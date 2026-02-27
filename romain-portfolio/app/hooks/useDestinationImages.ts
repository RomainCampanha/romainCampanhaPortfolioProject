// hooks/useDestinationImages.ts
"use client";

import { useState, useEffect } from "react";

type Destination = "Coree" | "Toronto" | "BrightonDubrovnik";

const DESTINATIONS_CONFIG = {
  Coree: {
    title: "SEOUL",
    country: "SOUTH KOREA",
    date: "2023",
    color: "#DC2626",
    coords: { lat: 37.5, lng: 127.0 },
  },
  Toronto: {
    title: "TORONTO",
    country: "CANADA",
    date: "2024",
    color: "#2563EB",
    coords: { lat: 43.7, lng: -79.4 },
  },
  BrightonDubrovnik: {
    title: "BRIGHTON & DUBROVNIK",
    country: "UK & CROATIA",
    date: "2024",
    color: "#059669",
    coords: { lat: 50.8, lng: -0.1 },
  },
};

export function useDestinationImages(destination: Destination) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      setLoading(true);

      const imageUrls: string[] = [];

      for (let i = 1; i <= 12; i++) {
        const url = `/PhotoSitePortfolio/${destination}/${i}.jpeg`;
        imageUrls.push(url);
      }

      setImages(imageUrls);
      setLoading(false);
    }

    loadImages();
  }, [destination]);

  return {
    images,
    loading,
    config: DESTINATIONS_CONFIG[destination]
  };
}

// Hook pour obtenir toutes les destinations
export function useAllDestinations() {
  return Object.keys(DESTINATIONS_CONFIG) as Destination[];
}
