/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SettingsPanel } from "@/components/SettingsPanel";
import { GemmaBadge } from "@/components/GemmaBadge";
import { DailyNudge } from "@/components/DailyNudge";
import { Home } from "@/pages/Home";
import { Swarm } from "@/pages/Swarm";
import { Connect } from "@/pages/Connect";
import { MapPage } from "@/pages/Map";
import { VAI } from "@/pages/VAI";
import { Unmask } from "@/pages/Unmask";
import { Reputation } from "@/pages/Reputation";
import { BootSequence } from "@/components/BootSequence";
import { Walkthrough } from "@/components/Walkthrough";
import { initGemma } from "@/lib/gemma";
import { useStore } from "@/lib/store";

export default function App() {
  const intakeDone = useStore((s) => s.intake.done);
  const [hasBooted, setHasBooted] = useState(intakeDone);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    initGemma();
  }, []);

  const completeBoot = () => {
    setHasBooted(true);
    setShowTour(true);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-body)] relative selection:bg-[var(--color-accent-coral)] selection:text-black overflow-x-hidden">
        {!hasBooted && <BootSequence onComplete={completeBoot} />}

        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[15%] w-[65%] h-[60%] bg-[#FF2D8B]/[0.18] rounded-full blur-[140px]"></div>
          <div className="absolute top-[30%] -right-[20%] w-[55%] h-[55%] bg-[#E8B33A]/[0.10] rounded-full blur-[150px]"></div>
          <div className="absolute -bottom-[20%] left-[10%] w-[60%] h-[55%] bg-[#B14BFF]/[0.14] rounded-full blur-[160px]"></div>
        </div>

        {hasBooted && (
          <>
            <SettingsPanel />
            <GemmaBadge />
            <DailyNudge />
          </>
        )}

        <div className="relative z-10 pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/unmask" element={<Unmask />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/swarm" element={<Swarm />} />
            <Route path="/rifts" element={<MapPage />} />
            <Route path="/vai" element={<VAI />} />
            <Route path="/reputation" element={<Reputation />} />
          </Routes>
        </div>
        <Navigation />
        {showTour && <Walkthrough onComplete={() => setShowTour(false)} />}
      </div>
    </Router>
  );
}
