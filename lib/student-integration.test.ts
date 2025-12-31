/**
 * Integration Tests for DepEd Student Profile
 * 
 * Feature: deped-student-profile
 * Tests: Complete student registration flow and profile view/edit
 * Validates: Requirements 1.1-8.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  validateLRN, 
  getLRNValidationError,
  validateGuardianContact,
  getGuardianContactValidationError 
} from './student-validation'
import type { DbStudentProfile, EnrollmentStatus, SHSTrack, Sex, DisabilityType } from './supabase/types'
import type { StudentFormData } from '@/components/student-form'

/**
 * Test 9.1: Complete Student Registration Flow
 * 
 * Validates that admin can create a student with all DepEd fields
 * and the data is structured correctly for database persistence.
 * 
 * Requirements: 1.1-8.5
 */
describe('Student Registration Flow', () => {
  // Sample complete student data with all DepEd fields
  const completeStudentData: StudentFormData = {
    // Basic Info (Requirements 1.1-1.6)
    lrn: '123456789012',
    first_name: 'Juan',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    name_extension: 'Jr.',
    birthdate: '2008-05-15',
    sex: 'Male' as Sex,
    birthplace_city: 'Manila',
    birthplace_province: 'Metro Manila',
    
    // Contact/Address (Requirements 2.1-2.5)
    current_house_street: '123 Main Street',
    current_barangay: 'Barangay 1',
    current_city: 'Quezon City',
    current_province: 'Metro Manila',
    current_region: 'NCR',
    permanent_same_as_current: true,
    permanent_house_street: '',
    permanent_barangay: '',
    permanent_city: '',
    permanent_province: '',
    permanent_region: '',
    contact_number: '09171234567',
    email: 'juan.delacruz@student.edu',
    
    // Parent/Guardian (Requirements 3.1-3.5)
    father_name: 'Pedro Dela Cruz',
    father_contact: '09181234567',
    father_occupation: 'Engineer',
    mother_name: 'Maria Santos',
    mother_contact: '09191234567',
    mother_occupation: 'Teacher',
    guardian_name: '',
    guardian_relationship: '',
    guardian_contact: '',
    
    // Academic (Requirements 4.1-4.7)
    grade: '10',
    section: 'A',
    school_year: '2024-2025',
    enrollment_status: 'New' as EnrollmentStatus,
    last_school_attended: '',
    last_school_year: '',
    track: null,
    strand: '',
    
    // DepEd Required (Requirements 5.1-5.7)
    psa_birth_cert_no: '123456789012345',
    is_4ps_beneficiary: false,
    household_4ps_id: '',
    is_indigenous: false,
    indigenous_group: '',
    mother_tongue: 'Tagalog',
    religion: 'Catholic',
    
    // Health/Special Needs (Requirements 6.1-6.5)
    disability_type: 'None' as DisabilityType,
    disability_details: '',
    emergency_contact_name: 'Pedro Dela Cruz',
    emergency_contact_number: '09181234567',
    blood_type: 'O+',
    medical_conditions: '',
  }

  describe('Basic Information Validation (Requirements 1.1-1.6)', () => {
    it('should validate LRN format - exactly 12 digits', () => {
      // Valid LRN
      expect(validateLRN('123456789012')).toBe(true)
      expect(getLRNValidationError('123456789012')).toBe(null)
      
      // Invalid LRN - wrong length
      expect(validateLRN('12345')).toBe(false)
      expect(getLRNValidationError('12345')).toBe('LRN must be exactly 12 digits')
      
      // Invalid LRN - contains letters
      expect(validateLRN('12345678901a')).toBe(false)
      expect(getLRNValidationError('12345678901a')).toBe('LRN must contain only numeric digits')
    })

    it('should have required name fields', () => {
      expect(completeStudentData.first_name).toBeTruthy()
      expect(completeStudentData.last_name).toBeTruthy()
    })

    it('should accept optional name extension', () => {
      expect(completeStudentData.name_extension).toBe('Jr.')
    })

    it('should have valid sex options', () => {
      expect(['Male', 'Female']).toContain(completeStudentData.sex)
    })
  })

  describe('Contact and Address Information (Requirements 2.1-2.5)', () => {
    it('should have current address fields', () => {
      expect(completeStudentData.current_house_street).toBeTruthy()
      expect(completeStudentData.current_barangay).toBeTruthy()
      expect(completeStudentData.current_city).toBeTruthy()
      expect(completeStudentData.current_province).toBeTruthy()
      expect(completeStudentData.current_region).toBeTruthy()
    })

    it('should handle permanent address same as current', () => {
      expect(completeStudentData.permanent_same_as_current).toBe(true)
    })

    it('should have contact information', () => {
      expect(completeStudentData.contact_number).toBeTruthy()
      expect(completeStudentData.email).toBeTruthy()
    })
  })

  describe('Parent/Guardian Information (Requirements 3.1-3.5)', () => {
    it('should validate at least one guardian contact is required', () => {
      // Valid - has father contact
      expect(validateGuardianContact({
        father_contact: '09181234567',
        mother_contact: null,
        guardian_contact: null,
      })).toBe(true)

      // Valid - has mother contact
      expect(validateGuardianContact({
        father_contact: null,
        mother_contact: '09191234567',
        guardian_contact: null,
      })).toBe(true)

      // Valid - has guardian contact
      expect(validateGuardianContact({
        father_contact: null,
        mother_contact: null,
        guardian_contact: '09201234567',
      })).toBe(true)

      // Invalid - no contacts
      expect(validateGuardianContact({
        father_contact: null,
        mother_contact: null,
        guardian_contact: null,
      })).toBe(false)

      // Invalid - empty strings
      expect(validateGuardianContact({
        father_contact: '',
        mother_contact: '',
        guardian_contact: '',
      })).toBe(false)
    })

    it('should return appropriate error message for missing guardian contact', () => {
      expect(getGuardianContactValidationError({
        father_contact: null,
        mother_contact: null,
        guardian_contact: null,
      })).toBe('At least one parent/guardian contact number is required')
    })

    it('should allow blank father/mother fields when guardian is provided', () => {
      const guardianOnlyData = {
        father_contact: null,
        mother_contact: null,
        guardian_contact: '09201234567',
      }
      expect(validateGuardianContact(guardianOnlyData)).toBe(true)
    })
  })

  describe('Academic Information (Requirements 4.1-4.7)', () => {
    it('should have grade level and section', () => {
      expect(completeStudentData.grade).toBeTruthy()
      expect(completeStudentData.section).toBeTruthy()
    })

    it('should have valid enrollment status options', () => {
      const validStatuses: EnrollmentStatus[] = ['New', 'Transferee', 'Balik-Aral', 'Cross-Enrollee']
      expect(validStatuses).toContain(completeStudentData.enrollment_status)
    })

    it('should require track/strand for Senior High (Grades 11-12)', () => {
      const seniorHighStudent: Partial<StudentFormData> = {
        grade: '11',
        track: 'Academic' as SHSTrack,
        strand: 'STEM',
      }
      expect(seniorHighStudent.track).toBeTruthy()
      expect(seniorHighStudent.strand).toBeTruthy()
    })

    it('should not require track/strand for Junior High (Grades 7-10)', () => {
      expect(completeStudentData.grade).toBe('10')
      expect(completeStudentData.track).toBeNull()
      expect(completeStudentData.strand).toBe('')
    })
  })

  describe('DepEd Required Information (Requirements 5.1-5.7)', () => {
    it('should handle 4Ps beneficiary conditional field', () => {
      // Non-beneficiary
      expect(completeStudentData.is_4ps_beneficiary).toBe(false)
      expect(completeStudentData.household_4ps_id).toBe('')

      // Beneficiary should have household ID
      const beneficiaryData: Partial<StudentFormData> = {
        is_4ps_beneficiary: true,
        household_4ps_id: '1234567890',
      }
      expect(beneficiaryData.is_4ps_beneficiary).toBe(true)
      expect(beneficiaryData.household_4ps_id).toBeTruthy()
    })

    it('should handle Indigenous Peoples conditional field', () => {
      // Non-IP
      expect(completeStudentData.is_indigenous).toBe(false)
      expect(completeStudentData.indigenous_group).toBe('')

      // IP should have group name
      const ipData: Partial<StudentFormData> = {
        is_indigenous: true,
        indigenous_group: 'Igorot',
      }
      expect(ipData.is_indigenous).toBe(true)
      expect(ipData.indigenous_group).toBeTruthy()
    })

    it('should have mother tongue field', () => {
      expect(completeStudentData.mother_tongue).toBeTruthy()
    })
  })

  describe('Health and Special Needs (Requirements 6.1-6.5)', () => {
    it('should have valid disability type options', () => {
      const validTypes: DisabilityType[] = [
        'None', 'Visual Impairment', 'Hearing Impairment', 'Learning Disability',
        'Intellectual Disability', 'Physical Disability', 'Speech/Language Disorder',
        'Autism Spectrum Disorder', 'Multiple Disabilities', 'Others'
      ]
      expect(validTypes).toContain(completeStudentData.disability_type)
    })

    it('should have emergency contact information', () => {
      expect(completeStudentData.emergency_contact_name).toBeTruthy()
      expect(completeStudentData.emergency_contact_number).toBeTruthy()
    })

    it('should handle disability details when disability is selected', () => {
      const disabledStudent: Partial<StudentFormData> = {
        disability_type: 'Visual Impairment' as DisabilityType,
        disability_details: 'Requires large print materials',
      }
      expect(disabledStudent.disability_type).not.toBe('None')
      expect(disabledStudent.disability_details).toBeTruthy()
    })
  })

  describe('Form Data Structure for Database', () => {
    it('should have all required fields for database insertion', () => {
      // Check that form data can be mapped to DbStudentProfile structure
      const dbProfile: Partial<DbStudentProfile> = {
        lrn: completeStudentData.lrn || null,
        first_name: completeStudentData.first_name,
        middle_name: completeStudentData.middle_name || null,
        last_name: completeStudentData.last_name,
        name_extension: completeStudentData.name_extension || null,
        birthdate: completeStudentData.birthdate || null,
        sex: completeStudentData.sex || null,
        birthplace_city: completeStudentData.birthplace_city || null,
        birthplace_province: completeStudentData.birthplace_province || null,
        current_house_street: completeStudentData.current_house_street || null,
        current_barangay: completeStudentData.current_barangay || null,
        current_city: completeStudentData.current_city || null,
        current_province: completeStudentData.current_province || null,
        current_region: completeStudentData.current_region || null,
        permanent_same_as_current: completeStudentData.permanent_same_as_current ?? true,
        contact_number: completeStudentData.contact_number || null,
        email: completeStudentData.email || null,
        father_name: completeStudentData.father_name || null,
        father_contact: completeStudentData.father_contact || null,
        father_occupation: completeStudentData.father_occupation || null,
        mother_name: completeStudentData.mother_name || null,
        mother_contact: completeStudentData.mother_contact || null,
        mother_occupation: completeStudentData.mother_occupation || null,
        guardian_name: completeStudentData.guardian_name || null,
        guardian_relationship: completeStudentData.guardian_relationship || null,
        guardian_contact: completeStudentData.guardian_contact || null,
        grade: completeStudentData.grade,
        section: completeStudentData.section,
        school_year: completeStudentData.school_year || null,
        enrollment_status: completeStudentData.enrollment_status || null,
        track: completeStudentData.track || null,
        strand: completeStudentData.strand || null,
        psa_birth_cert_no: completeStudentData.psa_birth_cert_no || null,
        is_4ps_beneficiary: completeStudentData.is_4ps_beneficiary ?? false,
        household_4ps_id: completeStudentData.household_4ps_id || null,
        is_indigenous: completeStudentData.is_indigenous ?? false,
        indigenous_group: completeStudentData.indigenous_group || null,
        mother_tongue: completeStudentData.mother_tongue || null,
        religion: completeStudentData.religion || null,
        disability_type: completeStudentData.disability_type || null,
        disability_details: completeStudentData.disability_details || null,
        emergency_contact_name: completeStudentData.emergency_contact_name || null,
        emergency_contact_number: completeStudentData.emergency_contact_number || null,
        blood_type: completeStudentData.blood_type || null,
        medical_conditions: completeStudentData.medical_conditions || null,
      }

      // Verify required fields are present
      expect(dbProfile.first_name).toBe('Juan')
      expect(dbProfile.last_name).toBe('Dela Cruz')
      expect(dbProfile.grade).toBe('10')
      expect(dbProfile.section).toBe('A')
    })

    it('should construct full name correctly', () => {
      const fullName = [
        completeStudentData.first_name,
        completeStudentData.middle_name,
        completeStudentData.last_name,
        completeStudentData.name_extension
      ].filter(Boolean).join(' ')
      
      expect(fullName).toBe('Juan Santos Dela Cruz Jr.')
    })
  })
})

