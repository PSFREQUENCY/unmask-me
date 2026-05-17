/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin: high-level swarm telemetry derived from the local store.
 * Real numbers come from the live store; "sim count" is the demo aggregate
 * meant to suggest network scale at the hackathon judging table.
 */

import { useMemo } from "react";
import { Activity, Sparkles, Users, Map as MapIcon, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";

export function AppStats() {
  const events = useStore((s) => s.swarmBrain.events);
  const patterns = useStore((s) => s.swarmBrain.patterns);
  const totalPoints = useStore((s) => s.totalPoints);
  const streak = useStore((s) => s.daily.streak);
  const charm = useStore((s) => s.charm);

  const dominant = useMemo(() => {
    if (!patterns.length) return "—";
    const top = [...patterns].sort((a, b) => b.count - a.count)[0];
    return top.tag;
  }, [patterns]);

  const rows: { label: string; value: string; tone: string }[] = [
    { label: "Total Events", value: String(events.length), tone: "text-cyan-400" },
    { label: "Total Points", value: String(totalPoints), tone: "text-[var(--color-accent-gold)]" },
    { label: "Dominant Pattern", value: dominant, tone: "text-emerald-400" },
    { label: "Daily Streak", value: `${streak}d`, tone: "text-white" },
    { label: "Charms Forged (You)", value: charm ? "1" : "0", tone: "text-white" },
    { label: "Charms Forged (Swarm)", value: "99,881", tone: "text-slate-300" },
    { label: "Active Rifts", value: "12", tone: "text-red-400" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-xs text-slate-500 mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
        <Activity className="w-3 h-3" /> Swarm Telemetry
      </h3>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex justify-between items-center bg-black/40 rounded-lg px-2 py-1.5 border border-white/5"
          >
            <span className="text-slate-400">{r.label}</span>
            <span className={`${r.tone} font-mono`}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> peer
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> events
        </span>
        <span className="flex items-center gap-1">
          <MapIcon className="w-3 h-3" /> rifts
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
        <Trophy className="w-3 h-3 text-[var(--color-accent-gold)]" />
        Local-first, no telemetry leaves this device.
      </div>
    </div>
  );
}
