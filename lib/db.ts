import { getDb } from "./init-db"

// Re-export the database getter
export { getDb }

// Shift configuration: 8-hour shift from 08:00 to 16:00 UTC
export const SHIFT_START_HOUR = 8
export const SHIFT_END_HOUR = 16
export const SHIFT_DURATION_HOURS = SHIFT_END_HOUR - SHIFT_START_HOUR
export const SHIFT_DURATION_MINUTES = SHIFT_DURATION_HOURS * 60
