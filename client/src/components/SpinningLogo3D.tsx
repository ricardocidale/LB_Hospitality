import { useRef, useState, useEffect, Component, type ReactNode } from "react";
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

function ThreeCanvas({ size, onClick }: { size: number; onClick?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    const loader = new THREE.TextureLoader();
    const texture = loader.load(logoImg);
    const geometry = new THREE.PlaneGeometry(2.4, 2.4);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mesh.rotation.y = Math.sin(t * 0.8) * 0.6;
      mesh.rotation.x = Math.cos(t * 0.6) * 0.3;
      mesh.rotation.z = Math.sin(t * 0.4) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => {
      cleanupRef.current?.();
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      data-testid="logo-login"
    />
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
      <ThreeCanvas size={size} onClick={onClick} />
    </WebGLErrorBoundary>
  );
}
