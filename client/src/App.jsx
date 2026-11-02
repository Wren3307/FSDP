import { useEffect, useState } from 'react'
import { api, setCurrentUserId } from './api'
import './App.css'

// Stand-in for login until FP-1: the seeded users the attendance demo needs.
const ACTING_USERS = [
  { id: 1, name: 'Aiko Tanaka', role: 'admin' },
  { id: 2, name: 'Kenji Yamamoto', role: 'instructor' },
  { id: 3, name: 'Mei Lin', role: 'instructor' },
]

// Tapping a student moves them to the next status in this list.
const STATUS_CYCLE = ['present', 'late', 'absent', 'excused']

// indexOf is -1 when nobody has marked the student yet, and (-1 + 1) % 4 is 0,
// so an unmarked student starts at "present".
function nextStatus(status) {
  const index = STATUS_CYCLE.indexOf(status)
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length]
}

// Today as YYYY-MM-DD in the browser's time zone. toISOString() alone is UTC,
// which shows yesterday's date late at night in Singapore.
function todayLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

// Postgres sends "18:00:00"; the screen only needs "18:00".
function shortTime(time) {
  return time.slice(0, 5)
}

export default function App() {
  const [actingUserId, setActingUserId] = useState(2)
  const [date, setDate] = useState(todayLocal)
  const [screen, setScreen] = useState('classes') // 'classes' | 'roster'
  const [classes, setClasses] = useState([])
  const [session, setSession] = useState(null) // { sessionId, className, date, centreId }
  const [roster, setRoster] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [message, setMessage] = useState(null) // { text, tone: 'ok' | 'error' }

  // Load the class list whenever the acting user or the chosen date changes.
  useEffect(() => {
    setCurrentUserId(actingUserId)

    api(`/api/instructor/classes?date=${date}`)
      .then((list) => {
        setClasses(list)
        setMessage(null)
      })
      .catch((err) => {
        setClasses([])
        setMessage({ text: err.message, tone: 'error' })
      })
  }, [actingUserId, date])

  // A roster belongs to one person and one day, so changing either goes back to
  // the class list before the new one loads.
  function resetToClasses() {
    setScreen('classes')
    setSession(null)
    setSearch('')
    setSearchResults([])
    setMessage(null)
  }

  // Open the session for a class and show its roster.
  async function openClass(item) {
    setMessage(null)
    try {
      // POST is idempotent: it creates the session the first time and reuses it
      // after that, so tapping the same class twice is safe.
      const { sessionId } = await api(`/api/classes/${item.classId}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      })
      const rows = await api(`/api/sessions/${sessionId}/roster`)

      setSession({ sessionId, className: item.name, date, centreId: item.centreId })
      setRoster(rows)
      setScreen('roster')
    } catch (err) {
      setMessage({ text: err.message, tone: 'error' })
    }
  }

  function cycleStatus(studentId) {
    setRoster((rows) =>
      rows.map((row) =>
        row.studentId === studentId ? { ...row, status: nextStatus(row.status) } : row,
      ),
    )
    setMessage(null) // the roster changed, so an earlier "Saved" is out of date
  }

  function markAllPresent() {
    setRoster((rows) => rows.map((row) => ({ ...row, status: 'present' })))
    setMessage(null)
  }

  async function searchStudents(text) {
    setSearch(text)
    if (!session || text.trim() === '') {
      setSearchResults([])
      return
    }

    try {
      const found = await api(
        `/api/centres/${session.centreId}/students?q=${encodeURIComponent(text)}`,
      )
      // Someone already on the roster cannot be added a second time.
      setSearchResults(
        found.filter((student) => !roster.some((row) => row.studentId === student.studentId)),
      )
    } catch (err) {
      setMessage({ text: err.message, tone: 'error' })
    }
  }

  function addWalkIn(student) {
    // A walk-in is standing in front of the instructor, so start them as present.
    setRoster((rows) => [...rows, { ...student, status: 'present' }])
    setSearch('')
    setSearchResults([])
    setMessage(null)
  }

  async function saveAttendance() {
    setMessage({ text: 'Saving...', tone: 'ok' })
    try {
      const entries = roster
        .filter((row) => row.status) // students nobody marked are not sent
        .map((row) => ({ studentId: row.studentId, status: row.status }))

      await api(`/api/sessions/${session.sessionId}/attendance`, {
        method: 'PUT',
        body: JSON.stringify(entries),
      })
      setMessage({ text: `Saved ${entries.length} students`, tone: 'ok' })
    } catch (err) {
      setMessage({ text: err.message, tone: 'error' })
    }
  }

  return (
    <div className="app">
      <header className="top-bar">
        <h1>Aikido Attendance</h1>
        <label className="field">
          Acting as (stands in for login)
          <select
            value={actingUserId}
            onChange={(event) => {
              setActingUserId(Number(event.target.value))
              resetToClasses()
            }}
          >
            {ACTING_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.role}
              </option>
            ))}
          </select>
        </label>
      </header>

      {screen === 'classes' ? (
        <main className="screen">
          <label className="field">
            Class date
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                resetToClasses()
              }}
            />
          </label>

          {message && <p className={`message ${message.tone}`}>{message.text}</p>}

          {classes.length === 0 ? (
            <p className="empty">No classes on this date.</p>
          ) : (
            <ul className="list">
              {classes.map((item) => (
                <li key={item.classId}>
                  <button type="button" className="class-button" onClick={() => openClass(item)}>
                    <span className="grow">
                      <span className="row-title">{item.name}</span>
                      <span className="row-sub">
                        {shortTime(item.startTime)} - {shortTime(item.endTime)} &middot;{' '}
                        {item.centreName}
                      </span>
                    </span>
                    <span className="chevron" aria-hidden="true">
                      &rsaquo;
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="hint">
            The seed data has Monday and Wednesday classes at Shinjuku Dojo, and a Saturday
            class at Shibuya Dojo.
          </p>
        </main>
      ) : (
        <main className="screen">
          <button type="button" className="back" onClick={() => setScreen('classes')}>
            &larr; Back
          </button>

          <div className="roster-title">
            <h2>{session.className}</h2>
            <p className="row-sub">
              {session.date} &middot; {roster.length} students
            </p>
          </div>

          <ul className="list">
            {roster.map((row) => (
              <li key={row.studentId}>
                <button
                  type="button"
                  className="student-button"
                  onClick={() => cycleStatus(row.studentId)}
                >
                  <span className="grow">
                    <span className="row-title">{row.name}</span>
                    <span className="row-sub">{row.rank || 'No rank'}</span>
                  </span>
                  <span className={`badge ${row.status || 'none'}`}>
                    {row.status || 'Not marked'}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="secondary" onClick={markAllPresent}>
            Mark all present
          </button>

          <section className="walk-in">
            <label className="field">
              Add walk-in
              <input
                type="search"
                placeholder="Search students at this centre"
                value={search}
                onChange={(event) => searchStudents(event.target.value)}
              />
            </label>

            {searchResults.length > 0 && (
              <ul className="list">
                {searchResults.map((student) => (
                  <li key={student.studentId}>
                    <button
                      type="button"
                      className="student-button"
                      onClick={() => addWalkIn(student)}
                    >
                      <span className="grow">
                        <span className="row-title">{student.name}</span>
                        <span className="row-sub">{student.rank || 'No rank'}</span>
                      </span>
                      <span className="badge add">Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="save-bar">
            {message && <p className={`message ${message.tone}`}>{message.text}</p>}
            <button type="button" className="primary" onClick={saveAttendance}>
              Save attendance
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
