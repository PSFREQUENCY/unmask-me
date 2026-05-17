import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Torus, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";
import { useStore, type CharmArchetype } from "@/lib/store";
import { Fox } from "@/components/charms/Fox";
import { Owl } from "@/components/charms/Owl";
import { Crystal } from "@/components/charms/Crystal";
import { Flame } from "@/components/charms/Flame";
import { Wave } from "@/components/charms/Wave";
import { Tree } from "@/components/charms/Tree";

type Mood = "calm" | "anchoring" | "regulated";

function Cocoon() {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringA.current) ringA.current.rotation.z = t * 0.4;
    if (ringB.current) ringB.current.rotation.z = -t * 0.3;
  });
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
      <group>
        <Torus ref={ringA} args={[1.1, 0.04, 16, 64]}>
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.7} />
        </Torus>
        <Torus ref={ringB} args={[1.3, 0.025, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.2} transparent opacity={0.55} />
        </Torus>
        <Sparkles count={36} scale={[3, 3, 3]} size={2} speed={0.25} color="#22d3ee" />
      </group>
    </Float>
  );
}

function CharmByArchetype({ archetype, level, mood }: { archetype: CharmArchetype; level: number; mood: Mood }) {
  switch (archetype) {
    case "fox": return <Fox level={level} mood={mood} />;
    case "owl": return <Owl level={level} mood={mood} />;
    case "crystal": return <Crystal level={level} mood={mood} />;
    case "flame": return <Flame level={level} mood={mood} />;
    case "wave": return <Wave level={level} mood={mood} />;
    case "tree": return <Tree level={level} mood={mood} />;
    default: return <Fox level={level} mood={mood} />;
  }
}

export function SpiritCharm3D({
  onInteract,
  isAnchoring = false,
  isRegulated = false,
}: {
  onInteract?: () => void;
  isAnchoring?: boolean;
  isRegulated?: boolean;
}) {
  const charm = useStore((s) => s.charm);
  const mood: Mood = isRegulated ? "regulated" : isAnchoring ? "anchoring" : "calm";
  const accent = charm?.primaryColor || "#22d3ee";

  return (
    <div
      className="w-full h-full relative"
      onClick={onInteract}
      role={onInteract ? "button" : undefined}
    >
      {!charm && (
        <div className="absolute bottom-2 left-0 right-0 z-10 text-center pointer-events-none">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Awaiting your first intake.
          </p>
        </div>
      )}
      <Canvas camera={{ position: [0, 0.4, 5.2], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 4]} intensity={1.1} />
        <directionalLight position={[-6, -3, -4]} intensity={0.4} color={accent} />
        <pointLight position={[0, 3, 2]} intensity={0.4} color={accent} />

        {charm ? (
          <CharmByArchetype archetype={charm.archetype} level={charm.level} mood={mood} />
        ) : (
          <Cocoon />
        )}

        <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={6} blur={2.5} far={4} color="#000" />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
