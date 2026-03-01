"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { WorkstationMetric } from "@/lib/types"

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getUtilizationColor(util: number): string {
  if (util >= 60) return "text-chart-2"
  if (util >= 40) return "text-chart-3"
  return "text-destructive"
}

function getTypeBadge(type: string) {
  const colorMap: Record<string, string> = {
    Assembly: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    Welding: "bg-chart-3/15 text-chart-3 border-chart-3/30",
    Inspection: "bg-chart-4/15 text-chart-4 border-chart-4/30",
    Packaging: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    Painting: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  }
  return (
    <Badge variant="outline" className={`font-medium ${colorMap[type] || ""}`}>
      {type}
    </Badge>
  )
}

export function WorkstationsTable({
  workstations,
  onSelect,
  selectedId,
}: {
  workstations: WorkstationMetric[]
  onSelect: (id: string | null) => void
  selectedId: string | null
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-foreground">Workstation Metrics</CardTitle>
        <CardDescription>
          Occupancy and throughput metrics for each workstation. Click a row to view details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Station Name</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-right">Occupancy</TableHead>
              <TableHead className="text-center">Utilization</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Throughput</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workstations.map((ws) => (
              <TableRow
                key={ws.station_id}
                className={`cursor-pointer transition-colors ${
                  selectedId === ws.station_id
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelect(selectedId === ws.station_id ? null : ws.station_id)}
              >
                <TableCell className="font-mono text-sm font-medium text-foreground">{ws.station_id}</TableCell>
                <TableCell className="font-medium text-foreground">{ws.name}</TableCell>
                <TableCell className="text-center">{getTypeBadge(ws.type)}</TableCell>
                <TableCell className="text-right text-foreground">{formatMinutes(ws.occupancy_minutes)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={ws.utilization} className="h-2 w-16" />
                    <span className={`text-sm font-medium ${getUtilizationColor(ws.utilization)}`}>
                      {ws.utilization}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">{ws.total_units}</TableCell>
                <TableCell className="text-right text-foreground">{ws.throughput_rate} u/hr</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
