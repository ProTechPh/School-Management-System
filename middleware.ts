import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { validateOrigin } from "@/lib/security"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Global CSRF Protection
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase()
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      if (!validateOrigin(request)) {
        return new NextResponse(
          JSON.stringify({ error: "Invalid Origin" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
    }
  }

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

  // Define protected path prefixes and their required roles
  const routeRules = [
    { prefix: "/admin", roles: ["admin"] },
    { prefix: "/api/admin", roles: ["admin"] },
    { prefix: "/teacher", roles: ["teacher"] },
    { prefix: "/api/teacher", roles: ["teacher"] },
    { prefix: "/student", roles: ["student"] },
    { prefix: "/api/student", roles: ["student"] },
    { prefix: "/test-supabase", roles: ["admin"] },
  ]

  const matchedRule = routeRules.find(rule => 
    request.nextUrl.pathname.startsWith(rule.prefix)
  )

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/")

  if (user) {
    // Check account status
    const { data: userData } = await supabase
      .from("users")
      .select("role, must_change_password, is_active")
      .eq("id", user.id)
      .single()
    
    // Enforce Account Status
    if (userData && userData.is_active === false) {
      if (isApiRoute) {
         return NextResponse.json({ error: "Account disabled" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/login?error=account_disabled", request.url))
    }

    // Enforce Password Change Policy
    if (userData?.must_change_password) {
      const isAllowedPath = 
        request.nextUrl.pathname.startsWith("/change-password") ||
        request.nextUrl.pathname.startsWith("/_next/") ||
        request.nextUrl.pathname === "/favicon.ico" ||
        request.nextUrl.pathname.startsWith("/api/auth")

      if (!isAllowedPath) {
        if (isApiRoute) {
          return NextResponse.json({ error: "Password change required" }, { status: 403 })
        }
        return NextResponse.redirect(new URL("/change-password", request.url))
      }
    }

    // SECURITY FIX: Enforce MFA for Admin Routes
    // Check if user is admin and trying to access admin routes (not MFA pages)
    const isMfaPage = request.nextUrl.pathname.startsWith("/auth/mfa")
    
    if (userData?.role === "admin" && request.nextUrl.pathname.startsWith("/admin") && !isMfaPage) {
      // Get the authenticator assurance level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      
      if (aalData?.currentLevel !== 'aal2') {
         // Check if user has enrolled factors
         const { data: factors } = await supabase.auth.mfa.listFactors()
         
         if (factors && factors.totp.length > 0 && factors.totp[0].status === 'verified') {
            // Has verified factors but not AAL2 in this session -> Redirect to verify
            return NextResponse.redirect(new URL("/auth/mfa/verify", request.url))
         } else {
            // No verified factors -> Force enrollment
            return NextResponse.redirect(new URL("/auth/mfa/enroll", request.url))
         }
      }
    }

    // Enforce Role-Based Access Control
    if (matchedRule) {
      const role = userData?.role
      if (!matchedRule.roles.includes(role)) {
        if (isApiRoute) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
  } else if (matchedRule) {
    // No user, but route is protected
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
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
    "/auth/mfa/:path*",
    "/api/:path*"
  ],
}