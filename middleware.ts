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

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/admin") || 
      request.nextUrl.pathname.startsWith("/teacher") || 
      request.nextUrl.pathname.startsWith("/student")) {
    
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check role from metadata or DB (using service role client if needed, but for middleware keep it simple with user metadata if available, or fetch from public profile table)
    // Note: Fetching from DB in middleware can add latency. Ideally, role is in user_metadata or a JWT claim.
    // For now, we'll fetch from the users table using the current client (RLS must allow reading own role)
    
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
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/login",
    "/setup"
  ],
}