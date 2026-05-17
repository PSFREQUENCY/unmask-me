import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Activity, Sparkles, Hexagon, ScanLine } from "lucide-react";
import { store } from "@/lib/store";
import { analyzeIntakeArchetype } from "@/lib/gemma";
import { speak } from "@/lib/voice";

type Step = "CINEMATIC" | "PARTICLES" | "HUD_BOOT" | "QUESTIONS" | "SCAN_PREP" | "SCAN" | "GENERATING";

const QUOTES = [
  "The world is loud.",
  "Most of us are masked.",
  "UNMASK ME is the room behind the room.",
];

const QUESTIONS = [
  "What is your core intention for today?",
  "What heavy energy are you letting go of right now?",
  "Scan your body. Where do you feel the most tension?",
];

// Seeded PRNG so each mount renders one stable but distinct procedural texture.
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function BreathWave({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed), [seed]);
  const lines = useMemo(() => Array.from({ length: 14 }, () => rand() * 0.5 + 0.5), [rand]);
  return (
    <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 100 100">
      {lines.map((amp, i) => (
        <motion.path
          key={i}
          d={`M0 ${10 + i * 6} Q 25 ${10 + i * 6 - amp * 8} 50 ${10 + i * 6} T 100 ${10 + i * 6}`}
          stroke={i % 3 === 0 ? "#E8B33A" : i % 3 === 1 ? "#FF2D8B" : "#B14BFF"}
          strokeWidth={0.25}
          fill="none"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 4 + amp * 2, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

function ParticleWeave({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed + 1), [seed]);
  const dots = useMemo(
    () => Array.from({ length: 60 }, () => ({ x: (rand() - 0.5) * 800, y: (rand() - 0.5) * 800, d: rand() * 2 + 1 })),
    [rand]
  );
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: p.x, y: p.y, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: [0, 1, 0] }}
          transition={{ duration: p.d + 1.2, ease: "easeInOut", delay: i * 0.015 }}
          className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FF5C8A" : "#B14BFF",
            boxShadow: i % 3 === 0
              ? "0 0 10px #E8B33A"
              : i % 3 === 1
                ? "0 0 10px #FF2D8B"
                : "0 0 10px #B14BFF",
          }}
        />
      ))}
    </div>
  );
}

function Mandala({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed + 2), [seed]);
  const petals = useMemo(() => 8 + Math.floor(rand() * 8), [rand]);
  const rate = useMemo(() => 30 + rand() * 30, [rand]);
  const rings = useMemo(() => [0.3, 0.55, 0.8], []);
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="-50 -50 100 100">
      <motion.g animate={{ rotate: 360 }} transition={{ duration: rate, repeat: Infinity, ease: "linear" }}>
        {rings.map((r, ri) => (
          <g key={ri}>
            {Array.from({ length: petals }).map((_, i) => {
              const a = (i * 2 * Math.PI) / petals;
              const x = Math.cos(a) * r * 40;
              const y = Math.sin(a) * r * 40;
              return <circle key={i} cx={x} cy={y} r={2 + ri} fill="none" stroke={ri === 0 ? "#FF2D8B" : ri === 1 ? "#E8B33A" : "#B14BFF"} strokeWidth={0.3} />;
            })}
          </g>
        ))}
        <circle cx={0} cy={0} r={3} fill="#FFD700" />
      </motion.g>
    </svg>
  );
}

