/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Email-only client account. Two screens: request code, then verify.
 * No password stored. No journal text stored. Only email + display name.
 */

import { useState } from "react";
import { Mail, ShieldCheck, LogOut, Sparkles, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { store, useStore } from "@/lib/store";
import {
  requestLoginCode,
  verifyLoginCode,
  peekPendingCode,
  signOut,
} from "@/lib/auth";

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

function CodeReveal({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const pending = peekPendingCode();
  return (
    <div className="flex items-center justify-between bg-black/40 rounded-lg px-2 py-1.5 border border-[var(--color-accent-gold)]/30">
      <span className="text-[10px] text-slate-400 font-mono uppercase">demo code</span>
      <button
        onClick={onToggle}
        className="text-[10px] font-mono text-[var(--color-accent-gold)] flex items-center gap-1"
      >
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {visible ? (pending?.code ?? "—") : "tap to reveal"}
      </button>
    </div>
  );
}

function SignedOut({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "verify">("email");
  const [err, setErr] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  const send = async () => {
    setErr(null);
    try {
      const { code } = await requestLoginCode(email);
      setIssuedCode(code);
      setStage("verify");
    } catch (e: any) {
      setErr(e?.message || "could not send code");
    }
  };

  const verify = () => {
    const res = verifyLoginCode(email, code);
    if (res.ok === false) setErr(res.reason);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-black/30 p-4 backdrop-blur">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-[var(--color-accent-gold)]" />
          <h4 className="font-display tracking-wider text-sm">Sign in by email</h4>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
          Your email is the only thing we keep. No journal, no body data, no face
          frames ever leave this device.
        </p>
        {stage === "email" && (
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@somewhere.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button
              onClick={send}
              className="w-full text-xs font-mono uppercase bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/40 hover:bg-[var(--color-accent-gold)]/25"
            >
              <Mail className="w-3 h-3 mr-1" /> Send 6-digit code
            </Button>
          </div>
        )}
        {stage === "verify" && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 font-mono">
              code sent to <span className="text-cyan-400">{email}</span>
            </p>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="tracking-[0.4em] font-mono text-center"
            />
            <Button
              onClick={verify}
              className="w-full text-xs font-mono uppercase bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/40 hover:bg-[var(--color-accent-gold)]/25"
            >
              <Sparkles className="w-3 h-3 mr-1" /> Verify
            </Button>
            <button
              onClick={() => {
                setStage("email");
                setCode("");
                setErr(null);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline"
            >
              wrong email? start over
            </button>
            {(isAdmin || issuedCode) && (
              <CodeReveal visible={reveal} onToggle={() => setReveal((v) => !v)} />
            )}
          </div>
        )}
        {err && <p className="text-[10px] text-red-400 font-mono mt-2">{err}</p>}
      </div>
    </div>
  );
}

function SignedIn() {
  const account = useStore((s) => s.account)!;
  const [name, setName] = useState(account.displayName);

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    store.setAccount({ ...account, displayName: trimmed, lastSeenAt: Date.now() });
  };

  const wipeKeepAccount = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Reset your journey? Charm, log, and prefs will be wiped — your email stays."
    );
    if (!ok) return;
    store.resetJourneyKeepAccount();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--color-accent-gold)]/30 bg-gradient-to-br from-black/60 to-black/30 p-4 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              signed in
            </p>
            <p className="text-sm text-white font-display tracking-wide truncate max-w-[200px]">
              {account.email}
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[var(--color-accent-gold)] drop-shadow-[0_0_10px_var(--color-accent-gold)]" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] text-slate-400 font-mono uppercase">Display name</label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-mono">
            <div className="bg-black/40 rounded px-2 py-1">
              <span className="text-slate-500">born </span>
              <span className="text-cyan-400">{formatTime(account.createdAt)}</span>
            </div>
            <div className="bg-black/40 rounded px-2 py-1">
              <span className="text-slate-500">last </span>
              <span className="text-cyan-400">{formatTime(account.lastSeenAt)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            onClick={wipeKeepAccount}
            variant="outline"
            className="text-[10px] font-mono uppercase border-white/10 text-slate-300"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Reset Journey
          </Button>
          <Button
            onClick={signOut}
            variant="outline"
            className="text-[10px] font-mono uppercase border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black"
          >
            <LogOut className="w-3 h-3 mr-1" /> Sign Out
          </Button>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed mt-3">
          Your email is the only thing we keep. No journal, no body data, no face
          frames ever leave this device.
        </p>
      </div>
    </div>
  );
}

export function AccountPanel() {
  const account = useStore((s) => s.account);
  const isAdmin = useStore((s) => s.admin.isAdmin);
  return account ? <SignedIn /> : <SignedOut isAdmin={isAdmin} />;
}
