/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Jaw release: open the mouth wide, stretch, sigh. SVG face with animated jaw drop.
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
  { at: 0, text: "open your mouth wide" },
  { at: 12, text: "stretch the jaw" },
  { at: 24, text: "sigh out loud" },
  { at: 36, text: "let the throat soften" },
];

export function JawRelease({ onComplete, voice, track }: Props) {
  useEffect(() => {
    const timers = CUES.map((c) =>
      window.setTimeout(() => speak(c.text, { voice }), c.at * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [voice]);

  return (
    <ProtocolShell
      title="Jaw Release"
      hint="unhinge the jaw. exhale audibly."
      durationSec={45}
      track={track}
      onComplete={onComplete}
    >
      <svg width={200} height={220} viewBox="0 0 200 220">
        <circle cx={100} cy={100} r={80} stroke="#a5b4fc" strokeWidth={3} fill="rgba(99,102,241,0.05)" />
        <circle cx={70} cy={85} r={5} fill="#a5b4fc" />
        <circle cx={130} cy={85} r={5} fill="#a5b4fc" />
        <motion.ellipse
          cx={100}
          cy={140}
          rx={26}
          animate={{ ry: [6, 36, 6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          stroke="#a5b4fc"
          strokeWidth={3}
          fill="rgba(15,23,42,0.8)"
        />
      </svg>
    </ProtocolShell>
  );
}
