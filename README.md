# UNMASK ME

> **UNMASK ME is a local-first Gemma 4 nervous-system sanctuary by PHENOMENAL MARK (PSFREQUENCY)** — six somatic protocols, a 3D Spirit Charm, and an adaptive Swarm, all on-device. Submitted to the **Gemma 4 Good Hackathon** (Main Track + Impact Track: Safety & Trust + Special Tech Track: Ollama).

The outer world is not promoting inner peace. Fear loops, doom scrolling, performance-of-okay-ness and institutional corrosion have pushed the shadow self off the feed and into the body. UNMASK ME uses technology to enhance humanity — Gemma 4 runs on the user's device, reads the face before and after a six-minute somatic reset, scores the release, and grows a Spirit Charm that learns who they are without their data ever leaving the room.

- **Live demo**: https://ai.studio/apps/b8e3b826-5959-4dd5-a24d-8d4450e3dc40
- **Kaggle notebook**: `kaggle-notebook/unmask-me-gemma4-demo.ipynb` — upload as the Code Resource on the writeup.
- **Repository**: GITHUB_URL_PLACEHOLDER

---

## Why this exists

Most wellness apps make the same bargain: your face, your journal, your tension — in exchange for a feature. UNMASK ME refuses. The Gemma 4 models the hackathon ships with (E2B / E4B / 4B class via Ollama) are small enough to live on a phone, so we put them there. Every face frame is held in RAM for ~200ms while Gemma 4 reads it, then discarded. The adaptive Swarm — the layer that watches what regulates *you* — lives in your browser's `localStorage`. No backend. Email-only account. No telemetry.

This is what the **Safety & Trust** track asks for, and it is what the **Ollama Special Tech** track asks for — implemented as the default path, not a marketing line.

## What UNMASK ME does

- **Six-protocol nervous-system reset** — Box Breathe, Somatic Shake, Vagus Hum, Jaw Release, EFT Tap, Ground Stomp — with voice guidance (Kokoro-style via Web Speech API) and ambient drone tracks. Pre/post face frames are sent to Gemma 4 for a multimodal shift score.
- **Spirit Charm** — six procedural 3D archetypes (Fox, Owl, Crystal, Flame, Wave, Tree). Intake answers pick the archetype. The charm grows with the user's level.
- **Adaptive Swarm** — every event (protocol, reflection, anchor, check-in) feeds a knowledge graph. Gemma 4 reads the rolling 200-event log and surfaces what it learned about *this user's* resilience pattern.
- **Daily check-ins** — morning intention + evening face review, both nudged at appropriate times, both call Gemma 4 with a face frame that is never stored.
- **Energy map** — geolocate with explicit consent (in-browser only), see seeded high-energy hotspots (parks, plazas, studios, water), anchor a rift to send a calm signal to the swarm.
- **Settings + admin** — three-dot top-left opens preferences, privacy, partner application, and a local-secret-gated admin dashboard (theme, voice, contact inbox, app stats, Demo Mode).

## Architecture map (reframed around the new problem)

```
src/App.tsx                      # router + boot gate + Gemma 4 init
components/
  BootSequence.tsx               # intake (6 deterministic procedural patterns) — the entry from the doom-scroll back into the body
  SpiritCharm3D.tsx              # archetype dispatcher — six procedural avatars
  charms/{Fox,Owl,Crystal,Flame,Wave,Tree}.tsx
  protocols/{BoxBreathe,SomaticShake,VagusHum,JawRelease,EFTTap,GroundStomp}.tsx
  admin/{ContactInbox,AppStats,ThemeControls,DemoMode}.tsx
  SettingsPanel.tsx              # three-dot menu + admin entry
  DailyNudge.tsx                 # morning / evening check-in cue
  Walkthrough.tsx                # interactive five-step tour
  GemmaBadge.tsx                 # active inference path indicator (Local | Cloud | Offline)
pages/
  Home.tsx                       # charm stage + meditate
  Unmask.tsx                     # progression + reflection log
  VAI.tsx                        # six-protocol reset (default), face check-in (morning|evening)
  Swarm.tsx                      # adaptive knowledge graph
  Map.tsx                        # geolocation + energy hotspots
  Connect.tsx                    # resonant souls + global pulse
  Reputation.tsx                 # adaptive learning insights + ledger
lib/
  gemma.ts                       # Gemma 4 client — local-first three-tier router
  store.ts                       # localStorage-backed single store
  voice.ts                       # Web Speech wrapper (Kokoro voices) + WebAudio drones
  protocols.ts                   # six-protocol metadata
  swarmGraph.ts                  # graph derivation from event log
  energyHotspots.ts              # deterministic seeded hotspot generator
```

