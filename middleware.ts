import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "minddock-session";
const PUBLIC_PATHS = new Set(["/login", "/register"]);

async function hasValidSession(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!secret || new TextEncoder().encode(secret).length < 32 || !cookie) return false;

  const [payload, signature, extra] = cookie.split(".");
  if (!payload || !signature || extra || !/^[0-9a-f]{64}$/i.test(signature)) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureBytes = Uint8Array.from(signature.match(/.{2}/g) ?? [], (byte) => parseInt(byte, 16));
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(payload),
    );
    if (!validSignature) return false;

    const base64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalizedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
    const session = JSON.parse(atob(normalizedPayload)) as { userId?: unknown; expiresAt?: unknown };
    return typeof session.userId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.userId) &&
      typeof session.expiresAt === "number" &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.has(request.nextUrl.pathname);
  const authenticated = await hasValidSession(request);

  if (!authenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authenticated && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
