// FP-7 attendance API: pick a day's classes, open a session, mark the roster.
// index.js mounts this file behind loadUser + requireRole('instructor', 'admin'),
// so req.user is always a known instructor or admin.
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// The only statuses the attendance table accepts.
const STATUSES = ['present', 'late', 'absent', 'excused'];

// A student's current rank is their latest rank_history row. The roster and the
// walk-in search both need it, so the join is written once. This is fixed SQL
// with no user input in it, so it is safe to paste into a query.
const CURRENT_RANK_JOIN = `
  LEFT JOIN LATERAL (
    SELECT rh.rank_id
      FROM rank_history rh
     WHERE rh.student_id = u.id
     ORDER BY rh.awarded_on DESC, rh.id DESC
     LIMIT 1
  ) latest_rank ON TRUE
  LEFT JOIN ranks r ON r.id = latest_rank.rank_id
`;

// Today as YYYY-MM-DD in the server's own time zone. toISOString() alone is UTC,
// which shows the wrong day late at night in Singapore.
function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// True only for real calendar dates like 2026-11-16. The round trip catches
// dates such as 2026-02-31, which JavaScript would quietly roll into March.
function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// ISO weekday number for a YYYY-MM-DD string: 1 = Monday ... 7 = Sunday, which
// is how classes.day_of_week is stored.
function isoWeekday(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

// Instructors only touch classes at their own centre; admins touch everything.
function canUseCentre(user, centreId) {
  return user.role === 'admin' || user.centre_id === centreId;
}

// Express 5 turns a thrown error into an HTML page. Wrapping each handler keeps
// the API's promise that every error is JSON: { error: "message" }.
function route(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`${req.method} ${req.originalUrl} failed:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Something went wrong on the server' });
      }
    }
  };
}

// The classes running on a given date (default today) for the acting user.
// session_id is null until a session has been created for that class and date.
router.get(
  '/instructor/classes',
  route(async (req, res) => {
    const date = req.query.date ?? today();
    if (!isDate(date)) {
      return res.status(400).json({ error: 'date must look like YYYY-MM-DD' });
    }

    // An admin has no centre, so their centre filter is NULL = "no filter".
    const centreId = req.user.role === 'admin' ? null : req.user.centre_id;

    // Double-quoted aliases keep the camelCase names the client expects.
    const { rows } = await pool.query(
      `SELECT c.id              AS "classId",
              c.name,
              c.start_time::text AS "startTime",
              c.end_time::text   AS "endTime",
              c.centre_id        AS "centreId",
              ct.name            AS "centreName",
              s.id               AS "sessionId"
         FROM classes c
         JOIN centres ct ON ct.id = c.centre_id
         LEFT JOIN sessions s
                ON s.class_id = c.id
               AND s.date = $1
               AND s.type = 'regular'
        WHERE c.day_of_week = $2
          AND ($3::int IS NULL OR c.centre_id = $3)
        ORDER BY c.start_time, c.name`,
      [date, isoWeekday(date), centreId],
    );

    res.json(rows);
  }),
);

// Open the regular session for a class on a date. Always returns the same id for
// the same class and date, so a double tap cannot create two sessions.
router.post(
  '/classes/:classId/sessions',
  route(async (req, res) => {
    const classId = Number(req.params.classId);
    if (!Number.isInteger(classId)) {
      return res.status(400).json({ error: 'classId must be a number' });
    }

    const date = req.body?.date ?? today();
    if (!isDate(date)) {
      return res.status(400).json({ error: 'date must look like YYYY-MM-DD' });
    }

    const { rows } = await pool.query(
      `SELECT id, centre_id, start_time::text AS start_time, end_time::text AS end_time
         FROM classes
        WHERE id = $1`,
      [classId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // `class` is reserved in JavaScript, so the row gets its own name.
    const aikidoClass = rows[0];
    if (!canUseCentre(req.user, aikidoClass.centre_id)) {
      return res.status(403).json({ error: 'That class belongs to another centre' });
    }

    const existing = await pool.query(
      `SELECT id FROM sessions WHERE class_id = $1 AND date = $2 AND type = 'regular'`,
      [classId, date],
    );
    if (existing.rows.length > 0) {
      return res.json({ sessionId: existing.rows[0].id });
    }

    const created = await pool.query(
      `INSERT INTO sessions (class_id, centre_id, date, start_time, end_time, type)
       VALUES ($1, $2, $3, $4, $5, 'regular')
       RETURNING id`,
      [classId, aikidoClass.centre_id, date, aikidoClass.start_time, aikidoClass.end_time],
    );

    res.status(201).json({ sessionId: created.rows[0].id });
  }),
);

// Everyone to mark for a session: the class's enrolled students plus any walk-in
// who already has an attendance row (e.g. a visitor from another centre).
router.get(
  '/sessions/:id/roster',
  route(async (req, res) => {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'id must be a number' });
    }

    const session = await pool.query(
      `SELECT s.class_id, COALESCE(c.centre_id, s.centre_id) AS centre_id
         FROM sessions s
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE s.id = $1`,
      [sessionId],
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!canUseCentre(req.user, session.rows[0].centre_id)) {
      return res.status(403).json({ error: 'That session belongs to another centre' });
    }

    // For an external session class_id is NULL, so only attendance rows match.
    const { rows } = await pool.query(
      `SELECT u.id AS "studentId",
              u.name,
              r.name AS rank,
              a.status
         FROM users u
         ${CURRENT_RANK_JOIN}
         LEFT JOIN attendance a
                ON a.session_id = $1
               AND a.student_id = u.id
        WHERE EXISTS (
                SELECT 1 FROM enrolments e
                 WHERE e.class_id = $2 AND e.student_id = u.id
              )
           OR a.id IS NOT NULL
        ORDER BY u.name`,
      [sessionId, session.rows[0].class_id],
    );

    res.json(rows);
  }),
);

// Student search for the "Add walk-in" box, limited to one centre.
router.get(
  '/centres/:centreId/students',
  route(async (req, res) => {
    const centreId = Number(req.params.centreId);
    if (!Number.isInteger(centreId)) {
      return res.status(400).json({ error: 'centreId must be a number' });
    }
    if (!canUseCentre(req.user, centreId)) {
      return res.status(403).json({ error: 'That centre is not yours' });
    }

    const q = String(req.query.q ?? '').trim();

    const { rows } = await pool.query(
      `SELECT u.id AS "studentId", u.name, r.name AS rank
         FROM users u
         ${CURRENT_RANK_JOIN}
        WHERE u.role = 'student'
          AND u.centre_id = $1
          AND u.name ILIKE $2
        ORDER BY u.name
        LIMIT 20`,
      [centreId, `%${q}%`],
    );

    res.json(rows);
  }),
);

// Mark or re-mark attendance. Re-saving the same students updates the existing
// rows (UNIQUE(session_id, student_id)) instead of adding duplicates.
router.put(
  '/sessions/:id/attendance',
  route(async (req, res) => {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'id must be a number' });
    }

    const session = await pool.query(
      `SELECT s.date::text AS date, COALESCE(c.centre_id, s.centre_id) AS centre_id
         FROM sessions s
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE s.id = $1`,
      [sessionId],
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!canUseCentre(req.user, session.rows[0].centre_id)) {
      return res.status(403).json({ error: 'That session belongs to another centre' });
    }

    // Attendance stays editable on the day and the day after, then it is locked.
    // Both dates parse as UTC midnight, so the difference is a whole number of days.
    const daysOld = (Date.parse(today()) - Date.parse(session.rows[0].date)) / 86_400_000;
    if (daysOld > 1) {
      return res.status(403).json({ error: 'This session is more than a day old, so attendance is locked' });
    }

    const entries = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Body must be an array of { studentId, status }' });
    }
    for (const entry of entries) {
      if (!Number.isInteger(entry?.studentId) || !STATUSES.includes(entry?.status)) {
        return res.status(400).json({
          error: `Each entry needs an integer studentId and a status of ${STATUSES.join(', ')}`,
        });
      }
    }

    // A walk-in who is also enrolled can arrive twice here, and Postgres cannot
    // update the same row twice in one statement. Keep the last status per student.
    const byStudent = new Map(entries.map((entry) => [entry.studentId, entry.status]));

    // One transaction for the whole save: either every row lands or none does.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [studentId, status] of byStudent) {
        await client.query(
          `INSERT INTO attendance (session_id, student_id, status, marked_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, student_id) DO UPDATE
              SET status    = EXCLUDED.status,
                  marked_by = EXCLUDED.marked_by,
                  marked_at = now()`,
          [sessionId, studentId, status, req.user.id],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      // 23503 = foreign key violation: the studentId is not a real user.
      if (err.code === '23503') {
        return res.status(400).json({ error: 'One of the students does not exist' });
      }
      throw err;
    } finally {
      client.release();
    }

    res.json({ saved: byStudent.size });
  }),
);

export default router;
