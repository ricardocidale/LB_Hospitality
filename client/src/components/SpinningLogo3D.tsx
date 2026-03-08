import { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import logoImg from "@/assets/logo.png";

function LogoPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, logoImg);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = Math.sin(t * 0.4) * 0.6;
    meshRef.current.rotation.x = Math.cos(t * 0.3) * 0.3;
    meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function SpinningLogo3D({ size = 64, onClick }: { size?: number; onClick?: () => void }) {
  return (
    <div
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      data-testid="logo-login"
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.5} />
        <LogoPlane />
      </Canvas>
    </div>
  );
}
