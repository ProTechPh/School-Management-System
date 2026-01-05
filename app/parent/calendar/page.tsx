"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { CalendarView } from "@/components/calendar-view"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useParentStore } from "@/lib/parent-store"
import { students } from "@/lib/mock-data"

export default function ParentCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState("")

  const { getChildrenIds } = useParentStore()

  const parentId = "p1"
  const childrenIds = getChildrenIds(parentId)

  useEffect(() => {
    if (childrenIds.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenIds[0])
    }
    setLoading(false)
  }, [childrenIds, selectedChildId])

  const selectedChild = students.find((s) => s.id === selectedChildId)

  // Mock class IDs for the selected child
  const classIds = ["c1", "c3"] // In production, fetch from API

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Calendar" subtitle="View your child's schedule and events" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Calendar"
        subtitle="View your child's schedule and events"
      />
      <div className="p-4 lg:p-6 space-y-6">
        {childrenIds.length > 1 && (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {childrenIds.map((childId) => {
                const child = students.find((s) => s.id === childId)
                return (
                  <SelectItem key={childId} value={childId}>
                    {child?.name || childId}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}

        {selectedChild && (
          <CalendarView
            userId={parentId}
            userRole="parent"
            classIds={classIds}
            canCreate={false}
          />
        )}
      </div>
    </div>
  )
}
