"use client";

import { useEffect, useRef } from "react";

export default function DotMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const gap = 7;
    const dotRadius = 1;
    const speed = 0.3; // pixels per frame — slow, subtle

    // Columns of dots, each with its own offset
    let cols: number[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      // Init column offsets (random start positions)
      const numCols = Math.ceil(window.innerWidth / gap) + 1;
      cols = Array.from({ length: numCols }, () => Math.random() * gap);
    };

    resize();
    window.addEventListener("resize", resize);

    // Center glow mask — dots are brighter near center, fade at edges
    const getCenterBrightness = (x: number, y: number, w: number, h: number): number => {
      const cx = w * 0.5;
      const cy = h * 0.45;
      const dx = (x - cx) / (w * 0.45);
      const dy = (y - cy) / (h * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Smooth falloff: bright in center, dark at edges
      return Math.max(0, 1 - dist * dist) * 0.55;
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // Update column offsets (move up)
      for (let i = 0; i < cols.length; i++) {
        cols[i] -= speed + Math.sin(i * 0.3) * 0.1; // slight wave
        if (cols[i] < -gap) cols[i] += gap;
      }

      // Draw dots
      const numRows = Math.ceil(h / gap) + 2;
      for (let col = 0; col < cols.length; col++) {
        const x = col * gap;
        for (let row = 0; row < numRows; row++) {
          const y = row * gap + cols[col];
          if (y < -gap || y > h + gap) continue;

          const brightness = getCenterBrightness(x, y, w, h);
          if (brightness < 0.01) continue; // skip invisible dots

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.fill();
        }
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
