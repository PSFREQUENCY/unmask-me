import { useEffect, useState } from "react";
import { Sun, Moon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useStore, hoursSince, isMorningWindow, isEveningWindow } from "@/lib/store";

type Tone = "morning" | "evening";

const PALETTE: Record<Tone, {
  icon: typeof Sun;
  title: string;
  body: string;
  cta: string;
  to: string;
  iconClass: string;
  iconWrapBorder: string;
  iconWrapBg: string;
  ctaClass: string;
  cardBorder: string;
  cardShadow: string;
}> = {
  morning: {
    icon: Sun,
    title: "Morning intention",
    body: "Set a tone before the world reaches for you.",
    cta: "Begin check-in",
    to: "/vai?mode=morning",
    iconClass: "text-[#E8B33A] drop-shadow-[0_0_8px_rgba(232,179,58,0.6)]",
    iconWrapBorder: "border-[#E8B33A]/40",
    iconWrapBg: "bg-[#E8B33A]/[0.10]",
    ctaClass: "bg-[#E8B33A]/15 text-[#FFD700] border-[#E8B33A]/55 hover:bg-[#E8B33A]/30",
    cardBorder: "border-[#E8B33A]/35",
    cardShadow: "0 0 28px -8px rgba(232,179,58,0.35)",
  },
  evening: {
    icon: Moon,
    title: "Evening release",
    body: "Review the day. Let it go. Sleep clean.",
    cta: "Begin review",
    to: "/vai?mode=evening",
    iconClass: "text-[#B14BFF] drop-shadow-[0_0_8px_rgba(177,75,255,0.6)]",
    iconWrapBorder: "border-[#B14BFF]/40",
    iconWrapBg: "bg-[#B14BFF]/[0.10]",
    ctaClass: "bg-[#B14BFF]/15 text-[#D7B8FF] border-[#B14BFF]/55 hover:bg-[#B14BFF]/30",
    cardBorder: "border-[#E8B33A]/30",
    cardShadow: "0 0 26px -10px rgba(177,75,255,0.40)",
  },
};

export function DailyNudge() {
  const lastMorning = useStore((s) => s.daily.lastMorning);
  const lastEvening = useStore((s) => s.daily.lastEvening);
  const enabled = useStore((s) => s.daily.remindersEnabled);
  const [dismissed, setDismissed] = useState<Tone | null>(null);

  useEffect(() => {
    const v = sessionStorage.getItem("nudge-dismissed");
    if (v === "morning" || v === "evening") setDismissed(v);
  }, []);

  if (!enabled) return null;

  const wantMorning = isMorningWindow() && hoursSince(lastMorning) > 8;
  const wantEvening = isEveningWindow() && hoursSince(lastEvening) > 8;
  const show: Tone | null = wantMorning && dismissed !== "morning"
    ? "morning"
    : wantEvening && dismissed !== "evening"
      ? "evening"
      : null;

  if (!show) return null;

  const dismiss = () => {
    setDismissed(show);
    sessionStorage.setItem("nudge-dismissed", show);
  };

  const cfg = PALETTE[show];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[92%]"
      >
        <div
          className={`glass-card rounded-2xl p-3 flex items-center gap-3 ${cfg.cardBorder}`}
          style={{ boxShadow: cfg.cardShadow }}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${cfg.iconWrapBg} ${cfg.iconWrapBorder}`}>
            <Icon className={`w-5 h-5 ${cfg.iconClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] gold-foil-static font-bold">{cfg.title}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">{cfg.body}</p>
          </div>
          <Link
            to={cfg.to}
            className={`tactile-press px-3 py-1.5 rounded-lg border font-mono text-[9px] uppercase tracking-[0.18em] font-bold whitespace-nowrap ${cfg.ctaClass}`}
            onClick={dismiss}
          >
            {cfg.cta}
          </Link>
          <button onClick={dismiss} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
