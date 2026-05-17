import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Float, Sparkles, Ring, MeshDistortMaterial, Torus } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Wave({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const blob = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (blob.current) {
      blob.current.rotation.y = t * 0.5;
      const s = 1 + Math.sin(t * 1.6) * 0.08;
      blob.current.scale.set(s, s * 0.95, s);
    }
    if (ringA.current) ringA.current.rotation.z = t * 0.6;
    if (halo.current) halo.current.rotation.z = -t * 0.5;
  });

  const water = mood === "regulated" ? "#60a5fa" : mood === "anchoring" ? "#3b82f6" : "#2563eb";
  const foam = "#bfdbfe";

  return (
    <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.7}>
      <group>
        <Sphere ref={blob} args={[1.05, 96, 96]}>
          <MeshDistortMaterial
            color={water}
            emissive={water}
            emissiveIntensity={0.5}
            distort={0.45}
            speed={2.2}
            roughness={0.15}
            metalness={0.1}
            transparent
            opacity={0.9}
          />
        </Sphere>

        <Torus ref={ringA} args={[1.25, 0.04, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color={foam} emissive={foam} emissiveIntensity={1.5} />
        </Torus>

        <Sphere args={[0.06, 16, 16]} position={[-0.25, 0.25, 0.95]}>
          <meshStandardMaterial color="#0f172a" />
        </Sphere>
        <Sphere args={[0.06, 16, 16]} position={[0.25, 0.25, 0.95]}>
          <meshStandardMaterial color="#0f172a" />
        </Sphere>
        <Sphere args={[0.025, 12, 12]} position={[-0.23, 0.29, 1.0]}>
          <meshBasicMaterial color="#fff" />
        </Sphere>
        <Sphere args={[0.025, 12, 12]} position={[0.27, 0.29, 1.0]}>
          <meshBasicMaterial color="#fff" />
        </Sphere>

        {level >= 2 && <Sparkles count={30} scale={[3.5, 3.5, 3.5]} size={2.4} speed={0.3} color={foam} />}
        {level >= 3 && (
          <group>
            <Torus args={[1.45, 0.025, 12, 48]} rotation={[Math.PI / 2.2, 0.2, 0]}>
              <meshStandardMaterial color={foam} emissive={water} emissiveIntensity={1.6} />
            </Torus>
            <Torus args={[1.55, 0.02, 12, 48]} rotation={[Math.PI / 2.4, -0.3, 0]}>
              <meshStandardMaterial color={foam} emissive={water} emissiveIntensity={1.4} />
            </Torus>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.7, 1.85, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 1.4, 0]}>
            <meshStandardMaterial color={water} emissive={water} emissiveIntensity={1.7} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
