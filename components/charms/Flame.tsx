import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Torus, Sphere, Float, Sparkles, Ring, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Flame({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const core = useRef<THREE.Mesh>(null);
  const shellA = useRef<THREE.Mesh>(null);
  const shellB = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (core.current) core.current.rotation.y = t * 1.2;
    if (shellA.current) {
      shellA.current.rotation.y = -t * 0.8;
      shellA.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
    }
    if (shellB.current) {
      shellB.current.rotation.y = t * 0.5;
      shellB.current.scale.setScalar(1 + Math.sin(t * 2.2 + 1) * 0.07);
    }
    if (halo.current) halo.current.rotation.z = t * 0.7;
  });

  const hot = mood === "regulated" ? "#fb923c" : mood === "anchoring" ? "#f97316" : "#ef4444";
  const inner = "#fbbf24";

  return (
    <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.7}>
      <group>
        <Torus ref={core} args={[0.55, 0.22, 32, 64]}>
          <meshStandardMaterial color={inner} emissive={inner} emissiveIntensity={2} roughness={0.3} />
        </Torus>

        <Sphere ref={shellA} args={[1.05, 64, 64]} scale={[0.95, 1.2, 0.95]}>
          <MeshDistortMaterial
            color={hot}
            emissive={hot}
            emissiveIntensity={1.1}
            distort={0.55}
            speed={4}
            roughness={0.35}
            transparent
            opacity={0.65}
          />
        </Sphere>
        <Sphere ref={shellB} args={[1.3, 48, 48]} scale={[0.85, 1.35, 0.85]}>
          <MeshDistortMaterial
            color="#fde047"
            emissive={inner}
            emissiveIntensity={0.8}
            distort={0.7}
            speed={3}
            roughness={0.5}
            transparent
            opacity={0.28}
          />
        </Sphere>

        {level >= 2 && <Sparkles count={40} scale={[3.5, 4.5, 3.5]} size={3} speed={0.55} color={inner} />}
        {level >= 3 && (
          <group position={[0, 1.5, 0]}>
            <Sphere args={[0.08, 12, 12]} position={[0.6, 0, 0]}>
              <meshStandardMaterial color={inner} emissive={hot} emissiveIntensity={2.4} />
            </Sphere>
            <Sphere args={[0.08, 12, 12]} position={[-0.6, 0.2, 0]}>
              <meshStandardMaterial color={inner} emissive={hot} emissiveIntensity={2.4} />
            </Sphere>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.7, 1.85, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 1.7, 0]}>
            <meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={1.8} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
