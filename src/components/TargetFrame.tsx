/**
 * Project Frontier - Top-Center Target Status Frame
 * Refined low-profile pill design with safe-area top padding
 */

import React from 'react';
import { EnemyInstance } from '../game/combat.ts';
import { FriendlyNPCConfig } from '../game/worldData.ts';
import { X, ShieldAlert, Skull, MessageSquare } from 'lucide-react';

interface TargetFrameProps {
  target: EnemyInstance | FriendlyNPCConfig | null;
  onClearTarget: () => void;
}

export const TargetFrame: React.FC<TargetFrameProps> = ({ target, onClearTarget }) => {
  if (!target) return null;

  const isEnemy = 'currentHealth' in target;
  const enemy = isEnemy ? (target as EnemyInstance) : null;
  const friendly = !isEnemy ? (target as FriendlyNPCConfig) : null;

  const hpPercent = enemy
    ? Math.max(0, Math.min(100, (enemy.currentHealth / Math.max(1, enemy.maxHealth)) * 100))
    : 100;

  return (
    <div
      className="flex flex-col items-center pointer-events-auto animate-in fade-in duration-150"
      style={{
        paddingTop: 'max(0.4rem, env(safe-area-inset-top, 0.4rem))',
      }}
    >
      <div className="flex items-center gap-2 p-1 px-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 shadow-lg min-w-[180px] max-w-[250px]">
        {/* Role Icon */}
        <div className={`p-1 rounded-md shrink-0 ${
          isEnemy 
            ? enemy?.definition.isBoss ? 'bg-red-950/80 text-red-400 border border-red-500/50' : 'bg-rose-950/80 text-rose-400 border border-rose-600/40'
            : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
        }`}>
          {isEnemy ? <Skull className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
        </div>

        {/* Info & HP Bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-semibold leading-none mb-1">
            <span className="truncate text-slate-100 pr-1">
              {target.name}
            </span>
            <span className={`text-[9px] font-bold px-1 rounded shrink-0 ${
              isEnemy ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {isEnemy ? `L${enemy?.definition.level}` : friendly?.role}
            </span>
          </div>

          {/* Enemy HP Bar or Friendly status */}
          {isEnemy ? (
            <div className="relative w-full h-2.5 bg-slate-950 rounded border border-rose-600/30 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  enemy?.definition.isBoss
                    ? 'bg-gradient-to-r from-red-600 to-amber-500'
                    : 'bg-gradient-to-r from-rose-600 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold text-white tabular-nums drop-shadow-sm">
                {Math.round(enemy?.currentHealth || 0)} / {enemy?.maxHealth}
              </span>
            </div>
          ) : (
            <div className="text-[9.5px] text-cyan-400 font-medium">
              Friendly Outpost NPC
            </div>
          )}
        </div>

        {/* Clear target button */}
        <button
          onClick={onClearTarget}
          className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Deselect target"
          aria-label="Deselect target"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Target active debuffs */}
      {enemy && enemy.buffs && enemy.buffs.length > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          {enemy.buffs.map((buff, idx) => (
            <div
              key={`${buff.definitionId}_${idx}`}
              className="px-1 py-0.2 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[8px] flex items-center gap-0.5"
            >
              <ShieldAlert className="w-2 h-2" />
              <span>{buff.name}</span>
              <span className="font-bold tabular-nums">({Math.ceil(buff.remainingTime)}s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
