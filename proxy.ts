import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

// Next.js 16 renamed middleware.ts -> proxy.ts (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// This refreshes the Supabase session cookie on every navigation so server components/pages always see a valid session.
export async function proxy(request: NextRequest) {
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
  ],
};
