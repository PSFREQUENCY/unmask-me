import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cone, Cylinder, Float, Sparkles, Ring, Sphere } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Tree({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const crown = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (crown.current) {
      crown.current.rotation.z = Math.sin(t * 0.9) * 0.08;
      crown.current.rotation.x = Math.cos(t * 0.7) * 0.05;
    }
    if (halo.current) halo.current.rotation.z = t * 0.4;
  });

  const leaf = mood === "regulated" ? "#4ade80" : mood === "anchoring" ? "#22c55e" : "#16a34a";
  const leafDeep = "#166534";
  const bark = "#78350f";

  return (
    <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.3}>
      <group>
        <Cylinder args={[0.22, 0.32, 0.95, 16]} position={[0, -0.7, 0]}>
          <meshStandardMaterial color={bark} roughness={0.85} />
        </Cylinder>
        <Sphere args={[0.45, 24, 24]} position={[0, -1.25, 0]} scale={[1.3, 0.45, 1.3]}>
          <meshStandardMaterial color={bark} roughness={0.9} />
        </Sphere>

        <group ref={crown} position={[0, 0.45, 0]}>
          <Cone args={[1.0, 1.4, 24]} position={[0, 0, 0]}>
            <meshStandardMaterial color={leaf} roughness={0.7} />
          </Cone>
          <Cone args={[0.85, 1.2, 24]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color={leafDeep} roughness={0.7} />
          </Cone>
          <Cone args={[0.65, 1.0, 24]} position={[0, 1.0, 0]}>
            <meshStandardMaterial color={leaf} roughness={0.7} />
          </Cone>
          <Cone args={[0.45, 0.75, 24]} position={[0, 1.45, 0]}>
            <meshStandardMaterial color={leafDeep} roughness={0.7} />
          </Cone>

          <Sphere args={[0.07, 16, 16]} position={[-0.18, -0.05, 0.85]}>
            <meshStandardMaterial color="#0f172a" />
          </Sphere>
          <Sphere args={[0.07, 16, 16]} position={[0.18, -0.05, 0.85]}>
            <meshStandardMaterial color="#0f172a" />
          </Sphere>
        </group>

        {level >= 2 && <Sparkles count={26} scale={[3, 4, 3]} size={2.2} speed={0.2} color="#86efac" />}
        {level >= 3 && (
          <group position={[0, 1.7, 0]}>
            <Sphere args={[0.07, 12, 12]} position={[0.6, 0, 0]}>
              <meshStandardMaterial color="#bbf7d0" emissive={leaf} emissiveIntensity={2} />
            </Sphere>
            <Sphere args={[0.07, 12, 12]} position={[-0.6, 0.2, 0]}>
              <meshStandardMaterial color="#bbf7d0" emissive={leaf} emissiveIntensity={2} />
            </Sphere>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.65, 1.8, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 2.0, 0]}>
            <meshStandardMaterial color={leaf} emissive={leaf} emissiveIntensity={1.6} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
