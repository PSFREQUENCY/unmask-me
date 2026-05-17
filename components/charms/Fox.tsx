import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Cone, Float, Sparkles, Ring } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Fox({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 3) * 0.55;
    if (head.current) head.current.rotation.y = Math.sin(t * 1.2) * 0.25;
    if (halo.current) halo.current.rotation.z = t * 0.6;
  });

  const body = mood === "regulated" ? "#fbbf24" : mood === "anchoring" ? "#fb923c" : "#f97316";
  const ear = "#ea580c";
  const belly = "#fde68a";

  return (
    <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.55}>
      <group>
        <Sphere args={[1, 48, 48]} scale={[1.05, 0.95, 1.1]}>
          <meshStandardMaterial color={body} roughness={0.5} metalness={0.05} />
        </Sphere>
        <Sphere args={[0.55, 32, 32]} position={[0, 0.2, 0.6]} scale={[1, 0.95, 0.85]}>
          <meshStandardMaterial color={belly} roughness={0.6} />
        </Sphere>

        <group ref={head} position={[0, 0.7, 0.55]}>
          <Sphere args={[0.55, 40, 40]} scale={[1.05, 0.95, 1]}>
            <meshStandardMaterial color={body} roughness={0.5} />
          </Sphere>
          <Cone args={[0.18, 0.32, 24]} position={[-0.28, 0.5, -0.05]} rotation={[0, 0, 0.25]}>
            <meshStandardMaterial color={ear} roughness={0.6} />
          </Cone>
          <Cone args={[0.18, 0.32, 24]} position={[0.28, 0.5, -0.05]} rotation={[0, 0, -0.25]}>
            <meshStandardMaterial color={ear} roughness={0.6} />
          </Cone>
          <Sphere args={[0.07, 16, 16]} position={[-0.2, 0.05, 0.48]}>
            <meshStandardMaterial color="#0f172a" />
          </Sphere>
          <Sphere args={[0.07, 16, 16]} position={[0.2, 0.05, 0.48]}>
            <meshStandardMaterial color="#0f172a" />
          </Sphere>
          <Sphere args={[0.04, 12, 12]} position={[0, -0.18, 0.52]}>
            <meshStandardMaterial color="#1a1a1a" />
          </Sphere>
        </group>

        <group ref={tail} position={[0, 0.05, -0.95]}>
          <Cone args={[0.32, 1.1, 28]} position={[0, 0.3, -0.2]} rotation={[Math.PI / 2.3, 0, 0]}>
            <meshStandardMaterial color={body} roughness={0.55} />
          </Cone>
          <Sphere args={[0.18, 24, 24]} position={[0, 0.65, -0.55]}>
            <meshStandardMaterial color="#fef3c7" roughness={0.4} />
          </Sphere>
        </group>

        {level >= 2 && <Sparkles count={28} scale={[3, 3, 3]} size={2.4} speed={0.35} color="#fbbf24" />}
        {level >= 3 && (
          <group position={[0, 1.4, 0]}>
            <Sphere args={[0.07, 12, 12]} position={[0.7, 0, 0]}>
              <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={2} />
            </Sphere>
            <Sphere args={[0.07, 12, 12]} position={[-0.7, 0.2, 0]}>
              <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={2} />
            </Sphere>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.6, 1.75, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 1.6, 0]}>
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
