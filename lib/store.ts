/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single localStorage-backed store for UNMASK ME state.
 * One file keeps the data graph readable; hooks at the bottom let any page subscribe.
 *
 * Data graph:
 *   charm            — archetype, name, level, xp, color, born timestamp
 *   intake           — three answers + completion flag
 *   swarmBrain       — adaptive learning corpus: events, insights, learned patterns
 *   daily            — streak, last morning/evening checkin, reminders
 *   audio            — active voice, active track, volume
 *   admin            — contact messages inbox, app stats
 *   prefs            — color, font, voice override, theme
 */

import { useEffect, useState, useSyncExternalStore } from "react";

// ───────── Types ─────────

export type CharmArchetype = "fox" | "owl" | "crystal" | "flame" | "wave" | "tree";

export interface CharmState {
  archetype: CharmArchetype;
  name: string;
  tagline: string;
  primaryColor: string;
  level: number;
  xp: number;
  bornAt: number;
}

export interface IntakeState {
  done: boolean;
  answers: [string, string, string];
  completedAt: number | null;
}

export interface SwarmEvent {
  id: string;
  at: number;
  kind: "intake" | "protocol" | "vei-log" | "morning-checkin" | "evening-checkin" | "anchor-rift";
  label: string;
  score?: number;
  insight?: string;
}

export interface SwarmBrainState {
  events: SwarmEvent[];
  insights: { at: number; headline: string; insight: string }[];
  patterns: { tag: string; count: number; lastAt: number }[];
}

export interface DailyProgress {
  breaths: number;
  veiLogs: number;
  protocolsCompleted: number;
  checkins: number;
}

export interface DailyState {
  streak: number;
  lastMorning: number | null;
  lastEvening: number | null;
  remindersEnabled: boolean;
  goals: { id: string; title: string; current: number; target: number; xp: number }[];
  progressByDay: Record<string, DailyProgress>;
}

export interface Account {
  email: string;
  displayName: string;
  createdAt: number;
  lastSeenAt: number;
}

export interface AudioState {
  voice: "Echo" | "Nova" | "Zenith" | "Luna" | "Sage" | "Iris";
  track: string;
  volume: number;
  isPlaying: boolean;
}

export interface AdminState {
  contactMessages: { id: string; at: number; from: string; body: string; status: "open" | "responded" | "archived" }[];
  partnerApplications: { id: string; at: number; name: string; type: string; status: "pending" | "approved" | "rejected" }[];
  isAdmin: boolean;
}

export interface PrefsState {
  primaryColor: string;
  font: "geist" | "anton" | "inter" | "mono";
  theme: "abyssal" | "neon-void" | "gilded";
  voiceOverride: string | null;
}

export interface UnmaskMeStore {
  charm: CharmState | null;
  intake: IntakeState;
  swarmBrain: SwarmBrainState;
  daily: DailyState;
  audio: AudioState;
  admin: AdminState;
  prefs: PrefsState;
  totalPoints: number;
  account: Account | null;
}

export type UnmaskStore = UnmaskMeStore;

const STORAGE_KEY = "unmaskme.v1";
const LEGACY_STORAGE_KEY = "soulshine.v1";

const defaultStore: UnmaskMeStore = {
  charm: null,
  intake: { done: false, answers: ["", "", ""], completedAt: null },
  swarmBrain: { events: [], insights: [], patterns: [] },
  daily: {
    streak: 0,
    lastMorning: null,
    lastEvening: null,
    remindersEnabled: true,
    goals: [
      { id: "somatic", title: "Somatic Check-ins", current: 0, target: 10, xp: 100 },
      { id: "calm", title: "Maintain Calm", current: 0, target: 5, xp: 50 },
      { id: "anchor", title: "Anchor a Rift", current: 0, target: 3, xp: 75 },
    ],
    progressByDay: {},
  },
  audio: { voice: "Echo", track: "drift-low", volume: 0.6, isPlaying: false },
  admin: {
    contactMessages: [
      {
        id: "seed-1",
        at: Date.now() - 86400000,
        from: "kira@example.com",
        body: "Thank you. The vagus hum cracked something open I had been sitting on for years.",
        status: "open",
      },
      {
        id: "seed-2",
        at: Date.now() - 172800000,
        from: "marco@example.com",
        body: "Can we partner? We run a sound bath studio in Portland and want a Safe Hub badge.",
        status: "open",
      },
    ],
    partnerApplications: [
      { id: "p1", at: Date.now() - 86400000, name: "Neon Lotus Studio", type: "Meditation Center", status: "pending" },
      { id: "p2", at: Date.now() - 172800000, name: "Void Cafe", type: "Silent Coffee Shop", status: "pending" },
    ],
    isAdmin: false,
  },
  prefs: { primaryColor: "#22d3ee", font: "geist", theme: "abyssal", voiceOverride: null },
  totalPoints: 0,
  account: null,
};

function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ───────── In-memory state + persistence ─────────

let memory: UnmaskMeStore = loadFromStorage();
const subs = new Set<() => void>();

function loadFromStorage(): UnmaskMeStore {
  if (typeof window === "undefined") return structuredClone(defaultStore);
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = legacy;
      }
    }
    if (!raw) return structuredClone(defaultStore);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultStore), ...parsed };
  } catch {
    return structuredClone(defaultStore);
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // quota — drop silently
  }
}

