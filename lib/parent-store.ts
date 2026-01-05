"use client"

import { create } from "zustand"
import type { ParentRelationship } from "@/lib/types"

export interface Parent {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  address?: string
  childrenIds: string[]
}

export interface ParentChildLink {
  parentId: string
  studentId: string
  relationship: ParentRelationship
}

// No mock data - data comes from database via API

interface ParentStore {
  parents: Parent[]
  parentChildLinks: ParentChildLink[]
  
  // Parent actions
  getParent: (parentId: string) => Parent | undefined
  getParentByEmail: (email: string) => Parent | undefined
  getChildrenIds: (parentId: string) => string[]
  getParentsForStudent: (studentId: string) => Parent[]
  
  // Communication
  canViewStudent: (parentId: string, studentId: string) => boolean
}

export const useParentStore = create<ParentStore>((_set, get) => ({
  parents: [],
  parentChildLinks: [],

  getParent: (parentId) => {
    return get().parents.find((p) => p.id === parentId)
  },

  getParentByEmail: (email) => {
    return get().parents.find((p) => p.email === email)
  },

  getChildrenIds: (parentId) => {
    const parent = get().parents.find((p) => p.id === parentId)
    return parent?.childrenIds || []
  },

  getParentsForStudent: (studentId) => {
    const links = get().parentChildLinks.filter((l) => l.studentId === studentId)
    const parentIds = links.map((l) => l.parentId)
    return get().parents.filter((p) => parentIds.includes(p.id))
  },

  canViewStudent: (parentId, studentId) => {
    const parent = get().parents.find((p) => p.id === parentId)
    return parent?.childrenIds.includes(studentId) || false
  },
}))