function GlyphRain({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed + 3), [seed]);
  const cols = 18;
  const glyphChars = "אבגדהוזחטיכלמנסעפצקרשת0123456789";
  const columns = useMemo(
    () =>
      Array.from({ length: cols }, () => ({
        delay: rand() * 4,
        duration: 8 + rand() * 6,
        glyphs: Array.from({ length: 12 }, () => glyphChars[Math.floor(rand() * glyphChars.length)]),
      })),
    [rand]
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {columns.map((col, i) => (
        <motion.div
          key={i}
          initial={{ y: "-30%" }}
          animate={{ y: "110%" }}
          transition={{ duration: col.duration, repeat: Infinity, delay: col.delay, ease: "linear" }}
          className="absolute top-0 font-mono text-[10px] text-[var(--color-accent-gold)] flex flex-col gap-1"
          style={{ left: `${(i / cols) * 100}%` }}
        >
          {col.glyphs.map((g, j) => (
            <span key={j} style={{ opacity: 1 - j / col.glyphs.length }}>{g}</span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function IrisBloom({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed + 4), [seed]);
  const rings = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ delay: i * 0.3 + rand() * 0.2 })), [rand]);
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {rings.map((r, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: [0, 6], opacity: [0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: r.delay, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full border border-[var(--color-accent-gold)]"
        />
      ))}
    </div>
  );
}

function FaceMesh({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry(seed + 5), [seed]);
  const dots = useMemo(() => {
    const rows = 14, cols = 10;
    const out: { x: number; y: number; delay: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) out.push({ x: c, y: r, delay: rand() * 2 });
    return out;
  }, [rand]);
  return (
    <div className="absolute inset-0 pointer-events-none opacity-30">
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "repeat(14, 1fr)" }}>
        {dots.map((d, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-center"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
          >
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: "#FF5C8A", boxShadow: "0 0 4px #FF2D8B" }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function useTypewriter(text: string, run: boolean, ms = 60) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!run) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [run, text, ms]);
  return out;
}

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("CINEMATIC");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<[string, string, string]>(["", "", ""]);
  const [forged, setForged] = useState<{ name: string; tagline: string; color: string } | null>(null);
  const [forging, setForging] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const seed = useMemo(() => Date.now(), []);
  const hudText = useTypewriter("UNMASK ME · ONLINE · LISTENING", step === "HUD_BOOT");

  useEffect(() => {
    if (step !== "CINEMATIC") return;
    const id = setTimeout(() => {
      if (quoteIndex < QUOTES.length - 1) setQuoteIndex((q) => q + 1);
      else setStep("PARTICLES");
    }, 3200);
    return () => clearTimeout(id);
  }, [step, quoteIndex]);

  useEffect(() => {
    if (step === "PARTICLES") {
      const id = setTimeout(() => setStep("HUD_BOOT"), 3800);
      return () => clearTimeout(id);
    }
    if (step === "HUD_BOOT") {
      speak("Unmask me. Online. Listening.", { voice: "Echo" });
      const id = setTimeout(() => setStep("QUESTIONS"), 4200);
      return () => clearTimeout(id);
    }
  }, [step]);

  const handleNextQ = () => {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
      return;
    }
    store.setIntake(answers);
    setStep("SCAN_PREP");
  };

  const captureScan = async () => {
    setStep("GENERATING");
    setForging(true);
    try {
      const result = await analyzeIntakeArchetype(answers);
      const charm = {
        archetype: result.archetype,
        name: result.name || "Charm",
        tagline: result.tagline || "Your charm has chosen you.",
        primaryColor: result.primaryColor || "#E8B33A",
        level: 1,
        xp: 0,
        bornAt: Date.now(),
      };
      store.setCharm(charm);
      if (result.swarmInsight) store.addSwarmInsight("First intake", result.swarmInsight);
      store.logSwarmEvent({ kind: "intake", label: `forged ${charm.archetype}`, insight: result.swarmInsight });
      setForged({ name: charm.name, tagline: charm.tagline, color: charm.primaryColor });
    } catch {
      setForged({ name: "Charm", tagline: "Your charm has chosen you.", color: "#E8B33A" });
    } finally {
      setForging(false);
      setTimeout(() => onComplete(), 3200);
    }
  };

  // Safety: if SCAN is open more than 25s with no input AND camera failed, allow auto-advance.
  useEffect(() => {
    if (step !== "SCAN" || !webcamError) return;
    const id = setTimeout(() => captureScan(), 6000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, webcamError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07040d] text-white p-6 font-mono overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-2/3 h-2/3 rounded-full bg-[#FF2D8B]/15 blur-[140px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full bg-[#E8B33A]/12 blur-[160px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1/2 h-1/2 rounded-full bg-[#B14BFF]/10 blur-[150px]" />
      </div>
      {step === "CINEMATIC" && <BreathWave seed={seed} />}
      {step === "PARTICLES" && <ParticleWeave seed={seed} />}
      {step === "HUD_BOOT" && <Mandala seed={seed} />}
      {step === "QUESTIONS" && <GlyphRain seed={seed} />}
      {step === "SCAN_PREP" && <IrisBloom seed={seed} />}
      {step === "SCAN" && <FaceMesh seed={seed} />}

      <Button
        onClick={onComplete}
        variant="ghost"
        className="tactile-press absolute top-4 right-4 z-50 text-[var(--color-text-muted)] hover:text-[var(--color-accent-coral)] uppercase font-mono text-[10px] tracking-[0.22em] font-bold"
      >
        Skip sequence
      </Button>

      <AnimatePresence mode="wait">
        {step === "CINEMATIC" && (
          <motion.div
            key="cinematic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center px-6 max-w-lg w-full z-10 cursor-pointer"
            onClick={() => (quoteIndex < QUOTES.length - 1 ? setQuoteIndex((q) => q + 1) : setStep("PARTICLES"))}
          >
            <div className="min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIndex}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 1.2 }}
                  className="font-serif italic text-3xl md:text-5xl leading-tight tracking-tight gold-foil"
                >
                  "{QUOTES[quoteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="text-[9px] font-mono text-[var(--color-accent-gold)]/60 uppercase tracking-[0.22em] mt-12 font-bold">
              Tap to advance
            </p>
          </motion.div>
        )}

        {step === "PARTICLES" && (
          <motion.div key="particles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex items-center justify-center w-64 h-64 z-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF2D8B] via-[#FFD700] to-[#B14BFF] shadow-[0_0_80px_#FF2D8B] blur-sm"
            />
          </motion.div>
        )}

        {step === "HUD_BOOT" && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-[4px] border-[#FF2D8B]/25 m-4 rounded-[40px] flex flex-col items-center justify-center"
          >
            <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-[var(--color-accent-gold)] rounded-tl-2xl opacity-70" />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-[var(--color-accent-gold)] rounded-tr-2xl opacity-70" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-[var(--color-accent-gold)] rounded-bl-2xl opacity-70" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-[var(--color-accent-gold)] rounded-br-2xl opacity-70" />

            <div className="relative z-10">
              <Hexagon className="w-24 h-24 text-[var(--color-accent-gold)] animate-[spin_10s_linear_infinite] drop-shadow-[0_0_20px_rgba(232,179,58,0.55)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Activity className="w-10 h-10 text-[#FF2D8B] animate-pulse drop-shadow-[0_0_14px_#FF2D8B]" />
              </div>
            </div>
            <h1 className="mt-8 font-display text-6xl gold-foil tracking-[0.16em] uppercase">UNMASK ME</h1>
            <p className="mt-3 text-[#FF5C8A] font-mono text-xs uppercase tracking-[0.4em] min-h-[1em] font-bold drop-shadow-[0_0_8px_rgba(255,45,139,0.5)]">
              {hudText}<span className="animate-pulse">_</span>
            </p>
          </motion.div>
        )}

        {step === "QUESTIONS" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md glass-card rounded-[2rem] p-8 relative overflow-hidden z-10"
            style={{ boxShadow: "0 0 50px rgba(255,45,139,0.18), 0 0 80px rgba(232,179,58,0.10)" }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-[#FF2D8B]/15 flex items-center justify-center border border-[#FF2D8B]/45 neon-glow-coral">
                <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="mono-label">Intake Vector {qIndex + 1}/{QUESTIONS.length}</h2>
                <div className="flex gap-1 mt-1">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`h-1 w-5 rounded-full ${i <= qIndex ? "bg-[var(--color-accent-gold)] shadow-[0_0_8px_rgba(232,179,58,0.7)]" : "bg-white/10"}`} />
                  ))}
                </div>
              </div>
            </div>

            <motion.h3
              key={`q-${qIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-serif italic leading-snug gold-foil mb-6"
            >
              {QUESTIONS[qIndex]}
            </motion.h3>

            <textarea
              autoFocus
              className="w-full bg-[#07040d]/55 border border-[var(--color-accent-gold)]/15 rounded-2xl p-5 text-sm font-sans text-white focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-[#07040d]/75 transition-all min-h-[120px] resize-none placeholder:text-[var(--color-text-muted)] mb-6 shadow-inner"
              placeholder="Your truth here..."
              value={answers[qIndex]}
              onChange={(e) => {
                const next = [...answers] as [string, string, string];
                next[qIndex] = e.target.value;
                setAnswers(next);
              }}
            />

            <Button
              onClick={handleNextQ}
              disabled={answers[qIndex].length < 3}
              className="tactile-press w-full h-12 bg-gradient-to-r from-[var(--color-accent-gold)] via-[#FFD700] to-[#FF5C8A] text-black hover:opacity-95 font-mono text-xs uppercase tracking-[0.22em] font-extrabold rounded-xl neon-glow-gold transition-all"
            >
              Log Intent
            </Button>
          </motion.div>
        )}

        {step === "SCAN_PREP" && (
          <motion.div
            key="prep"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-sm w-full glass-card rounded-[2rem] p-8 relative z-10"
            style={{ boxShadow: "0 0 50px rgba(232,179,58,0.15)" }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-accent-gold)]/12 flex items-center justify-center border border-[var(--color-accent-gold)]/45 mb-6 relative neon-glow-gold">
              <ScanLine className="w-8 h-8 text-[var(--color-accent-gold)] animate-pulse" />
              <div className="absolute inset-0 bg-[var(--color-accent-gold)] blur-[20px] opacity-25 rounded-2xl" />
            </div>
            <h2 className="text-4xl font-serif italic gold-foil tracking-tight mb-4 leading-none">Biometric Anchor</h2>
            <p className="text-xs font-sans text-[var(--color-text-body)]/85 leading-relaxed mb-8">
              We require a baseline facial read to shape your personal Spirit Charm.
              <br /><br />
              <strong className="text-[var(--color-accent-gold)] text-[10px] uppercase font-mono tracking-[0.18em] bg-[var(--color-accent-gold)]/10 px-2 py-1 rounded border border-[var(--color-accent-gold)]/30">100% Edge Processed. Zero Data Stored.</strong>
            </p>
            <Button
              onClick={() => setStep("SCAN")}
              className="tactile-press w-full h-12 bg-transparent border-2 border-[#FF2D8B] text-[#FF5C8A] hover:bg-[#FF2D8B] hover:text-black font-mono font-extrabold text-xs uppercase tracking-[0.22em] rounded-xl neon-glow-coral transition-all"
            >
              Activate Optical Sensor
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setWebcamError(true); captureScan(); }}
              className="tactile-press mt-3 w-full text-[10px] uppercase font-mono tracking-[0.22em] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)]"
            >
              Skip optical · forge from intake
            </Button>
          </motion.div>
        )}

        {step === "SCAN" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full max-w-sm z-10"
          >
            <div className="w-full flex justify-between items-center mb-6 px-4">
              <span className="mono-label flex items-center gap-2 text-[#FF5C8A]">
                <span className="w-2 h-2 rounded-full bg-[#FF2D8B] animate-pulse drop-shadow-[0_0_6px_#FF2D8B]" /> Live Feed
              </span>
              <ScanLine className="w-4 h-4 text-[var(--color-accent-gold)] drop-shadow-[0_0_8px_rgba(232,179,58,0.55)]" />
            </div>

            <div
              className="relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden border-2 border-[#FF2D8B]/55 mb-8 m-auto bg-[#07040d] flex items-center justify-center"
              style={{ boxShadow: "0 0 40px rgba(255,45,139,0.30), 0 0 80px rgba(232,179,58,0.12)" }}
            >
              {!webcamError ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="object-cover w-full h-full opacity-80"
                  onUserMediaError={() => setWebcamError(true)}
                />
              ) : (
                <div className="text-center p-4">
                  <Activity className="w-12 h-12 text-[#FF2D8B] animate-pulse mx-auto mb-2 drop-shadow-[0_0_12px_#FF2D8B]" />
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-[0.18em]">Sensor offline. Forging from intake.</p>
                </div>
              )}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-[var(--color-accent-gold)]/60 rounded-3xl pointer-events-none" />
            </div>

            <p className="text-[12px] font-sans text-[var(--color-text-body)]/85 text-center mb-6 px-4 leading-relaxed">
              Look into the lens. Soften your jaw.<br />
              <span className="text-[var(--color-accent-gold)] font-mono text-[10px] uppercase tracking-[0.22em] font-bold">Take a deep breath.</span>
            </p>

            <Button
              onClick={captureScan}
              className="tactile-press w-full h-14 bg-gradient-to-r from-[#FF2D8B] via-[#FFD700] to-[var(--color-accent-gold)] text-black hover:opacity-95 font-mono font-extrabold text-sm uppercase tracking-[0.22em] rounded-2xl neon-glow-coral transition-all"
            >
              Capture Baseline
            </Button>
          </motion.div>
        )}

        {step === "GENERATING" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center z-10"
          >
            <motion.div
              className="fixed inset-0 bg-gradient-to-br from-[#FFE89A] via-[#FF5C8A] to-[#B14BFF] z-[100] pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-t-4 border-l-4 border-[var(--color-accent-gold)] animate-spin drop-shadow-[0_0_18px_rgba(232,179,58,0.6)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#FF2D8B] animate-pulse drop-shadow-[0_0_14px_#FF2D8B]" />
              </div>
            </div>
            {forging || !forged ? (
              <>
                <h2 className="text-4xl font-serif italic gold-foil tracking-tight mb-3 leading-none">Synthesizing Charm</h2>
                <p className="text-[10px] font-mono text-[#FF5C8A] tracking-[0.22em] uppercase font-bold animate-pulse">
                  Translating intention and somatic signature...
                </p>
              </>
            ) : (
              <>
                <h2 className="text-5xl font-serif italic tracking-tight mb-3 leading-none" style={{ color: forged.color, textShadow: `0 0 22px ${forged.color}` }}>
                  {forged.name}
                </h2>
                <p className="text-sm text-[var(--color-text-body)] font-sans max-w-xs leading-relaxed">{forged.tagline}</p>
                <p className="text-[10px] font-mono text-[var(--color-accent-gold)] tracking-[0.22em] uppercase font-bold mt-6 animate-pulse">
                  Charm forged · entering temple
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
