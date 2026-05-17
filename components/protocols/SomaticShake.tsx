/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Somatic shake: a wobbling stick-figure with voice cues that move the user
 * through hands -> arms -> whole body. 60-second discharge.
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
  { at: 0, text: "shake your hands" },
  { at: 15, text: "now your arms" },
  { at: 30, text: "your whole body" },
  { at: 45, text: "stay loose, breathe" },
];

export function SomaticShake({ onComplete, voice, track }: Props) {
  useEffect(() => {
    const timers = CUES.map((c) =>
      window.setTimeout(() => speak(c.text, { voice }), c.at * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [voice]);

  return (
    <ProtocolShell
      title="Somatic Shake"
      hint="discharge stored charge through the body"
      durationSec={60}
      track={track}
      onComplete={onComplete}
    >
      <motion.svg
        width={180}
        height={220}
        viewBox="0 0 180 220"
        animate={{ x: [0, -6, 7, -5, 6, 0], rotate: [0, -2, 2, -1.5, 1.5, 0] }}
        transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
        className="drop-shadow-[0_0_25px_rgba(99,102,241,0.4)]"
      >
        <circle cx={90} cy={40} r={22} stroke="#a5b4fc" strokeWidth={3} fill="none" />
        <line x1={90} y1={62} x2={90} y2={140} stroke="#a5b4fc" strokeWidth={3} />
        <motion.line
          x1={90}
          y1={80}
          x2={40}
          y2={120}
          stroke="#a5b4fc"
          strokeWidth={3}
          animate={{ x2: [40, 60, 30, 50, 40] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        />
        <motion.line
          x1={90}
          y1={80}
          x2={140}
          y2={120}
          stroke="#a5b4fc"
          strokeWidth={3}
          animate={{ x2: [140, 120, 150, 130, 140] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        />
        <line x1={90} y1={140} x2={60} y2={210} stroke="#a5b4fc" strokeWidth={3} />
        <line x1={90} y1={140} x2={120} y2={210} stroke="#a5b4fc" strokeWidth={3} />
      </motion.svg>
    </ProtocolShell>
  );
}
