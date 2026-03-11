"use client";

import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  targetAlpha: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef(0);

  const getCount = useCallback((w: number) => {
    if (w < 640) return 80;
    if (w < 1024) return 200;
    return 400;
  }, []);

  const initParticles = useCallback(
    (w: number, h: number) => {
      const count = getCount(w);
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.3 + 0.1,
          targetAlpha: Math.random() * 0.3 + 0.1,
        });
      }
      particlesRef.current = particles;
    },
    [getCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const expected = getCount(w);
      if (particlesRef.current.length !== expected) {
        initParticles(w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    if (prefersReduced) {
      const parent = canvas.parentElement;
      if (parent) {
        drawFrame(ctx, particlesRef.current, parent.offsetWidth, parent.offsetHeight, mouseRef.current, false);
      }
      return () => {
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseleave", onMouseLeave);
      };
    }

    const animate = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      drawFrame(ctx, particlesRef.current, parent.offsetWidth, parent.offsetHeight, mouseRef.current, true);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [getCount, initParticles]);

  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <canvas ref={canvasRef} className="pointer-events-auto h-full w-full" />
    </div>
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  mouse: { x: number; y: number },
  move: boolean
) {
  ctx.clearRect(0, 0, w, h);

  // Subtle radial glow in center
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
  grad.addColorStop(0, "rgba(185, 28, 28, 0.03)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;

  for (const p of particles) {
    if (move) {
      // Gentle drift toward center
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 50) {
        p.vx += (dx / dist) * 0.002;
        p.vy += (dy / dist) * 0.002;
      }

      // Mouse repulsion
      const mx = p.x - mouse.x;
      const my = p.y - mouse.y;
      const mDist = Math.sqrt(mx * mx + my * my);
      if (mDist < 120 && mDist > 0) {
        const force = (120 - mDist) / 120 * 0.5;
        p.vx += (mx / mDist) * force;
        p.vy += (my / mDist) * force;
      }

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Twinkle
      p.alpha += (p.targetAlpha - p.alpha) * 0.02;
      if (Math.random() < 0.005) {
        p.targetAlpha = Math.random() * 0.4 + 0.1;
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(185, 28, 28, ${p.alpha})`;
    ctx.fill();
  }

  // Draw connections between close particles (only nearby ones for perf)
  ctx.lineWidth = 0.5;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < Math.min(i + 20, particles.length); j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        const alpha = 0.08 * (1 - dist / 80);
        ctx.strokeStyle = `rgba(185, 28, 28, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}
