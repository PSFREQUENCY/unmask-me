/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Map page — anchors of peace near you.
 *
 * - In-browser geolocation (consent gated, never stored, never POSTed)
 * - Deterministic energy hotspots seeded by (lat, lng, hour)
 * - Pulsing CSS glow scaled by intensity, color by kind
 * - Bottom sheet detail card with "Anchor here" → +50 peace points
 */

import { useEffect, useMemo, useState } from "react";
import {
  Map as MapIcon,
  Lock,
  MapPin,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import { store } from "@/lib/store";
import {
  generateHotspots,
  KIND_COLORS,
  DEFAULT_CITIES,
  type EnergyHotspot,
  type CityOption,
} from "@/lib/energyHotspots";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

type LocationMode = "pending" | "granted" | "denied";

interface UserCenter {
  lat: number;
  lng: number;
  fromGeo: boolean;
  cityLabel: string;
}

// ───────────────── No-key fallback ─────────────────

function NoKeyView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-display text-[var(--color-accent-gold)] uppercase mb-4">
          Google Maps API Key Required
        </h2>
        <p className="text-xs font-mono text-slate-300 mb-4">
          Add GOOGLE_MAPS_PLATFORM_KEY to view the swarm map.
        </p>
        <div className="mt-4 p-3 rounded-lg border border-cyan-500/30 bg-black/40 text-left">
          <p className="text-[10px] font-mono uppercase text-cyan-300 mb-2">
            Production hardening
          </p>
          <ul className="text-[10px] font-sans text-slate-300 space-y-1 list-disc list-inside">
            <li>
              Restrict the key to your domain in Google Cloud Console (HTTP
              referrers).
            </li>
            <li>
              Enable only "Maps JavaScript API" and "Places API (new)".
            </li>
            <li>Set a daily quota cap to prevent abuse.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ───────────────── Top bars ─────────────────

function PrivacyStrip() {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-black/70 backdrop-blur-md border-b border-cyan-500/20 px-3 py-1.5 flex items-center gap-2">
      <Lock className="w-3 h-3 text-cyan-400" />
      <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/80">
        Location: in-browser only · Never stored
      </p>
    </div>
  );
}

function MapHeader({ city }: { city: string }) {
  return (
    <div className="absolute top-8 left-0 right-0 z-10 px-4 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 flex justify-between items-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
        <div className="flex items-center gap-3">
          <MapIcon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div>
            <h1 className="font-display text-base text-cyan-400 uppercase tracking-wider">
              Anchors of Peace
            </h1>
            <p className="font-mono text-[9px] text-cyan-300/70 tracking-widest uppercase mt-0.5">
              Near {city}
            </p>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      </div>
    </div>
  );
}

// ───────────────── Consent card ─────────────────

interface ConsentCardProps {
  onUseLocation: () => void;
  onDeny: () => void;
  city: CityOption;
  setCity: (c: CityOption) => void;
}

function ConsentCard({
  onUseLocation,
  onDeny,
  city,
  setCity,
}: ConsentCardProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="max-w-sm w-full bg-black/85 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-base text-cyan-400 uppercase tracking-wider">
            Locate me
          </h2>
        </div>
        <p className="text-sm text-slate-200 mb-3">
          Locate me to find anchors of peace near you.
        </p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/70 mb-4">
          Used in-browser only. Never stored. Never sent to a server.
        </p>
        <Button
          onClick={onUseLocation}
          className="w-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black border border-cyan-500 font-mono text-xs uppercase tracking-widest"
        >
          Use my location
        </Button>
        <div className="mt-4 pt-4 border-t border-cyan-500/20">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
            Or browse public anchors near
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCity(c)}
                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors ${
                  city.id === c.id
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                    : "border-slate-600 text-slate-300 hover:border-cyan-500/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button
            onClick={onDeny}
            variant="ghost"
            className="w-full mt-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-slate-200"
          >
            Skip — show public anchors
          </Button>
        </div>
      </div>
    </div>
  );
}

// ───────────────── Marker w/ glow ─────────────────

function HotspotMarker({
  spot,
  onClick,
}: {
  spot: EnergyHotspot;
  onClick: () => void;
}) {
  const c = KIND_COLORS[spot.kind];
  const high = spot.intensity > 0.7;
  const ringSize = 24 + spot.intensity * 56;
  const innerSize = 10 + spot.intensity * 8;
  const duration = high ? 1.4 : 2.4;
  return (
    <AdvancedMarker position={{ lat: spot.lat, lng: spot.lng }} onClick={onClick}>
      <div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: ringSize, height: ringSize }}
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: c.glow,
            opacity: 0.35 + spot.intensity * 0.45,
            filter: `blur(${high ? 8 : 5}px)`,
            animation: `pulse-glow ${duration}s ease-in-out infinite`,
          }}
        />
        <span
          className="absolute rounded-full border-2"
          style={{
            width: innerSize + 8,
            height: innerSize + 8,
            borderColor: c.border,
            background: c.fill,
            boxShadow: `0 0 ${10 + spot.intensity * 18}px ${c.glow}`,
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            width: innerSize - 2,
            height: innerSize - 2,
            background: "#fff",
            opacity: 0.85,
          }}
        />
      </div>
    </AdvancedMarker>
  );
}