## How Gemma 4 routes

`lib/gemma.ts` is the only AI surface. It tries, in order:

1. **Local Gemma 4 via Ollama** at `http://localhost:11434` — preferred for privacy. Model-tag candidates: `gemma4:4b`, `gemma4:2b`, `gemma4:e4b`, `gemma4:e2b`, `gemma3:4b`, `gemma3:1b`. First installed wins.
2. **Cloud Gemma 4 via Google AI Studio** — `gemma-4-27b-it` via `@google/genai`, only when a `GEMINI_API_KEY` is set and Ollama is unavailable.
3. **Offline deterministic mock** — keyword-matched archetype fallback so the app is usable with zero connectivity and zero local model.

The active path is surfaced in the UI top-right (`<GemmaBadge />`) so the user always knows where their data is going.

## Quick start

```bash
# 1. Pull a local Gemma model
ollama pull gemma3:4b           # works today; gemma4:4b will be auto-picked when Google publishes it

# 2. Install + run
npm install
npm run dev                     # http://localhost:3000

# 3. (Optional) cloud fallback
cp .env.example .env.local      # add GEMINI_API_KEY for cloud Gemma 4
```

## Privacy posture

Testable claims, each with a named entity and a specific scope.

- **Face frames** — JavaScript base64 strings held in a React `useRef` for ~200ms, then cleared. Never written to disk. Never uploaded as a file. No `<img>` rendered to the DOM.
- **Voice (Vagus Hum)** — processed by a Web Audio `AnalyserNode` in-browser. No audio is recorded, transcribed, or transmitted.
- **Reflections** — stored in `localStorage` (key: `unmaskme.v1`). Sent to Gemma 4 for a sincerity score. No third-party backend exists.
- **Geolocation** — latitude/longitude lives only in React state during the session, populated by the browser's `navigator.geolocation` API with an explicit consent card.
- **Event log** — capped at 200 most recent events. `localStorage` only. **IndexedDB is not used.**
- **Account model** — email-only. No password, no profile, no telemetry, no analytics, no third-party trackers.
- **Inference transparency** — `<GemmaBadge />` shows the active path (Local | Cloud | Offline) at all times.

The 30-second proof: open DevTools → Network tab → run a somatic reset → the only outbound traffic is to `localhost:11434`.

## Environment variables

See `.env.example`. The notable ones:

- `GEMINI_API_KEY` — optional; enables Tier 2 (cloud Gemma 4) fallback when Ollama is unreachable.
- `VITE_GOOGLE_MAPS_KEY` — optional; powers the Map page. Restrict to your domain + Maps JS API + daily quota cap.
- `VITE_ADMIN_SECRET` — local secret gating the admin dashboard. Change before deploying.

## Verifying the Gemma 4 path locally

```bash
ollama pull gemma3:4b
ollama list                                          # confirm gemma3:4b is present
curl -s http://localhost:11434/api/tags | jq .       # JSON list
npm run dev
# Open http://localhost:3000 — the top-right badge should say "Local Gemma 4"
```

## Hackathon mapping

- **Main Track** — UNMASK ME is a working, video-demonstrated product built on Gemma 4 with real multimodal calls.
- **Impact Track — Safety & Trust ($10K)** — the entire product is a transparency demonstration. The inference path is shown, face frames are never stored, the Swarm runs in the browser.
- **Special Technology Track — Ollama ($10K)** — local Gemma 4 inference is the default, not the fallback.

## Credits

- Author: **PHENOMENAL MARK** (handle **PSFREQUENCY**) — artist, filmmaker, blockchain pioneer, AI architect.
- Built with: React 19, Vite 6, React Three Fiber, Tailwind 4, Ollama, `@google/genai`.

## License

Apache-2.0. See `LICENSE`.
