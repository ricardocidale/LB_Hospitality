import { useState, useEffect, useRef, useCallback, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

function ThreeBackground({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let webgl = false;
    try {
      const testCanvas = document.createElement("canvas");
      webgl = !!(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
    } catch { /* no webgl */ }
    if (!webgl) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const cssVar = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    const primaryColor = cssVar ? new THREE.Color(cssVar) : new THREE.Color("#8A9A7B");

    const pointLight1 = new THREE.PointLight(primaryColor, 1, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x38bdf8, 0.5, 20);
    pointLight2.position.set(-5, -3, 3);
    scene.add(pointLight2);
    const pointLight3 = new THREE.PointLight(0xf97066, 0.3, 20);
    pointLight3.position.set(0, 3, -5);
    scene.add(pointLight3);

    const sphereGeo = new THREE.IcosahedronGeometry(1, 4);
    const spheres: THREE.Mesh[] = [];
    const sphereConfigs = [
      { pos: [0, 0, 0], color: primaryColor, speed: 1.5, scale: 1 },
      { pos: [-2.5, 1, -1], color: new THREE.Color(0x38bdf8), speed: 1, scale: 0.7 },
      { pos: [2.5, -0.5, -1], color: new THREE.Color(0xf97066), speed: 1.2, scale: 0.6 },
    ];
    for (const cfg of sphereConfigs) {
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.scale.setScalar(cfg.scale);
      mesh.userData = { speed: cfg.speed, baseY: cfg.pos[1] };
      scene.add(mesh);
      spheres.push(mesh);
    }

    const ringGeo = new THREE.TorusGeometry(1, 0.02, 16, 100);
    const rings: THREE.Mesh[] = [];
    const ringConfigs = [
      { radius: 2, color: primaryColor, speed: 1 },
      { radius: 3, color: new THREE.Color(0x38bdf8), speed: 0.7 },
      { radius: 3.8, color: new THREE.Color(0xf97066), speed: 0.5 },
    ];
    for (const cfg of ringConfigs) {
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.4,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.scale.setScalar(cfg.radius);
      mesh.userData = { speed: cfg.speed };
      scene.add(mesh);
      rings.push(mesh);
    }

    const particleGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 2.5 + Math.sin(i * 1.5) * 0.5;
      const colors = [primaryColor, new THREE.Color(0x38bdf8), new THREE.Color(0xf97066), new THREE.Color(0xffd700)];
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % 4],
        emissive: colors[i % 4],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(particleGeo, mat);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.4;
      const pz = Math.sin(angle) * r * 0.3;
      mesh.position.set(px, py, pz);
      mesh.userData = { baseY: py, baseX: px, angle, r };
      scene.add(mesh);
      particles.push(mesh);
    }

    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const r2 = 10 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r2 * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r2 * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      for (const s of spheres) {
        const sp = s.userData.speed as number;
        s.rotation.x = t * sp * 0.3;
        s.rotation.y = t * sp * 0.5;
        s.position.y = (s.userData.baseY as number) + Math.sin(t * sp) * 0.3;
      }

      for (const r of rings) {
        const sp = r.userData.speed as number;
        r.rotation.x = Math.PI / 2 + Math.sin(t * sp) * 0.2;
        r.rotation.z = t * sp * 0.3;
      }

      for (const p of particles) {
        const baseY = p.userData.baseY as number;
        const baseX = p.userData.baseX as number;
        p.position.y = baseY + Math.sin(t * 2 + baseX) * 0.3;
        p.scale.setScalar(0.8 + Math.sin(t * 3 + (p.userData.angle as number)) * 0.2);
      }

      stars.rotation.y = t * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      sphereGeo.dispose();
      ringGeo.dispose();
      particleGeo.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      for (const s of spheres) (s.material as THREE.Material).dispose();
      for (const r of rings) (r.material as THREE.Material).dispose();
      for (const p of particles) (p.material as THREE.Material).dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  return null;
}

interface ResearchRefreshOverlayProps {
  onComplete: () => void;
}

export function ResearchRefreshOverlay({ onComplete }: ResearchRefreshOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [currentProperty, setCurrentProperty] = useState("");
  const [phase, setPhase] = useState<"loading" | "researching" | "done">("loading");
  const [totalProperties, setTotalProperties] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const abortRef = useRef(false);
  const bgRef = useRef<HTMLDivElement>(null);

  const refreshResearch = useCallback(async () => {
    try {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (!res.ok) { onComplete(); return; }
      const props = await res.json();
      if (!props || props.length === 0) { onComplete(); return; }

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
        } catch { /* property research fetch optional */ }

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
        } catch { /* research generation stream optional */ }

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
        style={{ background: "#0a0f1e" }}
      >
        <div ref={bgRef} className="absolute inset-0">
          <ThreeBackground containerRef={bgRef} />
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
                <>Analyzing <span className="text-primary font-medium">{currentProperty}</span> ({completedCount}/{totalProperties})</>
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
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--primary), #38BDF8, var(--primary))" }}
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
