// Trip planner — greedy algorithm to suggest charging stops along a route.
//
// Strategy:
// 1. Convert battery % to usable range in km.
// 2. If current range covers the full trip, no stops needed.
// 3. Otherwise, walk along the route (straight-line interpolation between
//    source and destination) and find the station closest to ~75% of the
//    current safe range (buffer — never plan to arrive on fumes).
// 4. From that stop, assume the car recharges to a comfortable 80% of full
//    range, then repeat for the remaining distance.
// 5. Stop when remaining distance fits within remaining range.

const EARTH_RADIUS_KM = 6371;
const RANGE_BUFFER = 0.75;     // use 75% of available range before forcing a stop
const RECHARGE_TARGET = 0.80;  // assume charging back to 80% of full range

// Haversine distance between two lat/lng points in km
function distanceKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Find a point `distKm` along the straight line from `start` to `end`
function interpolatePoint(start, end, distKm, totalDistKm) {
  if (totalDistKm === 0) return start;
  const fraction = Math.min(distKm / totalDistKm, 1);
  return {
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
  };
}

// Get valid {lat, lng} for a station, or null if missing
function getStationCoords(station) {
  const lat = station.AddressInfo?.Latitude;
  const lng = station.AddressInfo?.Longitude;
  if (!lat || !lng) return null;
  return { lat, lng };
}

/**
 * Plan charging stops for a trip.
 *
 * @param {Object} source       { lat, lng }
 * @param {Object} destination  { lat, lng }
 * @param {Array}  stations     list of OpenChargeMap station objects
 * @param {Object} car          { range_km, battery_kwh, connector }
 * @param {Number} batteryPercent  current battery % (0-100)
 *
 * @returns {Object} {
 *   needsStops: boolean,
 *   totalDistanceKm: number,
 *   suggestedStops: [{ station, distanceFromStart, arrivalPercent }],
 *   message: string
 * }
 */
export function planTrip(source, destination, stations, car, batteryPercent) {
  const totalDistanceKm = distanceKm(source, destination);
  const currentRangeKm  = (batteryPercent / 100) * car.range_km;

  // Case 1 — no stop needed at all
  if (currentRangeKm >= totalDistanceKm) {
    return {
      needsStops: false,
      totalDistanceKm: Math.round(totalDistanceKm),
      suggestedStops: [],
      message: `You can make this trip on your current charge — no stops needed.`,
    };
  }

  // Case 2 — no stations available to plan with
  const validStations = stations
    .map((s) => ({ station: s, coords: getStationCoords(s) }))
    .filter((s) => s.coords !== null);

  if (validStations.length === 0) {
    return {
      needsStops: true,
      totalDistanceKm: Math.round(totalDistanceKm),
      suggestedStops: [],
      message: `Your car can't make this trip on the current charge, but no charging stations were found nearby.`,
    };
  }

  const suggestedStops = [];
  let traveledKm     = 0;
  let remainingRange = currentRangeKm;
  let usedStationIds  = new Set();
  const MAX_STOPS = 6; // safety cap against infinite loops

  while (traveledKm + remainingRange < totalDistanceKm && suggestedStops.length < MAX_STOPS) {
    // Target point: 75% of current safe range ahead of where we are
    const safeRangeKm = remainingRange * RANGE_BUFFER;
    const targetDistKm = traveledKm + safeRangeKm;
    const targetPoint = interpolatePoint(source, destination, targetDistKm, totalDistanceKm);

    // Find nearest unused station to that target point, but only ones
    // that are actually reachable (within remaining range) and make
    // forward progress (closer to destination than current position)
    let bestStation = null;
    let bestScore = Infinity;

    for (const { station, coords } of validStations) {
      if (usedStationIds.has(station.ID)) continue;

      const distFromStart = distanceKm(source, coords);
      const distFromCurrentPos = distFromStart - traveledKm;

      // Must be ahead of us and within reach on remaining battery
      if (distFromCurrentPos <= 0 || distFromCurrentPos > remainingRange) continue;

      // Score = how close this station is to our ideal target distance
      const score = Math.abs(distFromStart - targetDistKm);
      if (score < bestScore) {
        bestScore = score;
        bestStation = { station, coords, distFromStart };
      }
    }

    // No reachable station found — trip isn't fully plannable with current data
    if (!bestStation) {
      return {
        needsStops: true,
        totalDistanceKm: Math.round(totalDistanceKm),
        suggestedStops,
        message: suggestedStops.length > 0
          ? `Found ${suggestedStops.length} stop(s), but couldn't find a reachable station for the rest of the route. Try a different route or check station availability.`
          : `Couldn't find a reachable charging station within your current range. Consider charging before you leave.`,
      };
    }

    const arrivalRangeKm = remainingRange - (bestStation.distFromStart - traveledKm);
    const arrivalPercent = Math.max(0, Math.round((arrivalRangeKm / car.range_km) * 100));

    suggestedStops.push({
      station: bestStation.station,
      distanceFromStart: Math.round(bestStation.distFromStart),
      arrivalPercent,
    });

    usedStationIds.add(bestStation.station.ID);
    traveledKm     = bestStation.distFromStart;
    remainingRange = car.range_km * RECHARGE_TARGET; // recharge to 80%
  }

  return {
    needsStops: true,
    totalDistanceKm: Math.round(totalDistanceKm),
    suggestedStops,
    message: `${suggestedStops.length} charging stop${suggestedStops.length > 1 ? 's' : ''} suggested for this trip.`,
  };
}