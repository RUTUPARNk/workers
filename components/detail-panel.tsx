"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WorkerMetric, WorkstationMetric } from "@/lib/types"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function WorkerDetailPanel({ worker }: { worker: WorkerMetric }) {
  const pieData = [
    { name: "Active", value: worker.active_minutes, color: "var(--color-chart-2)" },
    { name: "Idle", value: worker.idle_minutes, color: "var(--color-chart-3)" },
    { name: "Absent", value: worker.absent_minutes, color: "var(--color-chart-4)" },
  ].filter((d) => d.value > 0)

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">{worker.name}</CardTitle>
            <CardDescription>
              Worker {worker.worker_id} - Detailed shift breakdown
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-foreground">
            {worker.worker_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-foreground">Time Breakdown</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md bg-chart-2/10 px-3 py-2">
                <span className="text-sm text-foreground">Active Time</span>
                <span className="font-semibold text-chart-2">{formatMinutes(worker.active_minutes)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-chart-3/10 px-3 py-2">
                <span className="text-sm text-foreground">Idle Time</span>
                <span className="font-semibold text-chart-3">{formatMinutes(worker.idle_minutes)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-chart-4/10 px-3 py-2">
                <span className="text-sm text-foreground">Absent Time</span>
                <span className="font-semibold text-chart-4">{formatMinutes(worker.absent_minutes)}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <span className="text-lg font-bold text-foreground">{worker.utilization}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Units</span>
                <span className="text-lg font-bold text-foreground">{worker.total_units}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Units/Hour</span>
                <span className="text-lg font-bold text-foreground">{worker.units_per_hour}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Time Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatMinutes(value)}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs text-muted-foreground">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkstationDetailPanel({ workstation }: { workstation: WorkstationMetric }) {
  const barData = [
    { name: "Occupancy", value: workstation.occupancy_minutes },
    { name: "Idle", value: 480 - workstation.occupancy_minutes },
  ]

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">{workstation.name}</CardTitle>
            <CardDescription>
              Station {workstation.station_id} - {workstation.type} workstation details
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-foreground">
            {workstation.station_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-foreground">Station Metrics</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md bg-chart-1/10 px-3 py-2">
                <span className="text-sm text-foreground">Occupancy Time</span>
                <span className="font-semibold text-chart-1">{formatMinutes(workstation.occupancy_minutes)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm text-foreground">Idle Time</span>
                <span className="font-semibold text-muted-foreground">{formatMinutes(480 - workstation.occupancy_minutes)}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <span className="text-lg font-bold text-foreground">{workstation.utilization}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Units</span>
                <span className="text-lg font-bold text-foreground">{workstation.total_units}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Throughput Rate</span>
                <span className="text-lg font-bold text-foreground">{workstation.throughput_rate} u/hr</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Occupancy vs Idle</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  formatter={(value: number) => formatMinutes(value)}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-foreground)",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  <Cell fill="var(--color-chart-1)" />
                  <Cell fill="var(--color-muted)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
