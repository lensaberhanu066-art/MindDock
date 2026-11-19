import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../lib/server-auth";
import {
  MAX_DIARY_CONTENT_LENGTH,
  MAX_DIARY_TITLE_LENGTH,
  MAX_NOTE_DESCRIPTION_LENGTH,
  MAX_NOTE_LANGUAGE_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
  MAX_TASK_TITLE_LENGTH,
} from "../../lib/input-limits";
import { logDatabaseError, prisma } from "../../lib/server-db";

type Resource = "tasks" | "diary" | "notes";

function isResource(value: string): value is Resource {
  return value === "tasks" || value === "diary" || value === "notes";
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function exceedsLength(value: string, maximum: number) {
  return value.trim().length > maximum;
}

export async function GET(request: Request, context: { params: { resource: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return badRequest("Authentication required.", 401);
    if (!isResource(context.params.resource)) return badRequest("Unknown resource.", 404);

    const resource = context.params.resource;
    const collection = resource === "tasks"
      ? await prisma.task.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      : resource === "diary"
        ? await prisma.diaryEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
        : await prisma.note.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    const search = new URL(request.url).searchParams.get("search")?.trim().toLowerCase();
    const result = search
      ? collection.filter((item) => JSON.stringify(item).toLowerCase().includes(search))
      : collection;

    return NextResponse.json({ data: result });
  } catch (error) {
    logDatabaseError("list resource records", error);
    return badRequest("Unable to load records.", 503);
  }
}

export async function POST(request: Request, context: { params: { resource: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return badRequest("Authentication required.", 401);
    if (!isResource(context.params.resource)) return badRequest("Unknown resource.", 404);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const now = new Date();
    const id = crypto.randomUUID();
    const resource = context.params.resource;

    if (resource === "tasks") {
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      if (!title) return badRequest("Task title is required.");
      if (title.length > MAX_TASK_TITLE_LENGTH) {
        return badRequest(`Task title must be no more than ${MAX_TASK_TITLE_LENGTH} characters long.`);
      }
      const task = await prisma.task.create({
        data: { id, userId: user.id, title, completed: false, createdAt: now, updatedAt: now },
      });
      return NextResponse.json({ data: task }, { status: 201 });
    }

    if (resource === "diary") {
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const content = typeof body?.content === "string" ? body.content.trim() : "";
      if (!title || !content) return badRequest("Diary title and content are required.");
      if (title.length > MAX_DIARY_TITLE_LENGTH) {
        return badRequest(`Diary title must be no more than ${MAX_DIARY_TITLE_LENGTH} characters long.`);
      }
      if (content.length > MAX_DIARY_CONTENT_LENGTH) {
        return badRequest(`Diary content must be no more than ${MAX_DIARY_CONTENT_LENGTH} characters long.`);
      }
      const entry = await prisma.diaryEntry.create({
        data: { id, userId: user.id, title, content, createdAt: now, updatedAt: now },
      });
      return NextResponse.json({ data: entry }, { status: 201 });
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const language = typeof body?.language === "string" ? body.language.trim() : "";
    if (!title || !description || !language) return badRequest("Note title, description, and language are required.");
    if (title.length > MAX_NOTE_TITLE_LENGTH) {
      return badRequest(`Note title must be no more than ${MAX_NOTE_TITLE_LENGTH} characters long.`);
    }
    if (description.length > MAX_NOTE_DESCRIPTION_LENGTH) {
      return badRequest(`Note description must be no more than ${MAX_NOTE_DESCRIPTION_LENGTH} characters long.`);
    }
    if (language.length > MAX_NOTE_LANGUAGE_LENGTH) {
      return badRequest(`Language must be no more than ${MAX_NOTE_LANGUAGE_LENGTH} characters long.`);
    }
    const note = await prisma.note.create({
      data: { id, userId: user.id, title, description, language, createdAt: now, updatedAt: now },
    });
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    logDatabaseError("create resource record", error);
    return badRequest("Unable to save record.", 503);
  }
}

export async function PATCH(request: Request, context: { params: { resource: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return badRequest("Authentication required.", 401);
    if (!isResource(context.params.resource)) return badRequest("Unknown resource.", 404);
    const resource = context.params.resource;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return badRequest("An item id is required.");
    const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : undefined;
    const content = typeof body?.content === "string" && body.content.trim() ? body.content.trim() : undefined;
    const description = typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : undefined;
    const language = typeof body?.language === "string" && body.language.trim() ? body.language.trim() : undefined;
    const titleLimit = resource === "tasks" ? MAX_TASK_TITLE_LENGTH : resource === "diary" ? MAX_DIARY_TITLE_LENGTH : MAX_NOTE_TITLE_LENGTH;
    if (typeof body?.title === "string" && exceedsLength(body.title, titleLimit)) {
      return badRequest(`Title must be no more than ${titleLimit} characters long.`);
    }
    if (resource === "diary" && typeof body?.content === "string" && exceedsLength(body.content, MAX_DIARY_CONTENT_LENGTH)) {
      return badRequest(`Diary content must be no more than ${MAX_DIARY_CONTENT_LENGTH} characters long.`);
    }
    if (resource === "notes" && typeof body?.description === "string" && exceedsLength(body.description, MAX_NOTE_DESCRIPTION_LENGTH)) {
      return badRequest(`Note description must be no more than ${MAX_NOTE_DESCRIPTION_LENGTH} characters long.`);
    }
    if (resource === "notes" && typeof body?.language === "string" && exceedsLength(body.language, MAX_NOTE_LANGUAGE_LENGTH)) {
      return badRequest(`Language must be no more than ${MAX_NOTE_LANGUAGE_LENGTH} characters long.`);
    }
    const updatedAt = new Date();

    const updated = resource === "tasks"
      ? await prisma.task.updateMany({
        where: { id, userId: user.id },
        data: {
          ...(typeof body?.completed === "boolean" ? { completed: body.completed } : {}),
          ...(title ? { title } : {}),
          updatedAt,
        },
      }).then(async (result) => result.count ? prisma.task.findFirst({ where: { id, userId: user.id } }) : null)
      : resource === "diary"
        ? await prisma.diaryEntry.updateMany({
          where: { id, userId: user.id },
          data: { ...(title ? { title } : {}), ...(content ? { content } : {}), updatedAt },
        }).then(async (result) => result.count ? prisma.diaryEntry.findFirst({ where: { id, userId: user.id } }) : null)
        : await prisma.note.updateMany({
          where: { id, userId: user.id },
          data: {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(language ? { language } : {}),
            updatedAt,
          },
        }).then(async (result) => result.count ? prisma.note.findFirst({ where: { id, userId: user.id } }) : null);

    return updated ? NextResponse.json({ data: updated }) : badRequest("Item not found.", 404);
  } catch (error) {
    logDatabaseError("update resource record", error);
    return badRequest("Unable to update record.", 503);
  }
}

export async function DELETE(request: Request, context: { params: { resource: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return badRequest("Authentication required.", 401);
    if (!isResource(context.params.resource)) return badRequest("Unknown resource.", 404);

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("An item id is required.");
    const resource = context.params.resource;
    const deleted = resource === "tasks"
      ? await prisma.task.deleteMany({ where: { id, userId: user.id } })
      : resource === "diary"
        ? await prisma.diaryEntry.deleteMany({ where: { id, userId: user.id } })
        : await prisma.note.deleteMany({ where: { id, userId: user.id } });

    return deleted.count
      ? NextResponse.json({ success: true })
      : badRequest("Item not found.", 404);
  } catch (error) {
    logDatabaseError("delete resource record", error);
    return badRequest("Unable to delete record.", 503);
  }
}
