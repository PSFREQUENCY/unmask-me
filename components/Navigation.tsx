import { Link, useLocation } from "react-router-dom";
import { Activity, Map as MapIcon, Shield, Trophy, Network, HeartHandshake, VenetianMask } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const location = useLocation();

  const links = [
    { href: "/", label: "Charm", icon: Activity },
    { href: "/unmask", label: "Unmask", icon: VenetianMask },
    { href: "/vai", label: "V.A.I.", icon: Shield },
    { href: "/swarm", label: "Swarm", icon: Network },
    { href: "/rifts", label: "Map", icon: MapIcon },
    { href: "/connect", label: "Connect", icon: HeartHandshake },
    { href: "/reputation", label: "Ledger", icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="absolute inset-0 bg-gradient-to-t from-[#07040d] via-[#0a0612]/95 to-[#0a0612]/40 backdrop-blur-xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-gold)]/40 to-transparent" />
      <div className="relative max-w-md mx-auto flex items-center overflow-x-auto no-scrollbar px-3 py-2 gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          const targetId = `nav-${link.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          return (
            <Link
              key={link.href}
              id={targetId}
              to={link.href}
              className={cn(
                "tactile-press relative flex flex-col items-center gap-1 min-w-[58px] py-2 px-2 rounded-xl",
                "transition-colors duration-300",
                isActive
                  ? "text-[var(--color-accent-gold)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-accent-coral)]/80"
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-[var(--color-accent-gold)]/15 to-[var(--color-accent-coral)]/10 border border-[var(--color-accent-gold)]/40"
                  style={{
                    boxShadow:
                      "0 0 14px rgba(232,179,58,0.30), inset 0 1px 0 rgba(255,232,180,0.10)",
                  }}
                />
              )}
              <Icon
                className={cn(
                  "relative w-5 h-5 transition-all",
                  isActive && "drop-shadow-[0_0_10px_rgba(232,179,58,0.85)]"
                )}
              />
              <span
                className={cn(
                  "relative text-[9px] uppercase font-mono tracking-[0.18em] font-bold whitespace-nowrap",
                  isActive && "drop-shadow-[0_0_6px_rgba(232,179,58,0.6)]"
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
