/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Soul Connect — demo personas resonating in real-time (state-driven).
 * The "Send Pulse" button now writes a real anchor-rift event into swarmBrain
 * and awards points. Personas are seeded by intake.completedAt so they stay
 * stable across renders; every 8–15s one persona's current protocol shifts.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, HeartPulse, Send, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, store } from "@/lib/store";
import { PROTOCOLS } from "@/lib/protocols";

const PERSONA_NAMES = [
  "Oracle_99",
  "ZenPulse",
  "Echo_Breathe",
  "VoidWatcher",
  "Cinder_Bloom",
  "Halo_Drift",
  "Nyx_Echo",
  "Solace_7",
];

const LEVELS = ["Regulated", "Harmonious", "Ascended"] as const;
const INTENTIONS = [
  "Releasing anxiety",
  "Deep embodiment",
  "Grounding",
  "Anchoring presence",
  "Soft jaw, soft heart",
  "Returning to breath",
  "Dropping the mask",
  "Holding the still point",
];

interface Persona {
  id: string;
  name: string;
  level: (typeof LEVELS)[number];
  distance: string;
  intention: string;
  protocol: string;
}

// Mulberry32: deterministic PRNG seeded by intake completion timestamp.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seedPersonas(seed: number, count: number): Persona[] {
  const rng = makeRng(seed || 424242);
  const names = [...PERSONA_NAMES].sort(() => rng() - 0.5).slice(0, count);
  return names.map((name, i) => ({
    id: `p-${i}-${name}`,
    name,
    level: pick(rng, LEVELS),
    distance: `${(0.2 + rng() * 6.4).toFixed(1)} km`,
    intention: pick(rng, INTENTIONS),
    protocol: pick(rng, PROTOCOLS).name,
  }));
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500/95 text-black font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-full z-50 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
    >
      {message}
    </motion.div>
  );
}

function PulseBurst({ at }: { at: number }) {
  return (
    <motion.div
      key={at}
      initial={{ scale: 0, opacity: 0.7 }}
      animate={{ scale: 6, opacity: 0 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-emerald-400/40 pointer-events-none"
    />
  );
}

function PersonaCard({
  persona,
  pulseAt,
  onUplift,
}: {
  persona: Persona;
  pulseAt: number | null;
  onUplift: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden"
    >
      <AnimatePresence>
        {pulseAt && (
          <motion.div
            key={pulseAt}
            initial={{ opacity: 0.6, scale: 0.3 }}
            animate={{ opacity: 0, scale: 2.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-pink-400/60 pointer-events-none"
          />
        )}
      </AnimatePresence>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-white font-bold">{persona.name}</h4>
          <p className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase tracking-wider">
            {persona.level}
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-1 rounded-lg">
          {persona.distance}
        </span>
      </div>
      <p className="text-xs text-slate-300 font-sans italic mb-2">
        "{persona.intention}"
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono text-cyan-300/90 tracking-wider">
          Currently: {persona.protocol}
        </span>
      </div>
      <Button
        onClick={onUplift}
        size="sm"
        className="w-full bg-white/10 hover:bg-pink-500/30 text-pink-300 font-mono text-[10px] uppercase tracking-widest"
      >
        <Send className="w-3 h-3 mr-1" /> Uplift
      </Button>
    </motion.div>
  );
}

export function Connect() {
  const completedAt = useStore((s) => s.intake.completedAt) ?? 0;
  const personasSeed = useMemo(
    () => seedPersonas(completedAt, 6),
    [completedAt]
  );
  const [personas, setPersonas] = useState<Persona[]>(personasSeed);
  useEffect(() => {
    setPersonas(personasSeed);
  }, [personasSeed]);

  const [toast, setToast] = useState<string | null>(null);
  const [pulseBurstAt, setPulseBurstAt] = useState<number | null>(null);
  const [cardPulses, setCardPulses] = useState<Record<string, number>>({});
  const tickRef = useRef<number | null>(null);

  // Live "now" feel: every 8–15s shuffle one persona's current protocol.
  useEffect(() => {
    function scheduleNext() {
      const delay = 8000 + Math.random() * 7000;
      tickRef.current = window.setTimeout(() => {
        setPersonas((prev) => {
          if (prev.length === 0) return prev;
          const i = Math.floor(Math.random() * prev.length);
          const next = [...prev];
          const newProto =
            PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)].name;
          next[i] = { ...next[i], protocol: newProto };
          return next;
        });
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
  }, []);

  function sendPulse() {
    store.logSwarmEvent({
      kind: "anchor-rift",
      label: "Global pulse",
      score: 25,
    });
    store.awardPoints(25);
    setPulseBurstAt(Date.now());
    setToast("Pulse transmitted");
    window.setTimeout(() => setToast(null), 1800);
  }

  function uplift(p: Persona) {
    store.awardPoints(10);
    setCardPulses((m) => ({ ...m, [p.id]: Date.now() }));
    setToast(`Uplift sent to ${p.name}`);
    window.setTimeout(() => setToast(null), 1400);
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative">
      <div className="w-full text-center mb-8">
        <Users className="w-10 h-10 mx-auto mb-3 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
        <h1 className="font-display text-4xl text-emerald-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
          Soul Connect
        </h1>
        <p className="font-mono text-[10px] text-emerald-300/70 tracking-widest uppercase">
          Find your frequency
        </p>
      </div>

      <div className="w-full bg-black/40 border border-emerald-500/30 rounded-2xl p-6 mb-8 backdrop-blur-md relative">
        <h2 className="text-white font-mono uppercase text-xs tracking-widest mb-4 flex items-center justify-between">
          <span>Global Signal</span>
          <span className="flex items-center gap-1 text-[10px] text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            14,241 online
          </span>
        </h2>
        <div className="relative">
          <AnimatePresence>
            {pulseBurstAt && <PulseBurst at={pulseBurstAt} />}
          </AnimatePresence>
          <Button
            onClick={sendPulse}
            className="w-full h-12 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black border border-emerald-500/50 uppercase font-mono text-xs tracking-widest transition-all"
          >
            <HeartPulse className="w-4 h-4 mr-2" /> Send pulse to swarm
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4">
        <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Resonant souls
        </h3>
        {personas.map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            pulseAt={cardPulses[p.id] ?? null}
            onUplift={() => uplift(p)}
          />
        ))}
      </div>

      <div className="w-full mt-6 flex items-center gap-2 text-[10px] text-slate-500 leading-relaxed px-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
        <span>
          Demo personas. No real users tracked. Connect to a friend coming soon.
        </span>
      </div>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
