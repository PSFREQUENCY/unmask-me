/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin: live walkthrough of every Gemma 4 call. Each cell runs one
 * function from lib/gemma.ts, shows prompt preview, response JSON,
 * latency, and the active routing path. Mirrors the Kaggle notebook
 * cell-by-cell so a viewer can record the demo.
 */

import { useEffect, useMemo, useState } from "react";
import { Play, Layers, Terminal, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyzeIntakeArchetype,
  analyzeVEILog,
  analyzeSomaticShift,
  analyzeFaceCheckin,
  generateSwarmInsight,
  subscribeGemmaState,
  type GemmaMode,
} from "@/lib/gemma";

type RunStatus = "idle" | "running" | "success" | "error";

interface CellSpec {
  id: string;
  label: string;
  promptPreview: string;
  run: () => Promise<unknown>;
}

interface CellState {
  status: RunStatus;
  result: unknown;
  error: string | null;
  ms: number;
}

const PIXEL_PRE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";
const PIXEL_POST =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";

const CELLS: CellSpec[] = [
  {
    id: "intake",
    label: "analyzeIntakeArchetype",
    promptPreview:
      'Three answers → pick a spirit-charm archetype.\n' +
      '  1. "clear my head before a meeting"\n' +
      '  2. "old grief that won\'t move"\n' +
      '  3. "throat — like I\'m bracing"',
    run: () =>
      analyzeIntakeArchetype([
        "clear my head before a meeting",
        "old grief that won't move",
        "throat — like I'm bracing",
      ]),
  },
  {
    id: "vei",
    label: "analyzeVEILog",
    promptPreview:
      'Type: Self-Reflection\nText: "I noticed my jaw clenching every time the project lead messaged. I let it relax three times today."',
    run: () =>
      analyzeVEILog(
        "I noticed my jaw clenching every time the project lead messaged. I let it relax three times today.",
        "Self-Reflection"
      ),
  },
  {
    id: "somatic",
    label: "analyzeSomaticShift",
    promptPreview: 'Protocol: "vagus-hum"\nPRE: 1×1 px PNG\nPOST: 1×1 px PNG',
    run: () => analyzeSomaticShift(PIXEL_PRE, PIXEL_POST, "vagus-hum"),
  },
  {
    id: "face",
    label: "analyzeFaceCheckin",
    promptPreview: 'Time: morning\nFrame: 1×1 px PNG',
    run: () => analyzeFaceCheckin(PIXEL_PRE, "morning"),
  },
  {
    id: "insight",
    label: "generateSwarmInsight",
    promptPreview:
      "Recent actions:\n  vagus-hum (82)\n  vei-log (74)\n  morning-checkin (70)\n  box-breath (88)",
    run: () =>
      generateSwarmInsight([
        { action: "vagus-hum", score: 82 },
        { action: "vei-log", score: 74 },
        { action: "morning-checkin", score: 70 },
        { action: "box-breath", score: 88 },
      ]),
  },
];

