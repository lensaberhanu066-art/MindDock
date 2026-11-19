import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./server-db";

const SESSION_COOKIE = "minddock-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PASSWORD_HASH_PATTERN = /^([0-9a-f]{32}):([0-9a-f]{128})$/i;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const match = PASSWORD_HASH_PATTERN.exec(storedHash);
  if (!match) return false;

  const actual = scryptSync(password, match[1], 64);
  const expected = Buffer.from(match[2], "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sign(value: string) {
  if (!SESSION_SECRET || Buffer.byteLength(SESSION_SECRET, "utf8") < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_DURATION_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSession(value: string | undefined) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return null;

  const actualSignature = Buffer.from(signature, "hex");
  const expectedSignature = Buffer.from(sign(payload), "hex");
  if (!timingSafeEqual(actualSignature, expectedSignature)) return null;

  try {
    const session: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof session !== "object" ||
      session === null ||
      !("userId" in session) ||
      typeof session.userId !== "string" ||
      !UUID_PATTERN.test(session.userId) ||
      !("expiresAt" in session) ||
      typeof session.expiresAt !== "number" ||
      !Number.isFinite(session.expiresAt)
    ) {
      return null;
    }
    return session.expiresAt > Date.now() ? session.userId : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(userId: string) {
  cookies().set(SESSION_COOKIE, createSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthenticatedUser() {
  const userId = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export function publicUser(user: Pick<User, "id" | "name" | "email" | "createdAt">) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() };
}
