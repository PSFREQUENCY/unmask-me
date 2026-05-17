import { useEffect, useState } from "react";
import { Cpu, Cloud, WifiOff } from "lucide-react";
import { subscribeGemmaState, type GemmaMode } from "@/lib/gemma";

const LABELS: Record<GemmaMode, { text: string; icon: typeof Cpu; cls: string; halo: string }> = {
  "local-gemma": {
    text: "Local Gemma 4",
    icon: Cpu,
    cls: "text-[#E8B33A] border-[#E8B33A]/55 bg-[#E8B33A]/[0.08]",
    halo: "0 0 14px rgba(232,179,58,0.45), 0 0 28px rgba(232,179,58,0.18)",
  },
  "cloud-gemma": {
    text: "Cloud Gemma 4",
    icon: Cloud,
    cls: "text-[#FF5C8A] border-[#FF2D8B]/55 bg-[#FF2D8B]/[0.10]",
    halo: "0 0 14px rgba(255,45,139,0.40), 0 0 28px rgba(255,45,139,0.18)",
  },
  "offline-mock": {
    text: "Offline mock",
    icon: WifiOff,
    cls: "text-[#a08f74] border-white/15 bg-white/[0.04]",
    halo: "0 0 10px rgba(160,143,116,0.20)",
  },
};

export function GemmaBadge() {
  const [mode, setMode] = useState<GemmaMode>("offline-mock");
  const [tag, setTag] = useState("mock");

  useEffect(() => {
    return subscribeGemmaState((s) => {
      setMode(s.mode);
      setTag(s.modelTag);
    });
  }, []);

  const cfg = LABELS[mode];
  const Icon = cfg.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md font-mono text-[9px] uppercase tracking-[0.18em] font-bold ${cfg.cls}`}
      title={`Inference: ${tag}`}
      style={{ boxShadow: cfg.halo }}
    >
      <Icon className="w-3 h-3 drop-shadow-[0_0_6px_currentColor]" />
      <span>{cfg.text}</span>
    </div>
  );
}
