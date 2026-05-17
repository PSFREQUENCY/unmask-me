/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Top-left three-dot panel. Account, preferences, privacy, partnership,
 * and a hidden admin dashboard reached by tapping the title-row dot and
 * entering the admin code (env: VITE_ADMIN_SECRET, default "unmask-2026").
 */

import { useEffect, useState } from "react";
import {
  MoreVertical,
  Settings,
  Shield,
  Building2,
  UserCircle2,
  Bell,
  X,
  ScrollText,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { store, useStore } from "@/lib/store";
import { listVoices } from "@/lib/voice";
import { AppStats } from "@/components/admin/AppStats";
import { ContactInbox } from "@/components/admin/ContactInbox";
import { ThemeControls } from "@/components/admin/ThemeControls";
import { DemoMode } from "@/components/admin/DemoMode";
import { AccountPanel } from "@/components/auth/AccountPanel";

const THEMES: { id: "abyssal" | "neon-void" | "gilded"; label: string; gold: string }[] = [
  { id: "abyssal", label: "Midnight Coral", gold: "#FF5C8A" },
  { id: "neon-void", label: "Plasma Violet", gold: "#B14BFF" },
  { id: "gilded", label: "24k Gilded", gold: "#E8B33A" },
];

const FONT_CLASS: Record<string, string> = {
  geist: "font-sans",
  anton: "font-display",
  inter: "font-sans",
  mono: "font-mono",
};

const PRIVACY_TEXT = `We process face scans on-device or in your own Gemma 4 endpoint.
We never store raw images.
We store: charm state, event log, audio prefs — all in your browser's localStorage only.
You can wipe everything via Settings → Account → Reset Journey.
There is no server. There is no account. There is no telemetry.`;

const TERMS_TEXT = `UNMASK ME is a contemplative tool, not a medical device.
It does not diagnose, treat, or cure any condition.
If you are in crisis, contact your local emergency services or a licensed clinician.
By using this app you accept that all data lives in your browser and may be
lost if you clear site data. No warranty, express or implied.`;

function useThemeSync(): void {
  const theme = useStore((s) => s.prefs.theme);
  const font = useStore((s) => s.prefs.font);
  const color = useStore((s) => s.prefs.primaryColor);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const gold = THEMES.find((t) => t.id === theme)?.gold || color;
    document.documentElement.style.setProperty("--color-accent-gold", gold);
    document.body.classList.remove("font-class-geist", "font-class-anton", "font-class-inter", "font-class-mono");
    document.body.classList.add(`font-class-${font}`);
    document.body.style.fontFamily =
      font === "anton"
        ? "Anton, sans-serif"
        : font === "mono"
          ? "JetBrains Mono, ui-monospace, monospace"
          : font === "inter"
            ? "Inter, sans-serif"
            : "";
  }, [theme, font, color]);
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] glass-card text-[var(--color-accent-gold)] px-4 py-2 rounded-xl text-xs font-mono tracking-[0.14em] uppercase font-bold"
      style={{ boxShadow: "0 0 22px rgba(232,179,58,0.30)" }}
    >
      {message}
    </div>
  );
}

