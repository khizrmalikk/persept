import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Next 16 request gate (the file formerly called middleware.ts).
// Refreshes the Supabase session cookie and sends signed-out visitors of /dashboard to the login page.
export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (all) => {
          for (const { name, value } of all) req.cookies.set(name, value);
          for (const { name, value, options } of all)
            res.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");

  // Dev-only auth bypass for local preview work. Inert unless BOTH the build is
  // non-production AND DASHBOARD_AUTH_BYPASS=1 (set only in .env.local, never in
  // Vercel) — so this can safely live in the repo instead of being edited in/out.
  const devAuthBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1";
  if (devAuthBypass) return res;
  if (!data.user && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (data.user && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/dashboard/:path*", "/login"] };
