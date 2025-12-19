"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { 
  getLRNValidationError, 
  getGuardianContactValidationError 
} from "@/lib/student-validation"
import {
  PHILIPPINE_REGIONS,
  ENROLLMENT_STATUS_OPTIONS,
  SHS_TRACKS,
  ACADEMIC_STRANDS,
  DISABILITY_TYPES,
  BLOOD_TYPES,
  GRADE_LEVELS,
  SECTIONS
} from "@/lib/deped-constants"
import type { 
  DbStudentProfile, 
  EnrollmentStatus, 
  SHSTrack, 
  Sex, 
  DisabilityType 
} from "@/lib/supabase/types"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left font-medium hover:bg-muted/50 transition-colors"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0 border-t">{children}</div>}
    </div>
  )
}

export interface StudentFormData extends Partial<DbStudentProfile> {
  first_name: string
  last_name: string
  grade: string
  section: string
}

interface StudentFormProps {
  initialData?: Partial<DbStudentProfile>
  onSubmit: (data: StudentFormData) => void
  onCancel?: () => void
  isLoading?: boolean
  mode?: "create" | "edit" | "view"
}

export function StudentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create"
}: StudentFormProps) {
  const isViewMode = mode === "view"

  const [formData, setFormData] = useState<StudentFormData>({
    // Basic Info
    lrn: initialData?.lrn || "",
    first_name: initialData?.first_name || "",
    middle_name: initialData?.middle_name || "",
    last_name: initialData?.last_name || "",
    name_extension: initialData?.name_extension || "",
    birthdate: initialData?.birthdate || "",
    sex: initialData?.sex || null,
    birthplace_city: initialData?.birthplace_city || "",
    birthplace_province: initialData?.birthplace_province || "",
    
    // Contact/Address
    current_house_street: initialData?.current_house_street || "",
    current_barangay: initialData?.current_barangay || "",
    current_city: initialData?.current_city || "",
    current_province: initialData?.current_province || "",
    current_region: initialData?.current_region || "",
    permanent_same_as_current: initialData?.permanent_same_as_current ?? true,
    permanent_house_street: initialData?.permanent_house_street || "",
    permanent_barangay: initialData?.permanent_barangay || "",
    permanent_city: initialData?.permanent_city || "",
    permanent_province: initialData?.permanent_province || "",
    permanent_region: initialData?.permanent_region || "",
    contact_number: initialData?.contact_number || "",
    email: initialData?.email || "",
    
    // Parent/Guardian
    father_name: initialData?.father_name || "",
    father_contact: initialData?.father_contact || "",
    father_occupation: initialData?.father_occupation || "",
    mother_name: initialData?.mother_name || "",
    mother_contact: initialData?.mother_contact || "",
    mother_occupation: initialData?.mother_occupation || "",
    guardian_name: initialData?.guardian_name || "",
    guardian_relationship: initialData?.guardian_relationship || "",
    guardian_contact: initialData?.guardian_contact || "",
    
    // Academic
    grade: initialData?.grade || "10",
    section: initialData?.section || "A",
    school_year: initialData?.school_year || "",
    enrollment_status: initialData?.enrollment_status || null,
    last_school_attended: initialData?.last_school_attended || "",
    last_school_year: initialData?.last_school_year || "",
    track: initialData?.track || null,
    strand: initialData?.strand || "",
    
    // DepEd Required
    psa_birth_cert_no: initialData?.psa_birth_cert_no || "",
    is_4ps_beneficiary: initialData?.is_4ps_beneficiary ?? false,
    household_4ps_id: initialData?.household_4ps_id || "",
    is_indigenous: initialData?.is_indigenous ?? false,
    indigenous_group: initialData?.indigenous_group || "",
    mother_tongue: initialData?.mother_tongue || "",
    religion: initialData?.religion || "",
    
    // Health/Special Needs
    disability_type: initialData?.disability_type || "None",
    disability_details: initialData?.disability_details || "",
    emergency_contact_name: initialData?.emergency_contact_name || "",
    emergency_contact_number: initialData?.emergency_contact_number || "",
    blood_type: initialData?.blood_type || "",
    medical_conditions: initialData?.medical_conditions || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Determine if Senior High School (Grades 11-12)
  const isSeniorHigh = formData.grade === "11" || formData.grade === "12"

  // Get available strands based on selected track
  const availableStrands = formData.track ? ACADEMIC_STRANDS[formData.track] : []

  const updateField = <K extends keyof StudentFormData>(
    field: K,
    value: StudentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Reset track/strand when grade changes from Senior High to Junior High
  useEffect(() => {
    if (!isSeniorHigh) {
      setFormData(prev => ({ ...prev, track: null, strand: "" }))
    }
  }, [isSeniorHigh])

  // Reset strand when track changes
  useEffect(() => {
    if (formData.track && !availableStrands.includes(formData.strand || "")) {
      setFormData(prev => ({ ...prev, strand: "" }))
    }
  }, [formData.track, availableStrands, formData.strand])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.first_name?.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = "Last name is required"
    }

    // LRN validation (if provided)
    if (formData.lrn && formData.lrn.trim()) {
      const lrnError = getLRNValidationError(formData.lrn)
      if (lrnError) {
        newErrors.lrn = lrnError
      }
    }

    // Guardian contact validation
    const guardianError = getGuardianContactValidationError({
      father_contact: formData.father_contact,
      mother_contact: formData.mother_contact,
      guardian_contact: formData.guardian_contact,
    })
    if (guardianError) {
      newErrors.guardian_contact = guardianError
    }

    // Email validation (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewMode) return
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderInput = (
    label: string,
    field: keyof StudentFormData,
    options?: {
      type?: string
      placeholder?: string
      required?: boolean
    }
  ) => {
    const { type = "text", placeholder, required } = options || {}
    const error = errors[field]
    
    return (
      <div className="grid gap-2">
        <Label htmlFor={field}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={field}
          type={type}
          value={(formData[field] as string) || ""}
          onChange={(e) => updateField(field, e.target.value as any)}
          placeholder={placeholder}
          disabled={isViewMode}
          aria-invalid={!!error}
          className={cn(error && "border-destructive")}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information Section */}
      <CollapsibleSection title="Basic Information" defaultOpen={true}>
        <div className="grid gap-4 pt-4">
          {renderInput("LRN (Learner Reference Number)", "lrn", { 
            placeholder: "12-digit LRN" 
          })}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("First Name", "first_name", { required: true })}
            {renderInput("Middle Name", "middle_name")}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Last Name", "last_name", { required: true })}
            {renderInput("Name Extension", "name_extension", { 
              placeholder: "Jr., III, etc." 
            })}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate || ""}
                onChange={(e) => updateField("birthdate", e.target.value)}
                disabled={isViewMode}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={formData.sex || ""}
                onValueChange={(v) => updateField("sex", v as Sex)}
                disabled={isViewMode}
              >
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Birthplace (City/Municipality)", "birthplace_city")}
            {renderInput("Birthplace (Province)", "birthplace_province")}
          </div>
        </div>
      </CollapsibleSection>

      {/* Contact & Address Section */}
      <CollapsibleSection title="Contact & Address">
        <div className="grid gap-4 pt-4">
          <h4 className="font-medium text-sm text-muted-foreground">Current Address</h4>
          
          {renderInput("House No./Street", "current_house_street")}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Barangay", "current_barangay")}
            {renderInput("City/Municipality", "current_city")}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Province", "current_province")}
            <div className="grid gap-2">
              <Label htmlFor="current_region">Region</Label>
              <Select
                value={formData.current_region || ""}
                onValueChange={(v) => updateField("current_region", v)}
                disabled={isViewMode}
              >
                <SelectTrigger id="current_region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {PHILIPPINE_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="permanent_same"
              checked={formData.permanent_same_as_current}
              onCheckedChange={(checked) => 
                updateField("permanent_same_as_current", checked as boolean)
              }
              disabled={isViewMode}
            />
            <Label htmlFor="permanent_same" className="font-normal">
              Permanent address is the same as current address
            </Label>
          </div>

          {/* Permanent Address - shown only when not same as current */}
          {!formData.permanent_same_as_current && (
            <>
              <h4 className="font-medium text-sm text-muted-foreground mt-4">Permanent Address</h4>
              
              {renderInput("House No./Street", "permanent_house_street")}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput("Barangay", "permanent_barangay")}
                {renderInput("City/Municipality", "permanent_city")}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput("Province", "permanent_province")}
                <div className="grid gap-2">
                  <Label htmlFor="permanent_region">Region</Label>
                  <Select
                    value={formData.permanent_region || ""}
                    onValueChange={(v) => updateField("permanent_region", v)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="permanent_region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHILIPPINE_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          <h4 className="font-medium text-sm text-muted-foreground mt-4">Contact Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Contact Number", "contact_number", { 
              type: "tel",
              placeholder: "09XX XXX XXXX" 
            })}
            {renderInput("Email Address", "email", { 
              type: "email",
              placeholder: "student@email.com" 
            })}
          </div>
        </div>
      </CollapsibleSection>

      {/* Parent/Guardian Section */}
      <CollapsibleSection title="Parent/Guardian Information">
        <div className="grid gap-4 pt-4">
          {errors.guardian_contact && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {errors.guardian_contact}
            </p>
          )}
          
          <h4 className="font-medium text-sm text-muted-foreground">Father's Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput("Full Name", "father_name")}
            {renderInput("Contact Number", "father_contact", { type: "tel" })}
            {renderInput("Occupation", "father_occupation")}
          </div>
          
          <h4 className="font-medium text-sm text-muted-foreground mt-4">Mother's Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput("Full Name (Maiden Name)", "mother_name")}
            {renderInput("Contact Number", "mother_contact", { type: "tel" })}
            {renderInput("Occupation", "mother_occupation")}
          </div>
          
          <h4 className="font-medium text-sm text-muted-foreground mt-4">Guardian's Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput("Full Name", "guardian_name")}
            {renderInput("Relationship to Student", "guardian_relationship")}
            {renderInput("Contact Number", "guardian_contact", { type: "tel" })}
          </div>
        </div>
      </CollapsibleSection>

      {/* Academic Information Section */}
      <CollapsibleSection title="Academic Information">
        <div className="grid gap-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="grade">Grade Level</Label>
              <Select
                value={formData.grade}
                onValueChange={(v) => updateField("grade", v)}
                disabled={isViewMode}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section}
                onValueChange={(v) => updateField("section", v)}
                disabled={isViewMode}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>Section {section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {renderInput("School Year", "school_year", { 
              placeholder: "2024-2025" 
            })}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="enrollment_status">Enrollment Status</Label>
              <Select
                value={formData.enrollment_status || ""}
                onValueChange={(v) => updateField("enrollment_status", v as EnrollmentStatus)}
                disabled={isViewMode}
              >
                <SelectTrigger id="enrollment_status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ENROLLMENT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(formData.enrollment_status === "Transferee" || 
            formData.enrollment_status === "Balik-Aral") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput("Last School Attended", "last_school_attended")}
              {renderInput("Last School Year Completed", "last_school_year", {
                placeholder: "2023-2024"
              })}
            </div>
          )}
          
          {/* Track and Strand - only for Senior High (Grades 11-12) */}
          {isSeniorHigh && (
            <>
              <h4 className="font-medium text-sm text-muted-foreground mt-4">
                Senior High School Track & Strand
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="track">Track</Label>
                  <Select
                    value={formData.track || ""}
                    onValueChange={(v) => updateField("track", v as SHSTrack)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="track">
                      <SelectValue placeholder="Select track" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHS_TRACKS.map((track) => (
                        <SelectItem key={track} value={track}>{track}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="strand">Strand</Label>
                  <Select
                    value={formData.strand || ""}
                    onValueChange={(v) => updateField("strand", v)}
                    disabled={isViewMode || !formData.track}
                  >
                    <SelectTrigger id="strand">
                      <SelectValue placeholder={formData.track ? "Select strand" : "Select track first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStrands.map((strand) => (
                        <SelectItem key={strand} value={strand}>{strand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* DepEd Required Information Section */}
      <CollapsibleSection title="DepEd Required Information">
        <div className="grid gap-4 pt-4">
          {renderInput("PSA Birth Certificate Number", "psa_birth_cert_no", {
            placeholder: "Optional"
          })}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_4ps"
              checked={formData.is_4ps_beneficiary}
              onCheckedChange={(checked) => 
                updateField("is_4ps_beneficiary", checked as boolean)
              }
              disabled={isViewMode}
            />
            <Label htmlFor="is_4ps" className="font-normal">
              4Ps (Pantawid Pamilyang Pilipino Program) Beneficiary
            </Label>
          </div>
          
          {/* 4Ps Household ID - shown only when 4Ps beneficiary */}
          {formData.is_4ps_beneficiary && (
            <div className="ml-6">
              {renderInput("4Ps Household ID", "household_4ps_id")}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_indigenous"
              checked={formData.is_indigenous}
              onCheckedChange={(checked) => 
                updateField("is_indigenous", checked as boolean)
              }
              disabled={isViewMode}
            />
            <Label htmlFor="is_indigenous" className="font-normal">
              Belongs to Indigenous Peoples (IP) Group
            </Label>
          </div>
          
          {/* IP Group - shown only when indigenous */}
          {formData.is_indigenous && (
            <div className="ml-6">
              {renderInput("IP Community/Group Name", "indigenous_group")}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Mother Tongue", "mother_tongue", {
              placeholder: "e.g., Tagalog, Cebuano, Ilocano"
            })}
            {renderInput("Religion", "religion", {
              placeholder: "Optional"
            })}
          </div>
        </div>
      </CollapsibleSection>

      {/* Health & Special Needs Section */}
      <CollapsibleSection title="Health & Special Needs">
        <div className="grid gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="disability_type">Disability/Special Needs</Label>
            <Select
              value={formData.disability_type || "None"}
              onValueChange={(v) => updateField("disability_type", v as DisabilityType)}
              disabled={isViewMode}
            >
              <SelectTrigger id="disability_type">
                <SelectValue placeholder="Select if applicable" />
              </SelectTrigger>
              <SelectContent>
                {DISABILITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Disability details - shown when disability is selected (not None) */}
          {formData.disability_type && formData.disability_type !== "None" && (
            <div className="grid gap-2">
              <Label htmlFor="disability_details">Disability Details</Label>
              <Textarea
                id="disability_details"
                value={formData.disability_details || ""}
                onChange={(e) => updateField("disability_details", e.target.value)}
                placeholder="Please provide additional details about the disability"
                disabled={isViewMode}
              />
            </div>
          )}
          
          <h4 className="font-medium text-sm text-muted-foreground mt-4">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Emergency Contact Name", "emergency_contact_name")}
            {renderInput("Emergency Contact Number", "emergency_contact_number", {
              type: "tel"
            })}
          </div>
          
          <h4 className="font-medium text-sm text-muted-foreground mt-4">Medical Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="blood_type">Blood Type</Label>
              <Select
                value={formData.blood_type || ""}
                onValueChange={(v) => updateField("blood_type", v)}
                disabled={isViewMode}
              >
                <SelectTrigger id="blood_type">
                  <SelectValue placeholder="Select blood type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="medical_conditions">Known Medical Conditions/Allergies</Label>
            <Textarea
              id="medical_conditions"
              value={formData.medical_conditions || ""}
              onChange={(e) => updateField("medical_conditions", e.target.value)}
              placeholder="Optional - List any known medical conditions or allergies"
              disabled={isViewMode}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Form Actions */}
      {!isViewMode && (
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      )}
    </form>
  )
}
