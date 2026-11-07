# MindDock

MindDock is a Next.js application for personal tasks, diary entries, and project notes.

## Database setup

MindDock uses PostgreSQL with Prisma. The application requires a persistent PostgreSQL database; local JSON storage is no longer used for application reads or writes.
Use Node.js 20.6 or newer; the JSON import command uses Node's `--env-file` option.

1. Install the project dependencies with `npm install`.
2. Create a PostgreSQL database and set the following values in an ignored `.env` file at the project root:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   SESSION_SECRET="a-long-random-secret"
   ```

   Use credentials and a secret supplied by your deployment environment. Do not commit `.env` or paste credentials into source files.
3. Generate the Prisma client and apply committed migrations:

   ```sh
   npm run db:generate
   npm run db:migrate
   ```

   For local schema development, use `npm run db:migrate:dev`; review and commit the generated migration.
4. Start the application with `npm run dev`. Production deployments should run `npm run db:migrate` before starting the application.

`DATABASE_URL` is the PostgreSQL connection string used by Prisma. `SESSION_SECRET` signs authentication cookies and should be a unique, high-entropy secret. Neither value has a hardcoded production fallback.

## Importing existing JSON data

If `data/minddock.json` contains records to preserve, back it up before migrating. Keep the original file until the database import and application behavior have been verified.

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
