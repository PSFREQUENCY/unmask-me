/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * First-boot interactive tour. Five steps, each spotlights a nav tab by id
 * (nav-charm, nav-unmask, nav-vai, nav-swarm, nav-rifts) and pops a tooltip
 * card placed above the highlighted region.
 */

import { useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, X } from "lucide-react";

interface Step {
  targetId: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    targetId: "nav-charm",
    title: "Your Spirit Charm",
    body: "Your Spirit Charm grows with you. Tap to meditate and regulate your nervous system.",
  },
  {
    targetId: "nav-unmask",
    title: "Unmask",
    body: "Unmask reveals the layers. Track ascension through four authenticity levels.",
  },
  {
    targetId: "nav-v-a-i-",
    title: "V.A.I.",
    body: "V.A.I. resets your nervous system in 6 guided steps, biometric in / biometric out.",
  },
  {
    targetId: "nav-swarm",
    title: "The Swarm",
    body: "The Swarm learns from you and others — a private, on-device collective brain.",
  },
  {
    targetId: "nav-rifts",
    title: "The Map",
    body: "The Map shows energy hotspots and Safe-Hub anchors near you.",
  },
];

const PADDING = 10;
const CARD_W = 280;
const CARD_H_EST = 160;

function clampCardLeft(left: number): number {
  if (typeof window === "undefined") return left;
  return Math.min(Math.max(12, left), window.innerWidth - CARD_W - 12);
}

function useTargetRect(targetId: string): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.getElementById(targetId);
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    const id = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [targetId]);
  return rect;
}

function Spotlight({ rect }: { rect: DOMRect }) {
  return (
    <div
      className="fixed bg-transparent rounded-2xl pointer-events-none transition-all duration-500 ease-out"
      style={{
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
        border: "1px solid rgba(255, 45, 139, 0.85)",
        boxShadow:
          "0 0 0 9999px rgba(8,4,16,0.82), inset 0 0 28px rgba(255,45,139,0.55), 0 0 28px rgba(255,45,139,0.65), 0 0 64px rgba(232,179,58,0.20)",
      }}
    />
  );
}

function TooltipCard({
  step,
  index,
  total,
  rect,
  onNext,
  onSkip,
}: {
  step: Step;
  index: number;
  total: number;
  rect: DOMRect;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = index === total - 1;
  const above = rect.top - CARD_H_EST - 20;
  const placeAbove = above >= 12;
  const top = placeAbove ? above : rect.bottom + 16;
  const left = clampCardLeft(rect.left + rect.width / 2 - CARD_W / 2);

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: placeAbove ? 12 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: placeAbove ? -12 : 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed z-[101] glass-card p-4 rounded-2xl pointer-events-auto"
      style={{
        top,
        left,
        width: CARD_W,
        boxShadow:
          "0 4px 30px rgba(255,45,139,0.30), 0 0 24px rgba(232,179,58,0.18), inset 0 1px 0 rgba(255,232,180,0.08)",
      }}
    >
      <div className="mb-3">
        <span className="mono-label mb-1 block">
          Guide {index + 1}/{total}
        </span>
        <h4 className="font-serif italic tracking-tight text-xl gold-foil mb-1 leading-none">{step.title}</h4>
        <p className="text-xs text-[var(--color-text-body)]/90 leading-relaxed">{step.body}</p>
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="text-[10px] uppercase font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent-coral)] flex items-center gap-1 tactile-press"
        >
          <X className="w-3 h-3" /> Skip
        </button>
        <Button
          onClick={onNext}
          size="sm"
          className="tactile-press bg-[#FF2D8B]/15 text-[#FF5C8A] hover:bg-[#FF2D8B]/40 hover:text-white border border-[#FF2D8B]/55 h-8 font-mono text-[10px] uppercase tracking-[0.18em] font-bold neon-glow-coral"
        >
          {isLast ? (
            <>
              <Check className="w-3 h-3 mr-1" /> Got it
            </>
          ) : (
            <>
              Next <ChevronRight className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function Walkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const rect = useTargetRect(current.targetId);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-black/0 pointer-events-auto" onClick={next} />
      <AnimatePresence mode="wait">
        {rect && (
          <>
            <Spotlight rect={rect} />
            <TooltipCard
              step={current}
              index={step}
              total={STEPS.length}
              rect={rect}
              onNext={next}
              onSkip={onComplete}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
