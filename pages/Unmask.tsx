/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unmask page — real progression.
 * Pulls level/xp from the store, renders an ascension ladder (4 tiers),
 * shows active goals from store.daily.goals, replays the most recent
 * 5 swarm-brain events as an Authenticity Log, and lets the user etch
 * a self-reflection that is scored by Gemma and written back.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  VenetianMask,
  Sparkles,
  TrendingUp,
  Shield,
  Trophy,
  Target,
  Plus,
  ChevronDown,
  Feather,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { store, useStore } from "@/lib/store";
import { analyzeVEILog } from "@/lib/gemma";

const LADDER: { level: number; name: string; blurb: string }[] = [
  { level: 1, name: "Surface", blurb: "Mask intact. Conditioned responses on autopilot." },
  { level: 2, name: "Cracking", blurb: "Awareness emerges. Old patterns become visible." },
  { level: 3, name: "Peeling", blurb: "Defenses soften. Authentic signal grows louder." },
  { level: 4, name: "Ascended", blurb: "Mask dissolved. Presence is the default state." },
];

function relativeTime(at: number): string {
  const min = Math.floor((Date.now() - at) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function MaskVisual({ level }: { level: number }) {
  return (
    <motion.div
      className="relative w-48 h-64 flex items-center justify-center mb-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="absolute w-24 h-32 bg-amber-400/80 rounded-full blur-xl mix-blend-screen"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {[1, 2, 3].map((layer) => (
        <motion.div
          key={layer}
          className={`absolute inset-0 border-2 rounded-[4rem] flex items-center justify-center backdrop-blur-sm ${
            level > layer
              ? "border-dashed border-white/10"
              : "border-cyan-500/50 bg-black/40 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          }`}
          animate={
            level > layer
              ? { scale: 1.5, opacity: 0, rotate: layer * 15 }
              : { scale: 1, opacity: 1, rotate: 0 }
          }
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ padding: `${layer * 10}px` }}
        >
          {level <= layer && <Shield className="w-12 h-12 text-cyan-500/30" />}
        </motion.div>
      ))}
      <VenetianMask className="w-20 h-20 text-[var(--color-accent-gold)] z-20 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
    </motion.div>
  );
}

