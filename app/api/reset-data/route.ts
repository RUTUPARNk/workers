import { getDb } from "@/lib/db"
import { seedEvents } from "@/lib/init-db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const db = getDb()

    // Clear all events
    db.prepare("DELETE FROM events").run()

    // Re-seed with fresh dummy events
    seedEvents(db)

    const count = db.prepare("SELECT COUNT(*) as cnt FROM events").get() as { cnt: number }

    return NextResponse.json({
      message: "Data reset successfully",
      events_seeded: count.cnt,
    })
  } catch (err) {
    console.error("Reset error:", err)
    return NextResponse.json({ error: "Failed to reset data" }, { status: 500 })
  }
}
