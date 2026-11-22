# Qaryati Palestine (Firebase version)

A public, open platform to document every Palestinian village: names (current and historical), history,
landmarks, population over time, cultural practices, economy, facilities, crops and nearby villages.
Rule number one: **no fact without a source**, and no invented values (empty stays empty).

This repo is a simpler, deployable spin-off of the course project `mohammadmarei/Qaryati` (NestJS + MySQL +
Docker). That repo stays as it is for grading. Here there is **no backend server**: React frontend +
Firebase. The owner talks in Palestinian Arabic and wants replies in Arabic.

## Decisions already made
- **Firebase, not Supabase.** Hosting (one link, e.g. `qaryati-palestine.web.app`), Authentication
  (Email/Password, maybe Google), Firestore (region `europe-west`, production mode).
- **No Cloud Functions, no Blaze plan for the rules.** Permissions live in Firestore Security Rules. A change
  and its audit entry are written in one batch, and the rules refuse a change without its audit entry
  (`getAfter`/`existsAfter`).
- **Images:** stay as URLs for now (Wikimedia Commons photos with author and licence). Firebase Storage needs
  the Blaze plan for new projects; add real uploads only if the owner enables Blaze.
- **Roles** (same as the original): visitor reads published villages; contributor proposes changes;
  editor edits; reviewer verifies or rejects; admin does everything and manages accounts. The role is stored
  in `users/{uid}.role`; new sign-ups are `contributor`. The first admin is set by hand in the console.
- **Contributions:** a contributor's change goes to a `submissions` collection; a reviewer approves (applied
  to the village) or rejects it. Every record shows its review status.

## Planned data model (Firestore)
- `governorates/{id}`, `sources/{id}`, `agriculturalProducts/{id}`
- `villages/{id}`: one document per village holding its sections (names, population, events, landmarks,
  culturalPractices, economy, facilities, crops, relations), so a village page is one read. Each item keeps
  its `sourceId`.
- `submissions/{id}`, `auditLogs/{id}`, `users/{uid}`

## Data to import
- `data/qaryati_seed.mysql.sql`: the 14 sourced villages (Sinjil, Deir Istiya, Battir, Artas, Beita, Aqraba,
  Jifna, Biddya, Deir Sharaf, Sebastia, Aboud, Wadi Fukin, Birzeit, Al Jib) with 25 sources, 41 names,
  77 population records, 73 events, 38 landmarks, 12 cultural practices, crops, facilities, economy and
  10 relations. MySQL syntax; convert it, don't retype it. Every seeded record starts as `pending` review.
- `data/governorates.mysql.sql`: the 16 governorates (row 17 is a duplicate of Jenin: drop it).
- Import with the Admin SDK and a service-account key the owner keeps at `Desktop\firebase-key.json`.
  **Never commit that key** (it is in .gitignore). After importing, print a table of counts old vs new.

## Frontend (src/)
- The UI reads data through `src/app/DataProvider.tsx` (`useData()`), auth through
  `src/features/auth/AuthProvider.tsx`; `src/api/client.ts` + `mappers.ts` + `types.ts` talk to the old REST
  API. Replace that layer with Firebase; keep the pages and the UI types in `src/types`.
- `src/api/client.ts` still has a static-preview mode and `scripts/make-static-snapshot.mjs` +
  `src/api/static-snapshot.json` (used for a Netlify read-only copy). Remove them once Firebase works.
- Contact details shown on the site: `src/config/contact.ts`.
- Never show the words "demo"/"تجريبي" in the UI, and never put account passwords in the bundle.

## Steps the owner is doing in the Firebase console
1. Create project `qaryati-palestine`; add a Web app (with Hosting) and send the `firebaseConfig`
   (public, fine to commit in `src/config/firebase.ts`).
2. Enable Authentication → Email/Password.
3. Create Firestore (europe-west, production mode).
4. `npm install -g firebase-tools` then `firebase login`.
5. Download a service-account key to `Desktop\firebase-key.json` (secret).

## Working rules
- Each task on its own branch, pushed and merged by the owner.
- Don't add attribution lines to commits or PRs. Never print secrets.
- Run `npx tsc -b --noEmit`, `npx eslint src` and `npm run build` before committing.
