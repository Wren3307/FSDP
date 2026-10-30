-- Seed data for local development.
--
-- Run after schema.sql (schema.sql drops and recreates every table).
-- Session dates are relative to CURRENT_DATE, so the data always looks recent.
--
-- Test cases used by FP-7 / FP-10 / FP-9 later:
--   (a) Alice Tan  (user 4) -- clearly eligible for 5th kyu
--   (b) Ben Lim    (user 5) -- just short on sessions
--   (c) Chen Wei   (user 6) -- eligible only if external sessions count
--   (d) Divya Nair (user 7) -- strong in weeks 1-4, dropped off in weeks 5-8

BEGIN;

INSERT INTO centres (id, name, address) VALUES
  (1, 'Shinjuku Dojo', '1-2-3 Shinjuku, Tokyo'),
  (2, 'Shibuya Dojo', '4-5-6 Shibuya, Tokyo');

INSERT INTO ranks (id, name, sort_order) VALUES
  (1, '6th kyu', 1),
  (2, '5th kyu', 2),
  (3, '4th kyu', 3),
  (4, '3rd kyu', 4),
  (5, '2nd kyu', 5),
  (6, '1st kyu', 6),
  (7, 'shodan', 7);

-- Password hashes are placeholders: authentication is not built yet.
INSERT INTO users (id, name, email, password_hash, role, centre_id, date_of_birth) VALUES
  (1, 'Aiko Tanaka',    'aiko.tanaka@example.com',    'placeholder-hash', 'admin',      NULL, '1985-02-11'),
  (2, 'Kenji Yamamoto', 'kenji.yamamoto@example.com', 'placeholder-hash', 'instructor', 1,    '1979-07-19'),
  (3, 'Mei Lin',        'mei.lin@example.com',        'placeholder-hash', 'instructor', 2,    '1983-11-02'),
  -- Students
  (4, 'Alice Tan',      'alice.tan@example.com',      'placeholder-hash', 'student',    1,    '1998-04-12'),
  (5, 'Ben Lim',        'ben.lim@example.com',        'placeholder-hash', 'student',    1,    '2001-09-03'),
  (6, 'Chen Wei',       'chen.wei@example.com',       'placeholder-hash', 'student',    1,    '1995-01-27'),
  (7, 'Divya Nair',     'divya.nair@example.com',     'placeholder-hash', 'student',    1,    '2003-06-18'),
  (8, 'Ethan Koh',      'ethan.koh@example.com',      'placeholder-hash', 'student',    1,    '1999-11-05'),
  (9, 'Farah Ismail',   'farah.ismail@example.com',   'placeholder-hash', 'student',    1,    '1997-02-14'),
  (10, 'Glen Ong',      'glen.ong@example.com',       'placeholder-hash', 'student',    1,    '1992-08-30'),
  (11, 'Hana Sato',     'hana.sato@example.com',      'placeholder-hash', 'student',    2,    '2005-03-22'),
  (12, 'Ivan Petrov',   'ivan.petrov@example.com',    'placeholder-hash', 'student',    2,    '1990-12-09'),
  (13, 'Jia Lee',       'jia.lee@example.com',        'placeholder-hash', 'student',    1,    '2000-07-16'),
  (14, 'Kenji Mori',    'kenji.mori@example.com',     'placeholder-hash', 'student',    2,    '1988-05-04'),
  (15, 'Lena Fischer',  'lena.fischer@example.com',   'placeholder-hash', 'student',    2,    '1994-10-21');

