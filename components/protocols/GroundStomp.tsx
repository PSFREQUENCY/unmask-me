/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ground stomp: voice cues "stomp your feet, feel the earth". Ground-impact
 * rings pulse on each stomp. Uses DeviceMotion when available; else autopulse.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProtocolShell } from "@/components/protocols/ProtocolShell";
import { speak, type KokoroVoice, type AmbientTrack } from "@/lib/voice";

interface Props {
  onComplete: () => void;
  voice: KokoroVoice;
  track: AmbientTrack;
}

const CUES = [
  { at: 0, text: "stomp your feet" },
  { at: 12, text: "feel the earth pushing back" },
  { at: 24, text: "you are here, you are heavy, you are home" },
];

export function GroundStomp({ onComplete, voice, track }: Props) {
  const [rings, setRings] = useState<number[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef(0);

  const fire = () => {
    const id = ++idRef.current;
    setRings((r) => [...r, id]);
    window.setTimeout(() => setRings((r) => r.filter((x) => x !== id)), 900);
  };

  useEffect(() => {
    const timers = CUES.map((c) =>
      window.setTimeout(() => speak(c.text, { voice }), c.at * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [voice]);

  useEffect(() => {
    const auto = window.setInterval(fire, 1200);
    const onMotion = (ev: DeviceMotionEvent) => {
      const a = ev.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = performance.now();
      if (mag > 18 && now - lastRef.current > 300) {
        lastRef.current = now;
        fire();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.clearInterval(auto);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, []);

  return (
    <ProtocolShell
      title="Ground Stomp"
      hint="weight into the floor. become heavy."
      durationSec={45}
      track={track}
      onComplete={onComplete}
    >
      <div className="relative w-[260px] h-[200px] flex items-end justify-center">
        <AnimatePresence>
          {rings.map((id) => (
            <motion.div
              key={id}
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute bottom-6 w-32 h-32 rounded-full border-2 border-amber-300/70"
            />
          ))}
        </AnimatePresence>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-400/30 rounded-full" />
        <div className="relative font-display text-3xl text-amber-200/90 uppercase tracking-widest mb-10">
          earth
        </div>
      </div>
    </ProtocolShell>
  );
}
