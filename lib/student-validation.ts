/**
 * Student Profile Validation Utilities
 * Validates DepEd-required fields for student profiles
 */

/**
 * Validates LRN (Learner Reference Number) format
 * LRN must be exactly 12 numeric digits
 * 
 * @param lrn - The LRN string to validate
 * @returns true if valid, false otherwise
 * 
 * Validates: Requirements 1.1, 1.6
 */
export function validateLRN(lrn: string | null | undefined): boolean {
  if (!lrn) return false
  
  // Must be exactly 12 characters
  if (lrn.length !== 12) return false
  
  // Must contain only numeric digits (0-9)
  return /^\d{12}$/.test(lrn)
}

/**
 * Gets validation error message for LRN
 * 
 * @param lrn - The LRN string to validate
 * @returns Error message string or null if valid
 */
export function getLRNValidationError(lrn: string | null | undefined): string | null {
  if (!lrn) return 'LRN is required'
  if (lrn.length !== 12) return 'LRN must be exactly 12 digits'
  if (!/^\d+$/.test(lrn)) return 'LRN must contain only numeric digits'
  return null
}

/**
 * Validates that at least one guardian/parent contact is provided
 * At least one of father_contact, mother_contact, or guardian_contact must be non-empty
 * 
 * @param contacts - Object containing parent/guardian contact fields
 * @returns true if at least one contact is provided, false otherwise
 * 
 * Validates: Requirements 3.5
 */
export function validateGuardianContact(contacts: {
  father_contact?: string | null
  mother_contact?: string | null
  guardian_contact?: string | null
}): boolean {
  const { father_contact, mother_contact, guardian_contact } = contacts
  
  // Check if at least one contact is provided and non-empty
  const hasValidContact = 
    (father_contact && father_contact.trim().length > 0) ||
    (mother_contact && mother_contact.trim().length > 0) ||
    (guardian_contact && guardian_contact.trim().length > 0)
  
  return Boolean(hasValidContact)
}

/**
 * Gets validation error message for guardian contact requirement
 * 
 * @param contacts - Object containing parent/guardian contact fields
 * @returns Error message string or null if valid
 */
export function getGuardianContactValidationError(contacts: {
  father_contact?: string | null
  mother_contact?: string | null
  guardian_contact?: string | null
}): string | null {
  if (!validateGuardianContact(contacts)) {
    return 'At least one parent/guardian contact number is required'
  }
  return null
}
