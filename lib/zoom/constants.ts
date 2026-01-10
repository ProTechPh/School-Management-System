/**
 * Zoom Meeting Constants
 */

// Allowed email domain for class meetings
export const ALLOWED_EMAIL_DOMAIN = 'r1.deped.gov.ph'

/**
 * Check if an email is from the allowed domain
 */
export function isAllowedEmail(email: string): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
}

/**
 * Get the domain restriction error message
 */
export function getDomainRestrictionError(): string {
  return `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can join class meetings`
}
