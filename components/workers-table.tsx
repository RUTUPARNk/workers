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
import type { WorkerMetric } from "@/lib/types"

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getUtilizationColor(util: number): string {
  if (util >= 75) return "text-chart-2"
  if (util >= 50) return "text-chart-3"
  return "text-destructive"
}

function getUtilizationBadge(util: number) {
  if (util >= 75) return <Badge variant="default" className="bg-chart-2 text-foreground font-medium">High</Badge>
  if (util >= 50) return <Badge variant="secondary" className="font-medium">Medium</Badge>
  return <Badge variant="destructive" className="font-medium">Low</Badge>
}

export function WorkersTable({
  workers,
  onSelect,
  selectedId,
}: {
  workers: WorkerMetric[]
  onSelect: (id: string | null) => void
  selectedId: string | null
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-foreground">Worker Metrics</CardTitle>
        <CardDescription>
          Individual productivity metrics for all workers during the shift. Click a row to view details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="text-right">Idle</TableHead>
              <TableHead className="text-right">Absent</TableHead>
              <TableHead className="text-center">Utilization</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Units/hr</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((w) => (
              <TableRow
                key={w.worker_id}
                className={`cursor-pointer transition-colors ${
                  selectedId === w.worker_id
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelect(selectedId === w.worker_id ? null : w.worker_id)}
              >
                <TableCell className="font-mono text-sm font-medium text-foreground">{w.worker_id}</TableCell>
                <TableCell className="font-medium text-foreground">{w.name}</TableCell>
                <TableCell className="text-right text-foreground">{formatMinutes(w.active_minutes)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatMinutes(w.idle_minutes)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatMinutes(w.absent_minutes)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={w.utilization} className="h-2 w-16" />
                    <span className={`text-sm font-medium ${getUtilizationColor(w.utilization)}`}>
                      {w.utilization}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">{w.total_units}</TableCell>
                <TableCell className="text-right text-foreground">{w.units_per_hour}</TableCell>
                <TableCell className="text-center">{getUtilizationBadge(w.utilization)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
