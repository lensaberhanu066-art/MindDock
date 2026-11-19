import { NextResponse } from "next/server";
import { clearSessionCookie, getAuthenticatedUser, hashPassword, publicUser, setSessionCookie, verifyPassword } from "../../lib/server-auth";
import { checkAuthRateLimit } from "../../lib/auth-rate-limit";
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "../../lib/input-limits";
import { isUniqueConstraintError, logDatabaseError, prisma } from "../../lib/server-db";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const MAX_LOGIN_PASSWORD_LENGTH = 1024;

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

  if (body?.action !== "register" && body?.action !== "login") {
    return apiError("Unsupported auth action.");
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  try {
    const retryAfter = await checkAuthRateLimit(request, body.action, email.length <= MAX_EMAIL_LENGTH ? email : "");
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  } catch (error) {
    logDatabaseError("rate-limit auth attempts", error);
    return apiError("Unable to process your request right now.", 503);
  }

  if (!email || !password) return apiError("Email and password are required.");
  if (email.length > MAX_EMAIL_LENGTH) return apiError(`Email must be no more than ${MAX_EMAIL_LENGTH} characters long.`);

  if (body?.action === "register") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return apiError("Name is required.");
    if (name.length > MAX_NAME_LENGTH) return apiError(`Name must be no more than ${MAX_NAME_LENGTH} characters long.`);
    if (password.length < MIN_PASSWORD_LENGTH) {
      return apiError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return apiError(`Password must be no more than ${MAX_PASSWORD_LENGTH} characters long.`);
    }

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
    if (password.length > MAX_LOGIN_PASSWORD_LENGTH) return apiError("Invalid email or password.", 401);

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
