// hooks/useDestinationImages.ts
"use client";

import { useState, useEffect } from "react";

type Destination = "Coree" | "Toronto" | "BrightonDubrovnik";

const DESTINATIONS_CONFIG = {
  Coree: {
    title: "SEOUL",
    country: "SOUTH KOREA",
    date: "2023",
    color: "#DC2626", // Rouge
  },
  Toronto: {
    title: "TORONTO",
    country: "CANADA",
    date: "2024",
    color: "#2563EB", // Bleu
  },
  BrightonDubrovnik: {
    title: "BRIGHTON & DUBROVNIK",
    country: "UK & CROATIA",
    date: "2024",
    color: "#059669", // Vert
  },
};

export function useDestinationImages(destination: Destination) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      setLoading(true);
      
      // Pour l'instant, on simule avec des images de 1 à 12
      // Dans un vrai projet Next.js, on utiliserait fs.readdir côté serveur
      const imageUrls: string[] = [];
      
      // Essayer de charger les images (1.jpeg, 2.jpeg, etc.)
      for (let i = 1; i <= 12; i++) {
        const url = `/PhotoSitePortfolio/${destination}/${i}.jpeg`;
        imageUrls.push(url);
      }
      
      // On pourrait aussi vérifier si les images existent avec fetch
      // Mais pour l'instant on suppose qu'elles sont là
      
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