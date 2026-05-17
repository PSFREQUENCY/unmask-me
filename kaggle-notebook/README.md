# UNMASK ME — Kaggle Notebook

This folder is what you upload as the **Kaggle Code Resource** attached to the UNMASK ME writeup.

## What's in here

- `unmask-me-gemma4-demo.ipynb` — runs the five Gemma 4 calls the live app makes, cell-by-cell, with real responses you can show in the 3-minute video:
  1. **Intake → archetype** — three short text answers → one of six Spirit Charm archetypes.
  2. **Pre/post somatic shift** — two JPEG base64 face frames → release score 0–100 + visceral one-liner.
  3. **Reflection** — etched user reflection → sincerity score + poetic mirror.
  4. **Swarm insight** — rolling 200-event log → `{ headline, insight, nextProtocol }`.
  5. **Daily check-in** — morning intention text or evening face frame → tone-tagged nudge.

Each cell shows the prompt, the request payload, and the live response. The notebook is the contract: anything the live app does, the notebook proves end-to-end.

## In-app Demo Mode (admin dashboard)

The same five calls are also wired into a new **Demo Mode** inside the admin dashboard (`components/admin/DemoMode.tsx`). The judge — or any reviewer — can run every Gemma 4 call against the live UI without needing to perform a real somatic reset on camera. The Demo Mode emits the same `localhost:11434` traffic; the network tab proof still holds.

## How to upload to Kaggle

1. Go to https://kaggle.com/code → **New Notebook**.
2. Click **File → Upload Notebook** → choose `unmask-me-gemma4-demo.ipynb`.
3. In **Settings** (right sidebar):
   - Internet → **On** (needed for `google-genai` package + cloud Gemma fallback).
   - Add a secret: `GEMINI_API_KEY` (or `KAGGLE_GEMINI_API_KEY`) with the Google AI Studio key.
4. Click **Save Version** → **Save & Run All (Commit)**.
5. After it runs, click **Share → Public** and copy the URL — paste this into the Kaggle writeup as the **Public Code Repository**.

## How it routes inference

The notebook tries local Ollama first (`gemma4:4b` → `gemma3:4b` → any `gemma*`), and only falls back to Google AI Studio if Ollama is unreachable. On Kaggle, Ollama is unreachable, so the notebook uses Gemma 4 via Google AI Studio (`gemma-4-27b-it`). On a local laptop with Ollama installed, it uses whichever local Gemma the user has pulled.

This is the exact routing the live web app uses (`lib/gemma.ts`), expressed in Python — same JSON contract, same prompts, same downstream shape.
