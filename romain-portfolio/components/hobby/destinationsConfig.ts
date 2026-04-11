// Single source of truth for travel destinations.
// To add photos for Shanghai or Tokyo:
//   1. Drop the photos in /public/PhotoSitePortfolio/Shanghai/ (named 1.jpeg, 2.jpeg, ...)
//   2. Update `photoCount` below to match the number of files
// The scene will automatically switch from the placeholder to the photo polaroids.

export type Destination = {
  id: string;
  title: string;
  country: string;
  date: string;
  /** Hex color used for the scene ambiance, title glow, particles */
  color: string;
  coords: { lat: number; lng: number };
  /** 0 = render the "Photos coming soon" placeholder */
  photoCount: number;
  /** Folder name under /public/PhotoSitePortfolio/ */
  photoFolder: string;
};

export const DESTINATIONS: Destination[] = [
  {
    id: "seoul",
    title: "SEOUL",
    country: "SOUTH KOREA",
    date: "2023",
    color: "#DC2626",
    coords: { lat: 37.5, lng: 127.0 },
    photoCount: 12,
    photoFolder: "Coree",
  },
  {
    id: "toronto",
    title: "TORONTO",
    country: "CANADA",
    date: "2024",
    color: "#2563EB",
    coords: { lat: 43.7, lng: -79.4 },
    photoCount: 12,
    photoFolder: "Toronto",
  },
  {
    id: "brighton-dubrovnik",
    title: "BRIGHTON & DUBROVNIK",
    country: "UK & CROATIA",
    date: "2024",
    color: "#059669",
    coords: { lat: 50.8, lng: -0.1 },
    photoCount: 12,
    photoFolder: "BrightonDubrovnik",
  },
  {
    id: "shanghai",
    title: "SHANGHAI",
    country: "CHINA",
    date: "BIENTÔT",
    color: "#DB2777",
    coords: { lat: 31.2, lng: 121.5 },
    photoCount: 0,
    photoFolder: "Shanghai",
  },
  {
    id: "tokyo",
    title: "TOKYO",
    country: "JAPAN",
    date: "BIENTÔT",
    color: "#7C3AED",
    coords: { lat: 35.7, lng: 139.7 },
    photoCount: 0,
    photoFolder: "Tokyo",
  },
];

/** Build the photo URLs for a destination (returns [] if photoCount is 0) */
export function getDestinationPhotos(destination: Destination): string[] {
  if (destination.photoCount <= 0) return [];
  const urls: string[] = [];
  for (let i = 1; i <= destination.photoCount; i++) {
    urls.push(`/PhotoSitePortfolio/${destination.photoFolder}/${i}.jpeg`);
  }
  return urls;
}
