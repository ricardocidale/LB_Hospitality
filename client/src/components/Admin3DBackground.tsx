import { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function GlassPanel({ position, rotation, scale, color, speed }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useMemo(() => [...position] as [number, number, number], []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed;
      meshRef.current.position.y = initialPos[1] + Math.sin(t) * 0.15;
      meshRef.current.rotation.x = rotation[0] + Math.sin(t * 0.7) * 0.03;
      meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.5) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, 0.02]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.06}
        roughness={0.1}
        metalness={0.3}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

function OrbitalRing({ radius, color, speed, tilt }: {
  radius: number; color: string; speed: number; tilt: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 16, 120]} />
      <meshStandardMaterial color={color} transparent opacity={0.08} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  );
}

function GlowOrb({ position, color, size, speed }: {
  position: [number, number, number]; color: string; size: number; speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed;
      meshRef.current.scale.setScalar(size + Math.sin(t * 2) * size * 0.15);
      meshRef.current.position.y = position[1] + Math.sin(t) * 0.3;
    }
  });

  return (
    <Float speed={speed * 0.5} rotationIntensity={0} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.12}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  );
}

function AdminScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 4, 4]} intensity={0.3} color="#9FBCA4" />
      <pointLight position={[-4, -2, 3]} intensity={0.15} color="#257D41" />
      <directionalLight position={[0, 5, 5]} intensity={0.1} color="#ffffff" />

      <GlassPanel position={[-2.5, 1.2, -3]} rotation={[0.15, 0.3, 0.05]} scale={[2.5, 1.8, 1]} color="#9FBCA4" speed={0.4} />
      <GlassPanel position={[2.8, -0.5, -4]} rotation={[-0.1, -0.2, 0.08]} scale={[3, 2, 1]} color="#257D41" speed={0.3} />
      <GlassPanel position={[0.5, 2, -5]} rotation={[0.08, 0.1, -0.05]} scale={[4, 2.5, 1]} color="#9FBCA4" speed={0.25} />
      <GlassPanel position={[-1.5, -1.5, -3.5]} rotation={[-0.12, 0.15, 0.1]} scale={[2, 1.5, 1]} color="#38BDF8" speed={0.35} />

      <OrbitalRing radius={3} color="#9FBCA4" speed={0.4} tilt={Math.PI / 3} />
      <OrbitalRing radius={4.5} color="#257D41" speed={0.25} tilt={Math.PI / 2.5} />

      <GlowOrb position={[3.5, 2, -2]} color="#9FBCA4" size={0.25} speed={0.6} />
      <GlowOrb position={[-3, -1.5, -2]} color="#257D41" size={0.18} speed={0.5} />
      <GlowOrb position={[1, -2.5, -1.5]} color="#38BDF8" size={0.12} speed={0.7} />
    </>
  );
}

export function Admin3DBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ pointerEvents: "none" }}
          gl={{ alpha: true, antialias: true }}
        >
          <AdminScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
