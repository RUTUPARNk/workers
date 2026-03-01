import { getDb } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support single event or batch of events
    const events = Array.isArray(body) ? body : [body]

    const results: { event_id: string; status: string }[] = []
    const errors: { event: Record<string, unknown>; error: string }[] = []

    const db = getDb()
    const insertStmt = db.prepare(
      `INSERT OR IGNORE INTO events (event_id, timestamp, worker_id, workstation_id, event_type, confidence, count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )

    for (const event of events) {
      const { timestamp, worker_id, workstation_id, event_type, confidence, count } = event

      // Validate required fields
      if (!timestamp || !worker_id || !workstation_id || !event_type) {
        errors.push({
          event,
          error: "Missing required fields: timestamp, worker_id, workstation_id, event_type",
        })
        continue
      }

      // Validate event_type
      const validTypes = ["working", "idle", "absent", "product_count"]
      if (!validTypes.includes(event_type)) {
        errors.push({
          event,
          error: `Invalid event_type. Must be one of: ${validTypes.join(", ")}`,
        })
        continue
      }

      // Validate timestamp
      const parsedTimestamp = new Date(timestamp)
      if (isNaN(parsedTimestamp.getTime())) {
        errors.push({ event, error: "Invalid timestamp format" })
        continue
      }

      // Generate event_id if not provided (for deduplication)
      const eventId = event.event_id || `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      try {
        const result = insertStmt.run(
          eventId,
          timestamp,
          worker_id,
          workstation_id,
          event_type,
          confidence ?? 0,
          count ?? 0
        )
        results.push({ event_id: eventId, status: result.changes > 0 ? "inserted" : "duplicate" })
      } catch (dbErr: unknown) {
        const message = dbErr instanceof Error ? dbErr.message : "Database error"
        errors.push({ event, error: message })
      }
    }

    return NextResponse.json(
      {
        inserted: results.filter(r => r.status === "inserted").length,
        duplicates: results.filter(r => r.status === "duplicate").length,
        errors: errors.length,
        results,
        ...(errors.length > 0 ? { error_details: errors } : {}),
      },
      { status: errors.length > 0 && results.length === 0 ? 400 : 200 }
    )
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
