# AI-Powered Worker Productivity Dashboard

A full-stack web application that ingests AI-generated CCTV events from a manufacturing factory and displays real-time productivity metrics for workers, workstations, and the factory as a whole.

## Architecture Overview

```
┌──────────────┐     ┌───────────────────────────────────────────┐     ┌──────────────┐
│  Edge Layer  │     │            Backend (Next.js)              │     │   Frontend   │
│              │     │                                           │     │              │
│  AI Cameras  │────▶│  POST /api/events     ──▶  SQLite DB     │◀────│  Dashboard   │
│  (CV Models) │     │  GET  /api/metrics    ◀──  (factory.db)  │     │  (React)     │
│              │     │  POST /api/reset-data                    │     │              │
└──────────────┘     └───────────────────────────────────────────┘     └──────────────┘
```

**Edge Layer**: AI-powered CCTV cameras run computer vision models that detect worker activity (working, idle, absent) and product counts. They emit structured JSON events.

**Backend**: A Next.js API server receives events via REST, validates and deduplicates them, then stores them in SQLite. Metrics are computed on-the-fly from raw events using a state-machine approach.

**Frontend**: A React dashboard fetches computed metrics and displays factory KPIs, worker/workstation tables with detail panels, and utilization charts. Auto-refreshes every 30 seconds.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is created and seeded automatically on first request.

### Docker

```bash
# Build and run
docker compose up --build

# Or manually
docker build -t worker-dashboard .
docker run -p 3000:3000 worker-dashboard
```

