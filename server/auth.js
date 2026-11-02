// Auth stub for FP-7. Real login (roles, passwords, sessions) is FP-1, so until
// then the client simply tells the API who it is with an X-User-Id header.
import { pool } from './db.js';

// TODO(FP-1): replace with real auth (verify a session/JWT and drop the header).
// Loads the acting user from the header and puts them on req.user.
export async function loadUser(req, res, next) {
  const userId = Number(req.header('X-User-Id'));

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: 'Missing or invalid X-User-Id header' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, role, centre_id FROM users WHERE id = $1',
      [userId],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Unknown user' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// 403 unless the acting user has one of the given roles. Wrapping role checks in
// one helper means swapping in FP-1's real auth only has to change req.user.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that' });
    }
    next();
  };
}
