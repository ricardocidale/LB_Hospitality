import { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function Petal({ angle, color }: { angle: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rad = (angle * Math.PI) / 180;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = rad + Math.sin(state.clock.elapsedTime * 0.5 + angle * 0.01) * 0.04;
    }
  });

  const cx = Math.sin(rad) * 0.55;
  const cy = Math.cos(rad) * 0.55;

  return (
    <mesh ref={meshRef} position={[cx, cy, 0]}>
      <sphereGeometry args={[0.38, 24, 16]} />
      <MeshDistortMaterial
        color={color}
        speed={1.2}
        distort={0.15}
        roughness={0.35}
        metalness={0.5}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

function CenterNode({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.1]}>
      <sphereGeometry args={[0.15, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

function OrbitalNode({ angle, radius, color }: { angle: number; radius: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rad = (angle * Math.PI) / 180;

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const r = radius + Math.sin(t * 1.2 + angle * 0.02) * 0.03;
      meshRef.current.position.x = Math.cos(rad + t * 0.3) * r;
      meshRef.current.position.y = Math.sin(rad + t * 0.3) * r;
      meshRef.current.position.z = 0.15 + Math.sin(t * 2 + angle) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        roughness={0.3}
        metalness={0.5}
      />
    </mesh>
  );
}

function ConnectorRing({ radius, color }: { radius: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.012, 16, 64]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.25}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}

function LogoScene() {
  const groupRef = useRef<THREE.Group>(null);
  const sageColor = "#8A9A7B";
  const mossColor = "#4A5D3F";
  const warmAccent = "#C4A35A";

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  const petalAngles = useMemo(() => [0, 72, 144, 216, 288], []);
  const nodeAngles = useMemo(() => [0, 60, 120, 180, 240, 300], []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 5]} intensity={0.8} color="#FAF6F1" />
      <pointLight position={[-2, -2, 3]} intensity={0.3} color={sageColor} />
      <pointLight position={[0, 2, 2]} intensity={0.2} color={warmAccent} />

      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
        <group ref={groupRef}>
          {petalAngles.map((angle) => (
            <Petal key={angle} angle={angle} color={sageColor} />
          ))}

          <CenterNode color={mossColor} />

          {nodeAngles.map((angle) => (
            <OrbitalNode key={angle} angle={angle} radius={0.35} color={sageColor} />
          ))}

          <ConnectorRing radius={0.75} color={sageColor} />
          <ConnectorRing radius={1.1} color={mossColor} />
        </group>
      </Float>
    </>
  );
}

export function Login3DLogo({ size = 200 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} data-testid="logo-3d">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          style={{ width: "100%", height: "100%" }}
          gl={{ antialias: true, alpha: true }}
        >
          <LogoScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