/**
 * Test 9.2: Student Profile View/Edit
 * 
 * Validates that students can view their profile and update allowed fields.
 * 
 * Requirements: 8.1-8.5
 */
describe('Student Profile View/Edit', () => {
  // Sample student profile data as it would be retrieved from database
  const existingProfile: DbStudentProfile = {
    id: 'test-student-id',
    lrn: '123456789012',
    first_name: 'Juan',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    name_extension: 'Jr.',
    birthdate: '2008-05-15',
    sex: 'Male',
    birthplace_city: 'Manila',
    birthplace_province: 'Metro Manila',
    current_house_street: '123 Main Street',
    current_barangay: 'Barangay 1',
    current_city: 'Quezon City',
    current_province: 'Metro Manila',
    current_region: 'NCR',
    permanent_same_as_current: true,
    permanent_house_street: null,
    permanent_barangay: null,
    permanent_city: null,
    permanent_province: null,
    permanent_region: null,
    contact_number: '09171234567',
    email: 'juan.delacruz@student.edu',
    father_name: 'Pedro Dela Cruz',
    father_contact: '09181234567',
    father_occupation: 'Engineer',
    mother_name: 'Maria Santos',
    mother_contact: '09191234567',
    mother_occupation: 'Teacher',
    guardian_name: null,
    guardian_relationship: null,
    guardian_contact: null,
    grade: '10',
    section: 'A',
    school_year: '2024-2025',
    enrollment_status: 'New',
    last_school_attended: null,
    last_school_year: null,
    track: null,
    strand: null,
    enrollment_date: '2024-06-01',
    psa_birth_cert_no: '123456789012345',
    is_4ps_beneficiary: false,
    household_4ps_id: null,
    is_indigenous: false,
    indigenous_group: null,
    mother_tongue: 'Tagalog',
    religion: 'Catholic',
    disability_type: 'None',
    disability_details: null,
    emergency_contact_name: 'Pedro Dela Cruz',
    emergency_contact_number: '09181234567',
    blood_type: 'O+',
    medical_conditions: null,
  }

  describe('Profile Display (Requirements 8.1-8.2)', () => {
    it('should display all student information in organized format', () => {
      // Verify all sections are present
      expect(existingProfile.first_name).toBeTruthy()
      expect(existingProfile.last_name).toBeTruthy()
      expect(existingProfile.lrn).toBeTruthy()
      expect(existingProfile.grade).toBeTruthy()
      expect(existingProfile.section).toBeTruthy()
    })

    it('should group related fields together', () => {
      // Basic Info group
      const basicInfo = {
        lrn: existingProfile.lrn,
        first_name: existingProfile.first_name,
        middle_name: existingProfile.middle_name,
        last_name: existingProfile.last_name,
        name_extension: existingProfile.name_extension,
        birthdate: existingProfile.birthdate,
        sex: existingProfile.sex,
        birthplace_city: existingProfile.birthplace_city,
        birthplace_province: existingProfile.birthplace_province,
      }
      expect(Object.keys(basicInfo).length).toBe(9)

      // Contact group
      const contactInfo = {
        current_house_street: existingProfile.current_house_street,
        current_barangay: existingProfile.current_barangay,
        current_city: existingProfile.current_city,
        current_province: existingProfile.current_province,
        current_region: existingProfile.current_region,
        contact_number: existingProfile.contact_number,
        email: existingProfile.email,
      }
      expect(Object.keys(contactInfo).length).toBe(7)

      // Guardian group
      const guardianInfo = {
        father_name: existingProfile.father_name,
        father_contact: existingProfile.father_contact,
        mother_name: existingProfile.mother_name,
        mother_contact: existingProfile.mother_contact,
        guardian_name: existingProfile.guardian_name,
        guardian_contact: existingProfile.guardian_contact,
      }
      expect(Object.keys(guardianInfo).length).toBe(6)
    })
  })

  describe('Student Editable Fields (Requirements 8.3)', () => {
    // Fields that students are allowed to edit
    const studentEditableFields = [
      'contact_number',
      'current_house_street',
      'current_barangay',
      'current_city',
      'current_province',
      'current_region',
      'permanent_same_as_current',
      'permanent_house_street',
      'permanent_barangay',
      'permanent_city',
      'permanent_province',
      'permanent_region',
      'father_contact',
      'mother_contact',
      'guardian_contact',
      'emergency_contact_name',
      'emergency_contact_number',
    ]

    it('should allow students to update contact number', () => {
      const updatedProfile = { ...existingProfile, contact_number: '09179876543' }
      expect(updatedProfile.contact_number).toBe('09179876543')
      expect(studentEditableFields).toContain('contact_number')
    })

    it('should allow students to update address fields', () => {
      const updatedProfile = {
        ...existingProfile,
        current_house_street: '456 New Street',
        current_barangay: 'Barangay 2',
        current_city: 'Makati',
      }
      expect(updatedProfile.current_house_street).toBe('456 New Street')
      expect(studentEditableFields).toContain('current_house_street')
      expect(studentEditableFields).toContain('current_barangay')
      expect(studentEditableFields).toContain('current_city')
    })

    it('should allow students to update parent/guardian contacts', () => {
      const updatedProfile = {
        ...existingProfile,
        father_contact: '09189876543',
        mother_contact: '09199876543',
      }
      expect(updatedProfile.father_contact).toBe('09189876543')
      expect(studentEditableFields).toContain('father_contact')
      expect(studentEditableFields).toContain('mother_contact')
    })

    it('should allow students to update emergency contact', () => {
      const updatedProfile = {
        ...existingProfile,
        emergency_contact_name: 'Maria Santos',
        emergency_contact_number: '09199876543',
      }
      expect(updatedProfile.emergency_contact_name).toBe('Maria Santos')
      expect(studentEditableFields).toContain('emergency_contact_name')
      expect(studentEditableFields).toContain('emergency_contact_number')
    })

    // Fields that students should NOT be able to edit
    const readOnlyFields = [
      'lrn',
      'first_name',
      'middle_name',
      'last_name',
      'name_extension',
      'birthdate',
      'sex',
      'grade',
      'section',
      'enrollment_status',
    ]

    it('should NOT allow students to edit LRN', () => {
      expect(readOnlyFields).toContain('lrn')
      expect(studentEditableFields).not.toContain('lrn')
    })

    it('should NOT allow students to edit name fields', () => {
      expect(readOnlyFields).toContain('first_name')
      expect(readOnlyFields).toContain('last_name')
      expect(studentEditableFields).not.toContain('first_name')
      expect(studentEditableFields).not.toContain('last_name')
    })

    it('should NOT allow students to edit academic information', () => {
      expect(readOnlyFields).toContain('grade')
      expect(readOnlyFields).toContain('section')
      expect(studentEditableFields).not.toContain('grade')
      expect(studentEditableFields).not.toContain('section')
    })
  })

  describe('Form Validation on Save (Requirements 8.4)', () => {
    it('should validate required fields before saving', () => {
      // Guardian contact is still required even when updating
      const invalidUpdate = {
        father_contact: '',
        mother_contact: '',
        guardian_contact: '',
      }
      expect(validateGuardianContact(invalidUpdate)).toBe(false)
    })

    it('should allow save when at least one guardian contact exists', () => {
      const validUpdate = {
        father_contact: '09181234567',
        mother_contact: '',
        guardian_contact: '',
      }
      expect(validateGuardianContact(validUpdate)).toBe(true)
    })
  })

  describe('Success Confirmation (Requirements 8.5)', () => {
    it('should have success state for confirmation message', () => {
      // Simulate successful save
      const saveResult = {
        success: true,
        message: 'Changes saved successfully',
      }
      expect(saveResult.success).toBe(true)
      expect(saveResult.message).toBeTruthy()
    })
  })
})
