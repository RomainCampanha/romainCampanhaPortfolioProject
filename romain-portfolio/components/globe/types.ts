import * as THREE from "three";

export type CityCoord = {
  name: string;
  lat: number;
  lng: number;
};

export type FlightRoute = {
  from: CityCoord;
  to: CityCoord;
  destination: "Coree" | "Toronto" | "BrightonDubrovnik";
};

export type TravelPhase =
  | "globe-intro"
  | "flight"
  | "globe-to-carousel"
  | "carousel"
  | "carousel-to-globe";

export type TravelCycle = {
  phase: TravelPhase;
  flightIndex: number; // 0, 1, 2
  localProgress: number; // 0-1 within current phase
};
