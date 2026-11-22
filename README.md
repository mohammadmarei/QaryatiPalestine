# Qaryati frontend

React + TypeScript (Vite) app for the public site (villages, village pages, map) and the team dashboard
(villages, population, history and heritage, sources, reviews, users, audit log). All data comes from the
Qaryati API; nothing is stored in the browser except the session and display preferences.

## Run

With Docker, from the repository root (nginx serves the app on http://localhost:8080 and forwards `/api` to
the backend container):

```bash
docker compose --profile frontend up --build -d
```

For development, with the backend running on http://localhost:3000:

```bash
cd frontend
npm ci
npm run dev        # http://localhost:5173 — Vite forwards /api to the backend
npm run build      # type-check and production build
npm run lint
```

`VITE_API_PROXY=http://localhost:3001 npm run dev` points the dev server at another backend.
`VITE_API_URL` changes the API base the browser calls (default `/api/v1`, same origin).

Sign in with the demo accounts of `qaryati_seed.sql` (local use only), or with the role buttons on the
login page: `admin@qaryati.test` / `admin-demo-2026`, and likewise `editor`, `reviewer`, `contributor`.

## How it talks to the API

| File | Role |
|---|---|
| `src/api/client.ts` | `fetch` wrapper: base URL, JWT header, the API's error format as `ApiError`, paging helpers |
| `src/api/types.ts` | The shapes the API returns (see `docs/api/` and `docs/api/openapi.yaml`) |
| `src/api/mappers.ts` | API records ⇄ the UI types in `src/types` |
| `src/features/auth/AuthProvider.tsx` | `POST /auth/login`, `GET /auth/me`, token kept only with "remember me"; a 401 signs out |
| `src/app/DataProvider.tsx` | Loads the data each role may read; every change goes to the API first |

- **One request per village page:** villages are loaded through `GET /villages/:id/profile` (ADR-0011).
  After an edit the dashboard asks for it with `Cache-Control: no-cache`, so the 30-second cache never
  shows an editor stale data.
- **The UI keeps one nested `Village`; the API keeps separate records.** Saving the village form updates
  the village row, then creates, updates or deletes only the events, landmarks, facilities, crops and
  economic activities that changed, then the population series. Saving without changes sends one request
  and changes nothing.
- **No invented data (ADR-0008):** empty coordinates stay empty (the server refuses to publish without
  them), a missing date shows as "—", and a summary is the start of the real description.
- **Permissions:** `src/features/auth/permissions.ts` mirrors the backend policy (ADR-0004) so nobody sees
  a button that always answers 403. The backend still enforces every rule.
- **Reviews:** the review queue is the API's verification entries. Approve is "verify"; reject and
  "request changes" are "reject" with the reason as notes.

## Not backed by the API yet

The UI says so instead of simulating them:

- password reset and changing one's own password: the pages ask the user to email the administrators
  (contact details in `src/config/contact.ts`); the profile name is saved in this browser only;
- the home page has no newsletter: it invites visitors to email the team or become contributors;
- a village or landmark without an image of its own shows its drawn illustration, never a stock photo;
- the dashboard notifications are the records waiting in the review queue;
- names added on the History & heritage page are saved as alternative spellings (the page has no type or
  source field); former and historical names, which need a source, are added through the API.
- cover and landmark images: only `http(s)` URLs are saved. A file picked in the form is not uploaded (it is
  dropped without a message), and an image the server holds as a path is kept, never erased by an edit.
