# UNMASK ME — A Local-First Gemma 4 Sanctuary for the Shadow Self

**UNMASK ME is a private, on-device nervous-system reset built on Gemma 4 by PHENOMENAL MARK (handle PSFREQUENCY).** It runs six somatic protocols, forges a 3D Spirit Charm from a three-question intake, and grows an adaptive Swarm — all without a single face frame, voice sample, or reflection leaving the user's machine.

Built for the **Gemma 4 Good Hackathon** — Main Track, Impact Track (Safety & Trust, $10K), and Special Technology Track (Ollama, $10K).

---

## The condition we are building against

The outer world is not promoting inner peace.

People wake up to push notifications and go to sleep mid-doom-scroll. The feed rewards performance of okay-ness — the curated laugh, the polished selfie, the productivity flex — and punishes the panic, the grief, the dissociation, the shadow self underneath. Institutional trust is corroding in public. Surveillance has migrated from the public square into the breath, the journal entry, the heart-rate read. Wellness apps that promised regulation now sell the regulation back to the user as data.

This is the gap UNMASK ME is built to close. Technology can either extract from humanity or enhance it. We chose the second.

UNMASK ME treats inner peace as a default state to return to, not a premium feature. It treats on-device inference not as a technical preference but as a moral one: when the topic is the shadow self, your face cannot leave the room.

## The mask

What the user performs online vs. what the user actually carries:

| Performs | Carries |
| --- | --- |
| Amusement that is not joy | Doom-scroll-induced low-grade panic |
| Productivity that is not aliveness | Corruption-fatigue and institutional grief |
| Calm that is dissociation in a filter | Body-held tension no journal entry can release |
| Confidence that is fawn response | Sympathetic activation ten hours a day |

UNMASK ME sits at the seam. The flagship interaction is a pre/post somatic shift: Gemma 4 reads the face before a six-minute reset and again after, and scores the visible parasympathetic release. The mask comes off measurably.

## Why local-first Gemma 4 is the entire ethic

When the topic is the shadow self, on-device inference is not a feature. It is the only honest path.

UNMASK ME routes every Gemma 4 call through a three-tier client (`lib/gemma.ts`):

1. **Tier 1 — Local Gemma 4 via Ollama** at `http://localhost:11434`. Model tag preference: `gemma4:4b → gemma4:2b → gemma4:e4b → gemma4:e2b → gemma3:4b → gemma3:1b`. First tag pulled wins. UI badge: "Local Gemma 4."
2. **Tier 2 — Cloud Gemma 4 via Google AI Studio**, `gemma-4-27b-it` via `@google/genai`, only when Ollama is unreachable AND a `GEMINI_API_KEY` is set. UI badge: "Cloud Gemma 4."
3. **Tier 3 — Offline deterministic mock.** Keyword-matched archetype fallback so the app is usable with zero connectivity and zero local model. UI badge: "Offline mock."

This is what the **Ollama Special Tech Track** asks for: not a thin wrapper, but a product whose default path is on-device inference, with cloud as graceful degradation. And it is what the **Safety & Trust Impact Track** asks for: a transparent inference path the user can verify in their own DevTools.

Multimodal calls (pre/post face frames) use identical JSON contracts across tiers. Base64-encoded JPEG frames are attached as `images` to the Ollama generate endpoint or as `inline_data` parts to Google AI Studio. Same prompt, same downstream UI, swappable backends.

## How it works

UNMASK ME runs five Gemma 4 functions, all routed through the same client.

| # | Function | Input | Gemma 4 output |
|---|---|---|---|
| 1 | Intake → archetype | Three short text answers | One of six charm archetypes (Fox, Owl, Crystal, Flame, Wave, Tree) |
| 2 | Pre/post somatic shift | Two face frames (JPEG base64, in-memory) | Release score 0–100 + visceral one-line feedback + Peace Points |
| 3 | Reflection | User's etched self-reflection text | Sincerity score + one-line poetic mirror |
| 4 | Swarm insight | Rolling 200-event log | `{ headline, insight, nextProtocol }` describing this user's resilience pattern |
| 5 | Daily check-in | Morning intention text or evening face frame | Tone-tagged nudge or recovery suggestion |

### Spirit Charm

Six procedural 3D R3F components — **Fox, Owl, Crystal, Flame, Wave, Tree** — each grows visible detail as the user's level rises. The intake selects the archetype. The charm lives on the device and has no shadow copy on a server.

### Six somatic protocols

**Box Breathe** (4-4-4-4 cadence) · **Somatic Shake** (3-minute discharge) · **Vagus Hum** (sustained tone, mic-amplitude feedback via Web Audio `AnalyserNode`) · **Jaw Release** · **EFT Tap** · **Ground Stomp**. Each opens with a pre-mood scan and closes with a post-mood scan. Gemma 4 grades the shift.

### Morning + evening check-ins

