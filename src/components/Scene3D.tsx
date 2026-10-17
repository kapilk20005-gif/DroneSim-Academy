import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SimulatedTarget, Visibility } from "../types/simulation";
import DroneModel from "./DroneModel";

interface Props {
  targets: SimulatedTarget[];
  selectedId: string | null;
  night: boolean;
  urban: boolean;
  visibility: Visibility;
  onSelect: (id: string) => void;
}

function CameraControls() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 1, 0);
    return () => controls.dispose();
  }, [camera, gl]);
  return null;
}

function Terrain({ urban }: { urban: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90, 50, 50]} />
        <meshStandardMaterial color={urban ? "#414c55" : "#526b54"} roughness={1} />
      </mesh>
      {Array.from({ length: 25 }, (_, i) => {
        const x = ((i * 13) % 42) - 21;
        const z = ((i * 17) % 40) - 20;
        if (urban) {
          return <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 1.3 + (i % 4) * 0.35, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.1 + (i % 3) * 0.35, 2.6 + (i % 4) * 0.7, 2 + (i % 2) * 0.4]} />
              <meshStandardMaterial color={i % 3 === 0 ? "#677580" : "#56636e"} roughness={0.88} />
            </mesh>
            <mesh position={[0, 2.5 + (i % 4) * 0.35, 1.02]}>
              <boxGeometry args={[0.16, 0.18, 0.03]} />
              <meshBasicMaterial color="#d8b978" />
            </mesh>
          </group>;
        }
        return <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 1.1, 7]} />
            <meshStandardMaterial color="#5d4938" />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <coneGeometry args={[0.72 + (i % 3) * 0.08, 1.8, 7]} />
            <meshStandardMaterial color={i % 2 ? "#2d5c42" : "#3c6949"} roughness={1} />
          </mesh>
        </group>;
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[16.8, 17, 80]} />
        <meshBasicMaterial color="#9fb7b0" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function Scene3D({ targets, selectedId, night, urban, visibility, onSelect }: Props) {
  const fogColor = night ? "#0b1422" : urban ? "#aab8c1" : "#a9c6d0";
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [19, 15, 21], fov: 48 }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, visibility === "Clear" ? 38 : visibility === "Haze" ? 24 : 13, 72]} />
      <ambientLight intensity={night ? 0.38 : 1.15} />
      <directionalLight position={[12, 20, 8]} intensity={night ? 0.65 : 2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {night && <pointLight position={[-8, 8, 3]} intensity={16} distance={28} color="#8bb8ff" />}
      <Terrain urban={urban} />
      {targets.map((target) => <DroneModel key={target.id} position={[target.x, target.y, target.z]} speed={target.speed} selected={target.id === selectedId} onSelect={() => onSelect(target.id)} />)}
      <gridHelper args={[90, 45, "#a2b6bb", "#91a5aa"]} position={[0, 0.035, 0]} />
      <CameraControls />
    </Canvas>
  );
}
