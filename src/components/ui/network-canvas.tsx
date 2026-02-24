"use client";

import { useCallback, useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const CONNECTION_DIST = 180;
const SPEED = 0.3;

function getDotCount(width: number) {
  if (width < 640) return 25;
  if (width < 1024) return 60;
  return 120;
}

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number>(0);

  const initDots = useCallback((w: number, h: number) => {
    const count = getDotCount(w);
    const speed = w < 640 ? SPEED * 0.6 : SPEED;
    const dots: Dot[] = [];
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * 2 + 2,
      });
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Reset transform before scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const expectedCount = getDotCount(w);
      if (
        dotsRef.current.length === 0 ||
        dotsRef.current.length !== expectedCount
      ) {
        initDots(w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (prefersReduced) {
      const parent = canvas.parentElement;
      if (parent) {
        drawFrame(
          ctx,
          dotsRef.current,
          parent.offsetWidth,
          parent.offsetHeight,
          false,
        );
      }
      return () => window.removeEventListener("resize", resize);
    }

    const animate = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      drawFrame(
        ctx,
        dotsRef.current,
        parent.offsetWidth,
        parent.offsetHeight,
        true,
      );
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initDots]);

  return (
    <div
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  dots: Dot[],
  w: number,
  h: number,
  move: boolean,
) {
  ctx.clearRect(0, 0, w, h);

  if (move) {
    for (const dot of dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x < 0 || dot.x > w) dot.vx *= -1;
      if (dot.y < 0 || dot.y > h) dot.vy *= -1;
    }
  }

  // Draw connections
  ctx.lineWidth = 1.5;
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECTION_DIST) {
        const alpha = 0.35 * (1 - dist / CONNECTION_DIST);
        ctx.strokeStyle = `rgba(185, 28, 28, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw dots
  ctx.fillStyle = "rgba(185, 28, 28, 0.55)";
  for (const dot of dots) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
