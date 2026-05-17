/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VAI — Vibrational Assessment Intelligence
 *
 * Three modes selected by `?mode=morning|evening` (else the full somatic flow):
 *   - morning  : single face scan, calls analyzeFaceCheckin("morning") + markMorningCheckin
 *   - evening  : single face scan, calls analyzeFaceCheckin("evening") + markEveningCheckin
 *   - default  : Phase 1 pre-mood scan -> 6-protocol carousel -> Phase 3 post-mood scan
 *                -> analyzeSomaticShift + awardPoints + levelUpCharm + logSwarmEvent
 *
 * Privacy: the camera frame is captured ONCE pre and ONCE post (default flow) or
 * ONCE total (face check-in mode). It is held in a React ref as in-memory base64,
 * sent only to Gemma (local Ollama by default), and discarded after analysis.
 * Nothing is written to disk or to the network beyond the Gemma call.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Camera, Sparkles, Eye, ShieldCheck } from "lucide-react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useStore, store } from "@/lib/store";
import { analyzeSomaticShift, analyzeFaceCheckin } from "@/lib/gemma";
import { PROTOCOLS } from "@/lib/protocols";
import { BoxBreathe } from "@/components/protocols/BoxBreathe";
import { SomaticShake } from "@/components/protocols/SomaticShake";
import { VagusHum } from "@/components/protocols/VagusHum";
import { JawRelease } from "@/components/protocols/JawRelease";
import { EFTTap } from "@/components/protocols/EFTTap";
import { GroundStomp } from "@/components/protocols/GroundStomp";

type FlowMode = "morning" | "evening" | "full";
type Phase = "pre" | "carousel" | "analyzing" | "post" | "result";

const MOODS = ["calm", "neutral", "tense", "overwhelmed", "numb"] as const;
type Mood = (typeof MOODS)[number];

const PROTOCOL_COMPONENTS = {
  "box-breathe": BoxBreathe,
  "somatic-shake": SomaticShake,
  "vagus-hum": VagusHum,
  "jaw-release": JawRelease,
  "eft-tap": EFTTap,
  "ground-stomp": GroundStomp,
} as const;

function useFlowMode(): FlowMode {
  const loc = useLocation();
  return useMemo(() => {
    const m = new URLSearchParams(loc.search).get("mode");
    if (m === "morning") return "morning";
    if (m === "evening") return "evening";
    return "full";
  }, [loc.search]);
}

function captureFrame(webcamRef: React.RefObject<Webcam | null>): string | null {
  const cam = webcamRef.current;
  if (!cam) return null;
  try {
    return cam.getScreenshot() || null;
  } catch {
    return null;
  }
}

function PrivacyBanner() {
  return (
    <div className="w-full mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
      <p className="font-mono text-[10px] text-emerald-200/90 leading-tight">
        Scan only. Nothing saved. Frame discarded after analysis.
      </p>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-full text-center mb-6">
      <Shield className="w-10 h-10 mx-auto mb-3 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
      <h1 className="font-display text-4xl text-indigo-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
        V.A.I.
      </h1>
      <p className="font-mono text-[10px] text-indigo-300/70 tracking-widest uppercase">
        {title}
      </p>
      <p className="text-[11px] text-slate-400 font-sans mt-2 px-4">{subtitle}</p>
    </div>
  );
}

function CamFrame({
  webcamRef,
  onReady,
}: {
  webcamRef: React.RefObject<Webcam | null>;
  onReady?: () => void;
}) {
  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-indigo-500/30 bg-black/60 mb-4">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user" }}
        className="absolute inset-0 w-full h-full object-cover"
        onUserMedia={onReady}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-indigo-300/80 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-indigo-300/80 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-indigo-300/80 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-indigo-300/80 rounded-br-xl" />
      </div>
    </div>
  );
}

function PiPCam({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <div className="absolute top-3 right-3 w-24 h-24 rounded-2xl overflow-hidden border border-indigo-500/40 bg-black/60 shadow-lg z-20">
      <Webcam
        audio={false}
        videoConstraints={{ facingMode: "user" }}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 right-1 text-center font-mono text-[8px] text-indigo-200/80 tracking-widest uppercase">
        watching
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Face check-in (morning / evening) — single capture, no protocols
// ────────────────────────────────────────────────────────────────────────────

function FaceCheckin({ mode }: { mode: "morning" | "evening" }) {
  const webcamRef = useRef<Webcam | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    setBusy(true);
    const frame = captureFrame(webcamRef);
    if (!frame) {
      setBusy(false);
      return;
    }
    const r = await analyzeFaceCheckin(frame, mode);
    setResult(r);
    if (mode === "morning") store.markMorningCheckin();
    else store.markEveningCheckin();
    store.logSwarmEvent({
      kind: mode === "morning" ? "morning-checkin" : "evening-checkin",
      label: `${mode} face check-in`,
      score: r.score,
      insight: r.swarmInsight,
    });
    setBusy(false);
  };

  const title = mode === "morning" ? "Morning Face Check-in" : "Evening Face Review";
  const subtitle =
    mode === "morning"
      ? "Set today's baseline. One scan. Frame discarded after analysis."
      : "Close the loop. One scan. Frame discarded after analysis.";

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative pb-24">
      <PageHeader title={title} subtitle={subtitle} />
      <PrivacyBanner />
      {!result && (
        <>
          <CamFrame webcamRef={webcamRef} onReady={() => setReady(true)} />
          <Button
            disabled={!ready || busy}
            onClick={handleScan}
            className="w-full h-12 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500 font-mono text-xs uppercase tracking-widest transition-all"
          >
            {busy ? "Analyzing…" : `Capture ${mode} scan`}
          </Button>
        </>
      )}
      {result && <ResultPanel result={result} mode={mode} />}
    </div>
  );
}

