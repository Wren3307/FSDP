// Every call to the Express API goes through here.
// Vite's dev server forwards /api to http://localhost:3000 (see vite.config.js),
// so this file needs no host or port.

// The stub login: whichever user the top bar has picked is sent on every
// request. TODO(FP-1): replace this with a real session or token.
let currentUserId = 2

export function setCurrentUserId(id) {
  currentUserId = id
}

export async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(currentUserId),
      ...options.headers,
    },
  })

  // The API always answers with JSON, even for errors ({ error: "message" }).
  // The fallback keeps a crashed response from breaking the screen.
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`)
  }

  return body
}
