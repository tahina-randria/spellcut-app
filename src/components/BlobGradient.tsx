"use client";

import { useEffect, useRef } from "react";

export default function BlobGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const blobs = Array.from({ length: 5 }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 0.25 + 0.15,
      speedX: (Math.random() - 0.5) * 0.0003,
      speedY: (Math.random() - 0.5) * 0.0003,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.002 + 0.001,
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      time++;

      // Black background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Draw blobs
      for (const blob of blobs) {
        blob.x += blob.speedX + Math.sin(time * 0.001 + blob.phase) * 0.0002;
        blob.y += blob.speedY + Math.cos(time * 0.001 + blob.phase) * 0.0002;

        // Wrap around
        if (blob.x < -0.2) blob.x = 1.2;
        if (blob.x > 1.2) blob.x = -0.2;
        if (blob.y < -0.2) blob.y = 1.2;
        if (blob.y > 1.2) blob.y = -0.2;

        const pulse = Math.sin(time * blob.pulseSpeed + blob.phase) * 0.03;
        const r = (blob.radius + pulse) * Math.max(w, h);
        const cx = blob.x * w;
        const cy = blob.y * h;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.07)");
        gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.03)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Glow center (subtle)
      const centerGlow = ctx.createRadialGradient(
        w * 0.5, h * 0.4, 0,
        w * 0.5, h * 0.4, w * 0.5
      );
      centerGlow.addColorStop(0, "rgba(255, 255, 255, 0.04)");
      centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div className="blob-gradient-bg">
        <canvas ref={canvasRef} />
      </div>
      <div className="grain-overlay" />
    </>
  );
}
