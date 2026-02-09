import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

function GlowOrb({ position, color, speed, scale = 1 }: { position: [number, number, number]; color: string; speed: number; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.25;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
    }
  });
  return (
    <Float speed={speed * 0.4} rotationIntensity={0.15} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} speed={speed * 1.5} distort={0.3} roughness={0.2} metalness={0.8} transparent opacity={0.12} />
      </mesh>
    </Float>
  );
}

function OrbitalRing({ radius, color, speed, tilt = 0 }: { radius: number; color: string; speed: number; tilt?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = tilt + Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.1;
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.15;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.008, 16, 100]} />
      <MeshWobbleMaterial factor={0.15} speed={speed * 0.8} color={color} transparent opacity={0.08} />
    </mesh>
  );
}

function FloatingDot({ position, color, phase }: { position: [number, number, number]; color: string; phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.position.x = position[0] + Math.sin(t * 0.8 + phase) * 0.4;
      meshRef.current.position.y = position[1] + Math.cos(t * 0.6 + phase) * 0.3;
      meshRef.current.scale.setScalar(0.5 + Math.sin(t * 1.5 + phase) * 0.2);
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.35} />
    </mesh>
  );
}

function LoginScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#38BDF8" />
      <pointLight position={[-5, -3, 3]} intensity={0.2} color="#9FBCA4" />
      <pointLight position={[0, -5, 2]} intensity={0.15} color="#7DD3FC" />
      <Stars radius={60} depth={60} count={2000} factor={2.5} saturation={0.3} fade speed={0.5} />
      <GlowOrb position={[3, 2, -3]} color="#38BDF8" speed={0.6} scale={1.5} />
      <GlowOrb position={[-3.5, -1.5, -4]} color="#9FBCA4" speed={0.8} scale={1.2} />
      <GlowOrb position={[1, -3, -5]} color="#7DD3FC" speed={0.5} scale={1.8} />
      <GlowOrb position={[-2, 3, -6]} color="#38BDF8" speed={0.7} scale={1.0} />
      <OrbitalRing radius={4} color="#38BDF8" speed={0.4} tilt={Math.PI / 6} />
      <OrbitalRing radius={5.5} color="#9FBCA4" speed={0.3} tilt={-Math.PI / 8} />
      <OrbitalRing radius={3} color="#7DD3FC" speed={0.5} tilt={Math.PI / 4} />
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 3 + Math.sin(i * 2.1) * 1.5;
        const y = (Math.random() - 0.5) * 4;
        return (
          <FloatingDot
            key={i}
            position={[Math.cos(angle) * r, y, -2 + Math.sin(angle) * r * 0.3]}
            color={["#38BDF8", "#9FBCA4", "#7DD3FC", "#BAE6FD"][i % 4]}
            phase={i * 0.7}
          />
        );
      })}
    </>
  );
}

export function Login3DScene() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 7], fov: 55 }} style={{ pointerEvents: 'none' }}>
          <LoginScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
