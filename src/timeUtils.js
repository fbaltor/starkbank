// Single key for the active time period
const ACTIVE_PERIOD_KEY = ["active_time_period"];

/**
 * Create a TimePeriod object
 * @param {Temporal.Instant} [startTime] - Start time (defaults to now)
 * @param {Temporal.Duration} [duration] - Duration (defaults to 24 hours)
 * @returns {TimePeriod} TimePeriod object
 */
export function createTimePeriod(
  startTime = Temporal.Now.instant(),
  duration = Temporal.Duration.from({ hours: 24 }),
) {
  return Object.freeze({
    startTime,
    duration,
    get endTime() {
      return startTime.add(duration);
    },
  });
}

/**
 * Check if the current time falls within a time period
 * @param {TimePeriod} timePeriod
 * @returns {boolean}
 */
export function isTimePeriodActive(timePeriod) {
  const now = Temporal.Now.instant();
  return (
    Temporal.Instant.compare(now, timePeriod.startTime) >= 0 &&
    Temporal.Instant.compare(now, timePeriod.endTime) < 0
  );
}

/**
 * Convert TimePeriod to JSON-serializable object
 * @param {TimePeriod} timePeriod
 * @returns {Object}
 */
export function timePeriodToJSON(timePeriod) {
  return {
    startTime: timePeriod.startTime.toString(),
    duration: timePeriod.duration.toString(),
  };
}

/**
 * Create TimePeriod from JSON object
 * @param {Object} data - Serialized data
 * @returns {TimePeriod}
 */
export function timePeriodFromJSON(data) {
  return createTimePeriod(
    Temporal.Instant.from(data.startTime),
    Temporal.Duration.from(data.duration),
  );
}

/**
 * Create a human-readable string representation
 * @param {TimePeriod} timePeriod
 * @returns {string}
 */
export function timePeriodToString(timePeriod) {
  const dateTime = timePeriod.startTime
    .toZonedDateTimeISO("UTC")
    .toPlainDateTime();
  return `TimePeriod: ${dateTime} for ${timePeriod.duration}`;
}

/**
 * Set the active TimePeriod (overwrites any existing one)
 * @param {Deno.Kv} kv - KV database instance
 * @param {TimePeriod} timePeriod - TimePeriod to set as active
 */
export async function setActiveTimePeriod(kv, timePeriod) {
  const serialized = timePeriodToJSON(timePeriod);
  return await kv.set(ACTIVE_PERIOD_KEY, serialized);
}

/**
 * Get the active TimePeriod
 * @param {Deno.Kv} kv - KV database instance
 * @returns {TimePeriod|null} Active TimePeriod or null if none set
 */
export async function getActiveTimePeriod(kv) {
  const result = await kv.get(ACTIVE_PERIOD_KEY);
  if (result.value === null) {
    return null;
  }
  return timePeriodFromJSON(result.value);
}

/**
 * Clear the active TimePeriod
 * @param {Deno.Kv} kv - KV database instance
 */
export async function clearActiveTimePeriod(kv) {
  await kv.delete(ACTIVE_PERIOD_KEY);
}

/**
 * Check if there's currently an active time period running
 * @param {Deno.Kv} kv - KV database instance
 * @returns {boolean}
 */
export async function isCurrentlyActive(kv) {
  const activePeriod = await getActiveTimePeriod(kv);
  return activePeriod ? isTimePeriodActive(activePeriod) : false;
}

/**
 * Create a TimePeriod service object with bound KV instance
 * @param {Deno.Kv} kv - KV database instance
 * @returns {Object} Service object with methods
 */
export function createTimePeriodService(kv) {
  return Object.freeze({
    set: (timePeriod) => setActiveTimePeriod(kv, timePeriod),
    get: () => getActiveTimePeriod(kv),
    clear: () => clearActiveTimePeriod(kv),
    isActive: () => isCurrentlyActive(kv),
  });
}

// Example usage
async function example() {
  const kv = await Deno.openKv();
  const service = createTimePeriodService(kv);

  // Create and set a default time period (now + 24h)
  const defaultPeriod = createTimePeriod();
  await service.set(defaultPeriod);
  console.log("Set active period:", timePeriodToString(defaultPeriod));
  console.log("Is currently active:", await service.isActive());

  // Get the active period
  const activePeriod = await service.get();
  if (activePeriod) {
    console.log("Retrieved active period:", timePeriodToString(activePeriod));
    console.log(
      "Ends at:",
      activePeriod.endTime.toZonedDateTimeISO("UTC").toPlainDateTime(),
    );
  }

  // Set a new period (this overwrites the previous one)
  const newStart = Temporal.Now.instant().add({ minutes: 30 });
  const newDuration = Temporal.Duration.from({ hours: 6 });
  const newPeriod = createTimePeriod(newStart, newDuration);
  await service.set(newPeriod);
  console.log("Updated to new period:", timePeriodToString(newPeriod));

  // Clear the active period
  await service.clear();
  console.log("Cleared active period");
  console.log("Any active period?", await service.get());

  kv.close();
}

// Alternative: In-memory version for comparison
let activeTimePeriod = null;

export const inMemoryService = Object.freeze({
  set: (timePeriod) => {
    activeTimePeriod = timePeriod;
  },
  get: () => activeTimePeriod,
  clear: () => {
    activeTimePeriod = null;
  },
  isActive: () =>
    activeTimePeriod ? isTimePeriodActive(activeTimePeriod) : false,
});

// Run example if this file is executed directly
if (import.meta.main) {
  await example();
}
