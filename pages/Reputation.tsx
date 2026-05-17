import { useEffect, useState } from "react";
import { Trophy, ShieldCheck, Hexagon, Sparkles, Brain, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, store } from "@/lib/store";
import { generateSwarmInsight } from "@/lib/gemma";

export function Reputation() {
  const totalPoints = useStore((s) => s.totalPoints);
  const events = useStore((s) => s.swarmBrain.events);
  const insights = useStore((s) => s.swarmBrain.insights);
  const patterns = useStore((s) => s.swarmBrain.patterns);
  const charm = useStore((s) => s.charm);
  const streak = useStore((s) => s.daily.streak);
  const [generating, setGenerating] = useState(false);

  const dominantPattern = [...patterns].sort((a, b) => b.count - a.count)[0];
  const peaceScore = Math.min(100, Math.round((totalPoints / 50) + (streak * 3) + (events.length * 0.5)));

  const generate = async () => {
    setGenerating(true);
    const insight = await generateSwarmInsight(
      events.map((e) => ({ action: `${e.kind}: ${e.label}`, score: e.score }))
    );
    store.addSwarmInsight(insight.headline, insight.insight);
    setGenerating(false);
  };

  useEffect(() => {
    if (events.length >= 3 && insights.length === 0 && !generating) {
      generate();
    }
  }, [events.length, insights.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = [
    { label: "Peace Points", value: totalPoints.toLocaleString(), icon: Trophy, color: "text-[var(--color-accent-gold)]" },
    { label: "Charm Level", value: charm ? `L${charm.level}` : "—", icon: Hexagon, color: "text-cyan-400" },
    { label: "Peace Score", value: `${peaceScore}`, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Daily Streak", value: `${streak}`, icon: Flame, color: "text-orange-400" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] p-6 pt-16 max-w-md mx-auto">
      <div className="w-full text-center mb-8">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-[var(--color-accent-gold)] drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
        <h1 className="font-display text-4xl text-[var(--color-accent-gold)] uppercase tracking-wider mb-2">Ledger</h1>
        <p className="font-mono text-[10px] text-cyan-300/70 tracking-widest uppercase">
          Verifiable reputation of peace
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-black/40 border-white/10 rounded-2xl backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{stat.label}</span>
                </div>
                <span className="font-display text-2xl font-bold tracking-tight text-white">{stat.value}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="w-full bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-3xl p-5 mb-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-purple-300 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" /> Adaptive Learning Insights
            </h2>
            <Button
              size="sm"
              onClick={generate}
              disabled={generating || events.length < 3}
              className="bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/40 font-mono text-[9px] uppercase h-7"
            >
              {generating ? "Listening..." : "Refresh"}
            </Button>
          </div>

          {events.length < 3 ? (
            <p className="text-xs text-slate-400 font-sans italic">
              The swarm needs three encounters with your nervous system before it can speak. Complete a V.A.I. protocol or log a reflection.
            </p>
          ) : (
            <>
              <AnimatePresence mode="wait">
                {insights.slice(0, 3).map((ins, i) => (
                  <motion.div
                    key={ins.at}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.1 }}
                    className="mb-3 pb-3 border-b border-white/5 last:border-b-0 last:mb-0 last:pb-0"
                  >
                    <p className="font-display text-base text-white mb-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                      {ins.headline}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ins.insight}</p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {dominantPattern && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-300 mb-1">Dominant resilience pattern</p>
                  <p className="text-[11px] text-white font-sans">
                    <span className="text-cyan-400 font-mono uppercase">{dominantPattern.tag}</span>
                    {" — "}
                    {dominantPattern.count} encounters logged.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full mb-6">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 mb-4 border-b border-white/10 pb-2">
          Recent on-chain activity
        </h2>
        <div className="space-y-2">
          {events.slice(0, 8).map((e) => (
            <div key={e.id} className="flex justify-between items-start p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-sans truncate">{e.label}</p>
                <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                  {new Date(e.at).toLocaleDateString()} · {e.kind}
                </p>
              </div>
              {e.score != null && (
                <span className="font-mono text-[11px] text-[var(--color-accent-gold)] ml-3 shrink-0">+{e.score}</span>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-xs text-slate-500 font-sans italic text-center py-6">
              No activity yet. Start with a V.A.I. somatic reset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
