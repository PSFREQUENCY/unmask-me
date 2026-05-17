# UNMASK ME — Privacy

Last updated: 2026-05-17

**UNMASK ME is built by PHENOMENAL MARK on the premise that when the topic is the shadow self, on-device inference is the only honest path.** The outer world has spent a decade migrating surveillance into the breath, the journal entry, the heart-rate read. UNMASK ME refuses that contract. This document describes — in named-entity, testable claims — what that refusal actually means in code.

## What is processed

| Surface | Data | Where it lives |
| --- | --- | --- |
| Intake (three questions) | Plain text | `localStorage` on the user's device (key: `unmaskme.v1`), plus one Gemma 4 call (local Ollama or, opt-in, Google AI Studio) to pick a Spirit Charm archetype |
| Face frames (V.A.I., daily check-ins) | A single JPEG base64 string per scan | Held in JavaScript memory inside a React `useRef` for ~200ms. Sent to Gemma 4 (the user's local Ollama, or — opt-in — Google AI Studio's `gemma-4-27b-it`). Discarded immediately after the score returns. Never written to disk. Never uploaded as a file. No `<img>` is rendered to the DOM. |
| Voice (Vagus Hum mic) | Real-time amplitude analysis | Web Audio `AnalyserNode` inside the browser. No audio is recorded, transcribed, or transmitted. |
| Reflections (Unmask page) | Plain text | `localStorage`. Sent to Gemma 4 for a sincerity score. |
| Geolocation (Map page) | Latitude / longitude | React state during the session, populated by `navigator.geolocation`. Never transmitted. Used in-browser to seed nearby hotspots. |
| Swarm event log | Up to 200 most recent events with timestamps + kind tags + scores | `localStorage` only. Capped. **IndexedDB is not used.** |
| Account | Email address only | `localStorage` for the local session. Optional server stub may relay a one-time login code; no password is stored. |

## What is NOT processed

- UNMASK ME does not collect analytics or telemetry of any kind.
- UNMASK ME does not maintain a product backend.
- UNMASK ME does not store passwords (there are none).
- UNMASK ME does not connect to advertisers, data brokers, or third-party analytics services.
- UNMASK ME does not store raw face images at any point.
- UNMASK ME does not transcribe or record audio.
- UNMASK ME does not share data with any party other than the Gemma 4 inference path the user has chosen (local Ollama by default).
- UNMASK ME does not use IndexedDB, service-worker caches, or any other persistent client-side store beyond `localStorage`.

## Inference path transparency

The active Gemma 4 inference path is surfaced in the top-right `<GemmaBadge />` at all times. Possible values:

- **Local Gemma 4** — `http://localhost:11434` via Ollama.
- **Cloud Gemma 4** — `gemma-4-27b-it` via Google AI Studio, only when `GEMINI_API_KEY` is set AND local Ollama is unreachable.
- **Offline mock** — keyword-matched archetype fallback with zero network calls.

## How to verify this in 30 seconds

1. Open browser DevTools → Network tab.
2. Run a V.A.I. somatic reset end-to-end.
3. Observe: outbound traffic only to `localhost:11434` (the user's own Ollama). If cloud fallback is configured, additional calls to `generativelanguage.googleapis.com` will appear and the badge will read "Cloud Gemma 4."
4. No other outbound calls. No analytics, no upload of frames as files, no third-party trackers.

## Local data — how to delete

- Settings → Account → **Reset journey** wipes the entire `localStorage` record. The data is gone the moment the button is clicked.
- Or open DevTools → Application → Local Storage → delete the `unmaskme.v1` key.

## Third-party services

- **Google Maps Platform** — only loaded on the Map page, only when `VITE_GOOGLE_MAPS_KEY` is provided. The Maps JS API is served from Google's servers. Restrict the key to the deployed domain + Maps JS API only, with a daily quota cap.
- **Google AI Studio (Gemma 4 cloud endpoint)** — only used when the user has explicitly set `GEMINI_API_KEY` and the local Ollama is unavailable. The active inference path is always visible in the UI.
- **Ollama** — the user's local installation at `localhost:11434`. UNMASK ME never reaches a remote Ollama; the URL is hard-coded to localhost.

## Children's privacy

UNMASK ME is built for teens and adults — 13+ in the United States and consistent with COPPA. Because no data is collected, the COPPA threshold is not engaged; users under 13 in the United States should use the product with a parent or guardian.

## Contact

For privacy questions, write to the email address listed in the project's GitHub repository.
