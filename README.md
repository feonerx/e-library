# MCIU E-Library

A digital library website for **Michael and Cecilia Ibru University** (MCIU), featuring a browsable book
catalog, account sign-up, login, and a personal dashboard for borrowing and returning titles.

## Pages

- `index.html` — Landing page and public book catalog (search + filter by faculty).
- `signup.html` — Account creation (full name, matric/staff ID, department, email, password).
- `login.html` — Login with email or matric/staff ID.
- `dashboard.html` — Logged-in dashboard: borrowing stats, current loans, and the full catalog with borrow/return actions.

## How it works

This is a static front-end site (HTML, CSS, vanilla JS) with no backend. Accounts, sessions, and book loans are
stored in the browser's `localStorage` (`app.js`), and passwords are hashed with SHA-256 before being stored.
This is a client-side demo suitable for prototyping/portfolio purposes — it is **not** a secure or persistent
backend, and data is local to each browser.

## Running locally

No build step is required. Serve the folder with any static file server, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open `index.html` in your browser.
