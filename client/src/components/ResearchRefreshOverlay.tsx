import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Stars } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useAuth } from "@/lib/auth";

function GlowingSphere({ position, color, speed, distort }: { position: [number, number, number]; color: string; speed: number; distort: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
    }
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} speed={speed * 2} distort={distort} roughness={0.2} metalness={0.8} transparent opacity={0.7} />
      </mesh>
    </Float>
  );
}

function DataOrb({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
      meshRef.current.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 3 + position[2]) * 0.2);
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
    </mesh>
  );
}

function WobbleRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * speed) * 0.2;
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <MeshWobbleMaterial factor={0.3} speed={speed} color={color} transparent opacity={0.4} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#9FBCA4" />
      <pointLight position={[-5, -3, 3]} intensity={0.5} color="#38BDF8" />
      <pointLight position={[0, 3, -5]} intensity={0.3} color="#F97066" />
      <Stars radius={50} depth={50} count={1500} factor={3} saturation={0.5} fade speed={1} />
      <GlowingSphere position={[0, 0, 0]} color="#9FBCA4" speed={1.5} distort={0.4} />
      <GlowingSphere position={[-2.5, 1, -1]} color="#38BDF8" speed={1} distort={0.3} />
      <GlowingSphere position={[2.5, -0.5, -1]} color="#F97066" speed={1.2} distort={0.35} />
      <WobbleRing radius={2} color="#9FBCA4" speed={1} />
      <WobbleRing radius={3} color="#38BDF8" speed={0.7} />
      <WobbleRing radius={3.8} color="#F97066" speed={0.5} />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 2.5 + Math.sin(i * 1.5) * 0.5;
        return (
          <DataOrb
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.4, Math.sin(angle) * r * 0.3]}
            color={["#9FBCA4", "#38BDF8", "#F97066", "#FFD700"][i % 4]}
          />
        );
      })}
    </>
  );
}

interface ResearchRefreshOverlayProps {
  onComplete: () => void;
}

export function ResearchRefreshOverlay({ onComplete }: ResearchRefreshOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [currentProperty, setCurrentProperty] = useState("");
  const [phase, setPhase] = useState<"loading" | "researching" | "done">("loading");
  const [properties, setProperties] = useState<any[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const abortRef = useRef(false);

  const refreshResearch = useCallback(async () => {
    try {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (!res.ok) { onComplete(); return; }
      const props = await res.json();
      if (!props || props.length === 0) { onComplete(); return; }

      setProperties(props);
      setTotalProperties(props.length);
      setPhase("researching");

      for (let i = 0; i < props.length; i++) {
        if (abortRef.current) break;
        const prop = props[i];
        setCurrentProperty(prop.name || `Property ${i + 1}`);
        setProgress(Math.round(((i) / props.length) * 100));

        try {
          const checkRes = await fetch(`/api/research/property?propertyId=${prop.id}`, { credentials: "include" });
          if (checkRes.ok) {
            const existing = await checkRes.json();
            if (existing && existing.updatedAt) {
              const isSeedData = existing.llmModel === "seed-data";
              if (!isSeedData) {
                const age = Date.now() - new Date(existing.updatedAt).getTime();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                if (age < sevenDays) {
                  setCompletedCount(i + 1);
                  continue;
                }
              }
            }
          }
        } catch {}

        try {
          const genRes = await fetch("/api/research/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              type: "property",
              propertyId: prop.id,
              propertyContext: { name: prop.name, location: prop.location, market: prop.market, roomCount: prop.roomCount },
            }),
          });

          if (genRes.ok && genRes.headers.get("content-type")?.includes("text/event-stream")) {
            const reader = genRes.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                if (text.includes('"done":true')) break;
              }
            }
          }
        } catch {}

        setCompletedCount(i + 1);
      }

      setProgress(100);
      setPhase("done");
      await new Promise((r) => setTimeout(r, 1500));
      onComplete();
    } catch {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    refreshResearch();
    return () => { abortRef.current = true; };
  }, [refreshResearch]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #0a0f1e 100%)" }}
      >
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
              <Scene />
            </Canvas>
          </Suspense>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md text-center px-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-display text-white/90 mb-2">
              {phase === "loading" && "Preparing Research Engine"}
              {phase === "researching" && "Updating Market Research"}
              {phase === "done" && "Research Complete"}
            </h2>
            <p className="text-sm text-white/50">
              {phase === "loading" && "Connecting to market data sources..."}
              {phase === "researching" && (
                <>Analyzing <span className="text-[#9FBCA4] font-medium">{currentProperty}</span> ({completedCount}/{totalProperties})</>
              )}
              {phase === "done" && "All properties are up to date"}
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="w-full"
          >
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #9FBCA4, #38BDF8, #9FBCA4)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-white/30 mt-2">{progress}% complete</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={() => { abortRef.current = true; onComplete(); }}
            className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-4 mt-4"
          >
            Skip and continue to dashboard
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