function ModeBadge({ mode, modelTag }: { mode: GemmaMode; modelTag: string }) {
  const tone =
    mode === "local-gemma"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : mode === "cloud-gemma"
        ? "text-cyan-400 border-cyan-500/40 bg-cyan-500/10"
        : "text-slate-400 border-slate-500/40 bg-slate-500/10";
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded border font-mono ${tone}`}>
      {mode} · {modelTag}
    </span>
  );
}

function JsonView({ value }: { value: unknown }) {
  const lines = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2).split("\n");
    } catch {
      return ["<unserializable>"];
    }
  }, [value]);
  return (
    <pre className="text-[10px] font-mono bg-black/70 border border-white/10 rounded-lg p-2 overflow-x-auto whitespace-pre">
      {lines.map((line, i) => {
        const m = line.match(/^(\s*)"([^"]+)":(.*)$/);
        if (!m) return <div key={i} className="text-slate-300">{line}</div>;
        return (
          <div key={i} className="text-slate-300">
            <span>{m[1]}</span>
            <span className="text-[var(--color-accent-gold)]">"{m[2]}"</span>
            <span>:{m[3]}</span>
          </div>
        );
      })}
    </pre>
  );
}

function statusColor(s: RunStatus): string {
  if (s === "running") return "text-cyan-400";
  if (s === "success") return "text-emerald-400";
  if (s === "error") return "text-red-400";
  return "text-slate-500";
}

function Cell({
  spec,
  state,
  onRun,
}: {
  spec: CellSpec;
  state: CellState;
  onRun: () => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3 h-3 text-[var(--color-accent-gold)] shrink-0" />
          <code className="text-[11px] font-mono text-white truncate">{spec.label}()</code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-mono uppercase ${statusColor(state.status)}`}>
            {state.status}
          </span>
          {state.ms > 0 && (
            <span className="text-[9px] font-mono text-slate-500">{state.ms}ms</span>
          )}
          <Button
            onClick={onRun}
            disabled={state.status === "running"}
            size="xs"
            className="h-6 text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
          >
            {state.status === "running" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Run live
          </Button>
        </div>
      </div>
      <button
        onClick={() => setShowPrompt((v) => !v)}
        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
      >
        {showPrompt ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        prompt
      </button>
      {showPrompt && (
        <pre className="text-[10px] font-mono text-slate-400 bg-black/50 border border-white/5 rounded p-2 whitespace-pre-wrap">
          {spec.promptPreview}
        </pre>
      )}
      {state.error && (
        <p className="text-[10px] text-red-400 font-mono">err: {state.error}</p>
      )}
      {state.status === "success" && <JsonView value={state.result} />}
    </div>
  );
}

function initialState(): Record<string, CellState> {
  const out: Record<string, CellState> = {};
  for (const c of CELLS) out[c.id] = { status: "idle", result: null, error: null, ms: 0 };
  return out;
}

export function DemoMode() {
  const [cells, setCells] = useState<Record<string, CellState>>(initialState);
  const [runner, setRunner] = useState<"idle" | "all">("idle");
  const [gemma, setGemma] = useState<{ mode: GemmaMode; modelTag: string }>({
    mode: "offline-mock",
    modelTag: "mock",
  });

  useEffect(() => {
    const unsub = subscribeGemmaState((s) => setGemma({ mode: s.mode, modelTag: s.modelTag }));
    return unsub;
  }, []);

  const runOne = async (id: string) => {
    const spec = CELLS.find((c) => c.id === id);
    if (!spec) return;
    setCells((p) => ({ ...p, [id]: { status: "running", result: null, error: null, ms: 0 } }));
    const t0 = performance.now();
    try {
      const result = await spec.run();
      setCells((p) => ({
        ...p,
        [id]: { status: "success", result, error: null, ms: Math.round(performance.now() - t0) },
      }));
    } catch (e: any) {
      setCells((p) => ({
        ...p,
        [id]: {
          status: "error",
          result: null,
          error: e?.message || "unknown",
          ms: Math.round(performance.now() - t0),
        },
      }));
    }
  };

  const runAll = async () => {
    setRunner("all");
    for (const c of CELLS) await runOne(c.id);
    setRunner("idle");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--color-accent-gold)]/30 bg-black/60 p-3 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-[var(--color-accent-gold)]" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase text-slate-400">
              Gemma 4 live demo
            </p>
            <p className="text-[10px] font-mono text-slate-500 truncate">
              routing path active below
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModeBadge mode={gemma.mode} modelTag={gemma.modelTag} />
          <Button
            onClick={runAll}
            disabled={runner === "all"}
            size="xs"
            className="h-6 text-[10px] font-mono uppercase bg-rose-500/30 text-rose-200 border border-rose-500/50 hover:bg-rose-500/40"
          >
            {runner === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run all
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {CELLS.map((spec) => (
          <Cell key={spec.id} spec={spec} state={cells[spec.id]} onRun={() => runOne(spec.id)} />
        ))}
      </div>
    </div>
  );
}
