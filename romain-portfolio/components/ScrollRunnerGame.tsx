"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRunnerGameProps = {
  onGameComplete: () => void;
  scrollProgress: number;
};

type TimelineEvent = {
  at: number; // Position dans la timeline (0 à 1)
  type: "jump" | "collect" | "dodge" | "victory";
  data?: any;
};

type Obstacle = {
  x: number;
  emoji: string;
};

type Collectible = {
  x: number;
  emoji: string;
  collected: boolean;
};

export default function ScrollRunnerGame({ 
  onGameComplete, 
  scrollProgress 
}: ScrollRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dimensions canvas - HORIZONTAL pour le runner
  const CANVAS_WIDTH = isMobile ? 400 : 800;
  const CANVAS_HEIGHT = isMobile ? 300 : 400;
  
  const PLAYER_SIZE = 60;
  const GROUND_Y = CANVAS_HEIGHT - 80;
  
  // Charger le sprite
  const spriteRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const img = new Image();
    img.src = "/2Dgames/Roro2D.png";
    img.onload = () => {
      spriteRef.current = img;
    };
  }, []);

  // === SCÉNARIO CHORÉGRAPHIÉ ===
  // Le parcours total fait 2500 pixels de long
  const TOTAL_DISTANCE = 2500;
  
  // OBSTACLES placés à des positions fixes
  const obstacles: Obstacle[] = [
    { x: 400, emoji: "🌵" },
    { x: 800, emoji: "🪨" },
    { x: 1200, emoji: "🌵" },
    { x: 1600, emoji: "🏔️" },
    { x: 2000, emoji: "🪨" },
  ];

  // COLLECTIBLES placés stratégiquement
  const collectiblesData: Collectible[] = [
    { x: 300, emoji: "🎵", collected: false },
    { x: 600, emoji: "🎶", collected: false },
    { x: 1000, emoji: "🎵", collected: false },
    { x: 1400, emoji: "🎶", collected: false },
    { x: 1800, emoji: "🎵", collected: false },
    { x: 2200, emoji: "🎶", collected: false },
  ];
  
  const collectiblesRef = useRef(collectiblesData);

  // === TIMELINE - Sauts pré-programmés (ajustés pour sauter AVANT l'obstacle) ===
  // Le saut dure 0.06, le pic est à la moitié (0.03)
  // On calcule le début du saut pour que le pic coïncide avec l'obstacle
  const timeline: TimelineEvent[] = [
    { at: 0.13, type: "jump" }, // Saut pour éviter cactus à x=400 (pic à 0.16)
    { at: 0.29, type: "jump" }, // Saut pour éviter rocher à x=800 (pic à 0.32)
    { at: 0.45, type: "jump" }, // Saut pour éviter cactus à x=1200 (pic à 0.48)
    { at: 0.61, type: "jump" }, // Saut pour éviter montagne à x=1600 (pic à 0.64)
    { at: 0.77, type: "jump" }, // Saut pour éviter rocher à x=2000 (pic à 0.80)
    { at: 0.95, type: "victory" }, // Atteint le micro !
  ];

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      // Clear
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // === BACKGROUND ===
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, "#87CEEB"); // Ciel bleu
      gradient.addColorStop(1, "#FFE082"); // Jaune/sable
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // === SOL ===
      ctx.fillStyle = "#D4A574";
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      
      // Ligne de sol
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // === DÉCOMPTE 3-2-1-GO! (avant le démarrage du jeu) ===
      if (scrollProgress < 0.12) {
        let countdownText = "";
        let countdownColor = "#FF6B6B";
        
        if (scrollProgress < 0.03) {
          countdownText = "3";
        } else if (scrollProgress < 0.06) {
          countdownText = "2";
        } else if (scrollProgress < 0.09) {
          countdownText = "1";
        } else {
          countdownText = "GO!";
          countdownColor = "#4CAF50";
        }
        
        // Afficher le décompte au centre
        ctx.save();
        ctx.font = "bold 120px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = countdownColor;
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 20;
        
        // Animation de pulsation
        const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.scale(pulse, pulse);
        ctx.fillText(countdownText, 0, 20);
        ctx.restore();
        
        ctx.restore();
        
        animationId = requestAnimationFrame(gameLoop);
        return; // Ne pas dessiner le reste pendant le décompte
      }

      // === CALCUL DE LA PROGRESSION ===
      // scrollProgress va de 0 à 1, mais on commence vraiment à 0.12 après le décompte
      // On ajuste pour que le jeu commence à 0 après le décompte
      const adjustedProgress = Math.max(0, (scrollProgress - 0.12) / (1 - 0.12));
      const distance = adjustedProgress * TOTAL_DISTANCE; // Position dans le parcours
      
      // === CALCUL DU SAUT (selon la timeline ajustée) ===
      let jumpHeight = 0;
      
      // Vérifier si on est dans une phase de saut
      timeline.forEach(event => {
        if (event.type === "jump") {
          const jumpStart = event.at;
          const jumpEnd = event.at + 0.06; // Durée du saut = 6% du scroll
          
          if (adjustedProgress >= jumpStart && adjustedProgress <= jumpEnd) {
            // On est en train de sauter !
            const jumpProgress = (adjustedProgress - jumpStart) / 0.06;
            // Courbe parabolique pour le saut
            jumpHeight = Math.sin(jumpProgress * Math.PI) * 100;
          }
        }
      });

      // === POSITION DU JOUEUR ===
      const playerX = 100; // Position fixe horizontalement (le monde défile)
      const playerY = GROUND_Y - PLAYER_SIZE - jumpHeight;

      // === DESSINER LE MICRO (OBJECTIF) ===
      const microX = TOTAL_DISTANCE - 100; // Position du micro dans le monde
      const microScreenX = playerX + (microX - distance); // Position à l'écran
      
      if (microScreenX > -100 && microScreenX < CANVAS_WIDTH + 100) {
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        
        // Animation pulsante
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        ctx.save();
        ctx.translate(microScreenX, GROUND_Y - 60);
        ctx.scale(pulse, pulse);
        ctx.shadowColor = "#FF6B6B";
        ctx.shadowBlur = 30;
        ctx.fillText("🎤", 0, 0);
        ctx.restore();
      }

      // === DESSINER LES OBSTACLES ===
      ctx.font = "50px Arial";
      obstacles.forEach(obstacle => {
        const obstacleScreenX = playerX + (obstacle.x - distance);
        
        if (obstacleScreenX > -100 && obstacleScreenX < CANVAS_WIDTH + 100) {
          ctx.fillText(obstacle.emoji, obstacleScreenX, GROUND_Y - 5);
        }
      });

      // === DESSINER LES COLLECTIBLES ===
      ctx.font = "40px Arial";
      collectiblesRef.current.forEach((collectible, index) => {
        if (collectible.collected) return;
        
        const collectibleScreenX = playerX + (collectible.x - distance);
        
        if (collectibleScreenX > -100 && collectibleScreenX < CANVAS_WIDTH + 100) {
          // Animation flottante
          const float = Math.sin(Date.now() / 300 + index) * 8;
          ctx.fillText(collectible.emoji, collectibleScreenX, GROUND_Y - 80 + float);
          
          // Vérifier collision
          if (Math.abs(collectibleScreenX - playerX) < 40 && jumpHeight < 20) {
            collectible.collected = true;
            setScore(prev => prev + 10);
            console.log("🎵 Note collectée !");
          }
        }
      });

      // === DESSINER LE JOUEUR ===
      if (spriteRef.current) {
        // Légère rotation pendant le saut
        const rotation = jumpHeight > 0 ? Math.sin(jumpHeight / 100 * Math.PI) * 0.1 : 0;
        
        ctx.save();
        ctx.translate(playerX + PLAYER_SIZE / 2, playerY + PLAYER_SIZE / 2);
        ctx.rotate(rotation);
        ctx.drawImage(
          spriteRef.current,
          -PLAYER_SIZE / 2,
          -PLAYER_SIZE / 2,
          PLAYER_SIZE,
          PLAYER_SIZE
        );
        ctx.restore();
      } else {
        // Fallback
        ctx.fillStyle = "#FF6B6B";
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
      }

      // === UI - SCORE ===
      ctx.save();
      ctx.font = "bold 24px Orbitron, sans-serif";
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.shadowBlur = 5;
      ctx.fillText(`Score: ${score}`, 20, 40);
      
      // Barre de progression (ajustée pour le décompte)
      const progressPercent = adjustedProgress * 100;
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(20, 60, 200, 15);
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(20, 60, 200 * adjustedProgress, 15);
      
      ctx.font = "16px Orbitron, sans-serif";
      ctx.fillText(`${Math.floor(progressPercent)}%`, 230, 72);
      
      ctx.restore();

      // === VICTOIRE ===
      if (adjustedProgress >= 0.95) {
        ctx.save();
        ctx.font = "bold 60px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FF6B6B";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;
        
        const scale = Math.min(1, (adjustedProgress - 0.95) / 0.05);
        ctx.globalAlpha = scale;
        ctx.fillText("BRAVO ! 🎉", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        ctx.restore();
        
        // Déclencher la fin du jeu après un court délai
        if (adjustedProgress >= 0.98) {
          setTimeout(() => onGameComplete(), 1000);
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scrollProgress, score, onGameComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl shadow-2xl border-4 border-amber-900/50"
          style={{
            maxWidth: "95vw",
            height: "auto",
          }}
        />
      </div>
    </div>
  );
}