function UserMarker({ lat, lng }: { lat: number; lng: number }) {
  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(34,211,238,0.4)",
            filter: "blur(8px)",
            animation: "pulse-breath 3.2s ease-in-out infinite",
          }}
        />
        <span
          className="absolute rounded-full border-2 border-cyan-300/80"
          style={{ width: 22, height: 22, background: "rgba(34,211,238,0.25)" }}
        />
        <span
          className="absolute rounded-full bg-cyan-300"
          style={{ width: 8, height: 8, boxShadow: "0 0 12px #22d3ee" }}
        />
      </div>
    </AdvancedMarker>
  );
}

// ───────────────── Detail sheet ─────────────────

function DetailSheet({
  spot,
  onClose,
  onAnchor,
}: {
  spot: EnergyHotspot;
  onClose: () => void;
  onAnchor: () => void;
}) {
  const c = KIND_COLORS[spot.kind];
  const pct = Math.round(spot.intensity * 100);
  return (
    <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-auto">
      <div
        className="bg-black/85 backdrop-blur-md rounded-2xl p-4 border shadow-2xl"
        style={{ borderColor: c.fill + "66" }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: c.fill }}
            >
              {c.label}
            </p>
            <h3 className="font-display text-base text-white uppercase tracking-wider truncate">
              {spot.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          {spot.description}
        </p>
        <div className="mb-3">
          <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-slate-400 mb-1">
            <span>Intensity</span>
            <span style={{ color: c.fill }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: c.fill,
                boxShadow: `0 0 8px ${c.glow}`,
              }}
            />
          </div>
        </div>
        <Button
          onClick={onAnchor}
          className="w-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black border border-cyan-500 font-mono text-xs uppercase tracking-widest"
        >
          <Sparkles className="w-3 h-3" />
          Anchor here · +50
        </Button>
      </div>
    </div>
  );
}

// ───────────────── Toast ─────────────────

function Toast({ msg }: { msg: string }) {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-4 py-2 rounded-full backdrop-blur-md font-mono text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(52,211,153,0.4)]">
        {msg}
      </div>
    </div>
  );
}

// ───────────────── Page ─────────────────

export function MapPage() {
  const [locMode, setLocMode] = useState<LocationMode>("pending");
  const [defaultCity, setDefaultCity] = useState<CityOption>(DEFAULT_CITIES[0]);
  const [center, setCenter] = useState<UserCenter>({
    lat: DEFAULT_CITIES[0].lat,
    lng: DEFAULT_CITIES[0].lng,
    fromGeo: false,
    cityLabel: DEFAULT_CITIES[0].label,
  });
  const [selected, setSelected] = useState<EnergyHotspot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // refresh hotspots each hour
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = window.setInterval(
      () => setHour(new Date().getHours()),
      60_000,
    );
    return () => window.clearInterval(id);
  }, []);

  const hotspots = useMemo(
    () => generateHotspots(center.lat, center.lng, hour),
    [center.lat, center.lng, hour],
  );

  function requestGeo() {
    if (!("geolocation" in navigator)) {
      applyCity(defaultCity, false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          fromGeo: true,
          cityLabel: "you",
        });
        setLocMode("granted");
      },
      () => applyCity(defaultCity, false),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
    );
  }

  function applyCity(c: CityOption, granted: boolean) {
    setCenter({ lat: c.lat, lng: c.lng, fromGeo: false, cityLabel: c.label });
    setLocMode(granted ? "granted" : "denied");
  }

  function handleAnchor(spot: EnergyHotspot) {
    store.logSwarmEvent({
      kind: "anchor-rift",
      label: spot.name,
      score: Math.round(spot.intensity * 100),
    });
    store.awardPoints(50, "anchor");
    setToast("Anchor placed. +50 peace points.");
    setSelected(null);
    window.setTimeout(() => setToast(null), 2400);
  }

  if (!hasValidKey) return <NoKeyView />;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] pb-16 relative overflow-hidden">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(0.85); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 0.95; }
        }
        @keyframes pulse-breath {
          0%, 100% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.9; }
        }
      `}</style>
      <PrivacyStrip />
      <MapHeader city={center.cityLabel} />

      <div className="absolute inset-0">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            center={{ lat: center.lat, lng: center.lng }}
            zoom={13}
            mapId="SWARM_RIFT_MAP"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            disableDefaultUI={true}
            gestureHandling="greedy"
          >
            {center.fromGeo && (
              <UserMarker lat={center.lat} lng={center.lng} />
            )}
            {hotspots.map((spot) => (
              <HotspotMarker
                key={spot.id}
                spot={spot}
                onClick={() => setSelected(spot)}
              />
            ))}
          </Map>
        </APIProvider>
      </div>

      {locMode === "pending" && (
        <ConsentCard
          onUseLocation={requestGeo}
          onDeny={() => applyCity(defaultCity, false)}
          city={defaultCity}
          setCity={setDefaultCity}
        />
      )}

      {locMode === "denied" && !center.fromGeo && (
        <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
            <Info className="w-3 h-3 text-slate-300" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-300">
              Showing public anchors near {center.cityLabel}.
            </p>
          </div>
        </div>
      )}

      {selected && (
        <DetailSheet
          spot={selected}
          onClose={() => setSelected(null)}
          onAnchor={() => handleAnchor(selected)}
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}
