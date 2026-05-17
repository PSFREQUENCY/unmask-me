import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, HelpCircle, Flame as FlameIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SpiritCharm3D } from "@/components/SpiritCharm3D";
import { useStore, store } from "@/lib/store";
import { speak, startAmbient, stopAmbient, listVoices, listTracks, type KokoroVoice, type AmbientTrack } from "@/lib/voice";

const BOX_BREATH = ["in", "hold", "out", "hold"] as const;

function useBoxBreath(active: boolean, voice: KokoroVoice) {
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  useEffect(() => {
    if (!active) {
      setPhase(0);
      phaseRef.current = 0;
      return;
    }
    speak(BOX_BREATH[0], { voice });
    const id = setInterval(() => {
      phaseRef.current = (phaseRef.current + 1) % BOX_BREATH.length;
      setPhase(phaseRef.current);
      speak(BOX_BREATH[phaseRef.current], { voice });
    }, 4000);
    return () => clearInterval(id);
  }, [active, voice]);
  return phase;
}

function Header({ onWalkthrough }: { onWalkthrough: () => void }) {
  const charm = useStore((s) => s.charm);
  const streak = useStore((s) => s.daily.streak);
  const lastMorning = useStore((s) => s.daily.lastMorning);
  const xpTarget = (charm?.level || 1) * 250;
  const xpPct = charm ? Math.min(100, (charm.xp / xpTarget) * 100) : 0;
  const checkedInToday = lastMorning ? (Date.now() - lastMorning) < 16 * 3600 * 1000 : false;

  return (
    <div className="w-full mb-6">
      <div className="w-full flex justify-between items-start mb-4">
        <div>
          <p className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">Spirit Charm</p>
          <h1
            className="font-display text-4xl uppercase tracking-wider drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            style={{ color: charm?.primaryColor || "var(--color-accent-gold)" }}
          >
            {charm?.name || "Charm"}
          </h1>
          {charm?.tagline && (
            <p className="font-sans text-[11px] text-slate-400 mt-1 max-w-[260px] leading-relaxed">{charm.tagline}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onWalkthrough}
          className="text-slate-400 hover:text-[var(--color-accent-gold)] tracking-widest uppercase font-mono text-[10px]"
        >
          <HelpCircle className="w-3 h-3 mr-2" /> Walkthrough
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2">
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Level</p>
          <p className="font-display text-2xl text-white">{charm?.level || 1}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2">
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">XP</p>
          <Progress value={xpPct} className="h-2 mt-2 bg-white/5 border border-white/10" />
          <p className="font-mono text-[9px] text-cyan-400 mt-1">{charm?.xp || 0} / {xpTarget}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2">
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Streak</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <FlameIcon className="w-4 h-4 text-amber-400" />
            <p className="font-display text-2xl text-white">{streak}</p>
          </div>
          {!checkedInToday && (
            <button
              onClick={() => store.markMorningCheckin()}
              className="text-[8px] uppercase font-mono text-cyan-400 hover:text-cyan-200 mt-1 tracking-widest"
            >
              Check in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MeditationOverlay({ phase, count, active }: { phase: number; count: number; active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="text-center">
        <p className="font-display text-5xl uppercase text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.7)]">
          {BOX_BREATH[phase]}
        </p>
        <p className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase mt-2">
          {count}s remaining
        </p>
      </div>
    </motion.div>
  );
}

export function Home() {
  const charm = useStore((s) => s.charm);
  const audio = useStore((s) => s.audio);
  const [meditating, setMeditating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [regulated, setRegulated] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const phase = useBoxBreath(meditating, audio.voice);

  useEffect(() => {
    if (!meditating) return;
    setSecondsLeft(60);
    setRegulated(false);
    startAmbient(audio.track as AmbientTrack, audio.volume ?? 0.18);
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          finishMeditation();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      clearInterval(id);
      stopAmbient();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meditating]);

  const finishMeditation = () => {
    setRegulated(true);
    setMeditating(false);
    stopAmbient();
    store.awardPoints(50, "somatic");
    store.levelUpCharm(50);
    store.logSwarmEvent({ kind: "protocol", label: "meditate-with-charm", score: 50 });
    speak("You are regulated. The charm remembers.", { voice: audio.voice });
    setTimeout(() => setRegulated(false), 6000);
  };

  const handleMeditate = () => {
    if (meditating || !charm) return;
    setMeditating(true);
  };

  const voices = listVoices();
  const tracks = listTracks();

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] p-6 pt-12 max-w-md mx-auto">
      <Header onWalkthrough={() => setShowHowTo(true)} />

      <div className="relative w-72 h-72 flex items-center justify-center mb-6 mt-2">
        <div
          className={`absolute inset-0 border border-cyan-500/30 rounded-full border-dashed transition-all duration-[3000ms] pointer-events-none opacity-50 ${
            meditating ? "animate-[spin_10s_linear_infinite]" : "animate-[spin_30s_linear_infinite]"
          }`}
        />
        <div
          className={`absolute inset-4 border border-[var(--color-accent-gold)] rounded-full border-dashed pointer-events-none opacity-30 ${
            regulated ? "animate-[spin_4s_linear_infinite_reverse]" : "animate-[spin_20s_linear_infinite_reverse]"
          }`}
        />
        <div className="w-64 h-64 rounded-full overflow-visible z-10">
          <SpiritCharm3D isAnchoring={meditating} isRegulated={regulated} onInteract={handleMeditate} />
        </div>
        <AnimatePresence>
          <MeditationOverlay phase={phase} count={secondsLeft} active={meditating} />
        </AnimatePresence>
      </div>

      <Card className="w-full bg-black/40 border-[var(--color-border-subtle)] backdrop-blur-md rounded-2xl mb-6 p-5">
        <Button
          size="lg"
          onClick={handleMeditate}
          disabled={meditating || !charm}
          className="w-full h-14 font-mono font-bold tracking-widest uppercase bg-gradient-to-r from-[var(--color-accent-gold)] to-cyan-500 hover:opacity-90 text-black rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {meditating ? `Meditating · ${secondsLeft}s` : "Meditate with Charm"}
        </Button>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center mt-3">
          60-second box breath · ambient hum · +50 XP
        </p>
      </Card>

      <Card className="w-full bg-black/40 border-[var(--color-border-subtle)] backdrop-blur-md rounded-2xl mb-6 p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3" /> Audio Guide · Kokoro Voice
          </h3>
          <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase bg-amber-500/10 px-2 py-0.5 rounded">
            {audio.voice}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {voices.map((v) => (
            <Button
              key={v.name}
              onClick={() => store.setAudio({ voice: v.name })}
              variant="outline"
              size="sm"
              className={`font-mono text-[9px] uppercase border-[var(--color-border-subtle)] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50 justify-start ${
                audio.voice === v.name ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${audio.voice === v.name ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
              {v.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-3">
          <h3 className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">Ambient Track</h3>
          <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase bg-amber-500/10 px-2 py-0.5 rounded">
            {audio.track}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tracks.map((t) => (
            <Button
              key={t}
              onClick={() => store.setAudio({ track: t })}
              variant="outline"
              size="sm"
              className={`font-mono text-[9px] uppercase border-[var(--color-border-subtle)] hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/50 justify-start ${
                audio.track === t ? "bg-amber-500/15 text-amber-300 border-amber-500/40" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${audio.track === t ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
              {t}
            </Button>
          ))}
        </div>
      </Card>

      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="bg-[#030711] border border-cyan-500/30 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[var(--color-accent-gold)] tracking-wider">Walkthrough</DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">How to grow with UNMASK ME</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs font-sans text-slate-300 leading-relaxed">
            <p><strong className="text-emerald-400 font-mono text-[10px] uppercase">1. Charm:</strong> Tap your charm to start a 60-second box-breath meditation. It anchors you, regulates you, and grows.</p>
            <p><strong className="text-emerald-400 font-mono text-[10px] uppercase">2. Streak:</strong> Check in every morning to keep your streak alive. Mornings anchor evenings.</p>
            <p><strong className="text-emerald-400 font-mono text-[10px] uppercase">3. V.A.I.:</strong> Run somatic protocols in V.A.I. The swarm gauges your physical shift. Zero data is stored.</p>
            <p><strong className="text-emerald-400 font-mono text-[10px] uppercase">4. Ledger:</strong> Build an immutable reputation of peace.</p>
          </div>
          <Button onClick={() => setShowHowTo(false)} className="w-full bg-[var(--color-accent-gold)] hover:bg-cyan-400 text-black rounded-xl font-mono uppercase font-bold text-[10px] mt-2">
            Acknowledge
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
