import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./server-db";

const SESSION_COOKIE = "minddock-session";
const SESSION_SECRET = process.env.SESSION_SECRET;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sign(value: string) {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET must be configured.");
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSession(value: string | undefined) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
      expiresAt: number;
    };
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
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getAuthenticatedUser() {
  const userId = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export function publicUser(user: Pick<User, "id" | "name" | "email" | "createdAt">) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() };
}