Morning intention prompt + face frame; Gemma 4 tags the day's likely tone. Evening face review; Gemma 4 suggests a recovery protocol if residual sympathetic activation is detected. Both reuse the multimodal contract and the useRef-then-discard frame handling.

### The Swarm graph

Each event (protocol, reflection, anchor, check-in) is logged with kind tag + optional score. Gemma 4 reads the most recent twelve events and returns a meta-insight. The Swarm page renders the log as a force-directed knowledge graph; the Reputation page surfaces the dominant pattern in plain language.

## What we keep, what we never touch

Privacy posture, stated as testable claims:

- **Face frames** live as JavaScript base64 strings in a `useRef` for ~200ms while Gemma 4 reads them, then the ref is cleared. No `<img>` rendered, no upload as a file, no disk write.
- **Voice (Vagus Hum)** is processed by a Web Audio `AnalyserNode` in-browser. No audio is recorded, transcribed, or transmitted.
- **Reflections** are stored in `localStorage` and sent to Gemma 4 for a sincerity score. They never reach a third-party backend (there is no backend).
- **Geolocation** lives in React state during the session. Latitude/longitude never leaves the browser.
- **Swarm event log** lives in `localStorage`, capped at 200 events. IndexedDB is not used.
- **Account model** is email-only — no password, no profile, no telemetry, no analytics, no third-party trackers.
- **Inference path** is surfaced in the top-right `<GemmaBadge />` at all times so the user always knows whether their data is going to localhost, Google AI Studio, or nowhere.

The 30-second verification: open DevTools → Network tab → run a somatic reset → the only outbound calls are to `localhost:11434`. The Kaggle notebook (`kaggle-notebook/unmask-me-gemma4-demo.ipynb`) walks every Gemma 4 call cell-by-cell with live responses, and the in-app **Demo Mode** in the admin dashboard runs the same calls against the live UI.

## Why this is real, not a demo

- **Gemma 4 calls are functional, not faked.** Five live functions, one multimodal. None are stubs.
- **Privacy claims are testable.** Open the network tab, open `localStorage`, inspect `useRef`, read `lib/gemma.ts`. The claims survive a skeptical engineer.
- **Adaptive learning is real.** Swarm graph grows visibly; Reputation page reads from real event logs; next-protocol recommendations come from the user's actual recent behavior.

## What's next

UNMASK ME is the first product in an open-source pattern for human-flourishing AI tools — small, on-device models (Gemma 4 E2B/E4B, Llama 3.2 1B/3B) that bring the most personal computations *back* into the user's machine.

Post-hackathon roadmap: open-source the routing client (`lib/gemma.ts`) as `local-first-gemma`; publish the multimodal pre/post somatic-shift prompt as a public spec; pilot in harm-reduction sites, school counseling rooms, recovery groups; release the six-protocol audio pack under Creative Commons.

The thesis is small and stubborn: technology can be used to enhance humanity. UNMASK ME is one product-shaped argument for it.

## Try it

- Live demo: https://ai.studio/apps/b8e3b826-5959-4dd5-a24d-8d4450e3dc40
- Code: GITHUB_URL_PLACEHOLDER
- Notebook: see `kaggle-notebook/unmask-me-gemma4-demo.ipynb`
- Video (3 min): public YouTube link in the Kaggle writeup

```bash
ollama pull gemma3:4b && npm install && npm run dev
```

That is the whole local setup.

---

*Author: PHENOMENAL MARK (PSFREQUENCY) — artist, filmmaker, blockchain pioneer, AI architect.*

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "UNMASK ME",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web",
  "description": "A local-first Gemma 4 nervous-system reset by PHENOMENAL MARK that runs six somatic protocols, forges a 3D Spirit Charm, and grows an adaptive Swarm — all on-device. Built for the Gemma 4 Good Hackathon.",
  "url": "GITHUB_URL_PLACEHOLDER",
  "codeRepository": "GITHUB_URL_PLACEHOLDER",
  "softwareVersion": "1.0.0",
  "license": "https://www.apache.org/licenses/LICENSE-2.0",
  "author": {
    "@type": "Person",
    "name": "PHENOMENAL MARK",
    "alternateName": "PSFREQUENCY",
    "jobTitle": "Artist, Filmmaker, Blockchain Pioneer, AI Architect"
  },
  "creator": {
    "@type": "Person",
    "name": "PHENOMENAL MARK",
    "alternateName": "PSFREQUENCY"
  },
  "isAccessibleForFree": true,
  "featureList": [
    "Local-first Gemma 4 inference via Ollama",
    "Multimodal pre/post somatic face-shift scoring",
    "Six procedural 3D Spirit Charm archetypes",
    "Six somatic protocols (box breath, somatic shake, vagus hum, jaw release, EFT tap, ground stomp)",
    "Adaptive Swarm knowledge graph",
    "Email-only account, no telemetry, no backend"
  ]
}
</script>
```
