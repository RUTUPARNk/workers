"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, RotateCcw } from "lucide-react"

export function DashboardHeader({
  onRefresh,
  onReset,
  isLoading,
  isResetting,
}: {
  onRefresh: () => void
  onReset: () => void
  isLoading: boolean
  isResetting: boolean
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl text-balance">
          Factory Productivity Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered worker monitoring -- Shift: 08:00 - 16:00 UTC -- Jan 15, 2026
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isResetting}
          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
          Reset Data
        </Button>
      </div>
    </header>
  )
}
