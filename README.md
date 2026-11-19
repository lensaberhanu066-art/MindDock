# MindDock

MindDock is a Next.js application for personal tasks, diary entries, and project notes.

## Database setup

MindDock uses PostgreSQL with Prisma. The application requires a persistent PostgreSQL database; local JSON storage is no longer used for application reads or writes.
Use Node.js 20.6 or newer; the JSON import command uses Node's `--env-file` option.

1. Install the project dependencies with `npm install`.
2. Create a PostgreSQL database and set the following values in an ignored `.env` file at the project root:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   SESSION_SECRET="generate-a-unique-secret-with-at-least-32-random-bytes"
   ```

   Generate the secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use database credentials and a unique secret supplied by your deployment environment. Do not commit `.env` or paste credentials into source files.
3. Generate the Prisma client and apply committed migrations:

   ```sh
   npm run db:generate
   npm run db:migrate
   ```

   For local schema development, use `npm run db:migrate:dev`; review and commit the generated migration.
4. Start the application with `npm run dev`. Production deployments should run `npm run db:migrate` before starting the application.

`DATABASE_URL` is the PostgreSQL connection string used by Prisma. `SESSION_SECRET` signs authentication cookies and must be a unique, high-entropy secret of at least 32 bytes. Sessions expire after 30 days. Changing this secret invalidates existing sessions. Neither value has a hardcoded production fallback.

New accounts must use passwords between 12 and 128 characters. Existing accounts imported from JSON can continue to sign in with their existing passwords.

## Reliability and security

- Server middleware verifies the signed session cookie before rendering protected pages and redirects unauthenticated visitors to sign in. API handlers still validate the account against PostgreSQL.
- A shared React auth provider loads the current user once for the app shell and updates that state after sign-in, registration, and logout.
- Data pages show loading and error states; failed creates, edits, deletes, and auth actions show a user-facing message instead of silently failing.
- Auth attempts are limited using PostgreSQL-backed fixed windows: 10 sign-in attempts per IP and 5 per email per 15 minutes; 5 registrations per IP and 3 per email per hour. IP addresses and emails are stored only as SHA-256 bucket keys. Apply the committed migrations before running the updated application.
- Server-side limits also cap names at 100 characters, emails at 254, task and diary titles at 200, diary content at 20,000, note titles at 200, note descriptions at 10,000, and note languages at 50.

## Importing existing JSON data

If `data/minddock.json` contains records to preserve, treat it as sensitive: it contains account credentials (password hashes) and may contain private diary entries. Keep it out of source control and shared locations, make any backup in a protected location, and keep the original file until the database import and application behavior have been verified. This file is git-ignored; confirm it is not tracked before pushing data-related changes.

After configuring `.env` and applying the database migration, run:

```sh
npm run db:import-json
```

An alternate JSON file can be supplied as an argument:

```sh
npm run db:import-json -- path/to/minddock.json
```

The importer validates IDs, required fields, dates, duplicate identifiers/emails, and user relationships. It runs in a database transaction, skips already-imported records, rejects conflicting account ownership, and reports created/skipped counts. It never modifies or deletes the JSON source. Run it again safely to confirm that it creates no duplicates.

## Database schema

- `users`: unique email and password hash.
- `tasks`: task title and completion state, owned by a user.
- `diary`: diary title and content, owned by a user.
- `notes`: project title, description, and language, owned by a user.

Each table uses a UUID primary key. User-owned records have foreign keys with cascading deletion and indexes for per-user chronological queries.
