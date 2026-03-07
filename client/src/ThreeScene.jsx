// src/ThreeScene.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function SpinningBox(props) {
  const ref = useRef();
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  useFrame((_, delta) => {
    ref.current.rotation.x += delta;
    ref.current.rotation.y += delta * 0.7;
  });

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.4 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

export default function ThreeScene() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <SpinningBox position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
