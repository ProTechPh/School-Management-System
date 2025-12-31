import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // 1. Verify Authentication & Role
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} 
        }
      }
    )
    
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabaseAuth
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Parse Body
    const body = await request.json()
    const { 
      first_name, middle_name, last_name, name_extension,
      lrn, email, contact_number,
      grade, section, school_year, enrollment_status,
      track, strand,
      // ... other fields
      current_house_street, current_barangay, current_city, current_province, current_region,
      permanent_same_as_current, permanent_house_street, permanent_barangay, permanent_city, permanent_province, permanent_region,
      father_name, father_contact, father_occupation,
      mother_name, mother_contact, mother_occupation,
      guardian_name, guardian_relationship, guardian_contact,
      psa_birth_cert_no, is_4ps_beneficiary, household_4ps_id,
      is_indigenous, indigenous_group, mother_tongue, religion,
      disability_type, disability_details,
      emergency_contact_name, emergency_contact_number,
      blood_type, medical_conditions,
      birthdate, sex, birthplace_city, birthplace_province,
      last_school_attended, last_school_year, enrollment_date
    } = body

    if (!first_name || !last_name || !grade || !section) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 3. Use Service Role to bypass RLS for user creation if needed, 
    // or just standard client if policies allow. 
    // Since we are creating a 'user' record which is public.users (not auth.users), 
    // we should use the service role to ensure we can write to it regardless of current user context if RLS is strict.
    // However, usually admin should have access. Let's use service role for robustness.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Construct full name
    const fullName = [first_name, middle_name, last_name, name_extension].filter(Boolean).join(" ")
    
    // Generate email if not provided
    const studentEmail = email || `${first_name.toLowerCase()}.${last_name.toLowerCase()}@student.edu`

    // Create User Record
    // Note: This does NOT create an auth user. Auth users are created via the User Accounts page.
    // This creates a record in public.users to represent the student entity.
    // Ideally these should be linked, but based on current architecture they might be separate until linked.
    // We'll generate a UUID for the ID.
    const userId = crypto.randomUUID()

    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: studentEmail,
        name: fullName,
        role: "student",
        address: current_house_street 
          ? `${current_house_street}, ${current_barangay || ''}, ${current_city || ''}, ${current_province || ''}`
          : null,
        created_at: new Date().toISOString(),
        is_active: true
      })

    if (userError) throw userError

    // Create Student Profile
    const { error: profileError } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        id: userId,
        lrn: lrn || null,
        first_name,
        middle_name: middle_name || null,
        last_name,
        name_extension: name_extension || null,
        birthdate: birthdate || null,
        sex: sex || null,
        birthplace_city: birthplace_city || null,
        birthplace_province: birthplace_province || null,
        
        current_house_street: current_house_street || null,
        current_barangay: current_barangay || null,
        current_city: current_city || null,
        current_province: current_province || null,
        current_region: current_region || null,
        
        permanent_same_as_current: permanent_same_as_current ?? true,
        permanent_house_street: permanent_house_street || null,
        permanent_barangay: permanent_barangay || null,
        permanent_city: permanent_city || null,
        permanent_province: permanent_province || null,
        permanent_region: permanent_region || null,
        
        contact_number: contact_number || null,
        email: studentEmail,
        
        father_name: father_name || null,
        father_contact: father_contact || null,
        father_occupation: father_occupation || null,
        
        mother_name: mother_name || null,
        mother_contact: mother_contact || null,
        mother_occupation: mother_occupation || null,
        
        guardian_name: guardian_name || null,
        guardian_relationship: guardian_relationship || null,
        guardian_contact: guardian_contact || null,
        
        grade,
        section,
        school_year: school_year || null,
        enrollment_status: enrollment_status || null,
        last_school_attended: last_school_attended || null,
        last_school_year: last_school_year || null,
        track: track || null,
        strand: strand || null,
        enrollment_date: enrollment_date || new Date().toISOString().split("T")[0],
        
        psa_birth_cert_no: psa_birth_cert_no || null,
        is_4ps_beneficiary: is_4ps_beneficiary ?? false,
        household_4ps_id: household_4ps_id || null,
        is_indigenous: is_indigenous ?? false,
        indigenous_group: indigenous_group || null,
        mother_tongue: mother_tongue || null,
        religion: religion || null,
        
        disability_type: disability_type || null,
        disability_details: disability_details || null,
        
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_number: emergency_contact_number || null,
        blood_type: blood_type || null,
        medical_conditions: medical_conditions || null,
      })

    if (profileError) {
      // Rollback user creation
      await supabaseAdmin.from("users").delete().eq("id", userId)
      throw profileError
    }

    return NextResponse.json({ success: true, id: userId })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}