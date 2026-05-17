import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Float, Sparkles, Ring, Cone } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Owl({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const blink = Math.max(0.001, Math.sin(t * 0.9) > 0.96 ? 0.02 : 1);
    if (lidL.current) lidL.current.scale.y = blink;
    if (lidR.current) lidR.current.scale.y = blink;
    if (body.current) body.current.rotation.z = Math.sin(t * 0.8) * 0.08;
    if (halo.current) halo.current.rotation.z = t * 0.4;
  });

  const plume = mood === "regulated" ? "#8b5cf6" : mood === "anchoring" ? "#7c3aed" : "#6d28d9";
  const chest = "#c4b5fd";

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={body}>
        <Sphere args={[1.1, 48, 48]} scale={[1.05, 1.2, 1]}>
          <meshStandardMaterial color={plume} roughness={0.55} metalness={0.05} />
        </Sphere>
        <Sphere args={[0.7, 32, 32]} position={[0, -0.1, 0.55]} scale={[1, 1.15, 0.6]}>
          <meshStandardMaterial color={chest} roughness={0.5} />
        </Sphere>

        <Sphere args={[0.4, 32, 32]} position={[-0.38, 0.55, 0.55]} scale={[1, 1, 0.7]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.4, 32, 32]} position={[0.38, 0.55, 0.55]} scale={[1, 1, 0.7]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.2, 24, 24]} position={[-0.38, 0.55, 0.78]}>
          <meshStandardMaterial color="#0f172a" />
        </Sphere>
        <Sphere args={[0.2, 24, 24]} position={[0.38, 0.55, 0.78]}>
          <meshStandardMaterial color="#0f172a" />
        </Sphere>
        <Sphere ref={lidL} args={[0.42, 24, 24]} position={[-0.38, 0.55, 0.62]} scale={[1, 1, 0.7]}>
          <meshStandardMaterial color={plume} />
        </Sphere>
        <Sphere ref={lidR} args={[0.42, 24, 24]} position={[0.38, 0.55, 0.62]} scale={[1, 1, 0.7]}>
          <meshStandardMaterial color={plume} />
        </Sphere>

        <Cone args={[0.1, 0.22, 16]} position={[0, 0.3, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#fbbf24" />
        </Cone>

        <Cone args={[0.12, 0.4, 16]} position={[-0.45, 1.1, 0]} rotation={[0, 0, 0.35]}>
          <meshStandardMaterial color={plume} />
        </Cone>
        <Cone args={[0.12, 0.4, 16]} position={[0.45, 1.1, 0]} rotation={[0, 0, -0.35]}>
          <meshStandardMaterial color={plume} />
        </Cone>

        {level >= 2 && <Sparkles count={24} scale={[3, 3.5, 3]} size={2.2} speed={0.25} color="#a78bfa" />}
        {level >= 3 && (
          <group position={[0, 1.6, 0]}>
            <Sphere args={[0.06, 12, 12]} position={[0.5, 0, 0]}>
              <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={2} />
            </Sphere>
            <Sphere args={[0.06, 12, 12]} position={[-0.5, 0.1, 0]}>
              <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={2} />
            </Sphere>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.7, 1.85, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 1.8, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.6} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
