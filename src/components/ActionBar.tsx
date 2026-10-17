/**
 * Project Frontier - Mobile Combat Action Bar
 * Refined layout:
 * - Vertical Interaction Cluster (TARGET & TALK) above joystick
 * - Compact 2x2 Abilities centered at bottom
 * - Primary AUTO Attack on bottom-right
 * - Full safe-area inset support & 20% reduced visual clutter
 */

import React from 'react';
import { AbilityDefinition } from '../game/types.ts';
import { Crosshair, Flame, ShieldAlert, HeartPulse, Zap, MessageSquare } from 'lucide-react';

interface ActionBarProps {
  abilities: AbilityDefinition[];
  cooldowns: Record<string, number>;
  playerEnergy: number;
  isAutoAttacking: boolean;
  autoAttackProgress: number; // 0.0 to 1.0 (recharge sweep)
  hasTarget: boolean;
  canInteract: boolean;
  onToggleAutoAttack: () => void;
  onUseAbility: (abilityId: string) => void;
  onCycleTarget: () => void;
  onInteract: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  abilities,
  cooldowns,
  playerEnergy,
  isAutoAttacking,
  autoAttackProgress,
  hasTarget,
  canInteract,
  onToggleAutoAttack,
  onUseAbility,
  onCycleTarget,
  onInteract,
}) => {
  const getAbilityIcon = (id: string) => {
    switch (id) {
      case 'plasma_shot':
        return <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />;
      case 'disruptor_pulse':
        return <ShieldAlert className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300" />;
      case 'emergency_stim':
        return <HeartPulse className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-300" />;
      case 'overclock':
        return <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-yellow-300" />;
      default:
        return <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />;
    }
  };

  return (
    <>
      {/* 1. Small Vertical Interaction Cluster (TARGET & TALK) - Above Joystick */}
      <div
        className="absolute flex flex-col gap-2 pointer-events-auto select-none z-20"
        style={{
          left: 'max(0.9rem, env(safe-area-inset-left, 0.9rem))',
          bottom: 'calc(max(0.6rem, env(safe-area-inset-bottom, 0.6rem)) + 7.6rem)',
        }}
      >
        {/* Target Cycle Button */}
        <button
          onClick={onCycleTarget}
          className="w-11 h-11 rounded-xl bg-slate-900/80 backdrop-blur-none border border-indigo-400/40 flex flex-col items-center justify-center text-indigo-300 hover:bg-indigo-950/70 hover:border-indigo-400 active:scale-95 transition shadow-md"
          title="Cycle Nearest Hostile Target (Tab)"
          aria-label="Target Nearest Hostile"
        >
          <Crosshair className="w-4 h-4" />
          <span className="text-[7.5px] font-black uppercase tracking-tight mt-0.5">TARGET</span>
        </button>

        {/* Talk / Interact Button */}
        <button
          onClick={onInteract}
          disabled={!canInteract}
          className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition shadow-md ${
            canInteract
              ? 'bg-cyan-950/85 border-cyan-400 text-cyan-200 active:scale-95 shadow-cyan-500/20 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          title="Interact with NPC (E)"
          aria-label="Interact"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[7.5px] font-black uppercase tracking-tight mt-0.5">TALK</span>
        </button>
      </div>

      {/* 2. Compact 2x2 Abilities Layout - Centered at Bottom */}
      <div
        className="absolute pointer-events-auto select-none z-20"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
        }}
      >
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/50 border border-slate-800/60 shadow-lg">
          {abilities.map((ability, idx) => {
            const cd = cooldowns[ability.id] || 0;
            const hasEnergy = playerEnergy >= ability.energyCost;
            const isOnCooldown = cd > 0;
            const cdPercent = Math.min(100, (cd / ability.rechargeTime) * 100);

            return (
              <button
                key={ability.id}
                onClick={() => onUseAbility(ability.id)}
                disabled={isOnCooldown || !hasEnergy}
                className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex flex-col items-center justify-center border overflow-hidden transition active:scale-95 shadow-sm ${
                  isOnCooldown
                    ? 'bg-slate-950/90 border-slate-800 opacity-65 cursor-not-allowed'
                    : !hasEnergy
                    ? 'bg-slate-900/75 border-red-500/40 opacity-55'
                    : 'bg-slate-900/85 border-cyan-500/35 hover:border-cyan-400'
                }`}
                title={`${ability.name} (${ability.energyCost} Energy)`}
                aria-label={`Ability ${ability.name}`}
              >
                {/* Cooldown Dark Sweep Overlay */}
                {isOnCooldown && (
                  <div
                    className="absolute inset-0 bg-slate-950/85 z-10"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${cdPercent}%, 0 ${cdPercent}%)`,
                    }}
                  />
                )}

                {/* Cooldown text */}
                {isOnCooldown && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center font-black text-amber-300 text-[10px] tabular-nums">
                    {cd.toFixed(1)}s
                  </div>
                )}

                {/* Desktop keybind badge */}
                <span className="absolute top-0.5 left-1 text-[7px] font-bold text-slate-500">
                  {idx + 1}
                </span>

                {/* Energy cost badge */}
                <span className={`absolute top-0.5 right-1 text-[7.5px] font-bold ${
                  hasEnergy ? 'text-cyan-400' : 'text-red-400'
                }`}>
                  {ability.energyCost}e
                </span>

                {/* Icon */}
                <div className="mt-1.5">
                  {getAbilityIcon(ability.id)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Primary AUTO Attack Button - Bottom-Right */}
      <div
        className="absolute pointer-events-auto select-none z-20"
        style={{
          right: 'max(0.75rem, env(safe-area-inset-right, 0.75rem))',
          bottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))',
        }}
      >
        <button
          onClick={onToggleAutoAttack}
          className={`relative w-16 h-16 sm:w-17 sm:h-17 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-95 ${
            isAutoAttacking
              ? 'bg-gradient-to-br from-red-600 to-rose-700 border-red-300 text-white shadow-red-500/40 ring-2 ring-red-400/40'
              : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 text-slate-300 hover:border-cyan-400'
          }`}
          title="Toggle Auto Attack (Space)"
          aria-label="Auto Attack"
        >
          {/* Recharge sweep ring */}
          {isAutoAttacking && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r="29"
                fill="transparent"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="182"
                strokeDashoffset={182 * (1 - autoAttackProgress)}
                className="transition-all duration-75"
              />
            </svg>
          )}

          <Crosshair className={`w-6 h-6 ${isAutoAttacking ? 'text-white' : 'text-cyan-400'}`} />
          <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">
            {isAutoAttacking ? 'ATTACK' : 'AUTO'}
          </span>
        </button>
      </div>
    </>
  );
};
