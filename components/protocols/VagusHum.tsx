/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vagus hum: voice cue to hum on exhale. A pulsing line reacts to the user's
 * microphone amplitude (Web Audio AnalyserNode). If mic permission is denied,
 * fall back to a simulated breath pulse so the protocol always runs.
 */

import { useEffect, useRef, useState } from "react";
import { ProtocolShell } from "@/components/protocols/ProtocolShell";
import { speak, type KokoroVoice, type AmbientTrack } from "@/lib/voice";

interface Props {
  onComplete: () => void;
  voice: KokoroVoice;
  track: AmbientTrack;
}

export function VagusHum({ onComplete, voice, track }: Props) {
  const [amp, setAmp] = useState(0.15);
  const [micActive, setMicActive] = useState(false);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    speak("hum on the exhale, low and slow", { voice });
    const t = window.setTimeout(
      () => speak("let the chest vibrate", { voice }),
      25_000,
    );
    return () => window.clearTimeout(t);
  }, [voice]);

  useEffect(() => {
    let cancelled = false;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let buf: Uint8Array | null = null;

    const sim = () => {
      const t = performance.now() / 1000;
      setAmp(0.25 + 0.25 * Math.abs(Math.sin(t * 0.8)));
      rafRef.current = requestAnimationFrame(sim);
    };

    const tick = () => {
      if (!analyser || !buf) return;
      analyser.getByteTimeDomainData(buf as any);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      setAmp(Math.min(1, rms * 3 + 0.1));
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
        ctx = new Ctor();
        const src = ctx!.createMediaStreamSource(stream);
        analyser = ctx!.createAnalyser();
        analyser.fftSize = 1024;
        buf = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        setMicActive(true);
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) {
          setMicActive(false);
          rafRef.current = requestAnimationFrame(sim);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => undefined);
    };
  }, []);

  return (
    <ProtocolShell
      title="Vagus Hum"
      hint={micActive ? "the line listens to your hum" : "mic off — hum with the pulse"}
      durationSec={60}
      track={track}
      onComplete={onComplete}
    >
      <svg width={280} height={120} viewBox="0 0 280 120">
        <path
          d={`M0 60 Q70 ${60 - amp * 50} 140 60 T280 60`}
          stroke="#a5b4fc"
          strokeWidth={3}
          fill="none"
          style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.6))" }}
        />
      </svg>
    </ProtocolShell>
  );
}