function emit() {
  subs.forEach((fn) => fn());
}

function update(mutator: (s: UnmaskMeStore) => void) {
  mutator(memory);
  persist();
  emit();
}

// ───────── Actions ─────────

export const store = {
  get(): UnmaskMeStore {
    return memory;
  },
  subscribe(fn: () => void): () => void {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  },
  setCharm(charm: CharmState) {
    update((s) => {
      s.charm = charm;
    });
  },
  levelUpCharm(xpGain: number) {
    update((s) => {
      if (!s.charm) return;
      s.charm.xp += xpGain;
      while (s.charm.xp >= s.charm.level * 250) {
        s.charm.xp -= s.charm.level * 250;
        s.charm.level += 1;
      }
    });
  },
  setIntake(answers: [string, string, string]) {
    update((s) => {
      s.intake = { done: true, answers, completedAt: Date.now() };
    });
  },
  resetIntake() {
    update((s) => {
      s.intake = { done: false, answers: ["", "", ""], completedAt: null };
    });
  },
  logSwarmEvent(ev: Omit<SwarmEvent, "id" | "at"> & { at?: number }) {
    update((s) => {
      const event: SwarmEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: ev.at ?? Date.now(),
        ...ev,
      };
      s.swarmBrain.events.unshift(event);
      if (s.swarmBrain.events.length > 200) s.swarmBrain.events.length = 200;
      const existing = s.swarmBrain.patterns.find((p) => p.tag === ev.kind);
      if (existing) {
        existing.count += 1;
        existing.lastAt = event.at;
      } else {
        s.swarmBrain.patterns.push({ tag: ev.kind, count: 1, lastAt: event.at });
      }
    });
  },
  addSwarmInsight(headline: string, insight: string) {
    update((s) => {
      s.swarmBrain.insights.unshift({ at: Date.now(), headline, insight });
      if (s.swarmBrain.insights.length > 50) s.swarmBrain.insights.length = 50;
    });
  },
  awardPoints(n: number, goalId?: string) {
    update((s) => {
      s.totalPoints += n;
      if (goalId) {
        const g = s.daily.goals.find((g) => g.id === goalId);
        if (g) g.current = Math.min(g.target, g.current + 1);
      }
    });
  },
  markMorningCheckin() {
    update((s) => {
      const now = Date.now();
      const yesterday = now - 36 * 3600 * 1000;
      s.daily.streak = s.daily.lastMorning && s.daily.lastMorning > yesterday ? s.daily.streak + 1 : 1;
      s.daily.lastMorning = now;
    });
  },
  markEveningCheckin() {
    update((s) => {
      s.daily.lastEvening = Date.now();
    });
  },
  setRemindersEnabled(enabled: boolean) {
    update((s) => {
      s.daily.remindersEnabled = enabled;
    });
  },
  setAudio(patch: Partial<AudioState>) {
    update((s) => {
      Object.assign(s.audio, patch);
    });
  },
  setPrefs(patch: Partial<PrefsState>) {
    update((s) => {
      Object.assign(s.prefs, patch);
    });
  },
  setAdmin(isAdmin: boolean) {
    update((s) => {
      s.admin.isAdmin = isAdmin;
    });
  },
  setAccount(a: Account | null) {
    update((s) => {
      s.account = a;
    });
  },
  recordDailyAction(kind: "breath" | "vei" | "protocol" | "checkin") {
    update((s) => {
      const key = dayKey(Date.now());
      const cur = s.daily.progressByDay[key] || {
        breaths: 0,
        veiLogs: 0,
        protocolsCompleted: 0,
        checkins: 0,
      };
      if (kind === "breath") cur.breaths += 1;
      else if (kind === "vei") cur.veiLogs += 1;
      else if (kind === "protocol") cur.protocolsCompleted += 1;
      else cur.checkins += 1;
      s.daily.progressByDay[key] = cur;
    });
  },
  resetJourneyKeepAccount() {
    update((s) => {
      const a = s.account;
      const cloned = structuredClone(defaultStore);
      Object.assign(s, cloned);
      s.account = a;
    });
  },
  resolveMessage(id: string, status: "responded" | "archived") {
    update((s) => {
      const m = s.admin.contactMessages.find((x) => x.id === id);
      if (m) m.status = status;
    });
  },
  decideApplication(id: string, status: "approved" | "rejected") {
    update((s) => {
      const a = s.admin.partnerApplications.find((x) => x.id === id);
      if (a) a.status = status;
    });
  },
  reset() {
    memory = structuredClone(defaultStore);
    persist();
    emit();
  },
};

// ───────── React hook ─────────

export function useStore<T>(selector: (s: UnmaskMeStore) => T): T {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => selector(store.get()),
    () => selector(defaultStore)
  );
}

export function useStoreActions() {
  return store;
}

// ───────── Helpers ─────────

export function isMorningWindow(): boolean {
  const h = new Date().getHours();
  return h >= 4 && h < 12;
}

export function isEveningWindow(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h < 4;
}

export function hoursSince(ts: number | null): number {
  if (!ts) return Infinity;
  return (Date.now() - ts) / 3600000;
}
