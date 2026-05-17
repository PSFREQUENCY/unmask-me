/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Derives a 2D-positioned knowledge graph from swarmBrain state.
 *
 * Layout strategy: concentric rings around "self" at center.
 *   self      → (0.5, 0.5)
 *   pattern   → radius 0.25
 *   protocol  → radius 0.4
 *   insight   → radius 0.55
 *   voice     → radius 0.7
 * Angle = stable hash of label → deterministic between renders.
 *
 * Edge graph: every event connects to its parent pattern AND to "self".
 * Insights connect to the pattern(s) referenced in their headline/text.
 *
 * Capped at ~50 nodes by bucketing recent events per-kind.
 */

import type { SwarmEvent, SwarmBrainState } from "@/lib/store";

export type GraphNodeKind =
  | "self"
  | "protocol"
  | "pattern"
  | "insight"
  | "rift"
  | "voice";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  weight: number; // node size factor
  age: number; // 0..1, newer = brighter
  color: string;
  x: number; // 0..1 normalized
  y: number; // 0..1
}

export interface GraphEdge {
  from: string;
  to: string;
  strength: number; // 0..1 opacity/width
}

export interface DerivedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const COLORS: Record<GraphNodeKind, string> = {
  self: "#fde68a", // soft gold
  protocol: "#22d3ee", // cyan
  pattern: "#a855f7", // purple
  insight: "#34d399", // emerald
  rift: "#f97316", // orange
  voice: "#f472b6", // pink
};

const RADII: Record<Exclude<GraphNodeKind, "self">, number> = {
  pattern: 0.25,
  protocol: 0.4,
  insight: 0.55,
  rift: 0.45,
  voice: 0.7,
};

// Deterministic 32-bit hash → 0..1 float.
function hash01(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function polarToXY(radius: number, angle: number): { x: number; y: number } {
  // Center at (0.5, 0.5). y inverted is fine for SVG either way.
  return {
    x: 0.5 + radius * Math.cos(angle),
    y: 0.5 + radius * Math.sin(angle),
  };
}

function ageFactor(at: number, now: number): number {
  const hours = Math.max(0, (now - at) / 3600000);
  // 0h → 1, 24h → ~0.37, 72h → ~0.05
  return Math.max(0.05, Math.exp(-hours / 24));
}

function placeRing(label: string, kind: Exclude<GraphNodeKind, "self">) {
  const angle = hash01(label + kind) * Math.PI * 2;
  return polarToXY(RADII[kind], angle);
}

function buildSelfNode(): GraphNode {
  return {
    id: "self",
    label: "Self",
    kind: "self",
    weight: 2.4,
    age: 1,
    color: COLORS.self,
    x: 0.5,
    y: 0.5,
  };
}

function buildPatternNodes(
  patterns: SwarmBrainState["patterns"],
  now: number
): GraphNode[] {
  return patterns.map((p) => {
    const { x, y } = placeRing(p.tag, "pattern");
    return {
      id: `pattern:${p.tag}`,
      label: p.tag,
      kind: "pattern",
      weight: 1 + Math.sqrt(p.count) * 0.6,
      age: ageFactor(p.lastAt, now),
      color: COLORS.pattern,
      x,
      y,
    };
  });
}

type RingKind = Exclude<GraphNodeKind, "self">;

function eventKindToNodeKind(kind: SwarmEvent["kind"]): RingKind {
  if (kind === "anchor-rift") return "rift";
  if (kind === "protocol") return "protocol";
  return "protocol"; // intake / checkins / vei-log all live on protocol ring
}

function buildEventNodes(events: SwarmEvent[], now: number): GraphNode[] {
  // Bucket: keep the most recent ~28 events overall, dedupe by label+kind
  const seen = new Set<string>();
  const out: GraphNode[] = [];
  for (const ev of events.slice(0, 80)) {
    const nodeKind = eventKindToNodeKind(ev.kind);
    const key = `${nodeKind}:${ev.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { x, y } = placeRing(ev.label + ev.kind, nodeKind);
    const weight = 1 + 0.1 * ((ev.score || 50) / 10);
    out.push({
      id: `event:${ev.id}`,
      label: ev.label,
      kind: nodeKind,
      weight,
      age: ageFactor(ev.at, now),
      color: COLORS[nodeKind],
      x,
      y,
    });
    if (out.length >= 28) break;
  }
  return out;
}

function buildInsightNodes(
  insights: SwarmBrainState["insights"],
  now: number
): GraphNode[] {
  return insights.slice(0, 10).map((ins, i) => {
    const { x, y } = placeRing(ins.headline + i, "insight");
    return {
      id: `insight:${ins.at}`,
      label: ins.headline,
      kind: "insight",
      weight: 1.3,
      age: ageFactor(ins.at, now),
      color: COLORS.insight,
      x,
      y,
    };
  });
}

function buildEdges(
  events: SwarmEvent[],
  patternIds: Set<string>,
  insights: SwarmBrainState["insights"],
  eventNodeIds: Set<string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  // Pattern → self
  patternIds.forEach((pid) => {
    edges.push({ from: pid, to: "self", strength: 0.6 });
  });
  // Event node → its pattern AND self
  for (const ev of events.slice(0, 80)) {
    const id = `event:${ev.id}`;
    if (!eventNodeIds.has(id)) continue;
    const patternId = `pattern:${ev.kind}`;
    if (patternIds.has(patternId)) {
      edges.push({ from: id, to: patternId, strength: 0.35 });
    }
    edges.push({ from: id, to: "self", strength: 0.18 });
  }
  // Insight → patterns it references (substring match on headline + insight)
  for (const ins of insights.slice(0, 10)) {
    const id = `insight:${ins.at}`;
    const blob = (ins.headline + " " + ins.insight).toLowerCase();
    let linked = false;
    patternIds.forEach((pid) => {
      const tag = pid.slice("pattern:".length);
      if (blob.includes(tag.toLowerCase())) {
        edges.push({ from: id, to: pid, strength: 0.5 });
        linked = true;
      }
    });
    if (!linked) edges.push({ from: id, to: "self", strength: 0.3 });
  }
  return edges;
}

export function deriveGraph(
  events: SwarmEvent[],
  insights: SwarmBrainState["insights"],
  patterns: SwarmBrainState["patterns"]
): DerivedGraph {
  const now = Date.now();
  const self = buildSelfNode();
  const patternNodes = buildPatternNodes(patterns, now);
  const eventNodes = buildEventNodes(events, now);
  const insightNodes = buildInsightNodes(insights, now);

  // Cap at ~50: self + ring of others.
  const ringNodes = [...patternNodes, ...eventNodes, ...insightNodes].slice(
    0,
    49
  );
  const nodes = [self, ...ringNodes];

  const patternIds = new Set(patternNodes.map((p) => p.id));
  const eventNodeIds = new Set(eventNodes.map((e) => e.id));
  const edges = buildEdges(events, patternIds, insights, eventNodeIds);

  // Filter edges to nodes that actually exist post-cap.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const filtered = edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  return { nodes, edges: filtered };
}