Open [http://localhost:3000](http://localhost:3000).

## Database Schema

Uses **SQLite** (`factory.db`) with three tables:

### `workers`

| Column      | Type | Description         |
| ----------- | ---- | ------------------- |
| `worker_id` | TEXT | Primary key (W1–W6) |
| `name`      | TEXT | Worker's full name  |

### `workstations`

| Column       | Type | Description               |
| ------------ | ---- | ------------------------- |
| `station_id` | TEXT | Primary key (S1–S6)       |
| `name`       | TEXT | Station name              |
| `type`       | TEXT | Type (Assembly, Welding…) |

### `events`

| Column           | Type    | Description                                          |
| ---------------- | ------- | ---------------------------------------------------- |
| `id`             | INTEGER | Auto-increment primary key                           |
| `event_id`       | TEXT    | Unique ID for deduplication                          |
| `timestamp`      | TEXT    | ISO 8601 timestamp of the event                      |
| `worker_id`      | TEXT    | FK → workers                                         |
| `workstation_id` | TEXT    | FK → workstations                                    |
| `event_type`     | TEXT    | One of: `working`, `idle`, `absent`, `product_count` |
| `confidence`     | REAL    | CV model confidence score (0–1)                      |
| `count`          | INTEGER | Units produced (only for `product_count` events)     |
| `created_at`     | TEXT    | Record creation timestamp                            |

**Indexes**: `worker_id`, `workstation_id`, `timestamp`, `event_type`, `event_id`.

## API Endpoints

### `POST /api/events`

Ingest a single event or a batch of events.

**Single event:**

```json
{
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "count": 1
}
```

**Batch:**

```json
[
  { "timestamp": "...", "worker_id": "W1", ... },
  { "timestamp": "...", "worker_id": "W2", ... }
]
```

**Response:** `{ inserted: N, duplicates: N, errors: N, results: [...] }`

### `GET /api/metrics`

Returns computed metrics for workers, workstations, and factory.

### `POST /api/reset-data`

Clears all events and re-seeds with fresh dummy data. Evaluators can use this to reset the demo.

## Metric Definitions

### Assumptions

1. **State Machine**: Events are point-in-time. Each `working`/`idle`/`absent` event defines the worker's state until the next event for that worker.
2. **Duration Inference**: Duration = `next_event.timestamp − current_event.timestamp`. For the last event, the state continues until shift end (16:00 UTC).
3. **Shift**: 8-hour shift from 08:00 to 16:00 UTC.
4. **Product Count Events**: These are discrete — they record units produced and do NOT change the worker's state. They are summed separately.
5. **Metrics are computed on-the-fly** from raw events on each API call. This ensures correctness even after new events arrive or late data is ingested.

### Worker-Level Metrics

| Metric            | Formula                                        |
| ----------------- | ---------------------------------------------- |
| Total Active Time | Sum of durations in `working` state            |
| Total Idle Time   | Sum of durations in `idle` state               |
| Utilization %     | `active_time / (active + idle + absent)` × 100 |
| Total Units       | Sum of `count` from `product_count` events     |
| Units per Hour    | `total_units / shift_duration_hours`           |

### Workstation-Level Metrics

| Metric          | Formula                                          |
| --------------- | ------------------------------------------------ |
| Occupancy Time  | Total time a worker was `working` at the station |
| Utilization %   | `occupancy_time / shift_duration` × 100          |
| Total Units     | Sum of `product_count` events at that station    |
| Throughput Rate | `total_units / (occupancy_hours)`                |

### Factory-Level Metrics

| Metric                | Formula                                           |
| --------------------- | ------------------------------------------------- |
| Total Productive Time | Sum of all workers' active times                  |
| Total Production      | Sum of all `product_count` events                 |
| Avg Production Rate   | `total_units / total_productive_hours`            |
| Avg Utilization       | Mean of individual worker utilization percentages |

## Handling Edge Cases

### 1. Intermittent Connectivity

**Problem**: Cameras may lose network connectivity and buffer events locally.

**Current Design**: The API accepts batch event ingestion. Cameras can buffer events and send them when connectivity is restored. Since metrics are computed on-the-fly from all stored events (sorted by timestamp), late-arriving batches are automatically incorporated.

**At Scale**: Introduce a message queue (Apache Kafka) as a buffer between edge devices and the backend. Cameras publish events to local topics; a bridge service forwards them when connectivity resumes. The backend consumes from the queue, ensuring no data loss. Metrics would shift to a lambda architecture with pre-aggregated time buckets that can be recomputed when late data arrives.

### 2. Duplicate Events

**Current Design**: Every event has a unique `event_id`. The database has a `UNIQUE` constraint on `event_id`, and the insert uses `INSERT OR IGNORE` — duplicate events are silently discarded. The API response differentiates between `"inserted"` and `"duplicate"` results.

**At Scale**: Track the last processed event ID per camera/source. Use idempotent consumers that check watermarks before processing. For pre-aggregated metrics, maintain incremental aggregation state so reprocessing a duplicate doesn't double-count.

### 3. Out-of-Order Timestamps

**Current Design**: Events are stored as-is with their original timestamps. Metrics are computed by querying events `ORDER BY timestamp ASC`, so out-of-order arrivals are correctly ordered during computation. Since we compute on-the-fly from raw data, a late event simply gets included in the next metrics fetch.

**At Scale**: Define a late-arrival window (say 1 hour). Events within the window trigger recomputation of affected time buckets. Events older than the window can be logged and flagged for manual review. Stream processors like Apache Flink natively support watermark-based out-of-order handling.

## Model Versioning and Drift

### Adding Model Versioning

- Add a `model_version` field to the event schema (e.g., `"cv-v2.1.0"`).
- Track which model version generated each event.
- Store model metadata (training date, accuracy benchmarks, architecture) in a model registry.
- Filter metrics by model version to compare performance across releases.

### Detecting Model Drift

- **Confidence Monitoring**: Track average confidence scores per model version over time. A declining trend signals drift.
- **Event Distribution Shifts**: Monitor the ratio of event types (working:idle:absent). Significant changes may indicate the model is misclassifying.
- **Statistical Tests**: Use KL divergence or Kolmogorov-Smirnov tests on the confidence distribution to detect statistically significant shifts.
- **Dashboard Alerts**: Add threshold-based alerts when confidence drops below a target (e.g., < 0.85 average) or event distributions deviate from baseline.

### Triggering Retraining

- **Automated Triggers**: When drift is detected (confidence below threshold for N consecutive windows), automatically queue a retraining job.
- **Feedback Loop**: Enable human annotators to label edge cases. Accumulate a retraining dataset from flagged low-confidence events.
- **Canary Deployment**: Deploy retrained models to a subset of cameras first. Compare metrics against the stable model before full rollout.
- **CI/CD Pipeline**: Integrate model training into CI — run automated evaluation on a holdout set before promoting a new model version.

## Scalability: 5 → 100+ Cameras → Multi-Site

### 5 Cameras (Current)

- SQLite handles the load easily (< 1,000 events/day).
- Metrics computed on-the-fly in milliseconds.
- Single Node.js process, no infrastructure needed.

### 100+ Cameras

- **Database**: Migrate from SQLite to PostgreSQL or TimescaleDB for concurrent writes and time-series optimization.
- **API Layer**: Deploy multiple backend instances behind a load balancer (e.g. Nginx, AWS ALB)
- **Event Ingestion**: Introduce Kafka or Redis Streams to decouple ingestion from processing. Cameras push to a queue; worker services consume and persist.
- **Pre-aggregation**: Compute hourly/daily summaries in background jobs. Dashboard queries pre-aggregated tables instead of scanning all raw events.
- **Caching**: Cache metric responses with TTL (e.g. Redis) to reduce database load.

### Multi-Site

- **Federated Architecture**: Each factory site runs its own local backend + database for resilience against WAN failures.
- **Central Aggregator**: A central service polls site-level APIs and aggregates metrics for cross-site reporting.
- **Global Dashboard**: Displays per-site summaries with drill-down capability.
- **Clock Synchronization**: Use NTP across all sites for consistent timestamps.
- **Data Replication**: Async replication of raw events to a central data lake for company-wide analytics and model retraining.

## Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React 19, Next.js 16, Tailwind CSS, Recharts, SWR |
| Backend   | Next.js API Routes (Node.js)                      |
| Database  | SQLite (via better-sqlite3)                       |
| Container | Docker, Docker Compose                            |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── events/route.ts       # POST - ingest events
│   │   ├── metrics/route.ts      # GET  - compute metrics
│   │   └── reset-data/route.ts   # POST - reset & re-seed
│   ├── globals.css               # Theme & design tokens
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard page
├── components/
│   ├── dashboard.tsx             # Main dashboard orchestrator
│   ├── dashboard-header.tsx      # Header with refresh/reset
│   ├── factory-kpis.tsx          # Factory-level KPI cards
│   ├── workers-table.tsx         # Worker metrics table
│   ├── workstations-table.tsx    # Workstation metrics table
│   ├── detail-panel.tsx          # Expandable detail panels
│   ├── utilization-chart.tsx     # Bar charts (Recharts)
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── db.ts                     # Database exports & config
│   ├── init-db.ts                # SQLite init, tables, seed data
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Utility functions
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker Compose config
└── README.md                     # This file
```
