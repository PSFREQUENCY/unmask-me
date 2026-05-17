/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Six somatic reset protocols played in sequence inside the VAI flow.
 * Timings tuned so the full carousel lands near six minutes total.
 */

import type { KokoroVoice } from "@/lib/voice";
import type { AmbientTrack } from "@/lib/voice";

export interface Protocol {
  id: string;
  name: string;
  desc: string;
  durationSec: number;
  track: AmbientTrack;
  preferredVoice: KokoroVoice;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "box-breathe",
    name: "Box Breathing",
    desc: "Four-count box: inhale, hold, exhale, hold.",
    durationSec: 80,
    track: "drift-low",
    preferredVoice: "Luna",
  },
  {
    id: "somatic-shake",
    name: "Somatic Shake",
    desc: "Shake the hands, the arms, the whole body. Discharge stored charge.",
    durationSec: 60,
    track: "shimmer",
    preferredVoice: "Nova",
  },
  {
    id: "vagus-hum",
    name: "Vagus Hum",
    desc: "Long hum on every exhale to wake the vagus nerve.",
    durationSec: 60,
    track: "tidewater",
    preferredVoice: "Sage",
  },
  {
    id: "jaw-release",
    name: "Jaw Release",
    desc: "Open the mouth wide, stretch the jaw, sigh.",
    durationSec: 45,
    track: "void-bell",
    preferredVoice: "Echo",
  },
  {
    id: "eft-tap",
    name: "EFT Tapping",
    desc: "Tap the collarbone, name the truth: I am safe, I am here.",
    durationSec: 45,
    track: "shimmer",
    preferredVoice: "Iris",
  },
  {
    id: "ground-stomp",
    name: "Ground Stomp",
    desc: "Stomp the feet. Feel the floor. Return to earth.",
    durationSec: 45,
    track: "hearth",
    preferredVoice: "Echo",
  },
];

export function totalCarouselSec(): number {
  return PROTOCOLS.reduce((acc, p) => acc + p.durationSec, 0);
}
