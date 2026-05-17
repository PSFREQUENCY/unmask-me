/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared chrome around every protocol step: ambient track lifecycle,
 * countdown timer, skip button, progress label. Children render the
 * unique animation/visual for the protocol.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SkipForward } from "lucide-react";
import { startAmbient, stopAmbient, type AmbientTrack } from "@/lib/voice";

interface ProtocolShellProps {
  title: string;
  hint: string;
  durationSec: number;
  track: AmbientTrack;
  onComplete: () => void;
  children: React.ReactNode;
}

export function ProtocolShell({
  title,
  hint,
  durationSec,
  track,
  onComplete,
  children,
}: ProtocolShellProps) {
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    startAmbient(track);
    return () => {
      stopAmbient();
    };
  }, [track]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (completedRef.current) return;
    if (elapsed >= durationSec) {
      completedRef.current = true;
      onComplete();
    }
  }, [elapsed, durationSec, onComplete]);

  const remaining = Math.max(0, durationSec - elapsed);
  const pct = Math.min(100, (elapsed / durationSec) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black/40 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-xl text-indigo-300 uppercase tracking-widest">
            {title}
          </h3>
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
            {hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (completedRef.current) return;
            completedRef.current = true;
            onComplete();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-slate-300 hover:bg-white/10 transition-colors"
        >
          <SkipForward className="w-3 h-3" /> skip
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[260px] py-4">
        {children}
      </div>

      <div className="mt-4">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-slate-400">
          <span>{elapsed}s</span>
          <span>{remaining}s left</span>
        </div>
      </div>
    </motion.div>
  );
}
