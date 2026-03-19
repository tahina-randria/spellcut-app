"use client";

import { useEffect, useRef } from "react";

interface Pixel {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  phase: number;    // where in the blink cycle (0-1)
  speed: number;    // how fast it blinks
  on: boolean;
  fadeIn: number;    // current fade value 0-1
}

export default function DotMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let pixels: Pixel[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initPixels();
    };

    const initPixels = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.floor((w * h) / 6000);
      pixels = Array.from({ length: count }, () => ({
        x: Math.floor(Math.random() * (w / 5)) * 5, // snap to grid
        y: Math.floor(Math.random() * (h / 5)) * 5,
        size: [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        maxOpacity: Math.random() * 0.3 + 0.08,
        phase: Math.random(),
        speed: Math.random() * 0.003 + 0.001,
        on: Math.random() > 0.5,
        fadeIn: Math.random(),
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of pixels) {
        // Advance phase
        p.phase += p.speed;
        if (p.phase > 1) {
          p.phase = 0;
          p.on = !p.on;
          // Occasionally relocate
          if (Math.random() < 0.1) {
            p.x = Math.floor(Math.random() * (w / 5)) * 5;
            p.y = Math.floor(Math.random() * (h / 5)) * 5;
          }
        }

        // Smooth fade in/out
        if (p.on) {
          p.fadeIn = Math.min(1, p.fadeIn + 0.02);
        } else {
          p.fadeIn = Math.max(0, p.fadeIn - 0.015);
        }

        if (p.fadeIn < 0.01) continue;

        const opacity = p.fadeIn * p.maxOpacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="bg-dot-canvas">
      <canvas ref={canvasRef} />
    </div>
  );
}
