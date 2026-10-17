/**
 * Project Frontier - Title Screen & Archetype Selection
 */

import React, { useState } from 'react';
import { Archetype } from '../game/types.ts';
import { soundManager } from '../game/audio.ts';
import { Shield, Zap, Play, ChevronRight, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (archetype: Archetype) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [phase, setPhase] = useState<'title' | 'archetype'>('title');
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('Vanguard');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleStartTitle = () => {
    soundManager.playLevelUp();
    setPhase('archetype');
    window.scrollTo(0, 0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleConfirmArchetype = () => {
    soundManager.playOverclock();
    onStartGame(selectedArchetype);
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [phase]);

  return (
    <div 
      ref={scrollContainerRef}
      id="archetype-selection-screen"
      className="fixed inset-0 z-20 w-full h-[100dvh] min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-start text-white select-none pointer-events-auto overflow-y-auto"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 1.5rem) + 4.5rem))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))',
      }}
    >
      {/* Background sci-fi atmospheric grid (fixed so it stays in place while scrolling, pointer-events-none) */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #00f0ff 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          backgroundSize: '40px 40px, 40px 40px, 40px 40px',
        }}
      />

      {phase === 'title' ? (
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg space-y-8 animate-in fade-in duration-300 my-auto py-8">
          {/* Bespoke Sci-Fi Title Lockup */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Pre-Alpha Vertical Slice
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase bg-gradient-to-b from-white via-cyan-100 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
              PROJECT FRONTIER
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide max-w-md mx-auto">
              Mobile-first 3D Sci-Fi MMORPG Prototype featuring classic tab-target combat, deep character progression, cybernetic implants, and tactical abilities.
            </p>
          </div>

          {/* Controls Hint */}
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
            Touch Joystick / WASD Move · Drag Right Camera · 1-4 Abilities · Tab Target
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleStartTitle}
            className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            aria-label="Play Project Frontier"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>ENTER FRONTIER</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      ) : (
        /* Archetype Selection Phase */
        <div 
          className="relative z-10 flex flex-col items-center max-w-xl w-full space-y-6 animate-in fade-in duration-300 pt-2 pb-6"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wider">
              Select Combat Archetype
            </h2>
            <p className="text-xs text-slate-400">
              Choose your operative specialization to deploy into Outpost Delta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ touchAction: 'pan-y' }}>
            {/* Vanguard */}
            <div
              onClick={() => {
                soundManager.playUIClick();
                setSelectedArchetype('Vanguard');
              }}
              style={{ touchAction: 'pan-y' }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedArchetype === 'Vanguard'
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Vanguard</h3>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    Heavy Assault & Frontline
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                High kinetic endurance, reinforced armor plating, and superior rifle proficiency. Built for direct fire engagements.
              </p>

              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Health:</span>
                  <span className="text-emerald-400 font-bold">High (350+ HP)</span>
                </div>
                <div className="flex justify-between">
                  <span>Armor & Defense:</span>
                  <span className="text-cyan-400 font-bold">Elevated (+16 Def)</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Weapon:</span>
                  <span className="text-white font-bold">Frontier Rifle</span>
                </div>
              </div>
            </div>

            {/* Technician */}
            <div
              onClick={() => {
                soundManager.playUIClick();
                setSelectedArchetype('Technician');
              }}
              style={{ touchAction: 'pan-y' }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedArchetype === 'Technician'
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Technician</h3>
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                    Nano Specialist & Implants
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Maximum nano-energy capacity, rapid ability recharges, and advanced cybernetic augment compatibility.
              </p>

              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Nano Energy:</span>
                  <span className="text-cyan-400 font-bold">High (200+ Energy)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cybernetics & Biotech:</span>
                  <span className="text-purple-400 font-bold">Expert (+16 Skill)</span>
                </div>
                <div className="flex justify-between">
                  <span>Ability Scaling:</span>
                  <span className="text-white font-bold">Potent (INT/PER)</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmArchetype}
            style={{ touchAction: 'pan-y' }}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            aria-label="Confirm and Enter World"
          >
            DEPLOY AS {selectedArchetype}
          </button>
        </div>
      )}
    </div>
  );
};
