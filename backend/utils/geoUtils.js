/**
 * GEOSPATIAL UTILITIES FOR WAREHOUSE DISTANCE CALCULATION
 * 
 * 🌍 HOW LATITUDE & LONGITUDE WORK:
 * 
 * LATITUDE (North-South Position):
 * - Measures distance from the Equator (0°)
 * - Range: -90° (South Pole) to +90° (North Pole)
 * - Example: India is between 8°N to 37°N
 * - Lines of latitude are parallel circles (also called parallels)
 * 
 * LONGITUDE (East-West Position):
 * - Measures distance from Prime Meridian (Greenwich, UK = 0°)
 * - Range: -180° (West) to +180° (East)
 * - Example: India is between 68°E to 97°E
 * - Lines of longitude converge at the poles (also called meridians)
 * 
 * WHY WE NEED HAVERSINE FORMULA:
 * - Earth is a SPHERE (not flat!)
 * - Distance between two lat/lng points is along the curved surface
 * - Simple Pythagorean theorem (straight line) gives WRONG distance
 * - Haversine calculates the "great circle distance" (shortest path on sphere)
 * 
 * HOW HAVERSINE WORKS:
 * 1. Converts lat/lng from degrees to radians
 * 2. Calculates angular distance using spherical trigonometry
 * 3. Multiplies by Earth's radius to get distance in kilometers
 * 
 * WHY POWERGRID USES THIS:
 * - Warehouses are geographically distributed across India
 * - When one warehouse runs low on materials, need to find NEAREST alternatives
 * - Helps in logistics planning and emergency material transfer
 * - Reduces transportation costs by choosing closest warehouse
 */

// Earth's radius in kilometers (mean radius)
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine Formula
 * 
 * @param {Number} lat1 - Latitude of first point (in degrees)
 * @param {Number} lon1 - Longitude of first point (in degrees)
 * @param {Number} lat2 - Latitude of second point (in degrees)
 * @param {Number} lon2 - Longitude of second point (in degrees)
 * @returns {Number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians (needed for trigonometric functions)
  // Formula: radians = degrees × (π / 180)
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const φ1 = toRadians(lat1);  // φ (phi) = latitude in radians
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);  // Δ (delta) = difference
  const Δλ = toRadians(lon2 - lon1);  // λ (lambda) = longitude in radians
  
  // Haversine formula:
  // a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
  // c = 2 × atan2(√a, √(1−a))
  // distance = R × c
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
}

/**
 * Find all warehouses within a specified radius from a source warehouse
 * 
 * @param {Object} sourceWarehouse - Warehouse with low stock (must have location.coordinates)
 * @param {Array} allWarehouses - Array of all warehouse objects
 * @param {Number} maxDistanceKm - Maximum radius to search (default: 200 km)
 * @returns {Array} Array of nearby warehouses with distances, sorted by proximity
 */
function getNearbyWarehouses(sourceWarehouse, allWarehouses, maxDistanceKm = 200) {
  // Validate source warehouse has coordinates
  if (!sourceWarehouse.location?.coordinates?.latitude || 
      !sourceWarehouse.location?.coordinates?.longitude) {
    throw new Error('Source warehouse must have valid coordinates');
  }
  
  const sourceLat = sourceWarehouse.location.coordinates.latitude;
  const sourceLon = sourceWarehouse.location.coordinates.longitude;
  
  // Calculate distance to each warehouse
  const warehousesWithDistance = allWarehouses
    .filter(warehouse => {
      // Exclude the source warehouse itself
      if (warehouse.warehouseId === sourceWarehouse.warehouseId) {
        return false;
      }
      
      // Ensure warehouse has valid coordinates
      if (!warehouse.location?.coordinates?.latitude || 
          !warehouse.location?.coordinates?.longitude) {
        return false;
      }
      
      return true;
    })
    .map(warehouse => {
      const distance = haversineDistance(
        sourceLat,
        sourceLon,
        warehouse.location.coordinates.latitude,
        warehouse.location.coordinates.longitude
      );
      
      return {
        warehouseId: warehouse.warehouseId,
        name: warehouse.name,
        location: warehouse.location,
        distance_km: Math.round(distance * 10) / 10, // Round to 1 decimal place
        status: warehouse.status
      };
    })
    .filter(warehouse => warehouse.distance_km <= maxDistanceKm) // Only within radius
    .sort((a, b) => a.distance_km - b.distance_km); // Sort by closest first
  
  return warehousesWithDistance;
}

/**
 * Calculate approximate travel time based on distance
 * Assumes average road speed of 60 km/h for material transport
 */
function estimateTravelTime(distanceKm, avgSpeedKmh = 60) {
  const hours = distanceKm / avgSpeedKmh;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Get cardinal direction between two points
 */
function getDirection(lat1, lon1, lat2, lon2) {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = bearing * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

module.exports = {
  haversineDistance,
  getNearbyWarehouses,
  estimateTravelTime,
  getDirection,
  EARTH_RADIUS_KM
};
