"use client";

import { useEffect, useRef } from "react";

/*
 * ApertureField — the brand's signature centerpiece. A lattice of dots whose
 * size and colour "focus" toward a moving focal point: near the focus dots
 * swell and take the accent colour, far away they fade to faint ink. The
 * focus drifts on its own and eases toward the pointer, so the field reads
 * like a lens or aperture resolving an image — a nod to "Persept" / perceive.
 *
 * Colours are read from CSS custom properties (--ink, --accent-rgb) at mount,
 * so the same component renders terracotta on the main site and golden-yellow
 * inside the GYST theme with no extra wiring. Respects reduced-motion.
 */

function parseInk(el: HTMLElement): [number, number, number] {
  const raw =
    getComputedStyle(el).getPropertyValue("--ink").trim() || "#17140f";
  const hex = raw.replace("#", "");
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return [23, 20, 15];
}

function parseAccent(el: HTMLElement): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue("--accent-rgb").trim();
  const parts = raw.split(",").map((n) => parseInt(n.trim(), 10));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0], parts[1], parts[2]];
  }
  return [207, 90, 52];
}

export function ApertureField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    // non-null locals so the narrowing survives into the closures below
    const cv = canvas;
    const el = wrap;
    const ctx = context;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ink = parseInk(wrap);
    const accent = parseAccent(wrap);

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gap = 26; // px between dots (CSS space)

    // focal point (CSS space) — drifts and eases toward pointer
    let fx = 0;
    let fy = 0;
    let tx = 0;
    let ty = 0;
    let pointerActive = false;

    function resize() {
      const rect = el.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.floor(width * dpr));
      cv.height = Math.max(1, Math.floor(height * dpr));
      cv.style.width = `${width}px`;
      cv.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fx === 0 && fy === 0) {
        fx = tx = width * 0.5;
        fy = ty = height * 0.44;
      }
    }

    const radius = () => Math.min(width, height) * 0.42;

    let raf = 0;
    let t = 0;
    function frame() {
      t += 0.006;
      // autonomous drift (Lissajous) unless pointer is steering
      if (!pointerActive && !reduced) {
        tx = width * (0.5 + Math.cos(t) * 0.16);
        ty = height * (0.44 + Math.sin(t * 0.8) * 0.14);
      }
      fx += (tx - fx) * 0.06;
      fy += (ty - fy) * 0.06;

      ctx.clearRect(0, 0, width, height);
      const R = radius();

      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          const dx = x - fx;
          const dy = y - fy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const f = Math.max(0, 1 - dist / R); // 1 at focus → 0 at edge
          if (f <= 0.001) continue;
          const eased = f * f;
          const r = 0.6 + eased * 2.6;
          // colour: lerp faint-ink → accent as we approach the focus
          const mix = Math.min(1, eased * 1.25);
          const cr = Math.round(ink[0] + (accent[0] - ink[0]) * mix);
          const cg = Math.round(ink[1] + (accent[1] - ink[1]) * mix);
          const cb = Math.round(ink[2] + (accent[2] - ink[2]) * mix);
          const alpha = 0.1 + eased * 0.8;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // a couple of faint signal rings emanating from the focus
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const rr = R * (0.35 + ((t * 0.12 + i * 0.5) % 1) * 0.7);
        const ringAlpha = 0.14 * (1 - ((t * 0.12 + i * 0.5) % 1));
        ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${ringAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(fx, fy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function onPointer(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < -80 || y < -80 || x > width + 80 || y > height + 80) return;
      pointerActive = true;
      tx = x;
      ty = y;
    }
    function onLeave() {
      pointerActive = false;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("pointermove", onPointer, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    frame();
    if (reduced) cancelAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default ApertureField;
