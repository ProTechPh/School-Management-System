"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  header: string | React.ReactNode | (() => React.ReactNode)
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string }>({ columns, data, onRowClick }: DataTableProps<T>) {
  const renderHeader = (header: string | React.ReactNode | (() => React.ReactNode)) => {
    if (typeof header === "function") {
      return header()
    }
    return header
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={cn("text-muted-foreground", column.className)}>
                {renderHeader(column.header)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={cn("border-border", onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <TableCell key={`${item.id}-${String(column.key)}`} className={column.className}>
                  {column.render ? column.render(item) : String(item[column.key as keyof T] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