function Ladder({ level }: { level: number }) {
  return (
    <div className="w-full space-y-2 mb-6">
      <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
        <Trophy className="w-3 h-3 text-[var(--color-accent-gold)]" /> Ascension Ladder
      </h3>
      {LADDER.map((tier) => {
        const reached = level >= tier.level;
        const current = level === tier.level;
        return (
          <div
            key={tier.level}
            className={`rounded-xl px-3 py-2 border flex items-start gap-3 ${
              current
                ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10"
                : reached
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-white/10 bg-white/5"
            }`}
          >
            <div
              className={`text-[10px] font-mono shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                reached ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-700/40 text-slate-400"
              }`}
            >
              {tier.level}
            </div>
            <div className="flex-1">
              <p
                className={`text-xs font-bold ${
                  current ? "text-[var(--color-accent-gold)]" : reached ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                {tier.name}
              </p>
              <p className="text-[10px] text-slate-500 leading-snug">{tier.blurb}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GoalCard({
  title,
  current,
  target,
  xp,
}: {
  title: string;
  current: number;
  target: number;
  xp: number;
}) {
  const pct = target > 0 ? (current / target) * 100 : 0;
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
      <div
        className="absolute left-0 bottom-0 top-0 bg-white/5 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
      <div className="relative z-10 flex justify-between items-start mb-2">
        <h4 className="text-sm text-white font-bold tracking-wide">{title}</h4>
        <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase flex items-center gap-1">
          <Plus className="w-3 h-3" /> {xp} XP
        </span>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex-1">
          <Progress value={pct} className="h-1.5 bg-black/40" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {current} / {target}
        </span>
      </div>
    </div>
  );
}

function LogEntry({
  label,
  at,
  insight,
  score,
}: {
  label: string;
  at: number;
  insight?: string;
  score?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/40 transition-colors"
    >
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shrink-0">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-white font-sans">{label}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase">{relativeTime(at)}</span>
            {typeof score === "number" && (
              <span className="text-[9px] font-mono text-[var(--color-accent-gold)]">
                {Math.round(score)}
              </span>
            )}
          </div>
          {open && insight && (
            <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">{insight}</p>
          )}
          {insight && (
            <ChevronDown
              className={`w-3 h-3 text-slate-500 mt-1 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>
    </button>
  );
}

function EtchModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  result,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  result: { score: number; feedback: string; pointsAwarded: number } | null;
}) {
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border border-cyan-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-lg flex items-center gap-2">
            <Feather className="w-4 h-4 text-cyan-400" /> Etch a Reflection
          </DialogTitle>
        </DialogHeader>
        {!result && (
          <>
            <Textarea
              placeholder="What did you notice in your body today? What did you stop hiding?"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-black/60 border-white/10 text-white text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="text-xs flex-1">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button
                onClick={() => onSubmit(text)}
                disabled={!text.trim() || isLoading}
                className="text-xs flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black"
              >
                {isLoading ? "Analyzing..." : "Submit"}
              </Button>
            </div>
          </>
        )}
        {result && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 italic leading-relaxed">{result.feedback}</p>
            <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Score</span>
              <span className="text-lg font-mono text-[var(--color-accent-gold)]">
                {Math.round(result.score)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-mono uppercase">XP Awarded</span>
              <span className="text-lg font-mono text-emerald-400">+{result.pointsAwarded}</span>
            </div>
            <Button
              onClick={onClose}
              className="w-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Unmask() {
  const charm = useStore((s) => s.charm);
  const goals = useStore((s) => s.daily.goals);
  const events = useStore((s) => s.swarmBrain.events);

  const [etchOpen, setEtchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { score: number; feedback: string; pointsAwarded: number } | null
  >(null);

  const level = charm?.level ?? 1;
  const xp = charm?.xp ?? 0;
  const xpTarget = level * 250;
  const xpPct = xpTarget > 0 ? Math.min(100, (xp / xpTarget) * 100) : 0;
  const recent = useMemo(() => events.slice(0, 5), [events]);

  const submitReflection = async (text: string) => {
    setLoading(true);
    try {
      const out = await analyzeVEILog(text, "Self-Reflection");
      store.awardPoints(out.pointsAwarded, "calm");
      store.logSwarmEvent({
        kind: "vei-log",
        label: "Self-reflection etched",
        score: out.score,
        insight: out.swarmInsight,
      });
      if (charm) store.levelUpCharm(out.pointsAwarded);
      setResult({ score: out.score, feedback: out.feedback, pointsAwarded: out.pointsAwarded });
    } finally {
      setLoading(false);
    }
  };

  const closeEtch = () => {
    setEtchOpen(false);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative overflow-hidden pb-24">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full text-center mb-8 relative z-10">
        <VenetianMask className="w-10 h-10 mx-auto mb-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
        <h1 className="font-display text-4xl text-cyan-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          Unmask
        </h1>
        <p className="font-mono text-[10px] text-cyan-300/70 tracking-widest uppercase">
          Journey to True Authenticity
        </p>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center mb-8 z-10 relative">
        <MaskVisual level={level} />

        <div className="w-full bg-black/60 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-mono text-xs text-white uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3 text-[var(--color-accent-gold)]" />
                {LADDER[Math.max(0, Math.min(level - 1, LADDER.length - 1))].name}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                Mask Layer {level} of {LADDER.length}
              </p>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[10px] text-[var(--color-accent-gold)]">
                {Math.round(level * 25)}% Unmasked
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {xp} / {xpTarget} XP
              </span>
            </div>
          </div>
          <Progress value={xpPct} className="h-2 bg-white/10 mb-6" />

          <Button
            onClick={() => setEtchOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase font-mono text-xs font-bold tracking-widest rounded-xl transition-all"
          >
            <Feather className="w-4 h-4 mr-2" /> Etch a Reflection
          </Button>
        </div>
      </div>

      <Ladder level={level} />

      <div className="w-full space-y-4 z-10 relative mb-8">
        <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          <Target className="w-3 h-3" /> Active Goals
        </h3>
        {goals.map((g) => (
          <GoalCard key={g.id} title={g.title} current={g.current} target={g.target} xp={g.xp} />
        ))}
      </div>

      <div className="w-full space-y-3 z-10 relative">
        <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
          <TrendingUp className="w-3 h-3" /> Authenticity Log
        </h3>
        <AnimatePresence>
          {recent.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-400 italic">
                No entries yet. Etch your first reflection above.
              </p>
            </div>
          )}
          {recent.map((ev) => (
            <LogEntry
              key={ev.id}
              label={ev.label}
              at={ev.at}
              insight={ev.insight}
              score={ev.score}
            />
          ))}
        </AnimatePresence>
      </div>

      <EtchModal
        open={etchOpen}
        onClose={closeEtch}
        onSubmit={submitReflection}
        isLoading={loading}
        result={result}
      />
    </div>
  );
}
