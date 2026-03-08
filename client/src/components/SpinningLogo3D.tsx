import { useRef, useState, useEffect, Component, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import logoImg from "@/assets/logo.png";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

class WebGLErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function LogoPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, logoImg);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = Math.sin(t * 0.8) * 0.6;
    meshRef.current.rotation.x = Math.cos(t * 0.6) * 0.3;
    meshRef.current.rotation.z = Math.sin(t * 0.4) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CSSFallback({ size, onClick }: { size: number; onClick?: () => void }) {
  return (
    <div
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default", perspective: "200px" }}
      onClick={onClick}
      data-testid="logo-login"
    >
      <img
        src={logoImg}
        alt="Hospitality Business Group"
        className="w-full h-full object-contain animate-spherical"
      />
    </div>
  );
}

export default function SpinningLogo3D({ size = 64, onClick }: { size?: number; onClick?: () => void }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  if (webgl === null) {
    return <div style={{ width: size, height: size }} />;
  }

  const fallback = <CSSFallback size={size} onClick={onClick} />;

  if (!webgl) {
    return fallback;
  }

  return (
    <WebGLErrorBoundary fallback={fallback}>
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
    </WebGLErrorBoundary>
  );
}
