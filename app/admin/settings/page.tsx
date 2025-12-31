"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { MapPin, Save, RotateCcw, Navigation, CheckCircle2, Building2, Plus, Pencil, Trash2 } from "lucide-react"
import { useSchoolLocationStore } from "@/lib/school-location-store"
import { useDepartmentStore, type Department } from "@/lib/department-store"
import { Slider } from "@/components/ui/slider"

export default function AdminSettingsPage() {
  const { location, setLocation } = useSchoolLocationStore()
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useDepartmentStore()
  
  const [formData, setFormData] = useState({
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: location.radiusMeters,
  })
  const [saved, setSaved] = useState(false)
  
  // Department state
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptForm, setDeptForm] = useState({ name: "", description: "" })

  useEffect(() => {
    setFormData({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: location.radiusMeters,
    })
  }, [location])

  const handleSave = () => {
    setLocation({
      name: formData.name,
      latitude: formData.latitude,
      longitude: formData.longitude,
      radiusMeters: formData.radiusMeters,
    })
    setSaved(true)
    toast.success("Settings saved successfully")
    setTimeout(() => setSaved(false), 2000)
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", { description: "Your browser does not support geolocation" })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))
        toast.success("Location updated")
      },
      (error) => {
        toast.error("Unable to get location", { description: error.message })
      },
      { enableHighAccuracy: true }
    )
  }

  const handleReset = () => {
    setFormData({
      name: "LessonGo School Campus",
      latitude: 14.5995,
      longitude: 120.9842,
      radiusMeters: 500,
    })
  }

  const openAddDept = () => {
    setEditingDept(null)
    setDeptForm({ name: "", description: "" })
    setDeptDialogOpen(true)
  }

  const openEditDept = (dept: Department) => {
    setEditingDept(dept)
    setDeptForm({ name: dept.name, description: dept.description || "" })
    setDeptDialogOpen(true)
  }

  const handleSaveDept = () => {
    if (!deptForm.name.trim()) {
      toast.error("Department name is required")
      return
    }
    
    if (editingDept) {
      updateDepartment(editingDept.id, deptForm.name, deptForm.description)
      toast.success("Department updated")
    } else {
      addDepartment(deptForm.name, deptForm.description)
      toast.success("Department added")
    }
    
    setDeptDialogOpen(false)
    setDeptForm({ name: "", description: "" })
  }

  const handleDeleteDept = (id: string, name: string) => {
    deleteDepartment(id)
    toast.success(`"${name}" deleted`)
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Settings" subtitle="Configure system settings" />
      
      <div className="p-6 space-y-6">
        {/* School Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              School Location Settings
            </CardTitle>
            <CardDescription>
              Configure the school location for attendance check-in. Students must be within the specified radius to check in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter school name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Allowed Radius</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.radiusMeters]}
                    onValueChange={(value: number[]) => setFormData((prev) => ({ ...prev, radiusMeters: value[0] }))}
                    min={50}
                    max={2000}
                    step={50}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-20">{formData.radiusMeters}m</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 14.5995"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 120.9842"
                />
              </div>
            </div>

            <Button variant="outline" onClick={handleGetCurrentLocation} className="w-full md:w-auto">
              <Navigation className="mr-2 h-4 w-4" />
              Use Current Location
            </Button>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave}>
                {saved ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {location.name}
              </Badge>
              <Badge variant="outline">
                Lat: {location.latitude.toFixed(6)}
              </Badge>
              <Badge variant="outline">
                Lng: {location.longitude.toFixed(6)}
              </Badge>
              <Badge variant="outline">
                Radius: {location.radiusMeters}m
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Teachers can choose per-session whether to require location check-in.
            </p>
          </CardContent>
        </Card>

        {/* Department Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Department Management
                </CardTitle>
                <CardDescription>
                  Manage departments for organizing teachers and subjects.
                </CardDescription>
              </div>
              <Button onClick={openAddDept}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{dept.name}</p>
                    {dept.description && (
                      <p className="text-xs text-muted-foreground truncate">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDept(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {departments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No departments yet. Click "Add Department" to create one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Department Dialog */}
        <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
              <DialogDescription>
                {editingDept ? "Update department information." : "Create a new department."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deptName">Department Name</Label>
                <Input
                  id="deptName"
                  placeholder="e.g., Mathematics"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deptDesc">Description (Optional)</Label>
                <Input
                  id="deptDesc"
                  placeholder="e.g., Math and Statistics"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveDept}>
                {editingDept ? "Save Changes" : "Add Department"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
