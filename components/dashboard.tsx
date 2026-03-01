"use client"

import useSWR from "swr"
import { useState } from "react"
import type { MetricsResponse } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { FactoryKpis } from "@/components/factory-kpis"
import { WorkersTable } from "@/components/workers-table"
import { WorkstationsTable } from "@/components/workstations-table"
import { WorkerDetailPanel, WorkstationDetailPanel } from "@/components/detail-panel"
import { WorkerUtilizationChart, WorkstationUtilizationChart } from "@/components/utilization-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<MetricsResponse>("/api/metrics", fetcher, {
    refreshInterval: 30000,
  })
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await fetch("/api/reset-data", { method: "POST" })
      setSelectedWorker(null)
      setSelectedStation(null)
      await mutate()
    } finally {
      setIsResetting(false)
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Failed to load metrics</p>
              <p className="text-sm text-muted-foreground">
                Please check your database connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isLoading || !data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </main>
    )
  }

  const activeWorker = selectedWorker
    ? data.workers.find((w) => w.worker_id === selectedWorker)
    : null
  const activeStation = selectedStation
    ? data.workstations.find((ws) => ws.station_id === selectedStation)
    : null

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <DashboardHeader
          onRefresh={() => mutate()}
          onReset={handleReset}
          isLoading={isLoading}
          isResetting={isResetting}
        />

        {/* Factory KPIs */}
        <section aria-label="Factory-level summary">
          <FactoryKpis factory={data.factory} />
        </section>

        {/* Utilization Charts */}
        <section aria-label="Utilization charts" className="grid gap-6 lg:grid-cols-2">
          <WorkerUtilizationChart workers={data.workers} />
          <WorkstationUtilizationChart workstations={data.workstations} />
        </section>

        {/* Worker Metrics */}
        <section aria-label="Worker metrics">
          <WorkersTable
            workers={data.workers}
            onSelect={(id) => {
              setSelectedWorker(id)
              if (id) setSelectedStation(null)
            }}
            selectedId={selectedWorker}
          />
          {activeWorker && <div className="mt-4"><WorkerDetailPanel worker={activeWorker} /></div>}
        </section>

        {/* Workstation Metrics */}
        <section aria-label="Workstation metrics">
          <WorkstationsTable
            workstations={data.workstations}
            onSelect={(id) => {
              setSelectedStation(id)
              if (id) setSelectedWorker(null)
            }}
            selectedId={selectedStation}
          />
          {activeStation && <div className="mt-4"><WorkstationDetailPanel workstation={activeStation} /></div>}
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-4">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Assumptions:</strong> Each event defines a worker state (working/idle/absent) that persists until the next event. The last event&apos;s state extends to shift end (16:00 UTC). Product count events are discrete and do not alter the state.
            </p>
            <p>
              <strong className="text-foreground">Metrics refresh:</strong> Computed on-the-fly from raw events. Auto-refreshes every 30s.
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
