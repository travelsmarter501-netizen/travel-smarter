import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

// ONE stale build asset that must not be downloadable. An older build of the legacy V1 planner page shipped the
// whole paid Barcelona guide inside this public, content-hashed client chunk. The page is gone, but Vercel keeps
// previous builds' `_next/static/immutable` files reachable (deleting deployments and purging caches did not
// remove it), so this exact URL is answered with 410 Gone here, before the static-file step. It is an exact
// match on ONE path -- no other static asset is touched.
const STALE_PAID_CHUNK = "/_next/static/immutable/chunks/3y0c4l0k7njek.js";

// Next.js 16 renamed middleware.ts -> proxy.ts (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// This refreshes the Supabase session cookie on every navigation so server components/pages always see a valid session.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === STALE_PAID_CHUNK) {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image/asset files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // The one stale paid-content chunk above (exact path; matcher values must be constants).
    "/_next/static/immutable/chunks/3y0c4l0k7njek.js",
  ],
};
