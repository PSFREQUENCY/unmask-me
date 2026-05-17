/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Web Speech API wrapper exposed as "Kokoro voices".
 * Swap-ready interface: the public surface (speak / cancel / list) stays stable
 * so a real Kokoro TTS endpoint can replace the implementation without UI changes.
 */

export type KokoroVoice = "Echo" | "Nova" | "Zenith" | "Luna" | "Sage" | "Iris";

interface VoiceProfile {
  name: KokoroVoice;
  label: string;
  rate: number;
  pitch: number;
  prefer: RegExp[];
}

const PROFILES: Record<KokoroVoice, VoiceProfile> = {
  Echo: { name: "Echo", label: "Echo · Deep grounding", rate: 0.85, pitch: 0.6, prefer: [/google.*uk.*english.*male/i, /daniel/i, /alex/i, /male/i] },
  Nova: { name: "Nova", label: "Nova · Bright lift", rate: 1.05, pitch: 1.3, prefer: [/samantha/i, /victoria/i, /female/i] },
  Zenith: { name: "Zenith", label: "Zenith · Focused clarity", rate: 0.95, pitch: 0.95, prefer: [/google.*us.*english/i, /tessa/i] },
  Luna: { name: "Luna", label: "Luna · Hush calm", rate: 0.8, pitch: 1.1, prefer: [/karen/i, /moira/i, /serena/i, /female/i] },
  Sage: { name: "Sage", label: "Sage · Elder warmth", rate: 0.78, pitch: 0.85, prefer: [/fiona/i, /tessa/i, /female/i] },
  Iris: { name: "Iris", label: "Iris · Soft glow", rate: 0.92, pitch: 1.2, prefer: [/google.*english/i, /samantha/i, /female/i] },
};

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }
    const handler = () => {
      cachedVoices = synth.getVoices();
      synth.removeEventListener("voiceschanged", handler);
      resolve(cachedVoices);
    };
    synth.addEventListener("voiceschanged", handler);
    // safety: resolve after 800ms even if event never fires
    setTimeout(() => {
      cachedVoices = synth.getVoices();
      resolve(cachedVoices);
    }, 800);
  });
}

function pickSystemVoice(profile: VoiceProfile, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  for (const re of profile.prefer) {
    const hit = voices.find((v) => re.test(v.name) || re.test(v.voiceURI));
    if (hit) return hit;
  }
  return voices.find((v) => v.lang.startsWith("en")) || voices[0];
}

export interface SpeakOptions {
  voice?: KokoroVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onStart?: () => void;
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const voices = cachedVoices.length ? cachedVoices : await loadVoices();
  const profile = PROFILES[opts.voice || "Echo"];
  const sys = pickSystemVoice(profile, voices);
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  if (sys) utt.voice = sys;
  utt.rate = opts.rate ?? profile.rate;
  utt.pitch = opts.pitch ?? profile.pitch;
  utt.volume = opts.volume ?? 0.9;
  if (opts.onStart) utt.onstart = () => opts.onStart!();
  if (opts.onEnd) utt.onend = () => opts.onEnd!();
  synth.speak(utt);
}

export function cancel(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function listVoices(): Array<{ name: KokoroVoice; label: string }> {
  return Object.values(PROFILES).map((p) => ({ name: p.name, label: p.label }));
}

// Ambient meditation tracks — synthesized via WebAudio so the build has no
// third-party audio dependency. Each track is a layered drone.
let ambientCtx: AudioContext | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

export type AmbientTrack = "drift-low" | "shimmer" | "hearth" | "tidewater" | "void-bell";

const TRACKS: Record<AmbientTrack, { freqs: number[]; type: OscillatorType }> = {
  "drift-low": { freqs: [110, 165, 220], type: "sine" },
  shimmer: { freqs: [330, 440, 660, 880], type: "triangle" },
  hearth: { freqs: [82, 110, 138.6], type: "sawtooth" },
  tidewater: { freqs: [196, 261.6, 392], type: "sine" },
  "void-bell": { freqs: [55, 110, 220, 440], type: "sine" },
};

export function startAmbient(track: AmbientTrack, volume = 0.18): void {
  stopAmbient();
  if (typeof window === "undefined") return;
  const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtor) return;
  ambientCtx = new AudioCtor();
  const cfg = TRACKS[track];
  for (const f of cfg.freqs) {
    const osc = ambientCtx!.createOscillator();
    const gain = ambientCtx!.createGain();
    osc.type = cfg.type;
    osc.frequency.value = f;
    gain.gain.value = 0;
    osc.connect(gain).connect(ambientCtx!.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(volume / cfg.freqs.length, ambientCtx!.currentTime + 1.5);
    ambientNodes.push({ osc, gain });
  }
}

export function stopAmbient(): void {
  if (!ambientCtx) return;
  const ctx = ambientCtx;
  for (const n of ambientNodes) {
    n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    n.osc.stop(ctx.currentTime + 0.7);
  }
  setTimeout(() => {
    ctx.close();
  }, 800);
  ambientCtx = null;
  ambientNodes = [];
}

export function listTracks(): AmbientTrack[] {
  return Object.keys(TRACKS) as AmbientTrack[];
}
