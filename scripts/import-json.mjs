import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ImportValidationError extends Error {}

function requireRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ImportValidationError(`${label} must be an object.`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ImportValidationError(`${label} must be a non-empty string.`);
  }
  return value;
}

function requireId(value, label) {
  const id = requireString(value, label);
  if (!uuidPattern.test(id)) throw new ImportValidationError(`${label} must be a UUID.`);
  return id;
}

function requireDate(value, label) {
  const date = new Date(requireString(value, label));
  if (Number.isNaN(date.getTime())) throw new ImportValidationError(`${label} must be a valid date.`);
  return date;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new ImportValidationError(`${label} must be an array.`);
  return value;
}

function assertUnique(rows, key, label) {
  const seen = new Set();
  for (const row of rows) {
    const value = key(row);
    if (seen.has(value)) throw new ImportValidationError(`Duplicate ${label} in JSON source.`);
    seen.add(value);
  }
}

function parseSource(value) {
  const source = requireRecord(value, "JSON source");
  const users = requireArray(source.users, "users").map((value, index) => {
    const row = requireRecord(value, `users[${index}]`);
    const email = requireString(row.email, `users[${index}].email`);
    return {
      id: requireId(row.id, `users[${index}].id`),
      name: requireString(row.name, `users[${index}].name`),
      email,
      passwordHash: requireString(row.passwordHash, `users[${index}].passwordHash`),
      createdAt: requireDate(row.createdAt, `users[${index}].createdAt`),
    };
  });
  const tasks = requireArray(source.tasks, "tasks").map((value, index) => {
    const row = requireRecord(value, `tasks[${index}]`);
    if (typeof row.completed !== "boolean") {
      throw new ImportValidationError(`tasks[${index}].completed must be a boolean.`);
    }
    return {
      id: requireId(row.id, `tasks[${index}].id`),
      userId: requireId(row.userId, `tasks[${index}].userId`),
      title: requireString(row.title, `tasks[${index}].title`),
      completed: row.completed,
      createdAt: requireDate(row.createdAt, `tasks[${index}].createdAt`),
      updatedAt: requireDate(row.updatedAt, `tasks[${index}].updatedAt`),
    };
  });
  const diary = requireArray(source.diary, "diary").map((value, index) => {
    const row = requireRecord(value, `diary[${index}]`);
    return {
      id: requireId(row.id, `diary[${index}].id`),
      userId: requireId(row.userId, `diary[${index}].userId`),
      title: requireString(row.title, `diary[${index}].title`),
      content: requireString(row.content, `diary[${index}].content`),
      createdAt: requireDate(row.createdAt, `diary[${index}].createdAt`),
      updatedAt: requireDate(row.updatedAt, `diary[${index}].updatedAt`),
    };
  });
  const notes = requireArray(source.notes, "notes").map((value, index) => {
    const row = requireRecord(value, `notes[${index}]`);
    return {
      id: requireId(row.id, `notes[${index}].id`),
      userId: requireId(row.userId, `notes[${index}].userId`),
      title: requireString(row.title, `notes[${index}].title`),
      description: requireString(row.description, `notes[${index}].description`),
      language: requireString(row.language, `notes[${index}].language`),
      createdAt: requireDate(row.createdAt, `notes[${index}].createdAt`),
      updatedAt: requireDate(row.updatedAt, `notes[${index}].updatedAt`),
    };
  });

  assertUnique(users, (user) => user.id, "user id");
  assertUnique(users, (user) => user.email.toLowerCase(), "user email");
  assertUnique(tasks, (task) => task.id, "task id");
  assertUnique(diary, (entry) => entry.id, "diary entry id");
  assertUnique(notes, (note) => note.id, "note id");

  return { users, tasks, diary, notes };
}

async function main() {
  const sourcePath = path.resolve(process.argv[2] ?? "data/minddock.json");
  let text;
  try {
    text = await readFile(sourcePath, "utf8");
  } catch {
    throw new ImportValidationError(`Cannot read JSON source at ${sourcePath}.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportValidationError("JSON source is not valid JSON.");
  }

  const source = parseSource(parsed);
  const result = await prisma.$transaction(async (transaction) => {
    const referencedUserIds = [...new Set([
      ...source.users.map((user) => user.id),
      ...source.tasks.map((task) => task.userId),
      ...source.diary.map((entry) => entry.userId),
      ...source.notes.map((note) => note.userId),
    ])];
    const existingUsers = await transaction.user.findMany({
      where: {
        OR: [
          { id: { in: referencedUserIds } },
          ...source.users.map((user) => ({
            email: { equals: user.email, mode: Prisma.QueryMode.insensitive },
          })),
        ],
      },
    });
    const usersById = new Map(existingUsers.map((user) => [user.id, user]));
    const usersByEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));

    for (const user of source.users) {
      const byId = usersById.get(user.id);
      const byEmail = usersByEmail.get(user.email.toLowerCase());
      if (byId && byId.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new ImportValidationError(`User id ${user.id} conflicts with an existing database account.`);
      }
      if (byEmail && byEmail.id !== user.id) {
        throw new ImportValidationError(`Email ${user.email} belongs to a different database account.`);
      }
    }

    const knownUserIds = new Set(existingUsers.map((user) => user.id));
    for (const user of source.users) knownUserIds.add(user.id);
    for (const record of [...source.tasks, ...source.diary, ...source.notes]) {
      if (!knownUserIds.has(record.userId)) {
        throw new ImportValidationError(`Record ${record.id} references a user that is not present.`);
      }
    }

    const usersCreated = await transaction.user.createMany({
      data: source.users.filter((user) => !usersById.has(user.id)),
      skipDuplicates: true,
    });

    async function importOwnedRecords(model, records, table) {
      const existing = await model.findMany({
        where: { id: { in: records.map((record) => record.id) } },
        select: { id: true, userId: true },
      });
      const existingById = new Map(existing.map((record) => [record.id, record]));
      for (const record of records) {
        const duplicate = existingById.get(record.id);
        if (duplicate && duplicate.userId !== record.userId) {
          throw new ImportValidationError(`${table} id ${record.id} belongs to a different user.`);
        }
      }
      const inserted = await model.createMany({
        data: records.filter((record) => !existingById.has(record.id)),
        skipDuplicates: true,
      });
      return inserted.count;
    }

    const [tasksCreated, diaryCreated, notesCreated] = await Promise.all([
      importOwnedRecords(transaction.task, source.tasks, "Task"),
      importOwnedRecords(transaction.diaryEntry, source.diary, "Diary entry"),
      importOwnedRecords(transaction.note, source.notes, "Note"),
    ]);

    return {
      users: { created: usersCreated, skipped: source.users.length - usersCreated },
      tasks: { created: tasksCreated, skipped: source.tasks.length - tasksCreated },
      diary: { created: diaryCreated, skipped: source.diary.length - diaryCreated },
      notes: { created: notesCreated, skipped: source.notes.length - notesCreated },
    };
  }, { timeout: 60_000 });

  console.log(`Imported JSON source from ${sourcePath}:`);
  console.log(JSON.stringify(result, null, 2));
  console.log("The JSON source was not modified.");
}

main()
  .catch((error) => {
    if (error instanceof ImportValidationError) {
      console.error(`JSON import stopped: ${error.message}`);
    } else {
      const code = error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Prisma.PrismaClientInitializationError
          ? error.errorCode ?? "CONNECTION"
          : "UNEXPECTED";
      console.error(`JSON import failed (${code}). No source files were changed.`);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
