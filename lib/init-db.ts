import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "factory.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      worker_id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workstations (
      station_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE,
      timestamp TEXT NOT NULL,
      worker_id TEXT NOT NULL REFERENCES workers(worker_id),
      workstation_id TEXT NOT NULL REFERENCES workstations(station_id),
      event_type TEXT NOT NULL CHECK (event_type IN ('working', 'idle', 'absent', 'product_count')),
      confidence REAL DEFAULT 0.0,
      count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_worker_id ON events(worker_id);
    CREATE INDEX IF NOT EXISTS idx_events_workstation_id ON events(workstation_id);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);
  `);

  // Seed workers if empty
  const workerCount = _db
    .prepare("SELECT COUNT(*) as cnt FROM workers")
    .get() as { cnt: number };
  if (workerCount.cnt === 0) {
    const insertWorker = _db.prepare(
      "INSERT INTO workers (worker_id, name) VALUES (?, ?)",
    );
    const workers = [
      ["W1", "Alice Johnson"],
      ["W2", "Bob Martinez"],
      ["W3", "Carol Chen"],
      ["W4", "David Kim"],
      ["W5", "Eva Patel"],
      ["W6", "Frank Okafor"],
    ];
    const tx = _db.transaction(() => {
      for (const w of workers) insertWorker.run(w[0], w[1]);
    });
    tx();
  }

  // Seed workstations if empty
  const stationCount = _db
    .prepare("SELECT COUNT(*) as cnt FROM workstations")
    .get() as { cnt: number };
  if (stationCount.cnt === 0) {
    const insertStation = _db.prepare(
      "INSERT INTO workstations (station_id, name, type) VALUES (?, ?, ?)",
    );
    const stations = [
      ["S1", "Assembly Line A", "Assembly"],
      ["S2", "Assembly Line B", "Assembly"],
      ["S3", "Welding Bay", "Welding"],
      ["S4", "Quality Control", "Inspection"],
      ["S5", "Packaging Unit", "Packaging"],
      ["S6", "Paint Booth", "Painting"],
    ];
    const tx = _db.transaction(() => {
      for (const s of stations) insertStation.run(s[0], s[1], s[2]);
    });
    tx();
  }

  // Seed events if empty
  const eventCount = _db
    .prepare("SELECT COUNT(*) as cnt FROM events")
    .get() as { cnt: number };
  if (eventCount.cnt === 0) {
    seedEvents(_db);
  }

  return _db;
}

function seedEvents(db: Database.Database) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO events (event_id, timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const rows: [string, string, string, string, string, number, number][] = [
    // Worker 1 - Assembly Line A (strong performer)
    ["EVT-001", "2026-01-15T08:00:00Z", "W1", "S1", "working", 0.95, 0],
    ["EVT-002", "2026-01-15T08:01:00Z", "W1", "S1", "product_count", 0.99, 4],
    ["EVT-003", "2026-01-15T08:25:00Z", "W1", "S1", "working", 0.92, 0],
    ["EVT-004", "2026-01-15T08:26:00Z", "W1", "S1", "product_count", 0.99, 3],
    ["EVT-005", "2026-01-15T08:50:00Z", "W1", "S1", "idle", 0.88, 0],
    ["EVT-006", "2026-01-15T09:15:00Z", "W1", "S1", "working", 0.91, 0],
    ["EVT-007", "2026-01-15T09:16:00Z", "W1", "S1", "product_count", 0.99, 5],
    ["EVT-008", "2026-01-15T09:45:00Z", "W1", "S1", "working", 0.94, 0],
    ["EVT-009", "2026-01-15T09:46:00Z", "W1", "S1", "product_count", 0.99, 2],
    ["EVT-010", "2026-01-15T10:15:00Z", "W1", "S1", "idle", 0.85, 0],
    ["EVT-011", "2026-01-15T10:40:00Z", "W1", "S1", "working", 0.93, 0],
    ["EVT-012", "2026-01-15T10:41:00Z", "W1", "S1", "product_count", 0.99, 6],
    ["EVT-013", "2026-01-15T11:10:00Z", "W1", "S1", "absent", 0.82, 0],
    ["EVT-014", "2026-01-15T11:40:00Z", "W1", "S1", "working", 0.96, 0],
    ["EVT-015", "2026-01-15T11:41:00Z", "W1", "S1", "product_count", 0.99, 3],
    ["EVT-016", "2026-01-15T12:10:00Z", "W1", "S1", "working", 0.93, 0],
    ["EVT-017", "2026-01-15T12:11:00Z", "W1", "S1", "product_count", 0.99, 2],
    ["EVT-018", "2026-01-15T12:40:00Z", "W1", "S1", "idle", 0.87, 0],
    ["EVT-019", "2026-01-15T13:10:00Z", "W1", "S1", "working", 0.91, 0],
    ["EVT-020", "2026-01-15T13:11:00Z", "W1", "S1", "product_count", 0.99, 4],
    ["EVT-021", "2026-01-15T13:40:00Z", "W1", "S1", "working", 0.95, 0],
    ["EVT-022", "2026-01-15T14:10:00Z", "W1", "S1", "idle", 0.84, 0],
    ["EVT-023", "2026-01-15T14:40:00Z", "W1", "S1", "working", 0.92, 0],
    ["EVT-024", "2026-01-15T14:41:00Z", "W1", "S1", "product_count", 0.99, 3],
    ["EVT-025", "2026-01-15T15:10:00Z", "W1", "S1", "working", 0.9, 0],
    ["EVT-026", "2026-01-15T15:11:00Z", "W1", "S1", "product_count", 0.99, 1],

    // Worker 2 - Assembly Line B
    ["EVT-027", "2026-01-15T08:00:00Z", "W2", "S2", "working", 0.93, 0],
    ["EVT-028", "2026-01-15T08:01:00Z", "W2", "S2", "product_count", 0.99, 3],
    ["EVT-029", "2026-01-15T08:30:00Z", "W2", "S2", "idle", 0.87, 0],
    ["EVT-030", "2026-01-15T09:00:00Z", "W2", "S2", "working", 0.91, 0],
    ["EVT-031", "2026-01-15T09:01:00Z", "W2", "S2", "product_count", 0.99, 4],
    ["EVT-032", "2026-01-15T09:30:00Z", "W2", "S2", "working", 0.94, 0],
    ["EVT-033", "2026-01-15T10:00:00Z", "W2", "S2", "absent", 0.81, 0],
    ["EVT-034", "2026-01-15T10:30:00Z", "W2", "S2", "working", 0.92, 0],
    ["EVT-035", "2026-01-15T10:31:00Z", "W2", "S2", "product_count", 0.99, 5],
    ["EVT-036", "2026-01-15T11:00:00Z", "W2", "S2", "idle", 0.85, 0],
    ["EVT-037", "2026-01-15T11:30:00Z", "W2", "S2", "working", 0.96, 0],
    ["EVT-038", "2026-01-15T11:31:00Z", "W2", "S2", "product_count", 0.99, 2],
    ["EVT-039", "2026-01-15T12:00:00Z", "W2", "S2", "working", 0.93, 0],
    ["EVT-040", "2026-01-15T12:01:00Z", "W2", "S2", "product_count", 0.99, 3],
    ["EVT-041", "2026-01-15T12:30:00Z", "W2", "S2", "idle", 0.84, 0],
    ["EVT-042", "2026-01-15T13:00:00Z", "W2", "S2", "working", 0.91, 0],
    ["EVT-043", "2026-01-15T13:01:00Z", "W2", "S2", "product_count", 0.99, 4],
    ["EVT-044", "2026-01-15T13:30:00Z", "W2", "S2", "working", 0.95, 0],
    ["EVT-045", "2026-01-15T14:00:00Z", "W2", "S2", "absent", 0.8, 0],
    ["EVT-046", "2026-01-15T14:30:00Z", "W2", "S2", "working", 0.92, 0],
    ["EVT-047", "2026-01-15T14:31:00Z", "W2", "S2", "product_count", 0.99, 1],
    ["EVT-048", "2026-01-15T15:00:00Z", "W2", "S2", "working", 0.9, 0],
    ["EVT-049", "2026-01-15T15:01:00Z", "W2", "S2", "product_count", 0.99, 3],

    // Worker 3 - Welding Bay
    ["EVT-050", "2026-01-15T08:00:00Z", "W3", "S3", "working", 0.94, 0],
    ["EVT-051", "2026-01-15T08:01:00Z", "W3", "S3", "product_count", 0.99, 5],
    ["EVT-052", "2026-01-15T08:30:00Z", "W3", "S3", "working", 0.92, 0],
    ["EVT-053", "2026-01-15T08:31:00Z", "W3", "S3", "product_count", 0.99, 2],
    ["EVT-054", "2026-01-15T09:00:00Z", "W3", "S3", "idle", 0.85, 0],
    ["EVT-055", "2026-01-15T09:30:00Z", "W3", "S3", "working", 0.96, 0],
    ["EVT-056", "2026-01-15T09:31:00Z", "W3", "S3", "product_count", 0.99, 4],
    ["EVT-057", "2026-01-15T10:00:00Z", "W3", "S3", "working", 0.93, 0],
    ["EVT-058", "2026-01-15T10:01:00Z", "W3", "S3", "product_count", 0.99, 3],
    ["EVT-059", "2026-01-15T10:30:00Z", "W3", "S3", "absent", 0.83, 0],
    ["EVT-060", "2026-01-15T11:00:00Z", "W3", "S3", "working", 0.91, 0],
    ["EVT-061", "2026-01-15T11:01:00Z", "W3", "S3", "product_count", 0.99, 5],
    ["EVT-062", "2026-01-15T11:30:00Z", "W3", "S3", "idle", 0.87, 0],
    ["EVT-063", "2026-01-15T12:00:00Z", "W3", "S3", "working", 0.95, 0],
    ["EVT-064", "2026-01-15T12:01:00Z", "W3", "S3", "product_count", 0.99, 2],
    ["EVT-065", "2026-01-15T12:30:00Z", "W3", "S3", "working", 0.92, 0],
    ["EVT-066", "2026-01-15T13:00:00Z", "W3", "S3", "working", 0.94, 0],
    ["EVT-067", "2026-01-15T13:01:00Z", "W3", "S3", "product_count", 0.99, 6],
    ["EVT-068", "2026-01-15T13:30:00Z", "W3", "S3", "idle", 0.84, 0],
    ["EVT-069", "2026-01-15T14:00:00Z", "W3", "S3", "working", 0.91, 0],
    ["EVT-070", "2026-01-15T14:01:00Z", "W3", "S3", "product_count", 0.99, 3],
    ["EVT-071", "2026-01-15T14:30:00Z", "W3", "S3", "working", 0.93, 0],
    ["EVT-072", "2026-01-15T15:00:00Z", "W3", "S3", "absent", 0.82, 0],

    // Worker 4 - Quality Control
    ["EVT-073", "2026-01-15T08:00:00Z", "W4", "S4", "idle", 0.86, 0],
    ["EVT-074", "2026-01-15T08:30:00Z", "W4", "S4", "working", 0.93, 0],
    ["EVT-075", "2026-01-15T08:31:00Z", "W4", "S4", "product_count", 0.99, 3],
    ["EVT-076", "2026-01-15T09:00:00Z", "W4", "S4", "working", 0.91, 0],
    ["EVT-077", "2026-01-15T09:01:00Z", "W4", "S4", "product_count", 0.99, 2],
    ["EVT-078", "2026-01-15T09:30:00Z", "W4", "S4", "absent", 0.8, 0],
    ["EVT-079", "2026-01-15T10:00:00Z", "W4", "S4", "absent", 0.81, 0],
    ["EVT-080", "2026-01-15T10:30:00Z", "W4", "S4", "working", 0.94, 0],
    ["EVT-081", "2026-01-15T10:31:00Z", "W4", "S4", "product_count", 0.99, 5],
    ["EVT-082", "2026-01-15T11:00:00Z", "W4", "S4", "idle", 0.85, 0],
    ["EVT-083", "2026-01-15T11:30:00Z", "W4", "S4", "working", 0.9, 0],
    ["EVT-084", "2026-01-15T11:31:00Z", "W4", "S4", "product_count", 0.99, 3],
    ["EVT-085", "2026-01-15T12:00:00Z", "W4", "S4", "working", 0.96, 0],
    ["EVT-086", "2026-01-15T12:01:00Z", "W4", "S4", "product_count", 0.99, 4],
    ["EVT-087", "2026-01-15T12:30:00Z", "W4", "S4", "idle", 0.84, 0],
    ["EVT-088", "2026-01-15T13:00:00Z", "W4", "S4", "working", 0.93, 0],
    ["EVT-089", "2026-01-15T13:01:00Z", "W4", "S4", "product_count", 0.99, 2],
    ["EVT-090", "2026-01-15T13:30:00Z", "W4", "S4", "working", 0.91, 0],
    ["EVT-091", "2026-01-15T14:00:00Z", "W4", "S4", "absent", 0.82, 0],
    ["EVT-092", "2026-01-15T14:30:00Z", "W4", "S4", "working", 0.95, 0],
    ["EVT-093", "2026-01-15T14:31:00Z", "W4", "S4", "product_count", 0.99, 1],
    ["EVT-094", "2026-01-15T15:00:00Z", "W4", "S4", "working", 0.92, 0],
    ["EVT-095", "2026-01-15T15:01:00Z", "W4", "S4", "product_count", 0.99, 3],

    // Worker 5 - Packaging Unit (top performer)
    ["EVT-096", "2026-01-15T08:00:00Z", "W5", "S5", "working", 0.95, 0],
    ["EVT-097", "2026-01-15T08:01:00Z", "W5", "S5", "product_count", 0.99, 6],
    ["EVT-098", "2026-01-15T08:30:00Z", "W5", "S5", "working", 0.93, 0],
    ["EVT-099", "2026-01-15T08:31:00Z", "W5", "S5", "product_count", 0.99, 3],
    ["EVT-100", "2026-01-15T09:00:00Z", "W5", "S5", "working", 0.94, 0],
    ["EVT-101", "2026-01-15T09:01:00Z", "W5", "S5", "product_count", 0.99, 5],
    ["EVT-102", "2026-01-15T09:30:00Z", "W5", "S5", "idle", 0.86, 0],
    ["EVT-103", "2026-01-15T10:00:00Z", "W5", "S5", "working", 0.92, 0],
    ["EVT-104", "2026-01-15T10:01:00Z", "W5", "S5", "product_count", 0.99, 4],
    ["EVT-105", "2026-01-15T10:30:00Z", "W5", "S5", "working", 0.96, 0],
    ["EVT-106", "2026-01-15T10:31:00Z", "W5", "S5", "product_count", 0.99, 2],
    ["EVT-107", "2026-01-15T11:00:00Z", "W5", "S5", "idle", 0.85, 0],
    ["EVT-108", "2026-01-15T11:30:00Z", "W5", "S5", "working", 0.93, 0],
    ["EVT-109", "2026-01-15T11:31:00Z", "W5", "S5", "product_count", 0.99, 5],
    ["EVT-110", "2026-01-15T12:00:00Z", "W5", "S5", "working", 0.95, 0],
    ["EVT-111", "2026-01-15T12:01:00Z", "W5", "S5", "product_count", 0.99, 3],
    ["EVT-112", "2026-01-15T12:30:00Z", "W5", "S5", "working", 0.9, 0],
    ["EVT-113", "2026-01-15T12:31:00Z", "W5", "S5", "product_count", 0.99, 1],
    ["EVT-114", "2026-01-15T13:00:00Z", "W5", "S5", "idle", 0.84, 0],
    ["EVT-115", "2026-01-15T13:30:00Z", "W5", "S5", "working", 0.94, 0],
    ["EVT-116", "2026-01-15T13:31:00Z", "W5", "S5", "product_count", 0.99, 4],
    ["EVT-117", "2026-01-15T14:00:00Z", "W5", "S5", "working", 0.92, 0],
    ["EVT-118", "2026-01-15T14:01:00Z", "W5", "S5", "product_count", 0.99, 2],
    ["EVT-119", "2026-01-15T14:30:00Z", "W5", "S5", "working", 0.96, 0],
    ["EVT-120", "2026-01-15T14:31:00Z", "W5", "S5", "product_count", 0.99, 5],
    ["EVT-121", "2026-01-15T15:00:00Z", "W5", "S5", "working", 0.91, 0],
    ["EVT-122", "2026-01-15T15:01:00Z", "W5", "S5", "product_count", 0.99, 3],

    // Worker 6 - Paint Booth
    ["EVT-123", "2026-01-15T08:00:00Z", "W6", "S6", "working", 0.92, 0],
    ["EVT-124", "2026-01-15T08:01:00Z", "W6", "S6", "product_count", 0.99, 3],
    ["EVT-125", "2026-01-15T08:30:00Z", "W6", "S6", "idle", 0.85, 0],
    ["EVT-126", "2026-01-15T09:00:00Z", "W6", "S6", "working", 0.94, 0],
    ["EVT-127", "2026-01-15T09:01:00Z", "W6", "S6", "product_count", 0.99, 2],
    ["EVT-128", "2026-01-15T09:30:00Z", "W6", "S6", "absent", 0.81, 0],
    ["EVT-129", "2026-01-15T10:00:00Z", "W6", "S6", "absent", 0.83, 0],
    ["EVT-130", "2026-01-15T10:30:00Z", "W6", "S6", "working", 0.91, 0],
    ["EVT-131", "2026-01-15T10:31:00Z", "W6", "S6", "product_count", 0.99, 4],
    ["EVT-132", "2026-01-15T11:00:00Z", "W6", "S6", "idle", 0.87, 0],
    ["EVT-133", "2026-01-15T11:30:00Z", "W6", "S6", "working", 0.93, 0],
    ["EVT-134", "2026-01-15T11:31:00Z", "W6", "S6", "product_count", 0.99, 5],
    ["EVT-135", "2026-01-15T12:00:00Z", "W6", "S6", "working", 0.9, 0],
    ["EVT-136", "2026-01-15T12:01:00Z", "W6", "S6", "product_count", 0.99, 1],
    ["EVT-137", "2026-01-15T12:30:00Z", "W6", "S6", "idle", 0.84, 0],
    ["EVT-138", "2026-01-15T13:00:00Z", "W6", "S6", "working", 0.95, 0],
    ["EVT-139", "2026-01-15T13:01:00Z", "W6", "S6", "product_count", 0.99, 3],
    ["EVT-140", "2026-01-15T13:30:00Z", "W6", "S6", "working", 0.92, 0],
    ["EVT-141", "2026-01-15T13:31:00Z", "W6", "S6", "product_count", 0.99, 2],
    ["EVT-142", "2026-01-15T14:00:00Z", "W6", "S6", "absent", 0.8, 0],
    ["EVT-143", "2026-01-15T14:30:00Z", "W6", "S6", "working", 0.94, 0],
    ["EVT-144", "2026-01-15T14:31:00Z", "W6", "S6", "product_count", 0.99, 4],
    ["EVT-145", "2026-01-15T15:00:00Z", "W6", "S6", "working", 0.91, 0],
    ["EVT-146", "2026-01-15T15:01:00Z", "W6", "S6", "product_count", 0.99, 2],
    ["EVT-147", "2026-01-15T15:30:00Z", "W6", "S6", "idle", 0.86, 0],
  ];

  const tx = db.transaction(() => {
    for (const r of rows) {
      insert.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
    }
  });
  tx();
}

export { seedEvents };
