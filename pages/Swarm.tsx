/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Swarm Mind — interactive knowledge graph derived from the user's own
 * swarmBrain (events + patterns + insights). Replaces the prior random-dots
 * placeholder. Click a node to inspect; press "Grow the swarm" to ask Gemma
 * for a new synthesized insight, which animates a new emerald node into the
 * graph and lands in the "What it learned" rail below.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Cpu, Sparkles, Activity, X } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { generateSwarmInsight } from "@/lib/gemma";
import { deriveGraph, type GraphNode } from "@/lib/swarmGraph";
import { Button } from "@/components/ui/button";

const CANVAS_W = 400;
const CANVAS_H = 500; // 4:5 aspect

function formatRelative(at: number): string {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function NodeCircle({
  node,
  selected,
  onSelect,
}: {
  node: GraphNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const cx = node.x * CANVAS_W;
  const cy = node.y * CANVAS_H;
  const r = Math.max(4, Math.min(22, 4 + node.weight * 4));
  const glow = 0.35 + node.age * 0.65;
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.2, x: CANVAS_W / 2 - cx, y: CANVAS_H / 2 - cy }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14, duration: 0.6 }}
      style={{ cursor: "pointer" }}
      onClick={onSelect}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill={node.color}
        opacity={glow * 0.18}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={node.color}
        opacity={0.4 + node.age * 0.5}
        stroke={selected ? "#fff" : "transparent"}
        strokeWidth={selected ? 2 : 0}
      />
      {selected && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r + 4}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.7}
          strokeWidth={1.5}
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
}

function NodeDetails({
  node,
  onClose,
  insightText,
  count,
  lastAt,
}: {
  node: GraphNode;
  onClose: () => void;
  insightText?: string;
  count?: number;
  lastAt?: number;
}) {
  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="absolute top-3 right-3 bottom-3 w-[60%] max-w-[260px] bg-black/85 border border-white/15 rounded-2xl p-4 backdrop-blur-md z-30 overflow-y-auto"
    >
      <div className="flex justify-between items-start mb-3">
        <h3
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: node.color }}
        >
          {node.kind}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white"
          aria-label="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <h4 className="text-white font-bold text-sm mb-2 break-words">
        {node.label}
      </h4>
      <div className="space-y-1.5 mb-3">
        {typeof count === "number" && (
          <Row k="count" v={String(count)} />
        )}
        <Row k="brightness" v={`${Math.round(node.age * 100)}%`} />
        {typeof lastAt === "number" && (
          <Row k="last" v={formatRelative(lastAt)} />
        )}
      </div>
      {insightText && (
        <p className="text-[11px] text-emerald-200/90 font-sans italic leading-relaxed border-t border-white/10 pt-2">
          "{insightText}"
        </p>
      )}
    </motion.div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
      <span className="text-[8px] text-slate-500 uppercase tracking-widest">
        {k}
      </span>
      <span className="text-[10px] text-white font-mono">{v}</span>
    </div>
  );
}

function StatsStrip({
  nodes,
  edges,
  patterns,
  lastUpdate,
}: {
  nodes: number;
  edges: number;
  patterns: { tag: string; count: number }[];
  lastUpdate: number | null;
}) {
  const dominant =
    patterns.slice().sort((a, b) => b.count - a.count)[0]?.tag || "—";
  return (
    <div className="w-full grid grid-cols-4 gap-2 mb-3">
      <Stat label="nodes" value={String(nodes)} />
      <Stat label="edges" value={String(edges)} />
      <Stat label="pattern" value={dominant} />
      <Stat
        label="updated"
        value={lastUpdate ? formatRelative(lastUpdate) : "—"}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center">
      <div className="text-[8px] text-slate-500 uppercase tracking-widest">
        {label}
      </div>
      <div className="text-[11px] text-white font-mono truncate">{value}</div>
    </div>
  );
}

