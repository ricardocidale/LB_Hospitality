import { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function GlassCore({ irrPercent }: { irrPercent: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => {
    if (irrPercent >= 15) return "#10B981";
    if (irrPercent >= 10) return "#3B82F6";
    if (irrPercent >= 5) return "#F59E0B";
    return "#EF4444";
  }, [irrPercent]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = -t * 0.08;
      glowRef.current.rotation.z = t * 0.05;
      const s = 1.0 + Math.sin(t * 1.5) * 0.03;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.4, 2]} />
          <MeshDistortMaterial
            color="#E8F4F8"
            speed={1.5}
            distort={0.12}
            roughness={0.05}
            metalness={0.3}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[1.1, 3]} />
          <MeshDistortMaterial
            color="#B8D8E8"
            speed={2}
            distort={0.08}
            roughness={0.02}
            metalness={0.5}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[0.7, 4]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </Float>

      <mesh ref={glowRef}>
        <torusGeometry args={[1.8, 0.04, 16, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.02, 16, 64]} />
        <meshStandardMaterial
          color="#9FBCA4"
          emissive="#9FBCA4"
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
        />
      </mesh>
    </>
  );
}

function IceParticles() {
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => {
      const theta = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
      const r = 2.2 + Math.random() * 1.2;
      const y = (Math.random() - 0.5) * 2;
      return {
        position: [Math.cos(theta) * r, y, Math.sin(theta) * r] as [number, number, number],
        scale: 0.02 + Math.random() * 0.04,
        speed: 0.5 + Math.random() * 2,
      };
    }), []);

  return (
    <group ref={particlesRef}>
      {particles.map((p, i) => (
        <IceChip key={i} position={p.position} scale={p.scale} speed={p.speed} />
      ))}
    </group>
  );
}

function IceChip({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.3;
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.5;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#E0F2FE"
        emissive="#93C5FD"
        emissiveIntensity={0.3}
        transparent
        opacity={0.5}
        roughness={0.05}
        metalness={0.9}
      />
    </mesh>
  );
}

function OrbScene({ irrPercent }: { irrPercent: number }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 5]} intensity={0.8} color="#E0F2FE" />
      <pointLight position={[-3, -2, 3]} intensity={0.4} color="#93C5FD" />
      <pointLight position={[0, -3, 2]} intensity={0.3} color="#9FBCA4" />
      <GlassCore irrPercent={irrPercent} />
      <IceParticles />
    </>
  );
}

export function IceGlassOrb({ irrPercent, className }: { irrPercent: number; className?: string }) {
  return (
    <div className={`relative ${className || ""}`} style={{ width: 240, height: 240 }}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-100/50 to-blue-200/30 animate-pulse" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ pointerEvents: 'none' }}
          gl={{ antialias: true, alpha: true }}
        >
          <OrbScene irrPercent={irrPercent} />
        </Canvas>
      </Suspense>
    </div>
  );
}
