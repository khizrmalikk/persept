"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Points as ThreePoints } from "three";

const INK = "#16150f";
const ACCENT = "#5a6e2f";

/* ------------------------------------------------------------------ */
/*  Wireframe core — two counter-rotating cages + a faint inner solid  */
/* ------------------------------------------------------------------ */

function WireCore({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const inner = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = reduced ? 0 : delta;
    group.current.rotation.y += t * 0.12;
    group.current.rotation.x += t * 0.04;

    // pointer parallax — drift the whole form toward the cursor
    const px = state.pointer.x * 0.35;
    const py = state.pointer.y * 0.35;
    group.current.position.x += (px - group.current.position.x) * 0.04;
    group.current.position.y += (-py - group.current.position.y) * 0.04;

    if (inner.current) {
      inner.current.rotation.y -= t * 0.2;
      inner.current.rotation.z += t * 0.05;
      // gentle breathing
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
      inner.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {/* Outer cage */}
      <Icosahedron args={[2.35, 1]}>
        <meshBasicMaterial wireframe color={INK} transparent opacity={0.55} />
      </Icosahedron>

      {/* Inner breathing core */}
      <group ref={inner}>
        <Icosahedron args={[1.45, 1]}>
          <meshBasicMaterial wireframe color={INK} transparent opacity={0.9} />
        </Icosahedron>
        <Icosahedron args={[1.42, 0]}>
          <meshBasicMaterial color="#efece3" transparent opacity={0.25} />
        </Icosahedron>
      </group>

      {/* A single accent node */}
      <mesh position={[2.35, 0, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Orbiting particle field                                            */
/* ------------------------------------------------------------------ */

function Particles({
  count = 240,
  reduced,
}: {
  count?: number;
  reduced: boolean;
}) {
  const ref = useRef<ThreePoints>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // distribute on a fuzzy spherical shell
      const r = 3.1 + Math.random() * 1.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current && !reduced) {
      ref.current.rotation.y += delta * 0.03;
      ref.current.rotation.x -= delta * 0.012;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={INK}
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.5}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas wrapper (mount-guarded for SSR)                             */
/* ------------------------------------------------------------------ */

export function LabObject({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!mounted) return <div className={className} aria-hidden="true" />;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <WireCore reduced={reduced} />
        <Particles reduced={reduced} />
      </Canvas>
    </div>
  );
}

export default LabObject;
