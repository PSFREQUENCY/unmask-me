/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-only email account, no backend. Magic-link style: a 6-digit code
 * is generated locally, stored in localStorage under `unmask.auth.pending`.
 * In production a server would email it. For the hackathon demo, the code
 * is surfaced to the admin / dev path so a viewer can complete the loop.
 *
 * What is kept: email + display name + timestamps. Nothing else. No
 * journal text, no body data, no face frames, no passwords.
 */

import { store, type Account } from "./store";

const PENDING_KEY = "unmask.auth.pending";
const TTL_MS = 10 * 60 * 1000;

export type { Account };

interface PendingCode {
  email: string;
  code: string;
  expiresAt: number;
}

function genCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const n = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
    return String(n % 1_000_000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readPending(): PendingCode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCode;
  } catch {
    return null;
  }
}

function writePending(p: PendingCode | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!p) window.localStorage.removeItem(PENDING_KEY);
    else window.localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    // quota — drop silently
  }
}

export async function requestLoginCode(
  email: string
): Promise<{ code: string; expiresAt: number }> {
  const e = normalizeEmail(email);
  if (!isValidEmail(e)) throw new Error("invalid email");
  const code = genCode();
  const expiresAt = Date.now() + TTL_MS;
  writePending({ email: e, code, expiresAt });
  // TODO: in production, POST to a stubbed mailer endpoint here.
  return { code, expiresAt };
}

export function peekPendingCode(): PendingCode | null {
  const p = readPending();
  if (!p) return null;
  if (Date.now() > p.expiresAt) {
    writePending(null);
    return null;
  }
  return p;
}

export function verifyLoginCode(
  email: string,
  code: string
):
  | { ok: true; account: Account }
  | { ok: false; reason: string } {
  const e = normalizeEmail(email);
  const p = peekPendingCode();
  if (!p) return { ok: false, reason: "no pending code — request one first" };
  if (p.email !== e) return { ok: false, reason: "email mismatch" };
  if (p.code !== code.trim()) return { ok: false, reason: "wrong code" };
  const now = Date.now();
  const existing = store.get().account;
  const account: Account = existing && existing.email === e
    ? { ...existing, lastSeenAt: now }
    : {
        email: e,
        displayName: e.split("@")[0] || "wanderer",
        createdAt: now,
        lastSeenAt: now,
      };
  store.setAccount(account);
  writePending(null);
  return { ok: true, account };
}

export function getCurrentAccount(): Account | null {
  return store.get().account;
}

export function signOut(): void {
  store.setAccount(null);
  writePending(null);
}
