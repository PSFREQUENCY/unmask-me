import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Icosahedron, Octahedron, Float, Sparkles, Ring } from "@react-three/drei";
import * as THREE from "three";

type Mood = "calm" | "anchoring" | "regulated";

export function Crystal({ level = 1, mood = "calm" }: { level?: number; mood?: Mood }) {
  const core = useRef<THREE.Mesh>(null);
  const shardA = useRef<THREE.Group>(null);
  const shardB = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = t * 0.4;
      core.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    }
    if (shardA.current) shardA.current.rotation.y = -t * 0.6;
    if (shardB.current) shardB.current.rotation.y = t * 0.5;
    if (halo.current) halo.current.rotation.z = t * 0.5;
  });

  const tint = mood === "regulated" ? "#67e8f9" : mood === "anchoring" ? "#22d3ee" : "#06b6d4";

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
      <group>
        <Icosahedron ref={core} args={[0.95, 0]}>
          <meshPhysicalMaterial
            color={tint}
            transmission={0.85}
            thickness={0.6}
            roughness={0.05}
            ior={1.6}
            emissive={tint}
            emissiveIntensity={0.4}
            clearcoat={1}
          />
        </Icosahedron>

        <group ref={shardA}>
          <Octahedron args={[0.22, 0]} position={[1.3, 0.3, 0]}>
            <meshPhysicalMaterial color={tint} transmission={0.7} thickness={0.4} roughness={0.1} ior={1.5} emissive={tint} emissiveIntensity={0.5} />
          </Octahedron>
          <Octahedron args={[0.16, 0]} position={[-1.2, -0.4, 0.3]}>
            <meshPhysicalMaterial color="#a5f3fc" transmission={0.7} thickness={0.3} roughness={0.1} ior={1.5} emissive={tint} emissiveIntensity={0.6} />
          </Octahedron>
        </group>
        <group ref={shardB}>
          <Octahedron args={[0.18, 0]} position={[0.4, -1.2, 0.5]}>
            <meshPhysicalMaterial color={tint} transmission={0.7} thickness={0.3} roughness={0.1} ior={1.5} emissive={tint} emissiveIntensity={0.5} />
          </Octahedron>
          <Octahedron args={[0.14, 0]} position={[-0.5, 1.2, -0.3]}>
            <meshPhysicalMaterial color="#cffafe" transmission={0.7} thickness={0.3} roughness={0.1} ior={1.5} emissive={tint} emissiveIntensity={0.6} />
          </Octahedron>
        </group>

        {level >= 2 && <Sparkles count={32} scale={[3.5, 3.5, 3.5]} size={2.6} speed={0.45} color={tint} />}
        {level >= 3 && (
          <group>
            <Octahedron args={[0.1, 0]} position={[0, 1.6, 0]}>
              <meshStandardMaterial color="#cffafe" emissive={tint} emissiveIntensity={2.2} />
            </Octahedron>
            <Octahedron args={[0.1, 0]} position={[0, -1.6, 0]}>
              <meshStandardMaterial color="#cffafe" emissive={tint} emissiveIntensity={2.2} />
            </Octahedron>
          </group>
        )}
        {level >= 4 && (
          <Ring ref={halo} args={[1.8, 1.95, 64]} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 0, 0]}>
            <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={1.8} side={THREE.DoubleSide} />
          </Ring>
        )}
      </group>
    </Float>
  );
}
