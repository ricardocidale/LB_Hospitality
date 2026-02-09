import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

function SubtleSphere({ position, color, speed, distort, scale = 1 }: { position: [number, number, number]; color: string; speed: number; distort: number; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    }
  });
  return (
    <Float speed={speed * 0.6} rotationIntensity={0.2} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 3]} />
        <MeshDistortMaterial color={color} speed={speed} distort={distort} roughness={0.3} metalness={0.6} transparent opacity={0.15} />
      </mesh>
    </Float>
  );
}

function SubtleRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * speed) * 0.15;
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.2;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.015, 16, 80]} />
      <MeshWobbleMaterial factor={0.2} speed={speed} color={color} transparent opacity={0.12} />
    </mesh>
  );
}

function FloatingParticle({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.2;
      meshRef.current.scale.setScalar(0.6 + Math.sin(state.clock.elapsedTime * 2 + position[2]) * 0.15);
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.25} />
    </mesh>
  );
}

function DashboardScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#9FBCA4" />
      <pointLight position={[-5, -3, 3]} intensity={0.2} color="#38BDF8" />
      <SubtleSphere position={[3, 1.5, -2]} color="#9FBCA4" speed={0.8} distort={0.25} scale={1.2} />
      <SubtleSphere position={[-3, -1, -2]} color="#38BDF8" speed={0.6} distort={0.2} scale={0.9} />
      <SubtleSphere position={[0, -2, -3]} color="#F97066" speed={0.7} distort={0.2} scale={0.7} />
      <SubtleRing radius={2.5} color="#9FBCA4" speed={0.5} />
      <SubtleRing radius={3.5} color="#38BDF8" speed={0.3} />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 2 + Math.sin(i * 1.2) * 0.5;
        return (
          <FloatingParticle
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.3, -1 + Math.sin(angle) * 0.5]}
            color={["#9FBCA4", "#38BDF8", "#F97066", "#F59E0B"][i % 4]}
          />
        );
      })}
    </>
  );
}

export function Dashboard3DBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ pointerEvents: 'none' }}>
          <DashboardScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
