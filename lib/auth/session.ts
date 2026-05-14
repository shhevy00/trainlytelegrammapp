import { cookies } from "next/headers";
import { sessionCookieName, verifySessionToken, type SessionClaims } from "@/lib/auth/jwt";

export async function getTrainerSession(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const raw = jar.get(sessionCookieName())?.value;
  if (raw == null || raw.length === 0) return null;
  try {
    return await verifySessionToken(raw);
  } catch {
    return null;
  }
}