function LegalModal({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif italic tracking-tight text-2xl gold-foil flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[var(--color-accent-gold)]" /> {title}
          </DialogTitle>
        </DialogHeader>
        <pre className="text-[11px] text-[var(--color-text-body)]/85 whitespace-pre-wrap font-sans leading-relaxed">
          {body}
        </pre>
        <Button
          variant="outline"
          onClick={onClose}
          className="text-xs tactile-press border-[var(--color-accent-gold)]/35 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 hover:text-[var(--color-accent-gold-bright)] font-mono uppercase tracking-[0.18em]"
        >
          <X className="w-3 h-3 mr-1" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PartnerForm({
  open,
  onClose,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  onToast: (m: string) => void;
}) {
  const [form, setForm] = useState({ name: "", type: "", city: "", email: "" });
  const submit = () => {
    if (!form.name || !form.email) {
      onToast("Add a name and email first.");
      return;
    }
    onToast("Thank you. Your application is in.");
    setForm({ name: "", type: "", city: "", email: "" });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card-coral text-white max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif italic tracking-tight text-2xl coral-foil flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#FF5C8A]" /> Apply as a Safe Hub
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Studio / Cafe / Center Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Type (meditation, cafe, sound bath...)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            placeholder="Contact email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <Button
          onClick={submit}
          className="tactile-press bg-gradient-to-r from-[#FF2D8B]/35 to-[#FF5C8A]/30 text-white border border-[#FF2D8B]/55 text-xs uppercase font-mono tracking-[0.18em] font-bold neon-glow-coral hover:from-[#FF2D8B] hover:to-[#FF5C8A]"
        >
          Send Application
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AdminGate({
  open,
  onClose,
  onApproved,
}: {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const secret =
    ((import.meta as any).env?.VITE_ADMIN_SECRET as string | undefined) || "unmask-2026";
  const tryUnlock = () => {
    if (code.trim() === secret) {
      setCode("");
      setError(false);
      onApproved();
    } else {
      setError(true);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card text-white max-w-xs rounded-2xl" style={{ boxShadow: "0 0 28px rgba(255,45,139,0.30)" }}>
        <DialogHeader>
          <DialogTitle className="font-serif italic tracking-tight text-xl coral-foil flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FF2D8B]" /> Admin Code
          </DialogTitle>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Enter admin code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
        />
        {error && <p className="text-[10px] text-[#FF5C8A] font-mono uppercase tracking-[0.18em]">incorrect.</p>}
        <Button
          onClick={tryUnlock}
          className="tactile-press text-xs font-mono uppercase tracking-[0.18em] font-bold bg-[#FF2D8B]/20 text-[#FF5C8A] border border-[#FF2D8B]/55 neon-glow-coral hover:bg-[#FF2D8B] hover:text-black"
        >
          Unlock
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AccountSection({ onReset }: { onReset: () => void }) {
  const charm = useStore((s) => s.charm);
  return (
    <div className="space-y-2">
      <h3 className="mono-label flex items-center gap-2">
        <UserCircle2 className="w-4 h-4 text-[var(--color-accent-gold)]" /> Charm Profile
      </h3>
      <div className="glass-card rounded-2xl p-4 scanline-overlay">
        <p className="text-base font-serif italic gold-foil mb-1 leading-none">
          {charm ? charm.name : "Unborn Charm"}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-1 font-mono uppercase tracking-[0.16em]">
          {charm ? `${charm.archetype.toUpperCase()} · Level ${charm.level}` : "complete intake to forge"}
        </p>
        <p className="text-[10px] text-[var(--color-accent-gold)]/70 mb-3 font-mono tracking-[0.14em]">
          {charm ? `XP ${charm.xp} / ${charm.level * 250}` : ""}
        </p>
        <Button
          onClick={onReset}
          className="tactile-press w-full text-xs font-mono uppercase tracking-[0.18em] font-bold border border-[#FF2D8B]/40 text-[#FF5C8A] hover:bg-[#FF2D8B] hover:text-black bg-transparent"
          variant="outline"
        >
          Reset Journey
        </Button>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const prefs = useStore((s) => s.prefs);
  const remindersEnabled = useStore((s) => s.daily.remindersEnabled);
  const voices = listVoices();

  return (
    <div className="space-y-2">
      <h3 className="mono-label flex items-center gap-2">
        <Settings className="w-4 h-4 text-[var(--color-accent-gold)]" /> Preferences
      </h3>
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <Row label="Voice">
          <select
            value={prefs.voiceOverride || ""}
            onChange={(e) => store.setPrefs({ voiceOverride: e.target.value || null })}
            className="bg-transparent border border-[var(--color-accent-gold)]/25 rounded text-xs p-1 text-[var(--color-accent-gold)] font-mono"
          >
            <option value="">Default</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Theme">
          <select
            value={prefs.theme}
            onChange={(e) => store.setPrefs({ theme: e.target.value as any })}
            className="bg-transparent border border-white/10 rounded text-xs p-1 text-[var(--color-accent-gold)] font-mono"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Font">
          <select
            value={prefs.font}
            onChange={(e) => store.setPrefs({ font: e.target.value as any })}
            className="bg-transparent border border-[var(--color-accent-gold)]/25 rounded text-xs p-1 text-[var(--color-accent-gold)] font-mono"
          >
            <option value="geist">Geist</option>
            <option value="anton">Anton</option>
            <option value="inter">Inter</option>
            <option value="mono">Mono</option>
          </select>
        </Row>
        <Row label={<span className="flex items-center gap-1"><Bell className="w-3 h-3" /> Daily reminders</span>}>
          <button
            onClick={() => store.setRemindersEnabled(!remindersEnabled)}
            className={`tactile-press text-[10px] font-mono uppercase tracking-[0.18em] font-bold px-2 py-1 rounded border ${
              remindersEnabled
                ? "bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/45"
                : "bg-white/[0.04] text-[var(--color-text-muted)] border-white/10"
            }`}
          >
            {remindersEnabled ? "on" : "off"}
          </button>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center bg-[#07040d]/55 border border-[var(--color-accent-gold)]/10 p-2 rounded-lg">
      <span className="text-xs text-[var(--color-text-body)]/85">{label}</span>
      {children}
    </div>
  );
}

type AdminTab = "demo" | "stats" | "inbox" | "theme";

function AdminTabBar({
  active,
  onChange,
}: {
  active: AdminTab;
  onChange: (t: AdminTab) => void;
}) {
  const tabs: { id: AdminTab; label: string }[] = [
    { id: "demo", label: "Demo Mode" },
    { id: "stats", label: "Stats" },
    { id: "inbox", label: "Inbox" },
    { id: "theme", label: "Theme" },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`tactile-press text-[10px] font-mono uppercase tracking-[0.18em] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            active === t.id
              ? "bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/50 neon-glow-gold"
              : "bg-[#07040d]/55 text-[var(--color-text-muted)] border-white/10 hover:text-[var(--color-accent-coral)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AdminBody({ onCloseAdmin }: { onCloseAdmin: () => void }) {
  const [tab, setTab] = useState<AdminTab>("demo");
  return (
    <>
      <AdminTabBar active={tab} onChange={setTab} />
      <div className="pb-8">
        {tab === "demo" && <DemoMode />}
        {tab === "stats" && <AppStats />}
        {tab === "inbox" && <ContactInbox />}
        {tab === "theme" && <ThemeControls onReset={onCloseAdmin} />}
      </div>
    </>
  );
}

export function SettingsPanel() {
  useThemeSync();
  const [open, setOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const isAdmin = useStore((s) => s.admin.isAdmin);

  const onResetJourney = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Reset journey — your charm, log and prefs will be wiped. Continue?");
    if (!ok) return;
    store.reset();
    setOpen(false);
    setToast("Journey reset. The void is fresh.");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="tactile-press fixed top-4 left-4 z-50 text-[var(--color-accent-gold)]/75 hover:text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10"
        onClick={() => setOpen(true)}
      >
        <MoreVertical className="w-5 h-5 drop-shadow-[0_0_10px_currentColor]" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card text-white rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-serif italic tracking-tight text-2xl gold-foil flex items-center justify-between leading-none">
              Settings & Profile
              <button
                aria-label="admin"
                title="admin"
                className="group relative w-2 h-2 rounded-full bg-[var(--color-text-muted)]/30 hover:bg-[var(--color-accent-coral)] transition-colors duration-700 ml-4 cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  if (isAdmin) setAdminOpen(true);
                  else setGateOpen(true);
                }}
              >
                <span className="pointer-events-none absolute -right-1 top-3 text-[8px] font-mono uppercase tracking-[0.18em] text-[var(--color-accent-coral)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  admin
                </span>
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <AccountPanel />
            <AccountSection onReset={onResetJourney} />
            <PreferencesSection />

            <div className="space-y-2">
              <h3 className="mono-label flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--color-accent-gold)]" /> Privacy & Legal
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="tactile-press text-[10px] font-mono uppercase tracking-[0.18em] border-[var(--color-accent-gold)]/25 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 h-8"
                  onClick={() => setPrivacyOpen(true)}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  className="tactile-press text-[10px] font-mono uppercase tracking-[0.18em] border-[var(--color-accent-gold)]/25 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 h-8"
                  onClick={() => setTermsOpen(true)}
                >
                  Terms of Service
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--color-accent-gold)]/15">
              <h3 className="mono-label flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF5C8A]" /> Partnership
              </h3>
              <div className="glass-card-coral rounded-2xl p-4 scanline-overlay">
                <h4 className="text-base coral-foil mb-2 font-serif italic leading-none">
                  Become a Safe Hub
                </h4>
                <p className="text-[10px] text-[var(--color-text-body)]/85 leading-relaxed mb-3">
                  Apply to have your healing center, cafe, or studio verified on
                  the Swarm Map as an anchored zone of peace.
                </p>
                <Button
                  onClick={() => setPartnerOpen(true)}
                  className="tactile-press w-full text-[10px] uppercase font-mono font-bold tracking-[0.18em] bg-[#FF2D8B]/15 text-[#FF5C8A] border border-[#FF2D8B]/55 neon-glow-coral hover:bg-[#FF2D8B] hover:text-black"
                >
                  Apply as a Safe Hub
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AdminGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onApproved={() => {
          store.setAdmin(true);
          setGateOpen(false);
          setAdminOpen(true);
        }}
      />

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="glass-card text-white rounded-2xl max-w-2xl w-[95vw] h-[80vh] overflow-y-auto no-scrollbar" style={{ boxShadow: "0 0 36px rgba(255,45,139,0.25), 0 0 64px rgba(232,179,58,0.10)" }}>
          <DialogHeader className="mb-4 sticky top-0 bg-[#0a0612]/95 py-2 z-10 border-b border-[var(--color-accent-gold)]/20 backdrop-blur-md">
            <DialogTitle className="font-serif italic text-3xl coral-foil leading-none drop-shadow-[0_0_18px_rgba(255,45,139,0.45)]">
              God Mode / Admin Panel
            </DialogTitle>
          </DialogHeader>
          <AdminBody onCloseAdmin={() => setAdminOpen(false)} />
        </DialogContent>
      </Dialog>

      <PartnerForm
        open={partnerOpen}
        onClose={() => setPartnerOpen(false)}
        onToast={setToast}
      />
      <LegalModal
        open={privacyOpen}
        title="Privacy Policy"
        body={PRIVACY_TEXT}
        onClose={() => setPrivacyOpen(false)}
      />
      <LegalModal
        open={termsOpen}
        title="Terms of Service"
        body={TERMS_TEXT}
        onClose={() => setTermsOpen(false)}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
