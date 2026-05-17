/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 4-count box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.
 * Expanding/contracting circle synced to the phase. Voice speaks the phase name.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ProtocolShell } from "@/components/protocols/ProtocolShell";
import { speak, type KokoroVoice, type AmbientTrack } from "@/lib/voice";

interface Props {
  onComplete: () => void;
  voice: KokoroVoice;
  track: AmbientTrack;
}

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

const PHASES: { phase: Phase; label: string; cue: string }[] = [
  { phase: "inhale", label: "Inhale", cue: "inhale" },
  { phase: "hold-in", label: "Hold", cue: "hold" },
  { phase: "exhale", label: "Exhale", cue: "exhale" },
  { phase: "hold-out", label: "Hold", cue: "hold" },
];

export function BoxBreathe({ onComplete, voice, track }: Props) {
  const [idx, setIdx] = useState(0);
  const current = PHASES[idx];

  useEffect(() => {
    speak(current.cue, { voice });
    const id = window.setTimeout(() => {
      setIdx((i) => (i + 1) % PHASES.length);
    }, 4000);
    return () => window.clearTimeout(id);
  }, [idx, voice, current.cue]);

  const isExpanded = current.phase === "inhale" || current.phase === "hold-in";

  return (
    <ProtocolShell
      title="Box Breathing"
      hint="four counts in. four hold. four out. four hold."
      durationSec={80}
      track={track}
      onComplete={onComplete}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{ scale: isExpanded ? 1.4 : 0.7 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="w-40 h-40 rounded-full border-2 border-indigo-400/70 shadow-[0_0_50px_rgba(99,102,241,0.5)] bg-indigo-500/10 flex items-center justify-center"
        >
          <span className="font-display text-2xl text-indigo-200 uppercase tracking-widest">
            {current.label}
          </span>
        </motion.div>
      </div>
    </ProtocolShell>
  );
}
