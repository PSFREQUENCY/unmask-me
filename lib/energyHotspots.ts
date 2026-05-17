/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic energy hotspot generator.
 *
 * Hotspots are seeded by (centerLat, centerLng, hourOfDay) — same inputs
 * always produce the same anchors. This is intentional, not a bug. The
 * swarm shows "anchors of peace near you" as a felt, hourly-shifting
 * pattern, not as a Google Places lookup. No network calls, no PII.
 */

export type HotspotKind =
  | "park"
  | "plaza"
  | "studio"
  | "cafe"
  | "temple"
  | "water"
  | "crowd";

export interface EnergyHotspot {
  id: string;
  name: string;
  kind: HotspotKind;
  intensity: number; // 0..1
  lat: number;
  lng: number;
  description: string;
}

// ────────────── Seeded PRNG (mulberry32) ──────────────

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seedInt: number): () => number {
  let a = seedInt >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ────────────── Curated name pools ──────────────

const NAMES: Record<HotspotKind, string[]> = {
  park: [
    "Living Grove",
    "Hush Park",
    "Cedar Hollow",
    "Moss Commons",
    "Silver Fern Walk",
    "Quiet Meadow",
    "Lantern Glade",
    "Willow Bend",
  ],
  plaza: [
    "Sunwell Plaza",
    "Atrium Square",
    "Open Heart Court",
    "Bright Concourse",
    "Mercer Round",
    "Halcyon Steps",
  ],
  studio: [
    "Soft Light Studio",
    "Resonance Loft",
    "Vagus Sound Bath",
    "Slow Pulse Studio",
    "Inner Ear Atelier",
    "Breathwork Room",
  ],
  cafe: [
    "Low Hum Cafe",
    "Quiet Bean",
    "Long Table",
    "The Kindling",
    "Slow Pour",
    "Glasshouse Cafe",
  ],
  temple: [
    "Still Point Shrine",
    "Open Hand Temple",
    "Vow Chapel",
    "Lantern House",
    "Bell Garden",
  ],
  water: [
    "Tidal Edge",
    "Reflection Basin",
    "Riverwalk Bend",
    "Lockgate Pier",
    "Quiet Cove",
    "Mirror Pond",
  ],
  crowd: [
    "Market Hall",
    "Open Mic Corner",
    "Festival Mile",
    "Night Bazaar",
    "Drum Circle",
  ],
};

const DESCRIPTIONS: Record<HotspotKind, string> = {
  park: "Tree canopy, slow air. Drop the shoulders here.",
  plaza: "Open ground, daylight, low-stakes presence.",
  studio: "Held space for breath, sound, somatic work.",
  cafe: "Warm hum, soft lighting, social co-regulation.",
  temple: "Threshold space. Silence is welcome.",
  water: "Moving water resets the nervous system.",
  crowd: "High signal. Anchor first, then engage.",
};

// ────────────── Time-of-day weighting ──────────────

function intensityFor(kind: HotspotKind, hour: number, rand: number): number {
  // base curves per kind, peaks at certain hours
  const curves: Record<HotspotKind, (h: number) => number> = {
    park: (h) => bell(h, 8, 4) * 0.9,
    plaza: (h) => bell(h, 13, 3) * 0.85,
    studio: (h) => bell(h, 19, 4) * 0.95,
    cafe: (h) => (bell(h, 10, 3) + bell(h, 16, 3)) * 0.55,
    temple: (h) => (bell(h, 6, 3) + bell(h, 21, 3)) * 0.6,
    water: () => 0.78, // always-on
    crowd: (h) => bell(h, 20, 3) * 0.9,
  };
  const base = curves[kind](hour);
  // small deterministic jitter
  const jittered = base + (rand - 0.5) * 0.18;
  return clamp01(jittered);
}

function bell(x: number, mu: number, sigma: number): number {
  const d = (x - mu) / sigma;
  return Math.exp(-0.5 * d * d);
}

function clamp01(n: number): number {
  if (n < 0.05) return 0.05;
  if (n > 1) return 1;
  return n;
}

// ────────────── Generator ──────────────

const KIND_POOL: HotspotKind[] = [
  "park",
  "plaza",
  "studio",
  "cafe",
  "temple",
  "water",
  "crowd",
];

export function generateHotspots(
  centerLat: number,
  centerLng: number,
  hourOfDay: number,
): EnergyHotspot[] {
  const seedStr = `${centerLat.toFixed(2)}_${centerLng.toFixed(2)}_${hourOfDay}`;
  const rand = mulberry32(hashSeed(seedStr));
  const count = 6 + Math.floor(rand() * 5); // 6..10

  const used = new Map<HotspotKind, Set<string>>();
  const out: EnergyHotspot[] = [];

  for (let i = 0; i < count; i++) {
    const kind = KIND_POOL[Math.floor(rand() * KIND_POOL.length)];
    const namePool = NAMES[kind];
    if (!used.has(kind)) used.set(kind, new Set());
    const usedSet = used.get(kind)!;
    let name = namePool[Math.floor(rand() * namePool.length)];
    let guard = 0;
    while (usedSet.has(name) && guard < namePool.length) {
      name = namePool[Math.floor(rand() * namePool.length)];
      guard++;
    }
    if (usedSet.has(name)) name = `${name} ${i + 1}`;
    usedSet.add(name);

    const dLat = (rand() - 0.5) * 0.1; // ~0.05 deg radius
    const dLng = (rand() - 0.5) * 0.1;
    const intensity = intensityFor(kind, hourOfDay, rand());
    out.push({
      id: `${seedStr}_${i}`,
      name,
      kind,
      intensity,
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      description: `${DESCRIPTIONS[kind]} Seeded from time + location.`,
    });
  }
  return out;
}

// ────────────── Color tokens per kind ──────────────

export const KIND_COLORS: Record<
  HotspotKind,
  { fill: string; border: string; glow: string; label: string }
> = {
  park: {
    fill: "#10b981",
    border: "#047857",
    glow: "rgba(16,185,129,0.55)",
    label: "Park",
  },
  water: {
    fill: "#06b6d4",
    border: "#0e7490",
    glow: "rgba(6,182,212,0.55)",
    label: "Water",
  },
  studio: {
    fill: "#8b5cf6",
    border: "#6d28d9",
    glow: "rgba(139,92,246,0.55)",
    label: "Studio",
  },
  temple: {
    fill: "#f59e0b",
    border: "#b45309",
    glow: "rgba(245,158,11,0.55)",
    label: "Temple",
  },
  cafe: {
    fill: "#f97316",
    border: "#c2410c",
    glow: "rgba(249,115,22,0.55)",
    label: "Cafe",
  },
  plaza: {
    fill: "#ec4899",
    border: "#be185d",
    glow: "rgba(236,72,153,0.55)",
    label: "Plaza",
  },
  crowd: {
    fill: "#ef4444",
    border: "#991b1b",
    glow: "rgba(239,68,68,0.55)",
    label: "Crowd",
  },
};

// ────────────── Default city centers ──────────────

export interface CityOption {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const DEFAULT_CITIES: CityOption[] = [
  { id: "nyc", label: "NYC", lat: 40.7128, lng: -74.006 },
  { id: "sf", label: "SF", lat: 37.7749, lng: -122.4194 },
  { id: "london", label: "London", lat: 51.5074, lng: -0.1278 },
  { id: "tokyo", label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { id: "berlin", label: "Berlin", lat: 52.52, lng: 13.405 },
];
