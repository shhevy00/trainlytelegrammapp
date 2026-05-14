import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import { isTrainlyProtectedAppRoute, TRAINLY_PATHNAME_HEADER } from "@/lib/config/trainlyRouteAccess";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/jwt";

export function nextWithTrainlyPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TRAINLY_PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Edge-гейт для Trainly: в режиме postgres на защищённых путях требуется валидная httpOnly-сессия.
 * Проверка JWT на каждом запросе — намеренно простая модель (jose/jwtVerify); кэш на edge не используется.
 */
export async function trainlyEdgeAuthResponse(request: NextRequest): Promise<NextResponse> {
  let dataSource: ReturnType<typeof getTrainlyDataSource>;
  try {
    dataSource = getTrainlyDataSource();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Trainly misconfigured";
    return new NextResponse(message, { status: 503 });
  }

  const pathname = request.nextUrl.pathname;

  if (dataSource !== "postgres") {
    return nextWithTrainlyPathname(request, pathname);
  }

  if (!isTrainlyProtectedAppRoute(pathname)) {
    return nextWithTrainlyPathname(request, pathname);
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (token == null || token.length === 0) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  try {
    await verifySessionToken(token);
    return nextWithTrainlyPathname(request, pathname);
  } catch {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
}
