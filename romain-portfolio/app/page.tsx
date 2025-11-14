"use client";

import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import HomePage from "@/components/HomePage";
import HobbyPage from "@/components/HobbyPage";
import ChatbotPage from "@/components/ChatbotPage";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"home" | "hobby" | "chatbot">("home");
  const [scrollPositions, setScrollPositions] = useState({ 
    home: 0, 
    hobby: 0,
    chatbot: 0 
  });
  const isRestoringScroll = useRef(false);

  // Sauvegarder la position du scroll avant de changer de page
  const handlePageChange = (newPage: "home" | "hobby" | "chatbot") => {
    if (newPage === currentPage) return;

    // Sauvegarder la position actuelle
    const currentScroll = window.scrollY;
    setScrollPositions((prev) => ({
      ...prev,
      [currentPage]: currentScroll,
    }));

    // Changer de page
    setCurrentPage(newPage);
  };

  // Restaurer la position du scroll après changement de page
  useEffect(() => {
    if (isRestoringScroll.current) return;

    isRestoringScroll.current = true;
    
    // Petit délai pour laisser le DOM se charger
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositions[currentPage],
        behavior: "instant" as ScrollBehavior,
      });
      
      // Réinitialiser après la restauration
      setTimeout(() => {
        isRestoringScroll.current = false;
      }, 100);
    }, 50);
  }, [currentPage, scrollPositions]);

  return (
    <>
      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      {/* Afficher la page correspondante avec transition */}
      <div className="transition-opacity duration-300">
        {currentPage === "home" && <HomePage />}
        {currentPage === "hobby" && <HobbyPage />}
        {currentPage === "chatbot" && <ChatbotPage />}
      </div>
    </>
  );
}