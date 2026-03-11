"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh, InstancedMesh } from "three";

/* ── Camera follow mouse ─────────────────────── */

function CameraRig() {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    camera.position.x += (mouseRef.current.x * 0.3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseRef.current.y * 0.2 + 0.5 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ── Floating message bubble ─────────────────── */

function MessageBubble({
  startPos,
  delay,
}: {
  startPos: [number, number, number];
  delay: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - startTime.current;

    // Loop: float from start toward center, then reset
    const cycle = 8;
    const progress = ((t + delay) % cycle) / cycle;

    meshRef.current.position.x = startPos[0] * (1 - progress);
    meshRef.current.position.y = startPos[1] + Math.sin(progress * Math.PI) * 0.5;
    meshRef.current.position.z = startPos[2] * (1 - progress);

    const fadeIn = Math.min(progress * 5, 1);
    const fadeOut = Math.min((1 - progress) * 5, 1);
    const scale = Math.min(fadeIn, fadeOut) * 0.4;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <RoundedBox ref={meshRef} args={[0.6, 0.35, 0.15]} radius={0.08} smoothness={2} scale={0}>
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.4}
        transparent
        opacity={0.7}
      />
    </RoundedBox>
  );
}

/* ── AI Agent (geometric shape) ──────────────── */

function Agent({
  position,
  color,
  shape,
}: {
  position: [number, number, number];
  color: string;
  shape: "octahedron" | "icosahedron" | "dodecahedron" | "tetrahedron";
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "octahedron":
        return new THREE.OctahedronGeometry(0.25);
      case "icosahedron":
        return new THREE.IcosahedronGeometry(0.25);
      case "dodecahedron":
        return new THREE.DodecahedronGeometry(0.25);
      case "tetrahedron":
        return new THREE.TetrahedronGeometry(0.3);
    }
  }, [shape]);

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} geometry={geometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Glow ring */}
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </Float>
  );
}

/* ── Particle field (instanced) ──────────────── */

function ParticleField({ count = 200 }: { count?: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(
    () => Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.005,
      y: (Math.random() - 0.5) * 0.005,
      z: (Math.random() - 0.5) * 0.005,
      px: (Math.random() - 0.5) * 6,
      py: (Math.random() - 0.5) * 4,
      pz: (Math.random() - 0.5) * 4,
    })),
    [count]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const s = speeds[i];
      dummy.position.set(
        s.px + Math.sin(t * 0.5 + i) * 0.3,
        s.py + Math.cos(t * 0.3 + i * 0.5) * 0.2,
        s.pz
      );
      dummy.scale.setScalar(0.01 + Math.sin(t + i) * 0.005);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#b91c1c" transparent opacity={0.3} />
    </instancedMesh>
  );
}

/* ── Main scene ──────────────────────────────── */

function Scene() {
  const agents: { pos: [number, number, number]; color: string; shape: "octahedron" | "icosahedron" | "dodecahedron" | "tetrahedron" }[] = [
    { pos: [-1.2, -0.3, 0], color: "#b91c1c", shape: "octahedron" },
    { pos: [1.2, 0.2, -0.5], color: "#dc2626", shape: "icosahedron" },
    { pos: [0, -0.5, 0.5], color: "#991b1b", shape: "dodecahedron" },
    { pos: [-0.5, 0.6, -0.3], color: "#ef4444", shape: "tetrahedron" },
  ];

  const messages = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        startPos: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
        ] as [number, number, number],
        delay: i * 1.3,
      })),
    []
  );

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 3, 2]} intensity={0.8} color="#b91c1c" />
      <pointLight position={[-3, -1, 1]} intensity={0.4} color="#dc2626" />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#ffffff" />

      {agents.map((a, i) => (
        <Agent key={`agent-${i}`} position={a.pos} color={a.color} shape={a.shape} />
      ))}

      {messages.map((m) => (
        <MessageBubble key={m.id} startPos={m.startPos} delay={m.delay} />
      ))}

      <ParticleField count={150} />
    </>
  );
}

export function HotelScene() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  if (!visible) return <div className="h-full w-full" />;

  return (
    <Canvas
      camera={{ position: [0, 0.5, 4], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <Scene />
    </Canvas>
  );
}
