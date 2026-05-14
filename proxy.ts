import type { NextRequest } from "next/server";
import { trainlyEdgeAuthResponse } from "@/lib/config/trainlyEdgeAuth";

/**
 * Next.js 16+: конвенция `proxy` вместо `middleware` (тот же edge-гейт и matcher).
 */
export async function proxy(request: NextRequest): Promise<Response> {
  return trainlyEdgeAuthResponse(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
