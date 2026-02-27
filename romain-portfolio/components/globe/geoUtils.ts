import * as THREE from "three";
import type { CityCoord, FlightRoute } from "./types";

// === City coordinates ===
export const CITIES: Record<string, CityCoord> = {
  Geneva: { name: "Genève", lat: 46.2, lng: 6.1 },
  Seoul: { name: "Séoul", lat: 37.5, lng: 127.0 },
  Toronto: { name: "Toronto", lat: 43.7, lng: -79.4 },
  Brighton: { name: "Brighton", lat: 50.8, lng: -0.1 },
};

// === Flight routes ===
export const FLIGHT_ROUTES: FlightRoute[] = [
  { from: CITIES.Geneva, to: CITIES.Seoul, destination: "Coree" },
  { from: CITIES.Seoul, to: CITIES.Toronto, destination: "Toronto" },
  { from: CITIES.Toronto, to: CITIES.Brighton, destination: "BrightonDubrovnik" },
];

/**
 * Convert lat/lng (degrees) to a 3D position on a sphere.
 * Three.js uses Y-up, so:
 *   x = r * cos(lat) * sin(lng)
 *   y = r * sin(lat)
 *   z = r * cos(lat) * cos(lng)
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = 1
): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const theta = (lng * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta)
  );
}

/**
 * Create a flight arc (QuadraticBezierCurve3) between two cities.
 * The control point is elevated above the sphere surface, proportional to the distance.
 */
export function createFlightArc(
  from: CityCoord,
  to: CityCoord,
  radius: number = 1,
  altitudeFactor: number = 0.5
): THREE.QuadraticBezierCurve3 {
  const start = latLngToVector3(from.lat, from.lng, radius);
  const end = latLngToVector3(to.lat, to.lng, radius);

  // Midpoint on the sphere surface
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Distance between points determines arc height
  const dist = start.distanceTo(end);
  const altitude = radius + dist * altitudeFactor;

  // Push midpoint outward from center (elevated above surface)
  mid.normalize().multiplyScalar(altitude);

  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

/**
 * Compute the ideal globe rotation (as Euler Y angle) to center a flight arc in view.
 * Returns the Y rotation angle that centers the midpoint of the arc towards the camera.
 */
export function computeGlobeRotationY(from: CityCoord, to: CityCoord): number {
  const midLng = (from.lng + to.lng) / 2;
  // We want the midpoint longitude to face the camera (which looks along -Z).
  // A point at lng=0 faces the camera when globe rotation Y = 0.
  // So we rotate by -midLng to center the arc.
  return (-midLng * Math.PI) / 180;
}