export function Swarm() {
  const swarmBrain = useStore((s) => s.swarmBrain);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [growing, setGrowing] = useState(false);

  const { nodes, edges } = useMemo(
    () => deriveGraph(swarmBrain.events, swarmBrain.insights, swarmBrain.patterns),
    [swarmBrain.events, swarmBrain.insights, swarmBrain.patterns]
  );

  const lastUpdate = useMemo(() => {
    const candidates = [
      swarmBrain.events[0]?.at,
      swarmBrain.insights[0]?.at,
    ].filter((v): v is number => typeof v === "number");
    return candidates.length ? Math.max(...candidates) : null;
  }, [swarmBrain.events, swarmBrain.insights]);

  const nodeById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const selectedNode = selectedId ? nodeById.get(selectedId) : null;

  async function growSwarm() {
    if (growing) return;
    setGrowing(true);
    try {
      const history = swarmBrain.events.slice(0, 12).map((e) => ({
        action: `${e.kind}:${e.label}`,
        score: e.score,
      }));
      const out = await generateSwarmInsight(history);
      store.addSwarmInsight(out.headline, out.insight);
    } finally {
      setGrowing(false);
    }
  }

  const isEmpty = swarmBrain.events.length === 0;

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative">
      <div className="w-full text-center mb-6 relative z-10">
        <Network className="w-10 h-10 mx-auto mb-3 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
        <h1 className="font-display text-4xl text-purple-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          Swarm Mind
        </h1>
        <p className="font-mono text-[10px] text-purple-300/70 tracking-widest uppercase">
          Your living knowledge graph
        </p>
      </div>

      <StatsStrip
        nodes={nodes.length}
        edges={edges.length}
        patterns={swarmBrain.patterns}
        lastUpdate={lastUpdate}
      />

      <div
        className="w-full relative bg-black/40 border border-purple-500/20 rounded-3xl overflow-hidden backdrop-blur-sm z-10 shadow-[inset_0_0_40px_rgba(168,85,247,0.1)]"
        style={{ aspectRatio: "4 / 5" }}
      >
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <Cpu className="w-8 h-8 text-purple-400/60 mb-3" />
            <p className="font-mono text-[11px] text-purple-300/80 tracking-widest uppercase mb-1">
              Swarm dormant
            </p>
            <p className="text-[11px] text-slate-400">
              Run a V.A.I. protocol to feed it.
            </p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 w-full h-full"
            >
              {edges.map((e, i) => {
                const a = nodeById.get(e.from);
                const b = nodeById.get(e.to);
                if (!a || !b) return null;
                return (
                  <line
                    key={`e-${i}`}
                    x1={a.x * CANVAS_W}
                    y1={a.y * CANVAS_H}
                    x2={b.x * CANVAS_W}
                    y2={b.y * CANVAS_H}
                    stroke="#a855f7"
                    strokeOpacity={0.12 + e.strength * 0.35}
                    strokeWidth={0.4 + e.strength * 1.4}
                  />
                );
              })}
              {nodes.map((n) => (
                <NodeCircle
                  key={n.id}
                  node={n}
                  selected={selectedId === n.id}
                  onSelect={() => setSelectedId(n.id)}
                />
              ))}
            </svg>
            <AnimatePresence>
              {selectedNode && (
                <NodeDetails
                  node={selectedNode}
                  onClose={() => setSelectedId(null)}
                  insightText={
                    selectedNode.kind === "insight"
                      ? swarmBrain.insights.find(
                          (i) => `insight:${i.at}` === selectedNode.id
                        )?.insight
                      : selectedNode.kind === "pattern"
                      ? `Repeated signal in ${selectedNode.label}.`
                      : undefined
                  }
                  count={
                    selectedNode.kind === "pattern"
                      ? swarmBrain.patterns.find(
                          (p) => `pattern:${p.tag}` === selectedNode.id
                        )?.count
                      : undefined
                  }
                  lastAt={
                    selectedNode.kind === "pattern"
                      ? swarmBrain.patterns.find(
                          (p) => `pattern:${p.tag}` === selectedNode.id
                        )?.lastAt
                      : selectedNode.kind === "insight"
                      ? swarmBrain.insights.find(
                          (i) => `insight:${i.at}` === selectedNode.id
                        )?.at
                      : undefined
                  }
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <Button
        onClick={growSwarm}
        disabled={growing || isEmpty}
        className="w-full mt-4 h-11 bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-300 border border-emerald-500/40 uppercase font-mono text-[11px] tracking-widest"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {growing ? "Synthesizing..." : "Grow the swarm"}
      </Button>

      <div className="w-full mt-6">
        <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-400" /> What it learned
        </h3>
        {swarmBrain.insights.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic px-1">
            No insights yet. Grow the swarm above.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {swarmBrain.insights.slice(0, 6).map((ins) => (
              <motion.div
                key={ins.at}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-[220px] max-w-[240px] snap-start bg-white/5 border border-emerald-500/20 rounded-xl p-3"
              >
                <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mb-1">
                  {formatRelative(ins.at)}
                </div>
                <div className="text-[11px] text-white font-bold mb-1.5 leading-snug">
                  {ins.headline}
                </div>
                <p className="text-[10px] text-slate-300 italic leading-relaxed">
                  {ins.insight}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
