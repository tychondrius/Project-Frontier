/**
 * Project Frontier - Top-Left Player Status Frame
 * Refined low-clutter design with safe-area padding
 */

import React from 'react';
import { ActiveBuff, Archetype } from '../game/types.ts';
import { Shield, Zap, Coins, User } from 'lucide-react';

interface PlayerFrameProps {
  archetype: Archetype;
  level: number;
  currentHp: number;
  maxHp: number;
  currentEnergy: number;
  maxEnergy: number;
  credits: number;
  buffs: ActiveBuff[];
  onOpenCharacterSheet: () => void;
}

export const PlayerFrame: React.FC<PlayerFrameProps> = ({
  archetype,
  level,
  currentHp,
  maxHp,
  currentEnergy,
  maxEnergy,
  credits,
  buffs,
  onOpenCharacterSheet,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / Math.max(1, maxHp)) * 100));
  const energyPercent = Math.max(0, Math.min(100, (currentEnergy / Math.max(1, maxEnergy)) * 100));

  return (
    <div
      className="flex flex-col gap-1 pointer-events-auto"
      style={{
        paddingLeft: 'max(0.4rem, env(safe-area-inset-left, 0.4rem))',
        paddingTop: 'max(0.4rem, env(safe-area-inset-top, 0.4rem))',
      }}
    >
      <div 
        onClick={onOpenCharacterSheet}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-950/75 border border-cyan-500/25 shadow-md cursor-pointer hover:border-cyan-400/50 transition-colors"
        title="Tap to open Character Sheet"
      >
        {/* Avatar Portrait & Level Badge */}
        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-cyan-950 border border-cyan-500/35 flex items-center justify-center overflow-hidden shrink-0">
          <User className="w-5 h-5 text-cyan-300" />
          <div className="absolute -bottom-0.5 -right-0.5 px-1 bg-cyan-500 text-slate-950 font-black text-[9px] rounded-tl tracking-tighter">
            L{level}
          </div>
        </div>

        {/* Vitals Bars */}
        <div className="flex flex-col gap-0.5 min-w-[130px] sm:min-w-[150px]">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200">
            <span className="text-cyan-300 uppercase tracking-wider">{archetype}</span>
            <span className="flex items-center gap-0.5 text-amber-300 tabular-nums">
              <Coins className="w-2.5 h-2.5 text-amber-400" />
              {credits}
            </span>
          </div>

          {/* HP Bar */}
          <div className="relative w-full h-3 bg-slate-950/90 rounded border border-red-500/25 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
              style={{ width: `${hpPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold text-white/90 drop-shadow-sm tabular-nums">
              {Math.round(currentHp)} / {Math.round(maxHp)}
            </span>
          </div>

          {/* Energy / Nano Bar */}
          <div className="relative w-full h-2.5 bg-slate-950/90 rounded border border-cyan-500/25 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-200"
              style={{ width: `${energyPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold text-cyan-100 drop-shadow-sm tabular-nums">
              {Math.round(currentEnergy)} / {Math.round(maxEnergy)}
            </span>
          </div>
        </div>
      </div>

      {/* Active Buffs & Debuffs */}
      {buffs.length > 0 && (
        <div className="flex items-center gap-1 pl-0.5">
          {buffs.map((buff, idx) => (
            <div
              key={`${buff.definitionId}_${idx}`}
              className={`relative px-1 py-0.2 rounded border text-[8.5px] flex items-center gap-0.5 ${
                buff.isDebuff
                  ? 'bg-rose-950/70 border-rose-600/40 text-rose-300'
                  : 'bg-emerald-950/70 border-emerald-600/40 text-emerald-300'
              }`}
              title={`${buff.name}: ${Math.ceil(buff.remainingTime)}s remaining`}
            >
              {buff.isDebuff ? <Shield className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
              <span className="text-[8px] font-semibold truncate max-w-[55px]">{buff.name}</span>
              <span className="text-[7.5px] font-bold text-white/90 tabular-nums">
                {Math.ceil(buff.remainingTime)}s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