-- Every student has a history; older students keep their earlier promotions.
INSERT INTO rank_history (student_id, rank_id, awarded_on) VALUES
  (4,  1, CURRENT_DATE - 150),
  (5,  1, CURRENT_DATE - 140),
  (6,  1, CURRENT_DATE - 900),
  (6,  2, CURRENT_DATE - 400),
  (7,  1, CURRENT_DATE - 170),
  (8,  1, CURRENT_DATE - 160),
  (9,  1, CURRENT_DATE - 820),
  (9,  2, CURRENT_DATE - 300),
  (10, 1, CURRENT_DATE - 1200),
  (10, 2, CURRENT_DATE - 700),
  (10, 3, CURRENT_DATE - 240),
  (11, 1, CURRENT_DATE - 1100),
  (11, 2, CURRENT_DATE - 600),
  (11, 3, CURRENT_DATE - 200),
  (12, 1, CURRENT_DATE - 1500),
  (12, 2, CURRENT_DATE - 1000),
  (12, 3, CURRENT_DATE - 500),
  (12, 4, CURRENT_DATE - 180),
  (13, 1, CURRENT_DATE - 1400),
  (13, 2, CURRENT_DATE - 950),
  (13, 3, CURRENT_DATE - 420),
  (13, 4, CURRENT_DATE - 150),
  (14, 1, CURRENT_DATE - 1600),
  (14, 2, CURRENT_DATE - 1200),
  (14, 3, CURRENT_DATE - 800),
  (14, 4, CURRENT_DATE - 450),
  (14, 5, CURRENT_DATE - 120),
  (15, 1, CURRENT_DATE - 1800),
  (15, 2, CURRENT_DATE - 1400),
  (15, 3, CURRENT_DATE - 1000),
  (15, 4, CURRENT_DATE - 650),
  (15, 5, CURRENT_DATE - 300),
  (15, 6, CURRENT_DATE - 90);

INSERT INTO classes (id, centre_id, instructor_id, name, day_of_week, start_time, end_time, min_rank_id) VALUES
  (1, 1, 2, 'Monday Beginners',   1, '18:00', '19:30', 1),
  (2, 1, 2, 'Wednesday General',  3, '18:00', '19:30', NULL),
  (3, 2, 3, 'Saturday Advanced',  6, '09:00', '11:00', 3);

INSERT INTO enrolments (student_id, class_id, enrolled_on) VALUES
  (4,  1, CURRENT_DATE - 330),
  (5,  1, CURRENT_DATE - 320),
  (6,  1, CURRENT_DATE - 300),
  (7,  1, CURRENT_DATE - 310),
  (8,  1, CURRENT_DATE - 280),
  (9,  1, CURRENT_DATE - 290),
  (4,  2, CURRENT_DATE - 330),
  (5,  2, CURRENT_DATE - 320),
  (6,  2, CURRENT_DATE - 300),
  (7,  2, CURRENT_DATE - 310),
  (9,  2, CURRENT_DATE - 290),
  (10, 2, CURRENT_DATE - 260),
  (13, 2, CURRENT_DATE - 250),
  (11, 3, CURRENT_DATE - 240),
  (12, 3, CURRENT_DATE - 230),
  (14, 3, CURRENT_DATE - 220),
  (15, 3, CURRENT_DATE - 210);

-- Eight weeks of regular sessions for every class, one per week on the class's
-- weekday. Mondays run from eight weeks ago to last week; day_of_week shifts
-- each class to its own weekday within that week.
WITH weeks AS (
  SELECT date_trunc('week', CURRENT_DATE)::date - (7 * n) AS monday
  FROM generate_series(8, 1, -1) AS n
)
INSERT INTO sessions (class_id, centre_id, date, start_time, end_time, type)
SELECT c.id, c.centre_id, w.monday + (c.day_of_week - 1), c.start_time, c.end_time, 'regular'
FROM classes c
CROSS JOIN weeks w;

-- External sessions: not tied to a class, and named by event.
INSERT INTO sessions (class_id, centre_id, date, start_time, end_time, type, external_name) VALUES
  (NULL, 1, CURRENT_DATE - 28, '09:00', '13:00', 'external', 'Kanto Regional Seminar'),
  (NULL, 1, CURRENT_DATE - 14, '10:00', '12:00', 'external', 'City Dojo Exchange'),
  (NULL, 2, CURRENT_DATE - 5,  '09:30', '15:00', 'external', 'National Grading Clinic');

