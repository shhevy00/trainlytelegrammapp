import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = "trainly_session";

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

function getJwtSecretKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (s == null || s.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return new TextEncoder().encode(s);
}

export interface SessionClaims {
  trainerId: string;
  telegramUserId: string;
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ tid: claims.telegramUserId } satisfies Record<string, string>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.trainerId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionClaims> {
  const secret = getJwtSecretKey();
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  const p = payload as JWTPayload & { tid?: unknown };
  const trainerId = typeof p.sub === "string" && p.sub.length > 0 ? p.sub : null;
  const telegramUserId = typeof p.tid === "string" && p.tid.length > 0 ? p.tid : null;
  if (trainerId == null || telegramUserId == null) {
    throw new Error("invalid_session_token");
  }
  return { trainerId, telegramUserId };
}
