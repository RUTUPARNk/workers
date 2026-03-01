"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkerMetric, WorkstationMetric } from "@/lib/types"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

export function WorkerUtilizationChart({ workers }: { workers: WorkerMetric[] }) {
  const data = workers.map((w) => ({
    name: w.worker_id,
    utilization: w.utilization,
    units: w.total_units,
  }))

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-foreground">Worker Utilization Overview</CardTitle>
        <CardDescription>Utilization % and total units produced per worker</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              label={{
                value: "Utilization %",
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--color-muted-foreground)", fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              label={{
                value: "Units",
                angle: 90,
                position: "insideRight",
                style: { fill: "var(--color-muted-foreground)", fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-foreground)",
              }}
            />
            <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />
            <Bar yAxisId="left" dataKey="utilization" name="Utilization %" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="units" name="Units Produced" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function WorkstationUtilizationChart({ workstations }: { workstations: WorkstationMetric[] }) {
  const data = workstations.map((ws) => ({
    name: ws.station_id,
    utilization: ws.utilization,
    throughput: ws.throughput_rate,
  }))

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-foreground">Workstation Utilization Overview</CardTitle>
        <CardDescription>Utilization % and throughput rate per station</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              label={{
                value: "Utilization %",
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--color-muted-foreground)", fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              label={{
                value: "Throughput (u/hr)",
                angle: 90,
                position: "insideRight",
                style: { fill: "var(--color-muted-foreground)", fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-foreground)",
              }}
            />
            <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />
            <Bar yAxisId="left" dataKey="utilization" name="Utilization %" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="throughput" name="Throughput (u/hr)" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
