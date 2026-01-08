"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"

interface AuditLogFiltersProps {
  onFilterChange: (filters: {
    userId?: string
    action?: string
    startDate?: string
    endDate?: string
    ipAddress?: string
  }) => void
}

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "user_signedup", label: "User Signed Up" },
  { value: "user_updated_password", label: "Password Changed" },
  { value: "user_recovery_requested", label: "Password Reset" },
  { value: "user_modified", label: "User Modified" },
  { value: "user_deleted", label: "User Deleted" },
  { value: "token_refreshed", label: "Token Refreshed" },
  { value: "token_revoked", label: "Token Revoked" },
]

export function AuditLogFilters({ onFilterChange }: AuditLogFiltersProps) {
  const [filters, setFilters] = useState({
    userId: "",
    action: "all",
    startDate: "",
    endDate: "",
    ipAddress: "",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([k, v]) => v !== "" && !(k === "action" && v === "all"))
    )
    onFilterChange(cleanFilters)
  }

  const handleClearFilters = () => {
    const emptyFilters = {
      userId: "",
      action: "all",
      startDate: "",
      endDate: "",
      ipAddress: "",
    }
    setFilters(emptyFilters)
    onFilterChange({})
  }

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v !== "" && !(k === "action" && v === "all"))

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="action">Action Type</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Filter by user ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              placeholder="Filter by IP"
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
