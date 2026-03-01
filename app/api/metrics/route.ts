import { getDb, SHIFT_DURATION_MINUTES, SHIFT_DURATION_HOURS } from "@/lib/db"
import { NextResponse } from "next/server"

interface RawEvent {
  worker_id: string
  workstation_id: string
  event_type: string
  timestamp: string
  count: number
  worker_name: string
  station_name: string
  station_type: string
}

interface WorkerRow {
  worker_id: string
  name: string
}

interface StationRow {
  station_id: string
  name: string
  type: string
}

/**
 * Metrics computation approach:
 *
 * We use a state-machine approach per worker. Events are sorted by timestamp.
 * Each event's type (working/idle/absent) defines the worker's state until the next event.
 * The duration is: next_event.timestamp - current_event.timestamp.
 * For the last event in a shift, the state continues until shift end (16:00 UTC).
 *
 * product_count events are discrete - they record units produced at a point in time
 * and do NOT change the worker's state (the previous state continues).
 */

export async function GET() {
  try {
    const db = getDb()

    // Fetch all events with worker and workstation info, sorted by worker then timestamp
    const events = db.prepare(`
      SELECT
        e.worker_id, e.workstation_id, e.event_type, e.timestamp, e.count,
        w.name as worker_name,
        ws.name as station_name, ws.type as station_type
      FROM events e
      JOIN workers w ON e.worker_id = w.worker_id
      JOIN workstations ws ON e.workstation_id = ws.station_id
      ORDER BY e.worker_id, e.timestamp ASC
    `).all() as RawEvent[]

    // Fetch all workers and workstations for complete listing
    const workers = db.prepare("SELECT worker_id, name FROM workers ORDER BY worker_id").all() as WorkerRow[]
    const workstations = db.prepare("SELECT station_id, name, type FROM workstations ORDER BY station_id").all() as StationRow[]

    // Group events by worker
    const eventsByWorker: Record<string, RawEvent[]> = {}
    for (const w of workers) {
      eventsByWorker[w.worker_id] = []
    }
    for (const evt of events) {
      if (!eventsByWorker[evt.worker_id]) eventsByWorker[evt.worker_id] = []
      eventsByWorker[evt.worker_id].push(evt)
    }

    // Determine shift end from data (or use default)
    let shiftEnd: Date | null = null
    if (events.length > 0) {
      const firstTs = new Date(events[0].timestamp)
      shiftEnd = new Date(firstTs)
      shiftEnd.setUTCHours(16, 0, 0, 0)
    }

    // Compute worker-level metrics
    const workerMetrics = workers.map((w) => {
      const workerEvents = eventsByWorker[w.worker_id] || []
      // Filter state events (not product_count)
      const stateEvents = workerEvents.filter((e) => e.event_type !== "product_count")
      const productEvents = workerEvents.filter((e) => e.event_type === "product_count")

      let activeMinutes = 0
      let idleMinutes = 0
      let absentMinutes = 0
      const totalUnits = productEvents.reduce((sum, e) => sum + (e.count || 0), 0)

      for (let i = 0; i < stateEvents.length; i++) {
        const current = new Date(stateEvents[i].timestamp)
        const next = i + 1 < stateEvents.length ? new Date(stateEvents[i + 1].timestamp) : shiftEnd
        if (!next) continue

        const durationMin = (next.getTime() - current.getTime()) / 60000

        switch (stateEvents[i].event_type) {
          case "working":
            activeMinutes += durationMin
            break
          case "idle":
            idleMinutes += durationMin
            break
          case "absent":
            absentMinutes += durationMin
            break
        }
      }

      const totalObservedMinutes = activeMinutes + idleMinutes + absentMinutes
      const utilization = totalObservedMinutes > 0 ? (activeMinutes / totalObservedMinutes) * 100 : 0
      const unitsPerHour = SHIFT_DURATION_HOURS > 0 ? totalUnits / SHIFT_DURATION_HOURS : 0

      return {
        worker_id: w.worker_id,
        name: w.name,
        active_minutes: Math.round(activeMinutes),
        idle_minutes: Math.round(idleMinutes),
        absent_minutes: Math.round(absentMinutes),
        utilization: Math.round(utilization * 10) / 10,
        total_units: totalUnits,
        units_per_hour: Math.round(unitsPerHour * 10) / 10,
      }
    })

    // Group events by workstation
    const eventsByStation: Record<string, RawEvent[]> = {}
    for (const ws of workstations) {
      eventsByStation[ws.station_id] = []
    }
    for (const evt of events) {
      if (!eventsByStation[evt.workstation_id]) eventsByStation[evt.workstation_id] = []
      eventsByStation[evt.workstation_id].push(evt)
    }

    // Compute workstation-level metrics
    const workstationMetrics = workstations.map((ws) => {
      const stationEvents = eventsByStation[ws.station_id] || []
      const stateEvents = stationEvents.filter((e) => e.event_type !== "product_count")
      const productEvents = stationEvents.filter((e) => e.event_type === "product_count")

      let occupancyMinutes = 0

      for (let i = 0; i < stateEvents.length; i++) {
        const current = new Date(stateEvents[i].timestamp)
        const next = i + 1 < stateEvents.length ? new Date(stateEvents[i + 1].timestamp) : shiftEnd
        if (!next) continue

        const durationMin = (next.getTime() - current.getTime()) / 60000
        if (stateEvents[i].event_type === "working") {
          occupancyMinutes += durationMin
        }
      }

      const totalUnits = productEvents.reduce((sum, e) => sum + (e.count || 0), 0)
      const utilization = SHIFT_DURATION_MINUTES > 0 ? (occupancyMinutes / SHIFT_DURATION_MINUTES) * 100 : 0
      const throughputRate = occupancyMinutes > 0 ? totalUnits / (occupancyMinutes / 60) : 0

      return {
        station_id: ws.station_id,
        name: ws.name,
        type: ws.type,
        occupancy_minutes: Math.round(occupancyMinutes),
        utilization: Math.round(utilization * 10) / 10,
        total_units: totalUnits,
        throughput_rate: Math.round(throughputRate * 10) / 10,
      }
    })

    // Factory-level metrics
    const totalProductiveMinutes = workerMetrics.reduce((sum, w) => sum + w.active_minutes, 0)
    const totalProductionCount = workerMetrics.reduce((sum, w) => sum + w.total_units, 0)
    const avgProductionRate =
      totalProductiveMinutes > 0 ? totalProductionCount / (totalProductiveMinutes / 60) : 0
    const avgUtilization =
      workerMetrics.length > 0
        ? workerMetrics.reduce((sum, w) => sum + w.utilization, 0) / workerMetrics.length
        : 0
    const totalIdleMinutes = workerMetrics.reduce((sum, w) => sum + w.idle_minutes, 0)
    const totalAbsentMinutes = workerMetrics.reduce((sum, w) => sum + w.absent_minutes, 0)

    return NextResponse.json({
      factory: {
        total_productive_minutes: totalProductiveMinutes,
        total_idle_minutes: totalIdleMinutes,
        total_absent_minutes: totalAbsentMinutes,
        total_production_count: totalProductionCount,
        average_production_rate: Math.round(avgProductionRate * 10) / 10,
        average_utilization: Math.round(avgUtilization * 10) / 10,
        shift_duration_hours: SHIFT_DURATION_HOURS,
        worker_count: workers.length,
        workstation_count: workstations.length,
      },
      workers: workerMetrics,
      workstations: workstationMetrics,
    })
  } catch (err) {
    console.error("Metrics error:", err)
    return NextResponse.json({ error: "Failed to compute metrics" }, { status: 500 })
  }
}
