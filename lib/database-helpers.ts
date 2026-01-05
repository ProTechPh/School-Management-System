/**
 * Database type helpers for cleaner type usage throughout the app
 */
import { Database } from './database.types'

// Table row types
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

export type AssignmentSubmission = Database['public']['Tables']['assignment_submissions']['Row']
export type AssignmentSubmissionInsert = Database['public']['Tables']['assignment_submissions']['Insert']
export type AssignmentSubmissionUpdate = Database['public']['Tables']['assignment_submissions']['Update']

export type AssignmentAttachment = Database['public']['Tables']['assignment_attachments']['Row']
export type AssignmentAttachmentInsert = Database['public']['Tables']['assignment_attachments']['Insert']

// Add more as you complete the types file
// export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
// export type ParentChild = Database['public']['Tables']['parent_children']['Row']

// Joined types for common queries
export type AssignmentWithRelations = Assignment & {
  class?: { id: string; name: string; subject: string }
  teacher?: { id: string; name: string }
  submissions?: AssignmentSubmission[]
}

export type SubmissionWithRelations = AssignmentSubmission & {
  student?: { id: string; name: string; avatar?: string }
  files?: Array<{
    id: string
    name: string
    type: string
    url: string
    size: string
  }>
}

// Enum types from database constraints
export type AssignmentStatus = 'draft' | 'published' | 'closed'
export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late'
export type AttachmentType = 'pdf' | 'document' | 'image' | 'link'

// Helper to extract enum values from database check constraints
export type ExtractEnumType<T extends string> = T extends `${infer U}` ? U : never
