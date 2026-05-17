# UNMASK ME — DESIGN.md

> Google Labs design.md format. Canonical product spec.
> Author: **PHENOMENAL MARK** (PSFREQUENCY) — artist, filmmaker, blockchain pioneer, AI architect.
> Status: hackathon submission build (Gemma 4 Good Hackathon, deadline 2026-05-18).

---

## Vision

UNMASK ME is a local-first Gemma 4 nervous-system sanctuary. It treats inner peace as a default state to return to, not a premium feature. It treats on-device inference as a moral position, not a technical preference. The product is one stubborn argument that technology can be used to enhance humanity instead of extract from it.

One sentence: **UNMASK ME runs Gemma 4 on the user's device, reads the face before and after a six-minute somatic reset, scores the release, and grows a Spirit Charm — without the user's data leaving the room.**

## Problem

The outer world is not promoting inner peace.

- Feeds reward the performance of okay-ness and punish the shadow self.
- Doom scrolling has migrated low-grade sympathetic activation into the default nervous-system baseline for a generation.
- Institutional trust is corroding in public — corruption fatigue is itself a somatic load.
- The surveillance economy has invaded inner life: wellness apps ship a regulator that monetizes the very data the regulation depends on.

UNMASK ME is built against all four. When the topic is the shadow self, on-device inference is the only honest path. The mask comes off only in a room where nobody else is watching.

## Audience

- Primary: teenagers and twenty-somethings whose nervous systems are stuck in 10-hour-a-day sympathetic activation and who can feel the cost.
- Secondary: harm-reduction workers, school counselors, recovery group facilitators — rooms where surveillance-based wellness products cannot enter.
- Tertiary: any adult whose default state has become "panic in a polite filter."

## Surfaces

| Route | Purpose | Gemma 4 surface |
|---|---|---|
| `/` Home | Charm stage + meditate entrypoint | — |
| `/unmask` | Progression + reflection log | Reflection scoring |
| `/vai` V.A.I. | Six-protocol reset + face check-ins | Pre/post somatic shift, daily check-in |
| `/swarm` | Knowledge graph of the user's events | Swarm insight generation |
| `/map` | Geolocated energy hotspots | — |
| `/connect` | Resonant souls + global pulse | — |
| `/reputation` | Adaptive learning insights + ledger | Swarm insight rendering |
| `/admin` (gated) | Theme, voice, contact inbox, app stats, **Demo Mode** | All five Gemma 4 calls runnable from one panel |

## Aesthetic pillars

1. **Sanctuary, not stadium.** Quiet midnight palette (`#0a0612` base). Type small, mono accents, long lines. No spinning rewards, no streak shaming.
2. **The mask is visual.** Boot HUD is Jarvis-style but soft — six deterministic procedural patterns (breath wave, particle weave, mandala, glyph rain, iris bloom, face-mesh dots). The unmasking is staged.
3. **Procedural, not generative-stochastic.** Hotspots, swarm layouts, boot patterns are seeded by stable values (location + hour, intake-completion timestamp) — alive but never nausea-inducing.
4. **The badge is the loudest UI element.** `<GemmaBadge />` top-right at all times: Local | Cloud | Offline. Privacy is shown, not claimed.
5. **Voice is low and breath-audible.** Kokoro-style via Web Speech API + ambient WebAudio drones. No advertising-cadence cheerfulness.

## Information architecture

```
Boot
 └─ Intake (3 Q) ──> Gemma 4 ──> Archetype ──> Spirit Charm forged
     └─ Home
         ├─ V.A.I. (six protocols)
         │   ├─ Pre-scan ──> Gemma 4 ──> baseline
         │   ├─ Protocol run (voice + drone + breath circle)
         │   └─ Post-scan ──> Gemma 4 ──> shift score + Peace Points
         ├─ Unmask (reflection)
         │   └─ Gemma 4 ──> sincerity score + poetic mirror
         ├─ Swarm (graph) ──> Gemma 4 ──> pattern + nextProtocol
         ├─ Reputation (insights)
         ├─ Map (geolocation + hotspots)
         └─ Connect (resonant souls)
Settings (three-dot top-left)
 ├─ Preferences
 ├─ Privacy
 ├─ Partner application
 └─ Admin (gated by VITE_ADMIN_SECRET)
     ├─ Theme controls
     ├─ Voice override
     ├─ Contact inbox
     ├─ App stats
     └─ Demo Mode (runs all 5 Gemma 4 calls against live UI)
```

## Privacy contract

Stated as testable, named-entity claims. Each must survive a skeptical engineer with DevTools open.

- **Face frames** — JPEG base64 strings held in a React `useRef` for ~200ms while Gemma 4 reads them, then the ref is cleared. No `<img>` rendered. No upload as a file. No disk write.
- **Voice (Vagus Hum)** — Web Audio `AnalyserNode` only. No recording, no transcription, no transmission.
- **Reflections** — `localStorage` (`unmaskme.v1`). Sent to Gemma 4 for scoring. No third-party backend.
- **Geolocation** — React state only. `navigator.geolocation` gated by explicit consent card on `/map`.
- **Event log** — `localStorage`, capped at 200 events. IndexedDB is not used.
- **Account** — email-only. No password. No profile. No telemetry. No analytics. No third-party trackers.
- **Inference transparency** — `<GemmaBadge />` displays Local | Cloud | Offline at all times.

30-second proof: DevTools → Network tab → run a reset → only outbound is `localhost:11434`.

## Inference routing

Single AI surface: `lib/gemma.ts`. Three-tier graceful degradation.

1. **Tier 1 — Local Gemma 4 via Ollama** (`http://localhost:11434`). Model-tag candidates in order: `gemma4:4b`, `gemma4:2b`, `gemma4:e4b`, `gemma4:e2b`, `gemma3:4b`, `gemma3:1b`. First installed wins. Badge: "Local Gemma 4."
2. **Tier 2 — Cloud Gemma 4 via Google AI Studio.** Model: `gemma-4-27b-it` via `@google/genai`. Only when `GEMINI_API_KEY` is set AND Ollama is unreachable. Badge: "Cloud Gemma 4."
3. **Tier 3 — Offline deterministic mock.** Keyword-matched archetype fallback. Zero network. Badge: "Offline mock."

Multimodal calls (pre/post face frames) use identical JSON contracts across Tier 1 and Tier 2. Base64-encoded JPEGs are attached as `images` to the Ollama generate endpoint or as `inline_data` parts to Google AI Studio. Same prompt. Same downstream UI.

## Open questions

- **Open-source the routing client.** Should `lib/gemma.ts` ship as a standalone `local-first-gemma` npm package post-hackathon? Likely yes — the pattern is reusable and the wider community needs it.
- **Multimodal spec.** Should the pre/post somatic-shift prompt be published as a public benchmark so other teams can compare release scores? Likely yes.
- **Partner pilots.** Which surface (harm-reduction site, school counseling room, recovery group) is the first real-world pilot post-judging?
- **Audio pack licensing.** Six somatic-protocol audio tracks — Creative Commons release? (Currently undecided.)
- **Spirit Charm portability.** Should the charm export to a portable format (`.glb` + JSON state) so a user can carry it across devices without a server? Likely yes; needs design.

## Out of scope (deliberately)

- Streaks, badges, achievement notifications.
- Social feed, friends list, public profiles.
- Server-side persistence of any user-generated data.
- Therapist marketplace, telehealth booking.
- In-app purchases.

These are out of scope because they would either reintroduce the surveillance bargain or convert UNMASK ME into a competitor of products it is designed to be the opposite of.
