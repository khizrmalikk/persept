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
          for (const { name, value, options } of all) res.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
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
