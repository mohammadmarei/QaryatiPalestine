# Qaryati Palestine

React + TypeScript (Vite) site documenting Palestinian villages, on Firebase: Hosting, Authentication
(email and password) and Firestore. There is no backend server; the Firestore security rules are the access
control.

## Run

```bash
npm ci
npm run dev        # http://localhost:5173, against the live Firebase project
npm run build      # type-check and production build into dist/
npx eslint src
```

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes   # permissions
npm run build && firebase deploy --only hosting            # the site: https://qaryati-36f85.web.app
```

## Import the seed data

The 14 sourced villages and the 16 governorates come from `data/*.mysql.sql`, parsed as they are:

```bash
node scripts/import-seed.ts --dry-run   # convert and print the counts, write nothing
node scripts/import-seed.ts             # write (refuses if villages exist; --force replaces the seed documents)
```

It needs the service-account key at `Desktop\firebase-key.json` (or `FIREBASE_KEY=<path>`). The key is
secret: never commit it. After writing, the script reads the database back and prints the counts next to the
dump's. Every seeded record starts as `pending`, with an entry in the review queue.

## Data model (Firestore)

| Collection | Holds |
|---|---|
| `villages/{slug}` | One document per village with every section (names, population, events, landmarks, culture, crops, economy, facilities, nearby villages). Each item keeps its `sourceId`. |
| `sources/{id}` | The sources the items cite |
| `governorates/{slug}`, `agriculturalProducts/{id}` | Reference lists |
| `submissions/{id}` | The review queue: contributors' proposals (with the whole record in `payload`), and one entry for each record an editor changed directly |
| `auditLogs/{id}` | Append-only history of every change |
| `users/{uid}` | Name, email, `role` and `active` of each account |

## Roles and permissions (`firestore.rules`)

- **Visitor** reads published villages and the sources.
- **Contributor** (every new sign-up) proposes changes; they go to `submissions` and change nothing until approved.
- **Editor** edits directly; the record goes back to `pending` until a reviewer verifies it.
- **Reviewer** verifies or rejects; approving a proposal applies it.
- **Admin** does everything, deletes, and manages accounts. The first admin is set by hand: in the console,
  Firestore → `users` → your document → `role` = `admin`.

Every change is written in one batch with its audit entry; the rules refuse a change without it (the record
names the entry in `lastAuditId`, and `getAfter()` checks it).

| File | Role |
|---|---|
| `src/config/firebase.ts` | Firebase app, Auth and Firestore (public config) |
| `src/features/auth/AuthProvider.tsx` | Sign-in, sign-up, password reset; the role comes from `users/{uid}` |
| `src/app/DataProvider.tsx` | Live listeners for what the role may read; every write with its audit entry |
| `src/firebase/model.ts` | Firestore documents ⇄ the UI types in `src/types` |
| `scripts/import-seed.ts` | The seed import |
