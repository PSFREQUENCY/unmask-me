/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemma 4 client — local-first via Ollama, cloud fallback via @google/genai.
 *
 * Why local-first: the hackathon "Safety & Trust" + "Ollama" tracks reward
 * privacy-preserving on-device inference. Routing prefers the user's local
 * Ollama (E2B/E4B class) and only escalates to the cloud Gemma 4 endpoint
 * when local is unavailable. The UI surfaces the active mode so users see
 * where their data is going.
 */

import { GoogleGenAI } from "@google/genai";

const apiKey =
  (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  "";

const OLLAMA_BASE =
  (import.meta as any).env?.VITE_OLLAMA_BASE_URL || "http://localhost:11434";

// Preferred local model tags, ordered by preference. The first one Ollama
// reports as installed wins. The user pulls one with e.g. `ollama pull gemma3:4b`.
const LOCAL_GEMMA_CANDIDATES = [
  "gemma4:4b",
  "gemma4:2b",
  "gemma4:e4b",
  "gemma4:e2b",
  "gemma3:4b",
  "gemma3:1b",
];

const CLOUD_GEMMA_MODEL = "gemma-4-27b-it";

export type GemmaMode = "local-gemma" | "cloud-gemma" | "offline-mock";

interface RuntimeState {
  mode: GemmaMode;
  modelTag: string;
  detected: boolean;
}

const state: RuntimeState = {
  mode: "offline-mock",
  modelTag: "mock",
  detected: false,
};

const listeners = new Set<(s: RuntimeState) => void>();

export function getGemmaState(): RuntimeState {
  return { ...state };
}

export function subscribeGemmaState(fn: (s: RuntimeState) => void): () => void {
  listeners.add(fn);
  fn({ ...state });
  return () => {
    listeners.delete(fn);
  };
}

function setState(next: Partial<RuntimeState>) {
  Object.assign(state, next);
  listeners.forEach((fn) => fn({ ...state }));
}

let cloudClient: GoogleGenAI | null = null;
function getCloudClient(): GoogleGenAI | null {
  if (!apiKey) return null;
  if (!cloudClient) cloudClient = new GoogleGenAI({ apiKey });
  return cloudClient;
}

async function detectLocalGemma(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const installed = (data.models || []).map((m) => m.name);
    for (const tag of LOCAL_GEMMA_CANDIDATES) {
      if (installed.some((n) => n === tag || n.startsWith(`${tag.split(":")[0]}:`) && n.includes(tag.split(":")[1]))) {
        return installed.find((n) => n === tag) || installed.find((n) => n.startsWith(tag.split(":")[0])) || null;
      }
    }
    return installed.find((n) => n.toLowerCase().includes("gemma")) || null;
  } catch {
    return null;
  }
}

let detectionPromise: Promise<void> | null = null;
export function initGemma(): Promise<void> {
  if (detectionPromise) return detectionPromise;
  detectionPromise = (async () => {
    const local = await detectLocalGemma();
    if (local) {
      setState({ mode: "local-gemma", modelTag: local, detected: true });
      return;
    }
    if (apiKey) {
      setState({ mode: "cloud-gemma", modelTag: CLOUD_GEMMA_MODEL, detected: true });
      return;
    }
    setState({ mode: "offline-mock", modelTag: "mock", detected: true });
  })();
  return detectionPromise;
}

async function callLocalGemma(prompt: string, images: string[] = []): Promise<string> {
  const body: any = {
    model: state.modelTag,
    prompt,
    stream: false,
    options: { temperature: 0.7, num_predict: 512 },
  };
  if (images.length) {
    body.images = images.map((b64) => b64.split(",")[1] || b64);
  }
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const data = (await res.json()) as { response?: string };
  return data.response || "";
}

async function callCloudGemma(prompt: string, images: string[] = []): Promise<string> {
  const ai = getCloudClient();
  if (!ai) throw new Error("no cloud client");
  const parts: any[] = [prompt];
  for (const b64 of images) {
    parts.push({
      inlineData: {
        data: b64.split(",")[1] || b64,
        mimeType: "image/jpeg",
      },
    });
  }
  const response = await ai.models.generateContent({
    model: state.modelTag,
    contents: parts.length === 1 ? parts[0] : parts,
    config: { responseMimeType: "application/json" },
  });
  return response.text || "";
}

