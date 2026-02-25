"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Shared canvas wrapper                                              */
/* ------------------------------------------------------------------ */

function AgentCanvas({
  children,
  inView,
}: {
  children: React.ReactNode;
  inView: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  if (!visible) return <div className="h-full w-full" />;

  return (
    <Canvas
      camera={{ position: [0, 0.3, 5.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      frameloop={inView ? "always" : "demand"}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} />
      {children}
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/*  Easing helper                                                      */
/* ------------------------------------------------------------------ */

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/* ------------------------------------------------------------------ */
/*  1. Sarah — Single chat bubble that scales up + typing dots         */
/* ------------------------------------------------------------------ */

function ChatBubble({
  color,
  inView,
}: {
  color: string;
  inView: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const startTime = useRef<number | null>(null);
  const done = useRef(false);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (!inView) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    const dur = 0.8;
    const t = Math.min(elapsed / dur, 1);
    const s = easeOutBack(t);
    meshRef.current.scale.set(s, s, s);
    meshRef.current.rotation.z = (1 - t) * 0.15;

    if (t >= 1) done.current = true;
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[2.2, 1.4, 0.5]}
      radius={0.35}
      smoothness={4}
      scale={0}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.05}
      />
    </RoundedBox>
  );
}

function TypingDots({
  color,
  inView,
}: {
  color: string;
  inView: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (!inView) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    // Delay dots until bubble has mostly appeared
    const delay = 0.6;
    if (elapsed < delay) {
      for (const child of groupRef.current.children) {
        child.scale.setScalar(0);
      }
      return;
    }

    const t = elapsed - delay;
    for (let i = 0; i < groupRef.current.children.length; i++) {
      const dot = groupRef.current.children[i];
      const dotProgress = Math.min((t - i * 0.12) * 4, 1);
      const s = dotProgress > 0 ? easeOutBack(Math.max(0, dotProgress)) : 0;
      dot.scale.setScalar(s);
      dot.position.y = Math.sin(t * 3 + i * 1.2) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.3]}>
      {[0, 1, 2].map((i) => (
        <mesh key={`dot-${i}`} position={[i * 0.25 - 0.25, 0, 0]} scale={0}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

export function SarahScene({
  color,
  inView = false,
}: {
  color: string;
  inView?: boolean;
}) {
  return (
    <AgentCanvas inView={inView}>
      <group position={[0, -0.1, 0]}>
        <ChatBubble color={color} inView={inView} />
        <TypingDots color={color} inView={inView} />
      </group>
    </AgentCanvas>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Marcus — Star arc                                               */
/* ------------------------------------------------------------------ */

function createStarShape(
  outerRadius: number,
  innerRadius: number,
  points: number,
) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function StarMesh({
  position,
  color,
  index,
  inView,
}: {
  position: [number, number, number];
  color: string;
  index: number;
  inView: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const starShape = useMemo(() => createStarShape(0.32, 0.14, 5), []);
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(starShape, {
        depth: 0.12,
        bevelEnabled: false,
      }),
    [starShape],
  );
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (!inView) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    // Staggered pop-in per star
    const delay = index * 0.15;
    const t = Math.min(Math.max((elapsed - delay) / 0.6, 0), 1);
    const s = easeOutElastic(t);
    meshRef.current.scale.setScalar(s);

    // Settle rotation
    const rotT = Math.min(Math.max((elapsed - delay) / 1.2, 0), 1);
    meshRef.current.rotation.y = (1 - rotT) * Math.PI * 0.5;
    meshRef.current.rotation.z = (1 - rotT) * 0.3;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} scale={0}>
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

export function MarcusScene({
  color,
  inView = false,
}: {
  color: string;
  inView?: boolean;
}) {
  const stars = useMemo(() => {
    const result: { id: string; pos: [number, number, number]; idx: number }[] =
      [];
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / 4;
      const r = 1.6;
      result.push({
        id: `star-${i}`,
        pos: [Math.cos(angle) * r - 0.1, Math.sin(angle) * r - 0.9, 0],
        idx: i,
      });
    }
    return result;
  }, []);

  return (
    <AgentCanvas inView={inView}>
      {stars.map((s) => (
        <StarMesh
          key={s.id}
          position={s.pos}
          color={color}
          index={s.idx}
          inView={inView}
        />
      ))}
    </AgentCanvas>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Olivia — Calendar grid                                          */
/* ------------------------------------------------------------------ */

const HIGHLIGHTED_CELLS = new Set([2, 7, 8, 12, 15, 17]);

function CalendarCube({
  position,
  color,
  highlighted,
  index,
  inView,
}: {
  position: [number, number, number];
  color: string;
  highlighted: boolean;
  index: number;
  inView: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (!inView) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    // Wave reveal: row-by-row, column-by-column stagger
    const row = Math.floor(index / 5);
    const col = index % 5;
    const delay = row * 0.1 + col * 0.05;
    const t = Math.min(Math.max((elapsed - delay) / 0.5, 0), 1);
    const s = easeOutBack(t);
    meshRef.current.scale.set(s, s, s);
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[0.32, 0.32, 0.15]}
      radius={0.04}
      smoothness={2}
      position={position}
      scale={0}
    >
      <meshStandardMaterial
        color={highlighted ? color : "#e5e7eb"}
        roughness={0.35}
        metalness={0.05}
        emissive={highlighted ? color : "#000000"}
        emissiveIntensity={highlighted ? 0.25 : 0}
      />
    </RoundedBox>
  );
}

export function OliviaScene({
  color,
  inView = false,
}: {
  color: string;
  inView?: boolean;
}) {
  const cubes = useMemo(() => {
    const result: { pos: [number, number, number]; idx: number }[] = [];
    const cols = 5;
    const rows = 4;
    const gap = 0.42;
    const offsetX = ((cols - 1) * gap) / 2;
    const offsetY = ((rows - 1) * gap) / 2;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result.push({
          pos: [c * gap - offsetX, -(r * gap - offsetY), 0],
          idx,
        });
        idx++;
      }
    }
    return result;
  }, []);

  return (
    <AgentCanvas inView={inView}>
      <group rotation={[0.2, 0.3, 0.05]}>
        {cubes.map((cube) => (
          <CalendarCube
            key={cube.idx}
            position={cube.pos}
            color={color}
            highlighted={HIGHLIGHTED_CELLS.has(cube.idx)}
            index={cube.idx}
            inView={inView}
          />
        ))}
      </group>
    </AgentCanvas>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Alex — Bar chart                                                */
/* ------------------------------------------------------------------ */

const BAR_DATA = [
  { id: "bar-0", h: 1.4 },
  { id: "bar-1", h: 0.9 },
  { id: "bar-2", h: 1.8 },
  { id: "bar-3", h: 1.1 },
  { id: "bar-4", h: 1.6 },
  { id: "bar-5", h: 0.7 },
];

function ChartBar({
  position,
  targetHeight,
  color,
  index,
  inView,
}: {
  position: [number, number, number];
  targetHeight: number;
  color: string;
  index: number;
  inView: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (!inView) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    const delay = index * 0.12;
    const t = Math.min(Math.max((elapsed - delay) / 0.7, 0), 1);
    const eased = easeOutBack(t);
    const h = targetHeight * eased;
    meshRef.current.scale.y = Math.max(0.001, h);
    meshRef.current.position.y = (h * 0.5) / 1 - 0.8;
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[0.3, 1, 0.3]}
      radius={0.05}
      smoothness={2}
      position={position}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.15}
        transparent
        opacity={0.92}
      />
    </RoundedBox>
  );
}

export function AlexScene({
  color,
  inView = false,
}: {
  color: string;
  inView?: boolean;
}) {
  return (
    <AgentCanvas inView={inView}>
      <group rotation={[0.15, 0.35, 0.05]}>
        {BAR_DATA.map((bar, i) => (
          <ChartBar
            key={bar.id}
            position={[i * 0.45 - 1.1, 0, 0]}
            targetHeight={bar.h}
            color={color}
            index={i}
            inView={inView}
          />
        ))}
      </group>
    </AgentCanvas>
  );
}
