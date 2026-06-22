// ─────────────────────────────────────────────
// Charging time & cost estimation utilities
// ─────────────────────────────────────────────

/**
 * Estimate charging time in minutes.
 *
 * Formula:
 *   time = ((targetSOC - currentSOC) / 100) * batteryKwh / chargerKw * 60
 *
 * We cap charger efficiency at 90% for DC fast chargers (real-world losses).
 *
 * @param {number} currentPercent   Current battery % (0–100)
 * @param {number} targetPercent    Target battery % (default 80)
 * @param {number} batteryKwh       Car's total battery capacity in kWh
 * @param {number} chargerKw        Charger's power output in kW
 * @returns {number} Minutes (rounded)
 */
export function estimateChargingMinutes(
  currentPercent,
  targetPercent = 80,
  batteryKwh,
  chargerKw
) {
  if (!batteryKwh || !chargerKw || chargerKw <= 0) return null;
  if (currentPercent >= targetPercent) return 0;

  const efficiency = chargerKw >= 50 ? 0.90 : 0.95; // DC fast vs AC slow
  const energyNeeded = ((targetPercent - currentPercent) / 100) * batteryKwh;
  const effectiveKw = chargerKw * efficiency;
  const minutes = (energyNeeded / effectiveKw) * 60;

  return Math.round(minutes);
}

/**
 * Format minutes into a readable string.
 * e.g. 90 → "1h 30m", 45 → "45 min"
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes === 0) return 'Already charged';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Estimate cost in INR for a charging session.
 *
 * Indian public charging rates (approximate 2024):
 *   AC slow (< 22 kW) : ₹8–12 / kWh   → use ₹10
 *   DC fast (22–60 kW): ₹14–18 / kWh  → use ₹16
 *   DC ultra (> 60 kW): ₹18–22 / kWh  → use ₹20
 *
 * @param {number} currentPercent
 * @param {number} targetPercent
 * @param {number} batteryKwh
 * @param {number} chargerKw
 * @returns {{ min: number, max: number } | null}
 */
export function estimateCostINR(
  currentPercent,
  targetPercent = 80,
  batteryKwh,
  chargerKw
) {
  if (!batteryKwh || !chargerKw || chargerKw <= 0) return null;
  if (currentPercent >= targetPercent) return { min: 0, max: 0 };

  const energyKwh = ((targetPercent - currentPercent) / 100) * batteryKwh;

  let rateMin, rateMax;
  if (chargerKw > 60) {
    rateMin = 18; rateMax = 22;
  } else if (chargerKw >= 22) {
    rateMin = 14; rateMax = 18;
  } else {
    rateMin = 8; rateMax = 12;
  }

  return {
    min: Math.round(energyKwh * rateMin),
    max: Math.round(energyKwh * rateMax),
  };
}

/**
 * Extract the best (highest) power kW value from a station's connections.
 * OpenChargeMap stores PowerKW per connection.
 *
 * @param {Array} connections  station.Connections array
 * @returns {number|null}
 */
export function getBestChargerKw(connections) {
  if (!connections?.length) return null;
  const powers = connections
    .map((c) => c.PowerKW)
    .filter((p) => p && p > 0);
  if (!powers.length) return null;
  return Math.max(...powers);
}

/**
 * Get a human-readable charger speed label.
 */
export function getChargerSpeedLabel(kw) {
  if (!kw) return 'Unknown';
  if (kw >= 100) return 'Ultra-fast DC';
  if (kw >= 50)  return 'Fast DC';
  if (kw >= 22)  return 'Standard DC';
  if (kw >= 7)   return 'AC Fast';
  return 'AC Slow';
}