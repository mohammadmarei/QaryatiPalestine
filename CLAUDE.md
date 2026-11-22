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

## Current state (Firebase connected)
- Project `qaryati-36f85` (site will be `qaryati-36f85.web.app`). Config in `src/config/firebase.ts`;
  `.firebaserc` points the CLI at it. Firestore rules are deployed; the seed is imported
  (`scripts/import-seed.ts`, counts match the dump; governorates 16 after dropping the Jenin duplicate).
- Data layer: `src/app/DataProvider.tsx` (live listeners + batched writes), `src/features/auth/AuthProvider.tsx`,
  `src/firebase/model.ts`. The old REST layer (`src/api/`), the static snapshot and the Netlify copy are gone.
- Village ids are slugs of the English name (`battir`, `al-jib`); population lives inside the village doc.
- Review flow: editors' edits apply directly and file one open review entry per record; contributors'
  changes are proposals (`payload` = the whole record) applied on approval. Rules tested for every role.
- Seed demo accounts are not imported; accounts come from sign-up. The first admin is set in the console.
- Contact details shown on the site: `src/config/contact.ts`.
- Never show the words "demo"/"تجريبي" in the UI, and never put account passwords in the bundle.

## Working rules
- Each task on its own branch, pushed and merged by the owner.
- Don't add attribution lines to commits or PRs. Never print secrets.
- Run `npx tsc -b --noEmit`, `npx eslint src` and `npm run build` before committing.