-- Attendance for regular sessions. weeks_ago is 8 (oldest) .. 1 (most recent).
-- Test-case students are handled explicitly; everyone else gets a varied
-- deterministic pattern so the data is not uniformly perfect.
WITH session_weeks AS (
  SELECT s.id,
         s.class_id,
         s.date,
         s.end_time,
         (date_trunc('week', CURRENT_DATE)::date - date_trunc('week', s.date)::date) / 7 AS weeks_ago
  FROM sessions s
  WHERE s.type = 'regular'
)
INSERT INTO attendance (session_id, student_id, status, marked_by, marked_at)
SELECT sw.id,
       e.student_id,
       CASE
         -- (a) Alice: attends everything.
         WHEN e.student_id = 4 THEN
           CASE WHEN sw.weeks_ago = 4 AND sw.class_id = 1 THEN 'late' ELSE 'present' END
         -- (b) Ben: 13 attended of the 14 needed.
         WHEN e.student_id = 5 THEN
           CASE WHEN sw.weeks_ago >= 3 THEN 'present'
                WHEN sw.weeks_ago = 2 AND sw.class_id = 1 THEN 'present'
                ELSE 'absent'
           END
         -- (c) Chen: 15 of 16 regular sessions, plus all three external sessions.
         WHEN e.student_id = 6 THEN
           CASE WHEN sw.weeks_ago = 8 AND sw.class_id = 2 THEN 'excused' ELSE 'present' END
         -- (d) Divya: attends weeks 1-4 only, then drops off.
         WHEN e.student_id = 7 THEN
           CASE WHEN sw.weeks_ago >= 5 THEN
                  CASE WHEN sw.weeks_ago = 6 AND sw.class_id = 2 THEN 'late' ELSE 'present' END
                ELSE 'absent'
           END
         ELSE
           CASE (e.student_id * 3 + sw.weeks_ago + sw.class_id) % 8
             WHEN 0 THEN 'absent'
             WHEN 1 THEN 'late'
             WHEN 2 THEN 'excused'
             ELSE 'present'
           END
       END,
       c.instructor_id,
       (sw.date + sw.end_time)::timestamptz
FROM session_weeks sw
JOIN classes c ON c.id = sw.class_id
JOIN enrolments e ON e.class_id = sw.class_id;

-- External attendance: Chen attends all three (this is what makes case (c)
-- eligible), Alice attends two, and two others add variety.
INSERT INTO attendance (session_id, student_id, status, marked_by, marked_at)
SELECT s.id, 6, 'present', 3, (s.date + s.end_time)::timestamptz
FROM sessions s
WHERE s.type = 'external';

INSERT INTO attendance (session_id, student_id, status, marked_by, marked_at)
SELECT s.id, 4, 'present', 3, (s.date + s.end_time)::timestamptz
FROM sessions s
WHERE s.type = 'external'
  AND s.external_name <> 'National Grading Clinic';

INSERT INTO attendance (session_id, student_id, status, marked_by, marked_at)
SELECT s.id, 11, 'late', 3, (s.date + s.end_time)::timestamptz
FROM sessions s
WHERE s.type = 'external'
  AND s.external_name = 'Kanto Regional Seminar';

INSERT INTO attendance (session_id, student_id, status, marked_by, marked_at)
SELECT s.id, 12, 'absent', 3, (s.date + s.end_time)::timestamptz
FROM sessions s
WHERE s.type = 'external'
  AND s.external_name = 'City Dojo Exchange';

-- PLACEHOLDER: confirm real requirements.
-- Session counts are sized so that the seeded students sit either side of the
-- 6th -> 5th and 5th -> 4th thresholds (see test cases above).
INSERT INTO grading_rules (from_rank_id, to_rank_id, min_sessions, min_months_in_rank, counts_external, min_age) VALUES
  (1, 2, 14,  3, FALSE, NULL),
  (2, 3, 16,  4, TRUE,  NULL),
  (3, 4, 18,  6, FALSE, NULL),
  (4, 5, 20,  8, TRUE,  16),
  (5, 6, 22, 10, FALSE, NULL),
  (6, 7, 24, 12, TRUE,  18);

-- Rows above use explicit ids, so move the identity counters past them.
SELECT setval(pg_get_serial_sequence('centres', 'id'), (SELECT MAX(id) FROM centres));
SELECT setval(pg_get_serial_sequence('ranks', 'id'), (SELECT MAX(id) FROM ranks));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('classes', 'id'), (SELECT MAX(id) FROM classes));

COMMIT;
