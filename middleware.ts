import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes and sensitive endpoints
  const protectedPaths = ["/admin", "/teacher", "/student", "/test-supabase"]
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (user) {
    // Check role, password status, and active status from DB
    const { data: userData } = await supabase
      .from("users")
      .select("role, must_change_password, is_active")
      .eq("id", user.id)
      .single()
    
    // Enforce Account Status
    if (userData && userData.is_active === false) {
      // If user is disabled, sign them out (clear cookies) and redirect to login
      // Since we can't easily clear auth cookies here without a redirect loop or complex logic,
      // we redirect to login with an error, and the client/login page should handle the session cleanup.
      // Alternatively, we block access to protected routes.
      if (isProtected || request.nextUrl.pathname.startsWith("/api/")) {
         return NextResponse.redirect(new URL("/login?error=account_disabled", request.url))
      }
    }

    // Enforce Password Change Policy
    if (userData?.must_change_password) {
      const isAllowedPath = 
        request.nextUrl.pathname.startsWith("/change-password") ||
        request.nextUrl.pathname.startsWith("/_next/") ||
        request.nextUrl.pathname === "/favicon.ico" ||
        // Allow auth related APIs needed for password change/logout
        request.nextUrl.pathname.startsWith("/api/auth")

      if (!isAllowedPath) {
        return NextResponse.redirect(new URL("/change-password", request.url))
      }
    }

    if (isProtected) {
      const role = userData?.role

      if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (request.nextUrl.pathname.startsWith("/teacher") && role !== "teacher") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (request.nextUrl.pathname.startsWith("/student") && role !== "student") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      // /test-supabase is restricted to admins only for extra security
      if (request.nextUrl.pathname.startsWith("/test-supabase") && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
  } else if (isProtected) {
    // No user, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/test-supabase/:path*",
    "/change-password",
    "/login",
    "/api/:path*" // Include API routes in matcher to ensure enforcement
  ],
}