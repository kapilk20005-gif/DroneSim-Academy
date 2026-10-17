import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface Props {
  position: [number, number, number];
  speed: number;
  selected: boolean;
  onSelect: () => void;
}

export default function DroneModel({ position, speed, selected, onSelect }: Props) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.position.y = position[1] + Math.sin(t * speed) * 0.16;
    group.current.rotation.y = Math.sin(t * 0.28) * 0.16;
  });

  const arms: [number, number, number][] = [
    [-0.55, 0, -0.43], [0.55, 0, -0.43], [-0.55, 0, 0.43], [0.55, 0, 0.43],
  ];

  return (
    <group ref={group} position={position} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]}>
        <ringGeometry args={[0.72, 0.82, 40]} />
        <meshBasicMaterial color="#7ce8bd" side={2} />
      </mesh>}
      <mesh castShadow>
        <boxGeometry args={[0.58, 0.16, 0.38]} />
        <meshStandardMaterial color={selected ? "#74e4b4" : "#263749"} metalness={0.45} roughness={0.42} />
      </mesh>
      {arms.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh rotation={[0, 0, Math.atan2(z, x)]}>
            <boxGeometry args={[0.58, 0.055, 0.07]} />
            <meshStandardMaterial color="#8da1b4" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
            <meshStandardMaterial color="#1b2938" />
          </mesh>
          <mesh position={[0, 0.09, 0]} rotation={[0, 0.08, 0]}>
            <boxGeometry args={[0.36, 0.018, 0.035]} />
            <meshStandardMaterial color="#d1dce5" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.12, 0.04]}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial color="#73baff" emissive="#2469a8" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
