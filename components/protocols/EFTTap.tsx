/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EFT collarbone tapping with a body silhouette and pulsing tap points.
 * Voice cycles the safety phrases.
 */

import { useEffect } from "react";
import { motion } from "motion/react";
import { ProtocolShell } from "@/components/protocols/ProtocolShell";
import { speak, type KokoroVoice, type AmbientTrack } from "@/lib/voice";

interface Props {
  onComplete: () => void;
  voice: KokoroVoice;
  track: AmbientTrack;
}

const CUES = [
  { at: 0, text: "tap your collarbone, slow and steady" },
  { at: 10, text: "I am safe" },
  { at: 20, text: "I am here" },
  { at: 32, text: "I am held" },
];

export function EFTTap({ onComplete, voice, track }: Props) {
  useEffect(() => {
    const timers = CUES.map((c) =>
      window.setTimeout(() => speak(c.text, { voice }), c.at * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [voice]);

  return (
    <ProtocolShell
      title="EFT Tapping"
      hint="collarbone tap. anchor the truth."
      durationSec={45}
      track={track}
      onComplete={onComplete}
    >
      <svg width={200} height={240} viewBox="0 0 200 240">
        <circle cx={100} cy={50} r={28} stroke="#a5b4fc" strokeWidth={3} fill="none" />
        <path
          d="M55 90 Q100 80 145 90 L155 200 L45 200 Z"
          stroke="#a5b4fc"
          strokeWidth={3}
          fill="rgba(99,102,241,0.05)"
        />
        {[
          { cx: 78, cy: 95 },
          { cx: 122, cy: 95 },
        ].map((p, i) => (
          <motion.circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={8}
            fill="#22d3ee"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.4 }}
            style={{ transformOrigin: `${p.cx}px ${p.cy}px` }}
          />
        ))}
      </svg>
    </ProtocolShell>
  );
}
