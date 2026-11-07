import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../lib/server-auth";
import { logDatabaseError, prisma } from "../../lib/server-db";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const [openTasks, completedTasks, tasks, diaryCount, diary, notesCount, notes] = await Promise.all([
      prisma.task.count({ where: { userId: user.id, completed: false } }),
      prisma.task.count({ where: { userId: user.id, completed: true } }),
      prisma.task.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
      prisma.diaryEntry.count({ where: { userId: user.id } }),
      prisma.diaryEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 2 }),
      prisma.note.count({ where: { userId: user.id } }),
      prisma.note.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 2 }),
    ]);

    return NextResponse.json({
      data: {
        counts: {
          tasks: openTasks + completedTasks,
          openTasks,
          completedTasks,
          diary: diaryCount,
          notes: notesCount,
        },
        recent: { tasks, diary, notes },
      },
    });
  } catch (error) {
    logDatabaseError("load dashboard", error);
    return NextResponse.json({ error: "Unable to load dashboard." }, { status: 503 });
  }
}
