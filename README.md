# Aikido Shinjukai — Student Management System

A mobile-friendly web app for student attendance, enrolment and grading across
Aikido Shinjukai centres.

## How it fits together

Three programs run at once. Each one only talks to the one below it.

```
Browser
   │
   ▼
client/   React, served by Vite      http://localhost:5173   the screens
   │      requests to /api/... are forwarded to port 3000
   ▼
server/   Node.js + Express          http://localhost:3000   the rules (who may do what)
   │      SQL through the `pg` library
   ▼
PostgreSQL                           localhost:5432          the data
          db/schema.sql creates the tables, db/seed.sql adds test data
```

## First-time setup

You need **Node.js** (v20 or newer) and **PostgreSQL** installed.

**1. Create and fill the database.** Cloning the repo does **not** give you any
data. The database lives on your own machine, so you create it once. Run these
from the repo folder (it asks for the `postgres` password you chose when you
installed PostgreSQL):

```sh
psql -U postgres -c "CREATE DATABASE aikido"
psql -U postgres -d aikido -f db/schema.sql
psql -U postgres -d aikido -f db/seed.sql
```

> **Windows: `psql` not found?** Use the full path instead, e.g.
> `"C:\Program Files\PostgreSQL\18\bin\psql.exe"` (change `18` to your version).
> Or open pgAdmin, create a database called `aikido`, and run the two `.sql`
> files in its Query Tool.

**2. Point the API at your database.** In `server/`, copy `.env.example` to
`.env` and put your own password in it:

```
PORT=3000
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/aikido
```

`.env` is gitignored, so don't commit it.

**3. Install packages** (once, and again whenever `package.json` changes):

```sh
cd server
npm install
cd ../client
npm install
```

## Every time you work on it

Make sure PostgreSQL is running. A normal install starts it automatically. Then
open two terminals:

```sh
# Terminal 1: the API
cd server
npm run dev
```

```sh
# Terminal 2: the screens
cd client
npm run dev
```

Open **http://localhost:5173**. To check that the API can reach the database,
http://localhost:3000/api/health should show `{ "ok": true, ... }`.

## Reset the test data

`schema.sql` drops and recreates every table, so this wipes everything and
starts clean. It's handy before a demo:

```sh
psql -U postgres -d aikido -f db/schema.sql
psql -U postgres -d aikido -f db/seed.sql
```

## Test users (no real login yet)

Until login (FP-1) is built, the app has an **"Acting as"** dropdown, and the
API reads an `X-User-Id` header instead of a password.

| id | Name | Role |
|---|---|---|
| 1 | Aiko Tanaka | admin (all centres) |
| 2 | Kenji Yamamoto | instructor, Shinjuku Dojo |
| 3 | Mei Lin | instructor, Shibuya Dojo |
| 4–7 | Alice, Ben, Chen, Divya | students with deliberate grading test cases |

Seeded classes run on **Monday and Wednesday** (Shinjuku) and **Saturday**
(Shibuya). On any other day the class list is empty, so pick one of those
days in the date picker.

## Troubleshooting

| You see | It means |
|---|---|
| `ECONNREFUSED` in the API terminal | PostgreSQL isn't running, or `DATABASE_URL` has the wrong port or password |
| `password authentication failed` | The password in `server/.env` is wrong |
| `database "aikido" does not exist` | Step 1 hasn't been done yet |
| "No classes on this date" | Pick a Monday, Wednesday or Saturday |
