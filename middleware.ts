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

  if (isProtected) {
    
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check role from metadata or DB
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    
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

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/test-supabase/:path*",
    "/login"
  ],
}