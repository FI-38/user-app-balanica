import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View-Engine
app.set('view engine', 'pug');
app.set('views', './views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

app.use(flash());

// Middleware to make flash messages and user available to templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.user = { id: decoded.id, username: decoded.username, email: decoded.email };
    } catch (err) {
      // Invalid token, clear it
      res.clearCookie('token');
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// --- Routes ---

// Public routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Startseite',
    message: 'Willkommen!'
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'Über uns',
    content: 'Dies ist die About-Seite.'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Kontakt'
  });
});

// Registration routes
app.get('/register', (req, res) => {
  res.render('register', { title: 'Registrierung' });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (password.length < 8) {
    req.flash('error_msg', 'Passwort muss mindestens 8 Zeichen lang sein');
    return res.redirect('/register');
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const existing = await conn.query('SELECT id FROM user WHERE username = ? OR email = ?', [username, email]);

    if (existing.length > 0) {
      req.flash('error_msg', 'Benutzername oder E-Mail bereits vergeben');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // FIX: Use 'username' for both 'name' and 'username' columns
    await conn.query('INSERT INTO user (username, name, email, password_hash) VALUES (?, ?, ?, ?)', [username, username, email, hashedPassword]);

    req.flash('success_msg', 'Registrierung erfolgreich! Bitte einloggen.');
    res.redirect('/login');
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    req.flash('error_msg', 'Ein Fehler ist aufgetreten');
    res.redirect('/register');
  } finally {
    if (conn) conn.release();
  }
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const users = await conn.query('SELECT * FROM user WHERE username = ?', [username]);

    if (users.length === 0) {
      req.flash('error_msg', 'Benutzername oder Passwort falsch');
      return res.redirect('/login');
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      req.flash('error_msg', 'Benutzername oder Passwort falsch');
      return res.redirect('/login');
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    req.flash('success_msg', 'Erfolgreich angemeldet!');
    res.redirect('/');
  } catch (error) {
    console.error('Login-Fehler:', error);
    req.flash('error_msg', 'Ein Fehler ist aufgetreten');
    res.redirect('/login');
  } finally {
    if (conn) conn.release();
  }
});

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success_msg', 'Du wurdest erfolgreich abgemeldet.');
    res.redirect('/login');
});

// --- Protected Routes ---

// Middleware to check for authentication
const isAuthenticated = (req, res, next) => {
  if (res.locals.user) {
    return next();
  }
  req.flash('error_msg', 'Bitte melde dich an, um diese Seite zu sehen.');
  res.redirect('/login');
};

async function getAllUsers() {
  const connection = await pool.getConnection();
  const rows = await connection.query('SELECT id, username, name, email, created_at FROM user');
  connection.release();
  return rows;
}

app.get('/users', isAuthenticated, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.render('users', {
      users: users,
      title: 'Benutzerliste'
    });
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error);
    req.flash('error_msg', 'Fehler beim Laden der Benutzer');
    res.redirect('/');
  }
});

// Server start
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});