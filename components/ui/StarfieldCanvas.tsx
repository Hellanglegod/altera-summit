"use client";

import { useEffect, useRef, useCallback } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Constellation {
  stars: { x: number; y: number }[];
  connections: { from: number; to: number }[];
}

interface StarfieldCanvasProps {
  className?: string;
  starCount?: number;
  showConstellations?: boolean;
}

export function StarfieldCanvas({
  className = "",
  starCount = 150,
  showConstellations = true,
}: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const starsRef = useRef<Star[]>([]);
  const constellationsRef = useRef<Constellation[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  const initStars = useCallback(
    (width: number, height: number) => {
      const stars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          speed: Math.random() * 0.02 + 0.01,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    },
    [starCount],
  );

  const initConstellations = useCallback((width: number, height: number) => {
    const constellations: Constellation[] = [];
    const constellationCount = 3;

    for (let c = 0; c < constellationCount; c++) {
      const starPoints: { x: number; y: number }[] = [];
      const pointCount = Math.floor(Math.random() * 3) + 4;
      const centerX = Math.random() * width;
      const centerY = Math.random() * height;

      for (let i = 0; i < pointCount; i++) {
        starPoints.push({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });
      }

      const connections: { from: number; to: number }[] = [];
      for (let i = 0; i < pointCount - 1; i++) {
        connections.push({ from: i, to: i + 1 });
      }
      if (pointCount > 3) {
        connections.push({ from: pointCount - 1, to: 0 });
      }

      constellations.push({ stars: starPoints, connections });
    }

    constellationsRef.current = constellations;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initStars(rect.width, rect.height);
      if (showConstellations) {
        initConstellations(rect.width, rect.height);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw nebula gradient
      const gradient = ctx.createRadialGradient(
        rect.width / 2,
        rect.height / 3,
        0,
        rect.width / 2,
        rect.height / 3,
        rect.width * 0.8,
      );
      gradient.addColorStop(0, "rgba(19, 13, 42, 0.4)");
      gradient.addColorStop(0.5, "rgba(35, 24, 71, 0.2)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw constellations
      if (showConstellations && !prefersReducedMotion) {
        constellationsRef.current.forEach((constellation) => {
          // Draw connection lines
          ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
          ctx.lineWidth = 1;
          constellation.connections.forEach(({ from, to }) => {
            const starA = constellation.stars[from];
            const starB = constellation.stars[to];
            ctx.beginPath();
            ctx.moveTo(starA.x, starA.y);
            ctx.lineTo(starB.x, starB.y);
            ctx.stroke();
          });

          // Draw constellation stars
          constellation.stars.forEach((star) => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(212, 175, 55, 0.6)";
            ctx.fill();
          });
        });
      }

      // Draw stars
      starsRef.current.forEach((star) => {
        const twinkle = prefersReducedMotion
          ? star.opacity
          : star.opacity +
            Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;

        // Move stars slowly
        if (!prefersReducedMotion) {
          star.y += star.speed;
          if (star.y > rect.height) {
            star.y = 0;
            star.x = Math.random() * rect.width;
          }
        }

        // Mouse interaction - subtle glow when near
        const distToMouse = Math.hypot(
          star.x - mouseRef.current.x,
          star.y - mouseRef.current.y,
        );
        const glowIntensity = Math.max(0, 1 - distToMouse / 150);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        // Star color with potential gold glow near mouse
        if (glowIntensity > 0.1) {
          ctx.fillStyle = `rgba(212, 175, 55, ${Math.min(1, twinkle + glowIntensity * 0.5)})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(212, 175, 55, 0.5)";
        } else {
          ctx.fillStyle = `rgba(226, 232, 240, ${twinkle})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initStars, initConstellations, showConstellations]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
