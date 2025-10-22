# user-app-wilson
Dies ist ein express.js projekt mit einem pug template,

```bash
git clone https://github.com/FI-38/user-app-wilson
```
```bash
cd <PATH_TO_THE_GIT_FOLDER>
```
```bash
npm i
```
```bash
npm run dev
```

---

## Datenbank

Erstelle eine neue Datenbank namens **user_app** und führe anschließend diesen SQL-Befehl aus:
```sql
CREATE TABLE user (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

```
### Datenbank-Konfiguration (.env)
---

```bash
# Datenbank-Konfiguration
DB_HOST=localhost
DB_USER=[db-user]
DB_PASSWORD=[db-password]
DB_NAME=[db-name]

#Express Session
SESSION_SECRET=[session-secret]

# Server-Konfiguration
PORT=3000
```

---

## Environment

- **DB_USER**: Der Benutzer, mit dem die Datenbank angelegt wurde.  
- **DB_HOST**: In der Regel `localhost`, kann je nach Entwicklungsumgebung variieren.  
- **DB_PASSWORD**: Ein von dir festgelegtes Passwort.  
- **DB_NAME**: Der Name der Datenbank (Standard: `user_app`).  
- **SESSION_SECRET**: Ein selbst gewähltes geheimes Token für Express-Sessions.  
- **PORT**: Standard ist `3000`.

