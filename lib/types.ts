export interface WorkerMetric {
  worker_id: string
  name: string
  active_minutes: number
  idle_minutes: number
  absent_minutes: number
  utilization: number
  total_units: number
  units_per_hour: number
}

export interface WorkstationMetric {
  station_id: string
  name: string
  type: string
  occupancy_minutes: number
  utilization: number
  total_units: number
  throughput_rate: number
}

export interface FactoryMetric {
  total_productive_minutes: number
  total_idle_minutes: number
  total_absent_minutes: number
  total_production_count: number
  average_production_rate: number
  average_utilization: number
  shift_duration_hours: number
  worker_count: number
  workstation_count: number
}

export interface MetricsResponse {
  factory: FactoryMetric
  workers: WorkerMetric[]
  workstations: WorkstationMetric[]
}
