# CUBE Game — Setup Guide

Everything now runs from **one server, one command**. You just need MongoDB running alongside it.

## 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally (`mongod`), default port 27017

## 2. Start MongoDB (one terminal)
- **Mac (Homebrew):** `brew services start mongodb-community`
- **Linux:** `sudo systemctl start mongod`
- **Windows:** starts automatically as a service if installed that way, otherwise run `mongod` from its install folder

Leave this running in the background.

## 3. Set up and run everything else (one terminal, in VS Code)
Open the `cube-game` folder in VS Code, open a terminal (`` Ctrl+` ``):

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set `JWT_SECRET`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` to your own values. Then:

```bash
npm run seed-admin
npm start
```

You'll see `CUBE Game API running on http://localhost:5000`.

## 4. Open in browser — no separate frontend server needed
- **Public game:** http://localhost:5000
- **Admin panel:** http://localhost:5000/admin/login.html

The backend now serves both the game page and the admin panel itself, so there's nothing else to start. Total processes running: **MongoDB + this one `npm start`.**

## 5. Day-to-day usage
1. Log into `/admin/login.html`, add students (manually or via CSV import: columns `rollNumber,name,college,branch,section`).
2. Send players to `http://localhost:5000` — they enter their roll number, click the tiles in rainbow order (Red → Orange → Yellow → Green → Blue → Purple), and their time gets saved.
3. Leaderboard is visible on the game page, and updates live.

## Notes
- To reset for a new event: log into the admin panel and use "Clear all scores" — student records stay, only times are wiped.
- Deploying later (e.g. to a real server)? Nothing changes — it's still one process to run; just point MongoDB's URI in `.env` at your production database.
- Phase 2 (not built yet): a React Native mobile app can call this same API without any backend changes.
