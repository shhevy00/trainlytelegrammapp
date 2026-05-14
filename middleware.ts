import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import { isTrainlyProtectedAppRoute, TRAINLY_PATHNAME_HEADER } from "@/lib/config/trainlyRouteAccess";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/jwt";

function nextWithPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TRAINLY_PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * В режиме postgres без валидной сессии не пускаем в основной UI.
 * Публичные маршруты: welcome, auth, legal, billing/plans, api, static.
 * Во все `next()` передаётся `x-trainly-pathname` для RSC (TrainlyAppShell).
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  let dataSource: ReturnType<typeof getTrainlyDataSource>;
  try {
    dataSource = getTrainlyDataSource();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Trainly misconfigured";
    return new NextResponse(message, { status: 503 });
  }

  const pathname = request.nextUrl.pathname;

  if (dataSource !== "postgres") {
    return nextWithPathname(request, pathname);
  }

  if (!isTrainlyProtectedAppRoute(pathname)) {
    return nextWithPathname(request, pathname);
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (token == null || token.length === 0) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  try {
    await verifySessionToken(token);
    return nextWithPathname(request, pathname);
  } catch {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
