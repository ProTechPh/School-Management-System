/**
 * Property-Based Tests for Student Validation
 * 
 * Feature: deped-student-profile
 * Property 1: LRN Format Validation
 * Validates: Requirements 1.1, 1.6
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateLRN, getLRNValidationError } from './student-validation'

describe('LRN Validation - Property Tests', () => {
  /**
   * Property 1: LRN Format Validation
   * 
   * *For any* input string provided as an LRN, the system should accept it 
   * if and only if it consists of exactly 12 numeric digits (0-9).
   * 
   * Validates: Requirements 1.1, 1.6
   */
  it('should accept any string of exactly 12 numeric digits', () => {
    // Generate valid LRNs: exactly 12 digits using array of digits joined
    const validLRNArbitrary = fc.array(
      fc.integer({ min: 0, max: 9 }),
      { minLength: 12, maxLength: 12 }
    ).map(digits => digits.join(''))

    fc.assert(
      fc.property(validLRNArbitrary, (lrn) => {
        return validateLRN(lrn) === true
      }),
      { numRuns: 100 }
    )
  })

  it('should reject any string that is not exactly 12 characters', () => {
    // Generate strings of any length except 12
    const invalidLengthArbitrary = fc.string().filter(s => s.length !== 12)

    fc.assert(
      fc.property(invalidLengthArbitrary, (lrn) => {
        return validateLRN(lrn) === false
      }),
      { numRuns: 100 }
    )
  })

  it('should reject any 12-character string containing non-numeric characters', () => {
    // Generate 12-character strings that contain at least one non-digit
    const invalidCharsArbitrary = fc.string({ minLength: 12, maxLength: 12 })
      .filter(s => !/^\d{12}$/.test(s))

    fc.assert(
      fc.property(invalidCharsArbitrary, (lrn) => {
        return validateLRN(lrn) === false
      }),
      { numRuns: 100 }
    )
  })

  it('should reject null and undefined values', () => {
    expect(validateLRN(null)).toBe(false)
    expect(validateLRN(undefined)).toBe(false)
  })

  it('should return appropriate error messages for invalid LRNs', () => {
    // Null/undefined
    expect(getLRNValidationError(null)).toBe('LRN is required')
    expect(getLRNValidationError(undefined)).toBe('LRN is required')
    
    // Wrong length
    expect(getLRNValidationError('12345')).toBe('LRN must be exactly 12 digits')
    expect(getLRNValidationError('1234567890123')).toBe('LRN must be exactly 12 digits')
    
    // Non-numeric
    expect(getLRNValidationError('12345678901a')).toBe('LRN must contain only numeric digits')
    
    // Valid
    expect(getLRNValidationError('123456789012')).toBe(null)
  })
})
