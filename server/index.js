// Express entry point for the Aikido Shinjukai API.
// db.js loads server/.env before this module body runs, so PORT is available.
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { loadUser, requireRole } from './auth.js';
import attendanceRouter from './routes/attendance.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check: proves the API is up and that PostgreSQL is reachable.
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT now()');
    res.json({ ok: true, dbTime: rows[0].now });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ ok: false, error: 'Database unavailable' });
  }
});

// FP-7 attendance routes. The auth stub and the role check are mounted on the
// whole router, so no attendance route can be reached without an instructor or
// admin header.
app.use('/api', loadUser, requireRole('instructor', 'admin'), attendanceRouter);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
