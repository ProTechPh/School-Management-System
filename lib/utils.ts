import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 安全工具函数
 * Client-side security utilities
 */

/**
 * 验证 URL 是否安全（防止 XSS 和开放重定向）
 * Validates if a URL is safe to use (prevents XSS and open redirect)
 * Only allows http/https protocols and optionally restricts to specific hosts
 */
export function isSafeUrl(url: string, allowedHosts?: string[]): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsed = new URL(url)
    
    // Only allow http/https protocols (blocks javascript:, data:, etc.)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    
    // If allowed hosts specified, check against them
    if (allowedHosts && allowedHosts.length > 0) {
      return allowedHosts.some(host => 
        parsed.host === host || parsed.host.endsWith(`.${host}`)
      )
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * 获取安全的 URL，如果不安全则返回 fallback
 * Returns a safe URL or a fallback if the URL is not safe
 */
export function getSafeUrl(url: string, fallback: string = '#'): string {
  return isSafeUrl(url) ? url : fallback
}

/**
 * 验证 Supabase 存储 URL
 * Validates if URL is from Supabase storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!supabaseUrl) return false
  
  try {
    const parsed = new URL(url)
    const allowedHost = new URL(supabaseUrl).host
    return parsed.host === allowedHost || parsed.host.endsWith('.supabase.co')
  } catch {
    return false
  }
}

/**
 * 防止原型污染的安全对象键
 * Dangerous object keys that could cause prototype pollution
 */
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

/**
 * 检查对象键是否安全（防止原型污染）
 * Checks if an object key is safe (prevents prototype pollution)
 */
export function isSafeKey(key: string): boolean {
  return typeof key === 'string' && !DANGEROUS_KEYS.includes(key)
}

/**
 * 安全设置对象属性（防止原型污染）
 * Safely sets an object property (prevents prototype pollution)
 */
export function safeSetProperty<T extends Record<string, unknown>>(
  obj: T,
  key: string,
  value: unknown
): void {
  if (isSafeKey(key)) {
    obj[key as keyof T] = value as T[keyof T]
  }
}

/**
 * 安全获取对象属性（防止原型污染）
 * Safely gets an object property (prevents prototype pollution)
 */
export function safeGetProperty<T extends Record<string, unknown>>(
  obj: T,
  key: string
): T[keyof T] | undefined {
  if (isSafeKey(key) && Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key as keyof T]
  }
  return undefined
}