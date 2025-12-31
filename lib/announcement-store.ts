"use client"

import { create } from "zustand"

export type UserRole = "admin" | "teacher" | "student"

export interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorRole: UserRole
  targetAudience: "all" | "students" | "teachers" | "grade-10" | "grade-11" | "grade-12"
  priority: "normal" | "important" | "urgent"
  createdAt: string
  expiresAt?: string
}

interface AnnouncementStore {
  announcements: Announcement[]
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => void
  deleteAnnouncement: (id: string) => void
  getAnnouncementsForUser: (userRole: UserRole, grade?: string) => Announcement[]
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  announcements: [],

  addAnnouncement: (announcement) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: crypto.randomUUID(), // Use UUID
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      announcements: [newAnnouncement, ...state.announcements],
    }))
  },

  deleteAnnouncement: (id) => {
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    }))
  },

  getAnnouncementsForUser: (userRole, grade) => {
    const { announcements } = get()
    return announcements
      .filter((a) => {
        if (a.targetAudience === "all") return true
        if (a.targetAudience === "students" && userRole === "student") return true
        if (a.targetAudience === "teachers" && userRole === "teacher") return true
        if (grade && a.targetAudience === `grade-${grade}`) return true
        if (userRole === "admin") return true
        return false
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },
}))