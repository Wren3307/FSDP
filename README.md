# Aikido Shinjukai — Student Management System

Shared starting point for the student management system: a React (Vite)
client, an Express API, and PostgreSQL accessed with plain `pg` (no ORM).

```
client/   React + Vite app (unmodified starter)
server/   Express API (health check only)
db/       schema.sql and seed.sql
```

## Run it

1. **Create the database** (PostgreSQL must be running; `createdb` comes with it):
   ```sh
   createdb aikido
   ```
2. **Load the schema and sample data.** `schema.sql` drops and recreates every
   table, so this is safe to repeat:
   ```sh
   psql -d aikido -f db/schema.sql
   psql -d aikido -f db/seed.sql
   ```
3. **Start the API:** `cd server`, then `npm install`, copy `.env.example` to
   `.env` and fill in `DATABASE_URL`, then `npm run dev` (nodemon, port 3000).
4. **Start the client:** `cd client`, then `npm install` and `npm run dev`
   (Vite, port 5173).
5. **Check it works:** open <http://localhost:5173>, and
   `GET http://localhost:3000/api/health` should return
   `{ "ok": true, "dbTime": "..." }`.

The only API route so far is `/api/health`; there is no feature UI yet.