function ResultPanel({
  result,
  mode,
}: {
  result: { score: number; state: string; feedback: string; swarmInsight: string };
  mode: "morning" | "evening";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-indigo-950/30 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest">
          {mode} baseline
        </h3>
        <span className="text-[10px] text-amber-300 font-mono">{result.score}/100</span>
      </div>
      <p className="text-3xl font-display text-white tracking-widest uppercase mb-2 text-center">
        {result.state}
      </p>
      <p className="text-xs text-indigo-200 italic text-center mb-4">{result.feedback}</p>
      <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-3">
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
          Swarm insight
        </p>
        <p className="text-[12px] text-slate-200">{result.swarmInsight}</p>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Full somatic flow
// ────────────────────────────────────────────────────────────────────────────

interface FullFlowState {
  phase: Phase;
  mood: Mood | null;
  protocolIdx: number;
  result: any;
}

const initialFlow: FullFlowState = {
  phase: "pre",
  mood: null,
  protocolIdx: 0,
  result: null,
};

function FullFlow() {
  const voice = useStore((s) => s.audio.voice);
  const webcamRef = useRef<Webcam | null>(null);
  const preFrameRef = useRef<string | null>(null);
  const postFrameRef = useRef<string | null>(null);
  const [flow, setFlow] = useState<FullFlowState>(initialFlow);
  const [camReady, setCamReady] = useState(false);
  const [camDenied, setCamDenied] = useState(false);

  const beginReset = () => {
    const frame = captureFrame(webcamRef);
    if (frame) preFrameRef.current = frame;
    setFlow((f) => ({ ...f, phase: "carousel", protocolIdx: 0 }));
  };

  const onProtocolComplete = () => {
    setFlow((f) => {
      const next = f.protocolIdx + 1;
      if (next >= PROTOCOLS.length) return { ...f, phase: "post" };
      return { ...f, protocolIdx: next };
    });
  };

  const runPostAnalysis = async () => {
    setFlow((f) => ({ ...f, phase: "analyzing" }));
    const frame = captureFrame(webcamRef);
    if (frame) postFrameRef.current = frame;
    const pre = preFrameRef.current || "";
    const post = postFrameRef.current || "";
    const r = await analyzeSomaticShift(pre, post, "Six-protocol reset");
    store.awardPoints(r.pointsAwarded, "somatic");
    store.levelUpCharm(r.pointsAwarded);
    store.logSwarmEvent({
      kind: "protocol",
      label: "six-protocol-reset",
      score: r.score,
      insight: r.swarmInsight,
    });
    // discard frames immediately after analysis
    preFrameRef.current = null;
    postFrameRef.current = null;
    setFlow((f) => ({ ...f, phase: "result", result: r }));
  };

  if (flow.phase === "pre") {
    return (
      <PreMoodView
        webcamRef={webcamRef}
        mood={flow.mood}
        onMood={(m) => setFlow((f) => ({ ...f, mood: m }))}
        onBegin={beginReset}
        onReady={() => setCamReady(true)}
        onDenied={() => setCamDenied(true)}
        camReady={camReady}
      />
    );
  }

  if (flow.phase === "carousel") {
    return (
      <CarouselView
        protocolIdx={flow.protocolIdx}
        voice={voice}
        onComplete={onProtocolComplete}
        camEnabled={!camDenied}
      />
    );
  }

  if (flow.phase === "post") {
    return (
      <PostMoodView
        webcamRef={webcamRef}
        camDenied={camDenied}
        onAnalyze={runPostAnalysis}
      />
    );
  }

  if (flow.phase === "analyzing") {
    return <AnalyzingView />;
  }

  return <ShiftResult result={flow.result} onReset={() => setFlow(initialFlow)} />;
}

function PreMoodView({
  webcamRef,
  mood,
  onMood,
  onBegin,
  onReady,
  onDenied,
  camReady,
}: {
  webcamRef: React.RefObject<Webcam | null>;
  mood: Mood | null;
  onMood: (m: Mood) => void;
  onBegin: () => void;
  onReady: () => void;
  onDenied: () => void;
  camReady: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative pb-24">
      <PageHeader
        title="Phase 1 — Pre-mood Scan"
        subtitle="One in-memory frame. No picture is taken or stored."
      />
      <PrivacyBanner />
      <div className="relative w-full">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-full aspect-square object-cover rounded-3xl border border-indigo-500/30 bg-black/60"
          onUserMedia={onReady}
          onUserMediaError={onDenied}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-indigo-300/80 rounded-tl-xl" />
          <div className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-indigo-300/80 rounded-tr-xl" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-indigo-300/80 rounded-bl-xl" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-indigo-300/80 rounded-br-xl" />
        </div>
      </div>
      <MoodPicker mood={mood} onMood={onMood} />
      <Button
        onClick={onBegin}
        disabled={!mood || !camReady}
        className="w-full h-12 mt-4 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500 font-mono text-xs uppercase tracking-widest"
      >
        <Camera className="w-4 h-4 mr-2" /> Begin reset
      </Button>
    </div>
  );
}

function MoodPicker({ mood, onMood }: { mood: Mood | null; onMood: (m: Mood) => void }) {
  return (
    <div className="w-full mt-4 bg-black/30 border border-white/10 rounded-2xl p-4">
      <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-3">
        Where are you right now?
      </p>
      <div className="grid grid-cols-5 gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMood(m)}
            className={`px-2 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all ${
              mood === m
                ? "border-indigo-400 bg-indigo-500/30 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-indigo-400/50"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

function CarouselView({
  protocolIdx,
  voice,
  onComplete,
  camEnabled,
}: {
  protocolIdx: number;
  voice: ReturnType<typeof useStore<any>>;
  onComplete: () => void;
  camEnabled: boolean;
}) {
  const p = PROTOCOLS[protocolIdx];
  const Comp = PROTOCOL_COMPONENTS[p.id as keyof typeof PROTOCOL_COMPONENTS];
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative pb-24">
      <PiPCam enabled={camEnabled} />
      <div className="w-full text-center mb-3">
        <p className="font-mono text-[10px] text-indigo-300/70 tracking-widest uppercase">
          Protocol {protocolIdx + 1} of {PROTOCOLS.length}
        </p>
        <p className="text-[11px] text-slate-400 font-sans mt-1">{p.desc}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="w-full"
        >
          <Comp onComplete={onComplete} voice={voice} track={p.track} />
        </motion.div>
      </AnimatePresence>
      <ProgressDots active={protocolIdx} />
    </div>
  );
}

function ProgressDots({ active }: { active: number }) {
  return (
    <div className="flex gap-2 mt-6">
      {PROTOCOLS.map((p, i) => (
        <div
          key={p.id}
          className={`h-1.5 rounded-full transition-all ${
            i < active
              ? "w-6 bg-indigo-400/60"
              : i === active
                ? "w-10 bg-indigo-400"
                : "w-6 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function PostMoodView({
  webcamRef,
  camDenied,
  onAnalyze,
}: {
  webcamRef: React.RefObject<Webcam | null>;
  camDenied: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative pb-24">
      <PageHeader
        title="Phase 3 — Post-mood Scan"
        subtitle="One last in-memory frame to score the shift."
      />
      <PrivacyBanner />
      {!camDenied && (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-full aspect-square object-cover rounded-3xl border border-indigo-500/30 bg-black/60 mb-4"
        />
      )}
      <Button
        onClick={onAnalyze}
        className="w-full h-12 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500 font-mono text-xs uppercase tracking-widest"
      >
        <Eye className="w-4 h-4 mr-2" /> Score the shift
      </Button>
    </div>
  );
}

function AnalyzingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 max-w-md mx-auto pb-24">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-32 h-32 rounded-full border-2 border-t-indigo-400 border-white/10"
      />
      <p className="font-mono text-[11px] text-indigo-300 uppercase tracking-widest mt-6">
        Gemma reading the shift
      </p>
    </div>
  );
}

function ShiftResult({ result, onReset }: { result: any; onReset: () => void }) {
  if (!result) return null;
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto relative pb-24">
      <PageHeader title="Shift recorded" subtitle="The swarm just learned from your reset." />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-indigo-950/30 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest">
            Shift score
          </h3>
          <span className="text-[10px] text-amber-300 font-mono">{result.score}/100</span>
        </div>
        <p className="text-xs text-indigo-200 italic text-center mb-4">{result.feedback}</p>
        <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-3 mb-3">
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            Points
          </p>
          <p className="text-2xl font-display text-amber-300">+{result.pointsAwarded}</p>
        </div>
        <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-3 mb-4">
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            Swarm insight
          </p>
          <p className="text-[12px] text-slate-200">{result.swarmInsight}</p>
        </div>
        <Button
          onClick={onReset}
          className="w-full h-12 bg-indigo-500 text-white font-mono text-xs uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Run another
        </Button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Top-level page
// ────────────────────────────────────────────────────────────────────────────

export function VAI() {
  const mode = useFlowMode();
  useEffect(() => {
    // No-op placeholder: future mode-entry telemetry can hook here.
  }, [mode]);

  if (mode === "morning" || mode === "evening") {
    return <FaceCheckin mode={mode} />;
  }
  return <FullFlow />;
}
