import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FactoryMetric } from "@/lib/types"
import { Activity, Clock, Package, TrendingUp, Users, Wrench } from "lucide-react"

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function FactoryKpis({ factory }: { factory: FactoryMetric }) {
  const kpis = [
    {
      label: "Total Productive Time",
      value: formatMinutes(factory.total_productive_minutes),
      icon: Clock,
      description: `Across ${factory.worker_count} workers`,
    },
    {
      label: "Total Units Produced",
      value: factory.total_production_count.toLocaleString(),
      icon: Package,
      description: "All workstations combined",
    },
    {
      label: "Avg Production Rate",
      value: `${factory.average_production_rate} units/hr`,
      icon: TrendingUp,
      description: "Per hour of productive time",
    },
    {
      label: "Avg Worker Utilization",
      value: `${factory.average_utilization}%`,
      icon: Activity,
      description: "Active / total observed time",
    },
    {
      label: "Workers Active",
      value: factory.worker_count.toString(),
      icon: Users,
      description: `${factory.shift_duration_hours}h shift`,
    },
    {
      label: "Workstations",
      value: factory.workstation_count.toString(),
      icon: Wrench,
      description: "Monitored stations",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