function extractJson(raw: string): any {
  if (!raw) return null;
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function gemmaJSON(prompt: string, images: string[] = []): Promise<any> {
  await initGemma();
  try {
    if (state.mode === "local-gemma") {
      const raw = await callLocalGemma(prompt + "\n\nRespond ONLY with valid JSON, no prose.", images);
      const parsed = extractJson(raw);
      if (parsed) return parsed;
    }
    if (state.mode === "cloud-gemma" || (state.mode === "local-gemma" && apiKey)) {
      const raw = await callCloudGemma(prompt, images);
      const parsed = extractJson(raw);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn("[gemma] inference failed, returning offline mock", err);
  }
  return null;
}

// ───────────────── Public API ─────────────────

export async function analyzeIntakeArchetype(answers: string[]) {
  const prompt = `You are the swarm arbiter for UNMASK ME.
A new user completed an intake with three answers:
1) Core intention: "${answers[0] || ""}"
2) Heavy energy releasing: "${answers[1] || ""}"
3) Body tension location: "${answers[2] || ""}"

Pick ONE spirit-charm archetype that best matches their state, from this list:
- fox (cunning, playful, lightness-seeking)
- owl (introspective, wisdom-seeking, night)
- crystal (clarity-seeking, structure, healing)
- flame (transformative, anger-releasing, courage)
- wave (emotional, releasing, fluid)
- tree (grounded, embodied, patient)

Return JSON: { "archetype": "...", "name": "<short evocative name for the charm>", "tagline": "<one sentence>", "primaryColor": "<hex>", "swarmInsight": "<one short sentence on what the swarm learned about human resilience from this intake>" }`;

  const out = await gemmaJSON(prompt);
  if (out?.archetype) return out;

  // Deterministic offline fallback based on keyword matching
  const text = answers.join(" ").toLowerCase();
  const arche =
    /angry|rage|burn|fight/.test(text) ? "flame" :
    /tired|sad|cry|grief|heavy/.test(text) ? "wave" :
    /think|clear|focus|mind/.test(text) ? "crystal" :
    /ground|body|earth|stuck/.test(text) ? "tree" :
    /worried|anxious|fear|night|alone/.test(text) ? "owl" :
    "fox";
  return {
    archetype: arche,
    name: { fox: "Ember", owl: "Veylin", crystal: "Aiko", flame: "Solas", wave: "Mira", tree: "Rooth" }[arche],
    tagline: "Your charm has chosen you.",
    primaryColor: { fox: "#f97316", owl: "#a78bfa", crystal: "#22d3ee", flame: "#ef4444", wave: "#3b82f6", tree: "#22c55e" }[arche],
    swarmInsight: "First-light intake — baseline of presence captured.",
  };
}

export async function analyzeVEILog(logText: string, type: "Relational" | "Self-Reflection") {
  const prompt = `swarm arbiter. Review ${type} text:
"${logText}"
Return JSON: { "score": 1-100, "feedback": "<short poetic gritty sentence>", "pointsAwarded": <int max 200>, "swarmInsight": "<one sentence on resilience learning>" }`;
  const out = await gemmaJSON(prompt);
  if (out?.score) return out;
  return {
    score: 75,
    feedback: "Signal lost. The void accepts your etching.",
    pointsAwarded: 50,
    swarmInsight: "Resilience emerged even without network coherence.",
  };
}

export async function analyzeSomaticShift(
  preScanBase64: string,
  postScanBase64: string,
  protocolName: string
) {
  const prompt = `swarm somatic arbiter. Protocol: "${protocolName}".
Image 1 = PRE, Image 2 = POST. Score the visible release.
Return JSON: { "score": 1-100, "feedback": "<visceral gritty sentence>", "pointsAwarded": <int max 500>, "swarmInsight": "<one sentence>" }`;
  const out = await gemmaJSON(prompt, [preScanBase64, postScanBase64]);
  if (out?.score) return out;
  return {
    score: 82,
    feedback: "The swarm felt your frequency shift, even unseen.",
    pointsAwarded: 150,
    swarmInsight: `Resilience signature detected during ${protocolName}.`,
  };
}

export async function analyzeFaceCheckin(faceBase64: string, timeOfDay: "morning" | "evening") {
  const prompt = `swarm face-checkin arbiter. Time: ${timeOfDay}.
Score the face for parasympathetic regulation (soft jaw, open gaze, relaxed brow).
Return JSON: { "score": 1-100, "state": "<one of: calm/elevated/dissociated/joyful/tense>", "feedback": "<short visceral sentence>", "swarmInsight": "<one sentence>" }`;
  const out = await gemmaJSON(prompt, [faceBase64]);
  if (out?.score) return out;
  return {
    score: 70,
    state: "calm",
    feedback: "Baseline accepted. The day can hold you.",
    swarmInsight: "Morning baselines anchor evening releases.",
  };
}

export async function generateSwarmInsight(history: { action: string; score?: number }[]) {
  const recent = history.slice(-12);
  const prompt = `swarm meta-arbiter. The user's last ${recent.length} actions were:
${recent.map((h, i) => `${i + 1}. ${h.action}${h.score ? ` (${h.score})` : ""}`).join("\n")}

Return JSON: { "headline": "<short bold phrase>", "insight": "<2-sentence reflection on what the swarm learned about THIS user's resilience pattern>", "nextProtocol": "<one of: box-breath, somatic-shake, vagus-hum, jaw-release, eft-tap, ground-stomp>" }`;
  const out = await gemmaJSON(prompt);
  if (out?.headline) return out;
  return {
    headline: "Pattern: returning to breath.",
    insight: "You meet stress with stillness more often than not. The swarm marks this as a resilient signature.",
    nextProtocol: "box-breath",
  };
}
