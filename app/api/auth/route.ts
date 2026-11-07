import { NextResponse } from "next/server";
import { clearSessionCookie, getAuthenticatedUser, hashPassword, publicUser, setSessionCookie, verifyPassword } from "../../lib/server-auth";
import { isUniqueConstraintError, logDatabaseError, prisma } from "../../lib/server-db";

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    logDatabaseError("load current user", error);
    return apiError("Unable to load your account.", 503);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    name?: string;
    email?: string;
    password?: string;
  } | null;

  if (body?.action === "logout") {
    clearSessionCookie();
    return NextResponse.json({ user: null });
  }

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";
  if (!email || !password) return apiError("Email and password are required.");

  if (body?.action === "register") {
    const name = body.name?.trim();
    if (!name) return apiError("Name is required.");
    if (password.length < 6) return apiError("Password must be at least 6 characters long.");

    try {
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name,
          email,
          passwordHash: hashPassword(password),
        },
      });
      setSessionCookie(user.id);
      return NextResponse.json({ user: publicUser(user) }, { status: 201 });
    } catch (error) {
      if (isUniqueConstraintError(error)) return apiError("An account with this email already exists.", 409);
      logDatabaseError("register user", error);
      return apiError("Unable to create your account.", 503);
    }
  }

  if (body?.action === "login") {
    try {
      const databaseUser = await prisma.user.findUnique({ where: { email } });
      if (!databaseUser || !verifyPassword(password, databaseUser.passwordHash)) {
        return apiError("Invalid email or password.", 401);
      }
      setSessionCookie(databaseUser.id);
      return NextResponse.json({ user: publicUser(databaseUser) });
    } catch (error) {
      logDatabaseError("authenticate user", error);
      return apiError("Unable to sign in.", 503);
    }
  }

  return apiError("Unsupported auth action.");
}
