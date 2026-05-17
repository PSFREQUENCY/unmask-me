/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin: global theme + voice override + nuclear reset. Writes through
 * the store so changes immediately re-render every subscriber.
 */

import { Palette, Type, Mic, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";
import { listVoices } from "@/lib/voice";

const FONTS: { id: "geist" | "anton" | "inter" | "mono"; label: string }[] = [
  { id: "geist", label: "Geist" },
  { id: "anton", label: "Anton" },
  { id: "inter", label: "Inter" },
  { id: "mono", label: "Mono" },
];

export function ThemeControls({ onReset }: { onReset?: () => void }) {
  const prefs = useStore((s) => s.prefs);
  const voices = listVoices();

  const confirmReset = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Master reset will wipe charm, log, and prefs. Continue?");
    if (!ok) return;
    store.reset();
    onReset?.();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
      <h3 className="text-xs text-slate-500 border-b border-white/10 pb-2 flex items-center gap-2">
        <Palette className="w-3 h-3" /> Global System Config
      </h3>

      <div>
        <label className="text-[9px] text-slate-400 block mb-1 flex items-center gap-1">
          <Palette className="w-3 h-3" /> Primary Color
        </label>
        <input
          type="color"
          value={prefs.primaryColor}
          onChange={(e) => store.setPrefs({ primaryColor: e.target.value })}
          className="w-full h-8 bg-black border border-white/10 rounded"
        />
      </div>

      <div>
        <label className="text-[9px] text-slate-400 block mb-1 flex items-center gap-1">
          <Type className="w-3 h-3" /> Global Font
        </label>
        <select
          value={prefs.font}
          onChange={(e) => store.setPrefs({ font: e.target.value as any })}
          className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-cyan-400"
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[9px] text-slate-400 block mb-1 flex items-center gap-1">
          <Mic className="w-3 h-3" /> Voice Override
        </label>
        <select
          value={prefs.voiceOverride || ""}
          onChange={(e) => store.setPrefs({ voiceOverride: e.target.value || null })}
          className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-cyan-400"
        >
          <option value="">User Choice</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              Force: {v.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="outline"
        className="w-full text-[10px] border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black"
        onClick={confirmReset}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Force Master Reset
      </Button>
    </div>
  );
}
