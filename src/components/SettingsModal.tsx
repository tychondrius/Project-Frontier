/**
 * Project Frontier - Settings & Developer Debug Panel
 */

import React, { useState } from 'react';
import { soundManager } from '../game/audio.ts';
import { X, Settings, Volume2, VolumeX, Monitor, Terminal, RefreshCw, PlusCircle, Heart, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  graphicsQuality: 'Low' | 'Medium' | 'High';
  fps: number;
  playerPos: { x: number; y: number; z: number };
  playerLevel: number;
  attackRating: number;
  defenseRating: number;
  targetId: string | null;
  enemyCount: number;
  onSetGraphicsQuality: (q: 'Low' | 'Medium' | 'High') => void;
  onAddCredits: (amount: number) => void;
  onGainLevel: () => void;
  onHealPlayer: () => void;
  onSpawnEnemy: () => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  graphicsQuality,
  fps,
  playerPos,
  playerLevel,
  attackRating,
  defenseRating,
  targetId,
  enemyCount,
  onSetGraphicsQuality,
  onAddCredits,
  onGainLevel,
  onHealPlayer,
  onSpawnEnemy,
  onResetSave,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    soundManager.setVolume(v);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                System Configuration
              </h2>
              <span className="text-xs text-slate-400">Settings & Prototype Debug Telemetry</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-200">
          {/* Audio Controls */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Synthesized Audio Matrix
            </h3>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleToggleMute}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition ${
                  isMuted
                    ? 'bg-rose-950/50 border-rose-600 text-rose-300'
                    : 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? 'Muted' : 'Audio Active'}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-slate-400">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Graphics Performance Profile
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map(quality => (
                <button
                  key={quality}
                  onClick={() => {
                    soundManager.playUIClick();
                    onSetGraphicsQuality(quality);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition border ${
                    graphicsQuality === quality
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

          {/* Developer Debug Panel */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Prototype Debug Panel & Cheats
            </h3>

            {/* Telemetry Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">FPS:</span>
                <span className="font-bold text-emerald-400 tabular-nums">{fps}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Coords:</span>
                <span className="font-bold text-cyan-300 tabular-nums">
                  {playerPos.x.toFixed(1)}, {playerPos.z.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">AR / DR:</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {attackRating} / {defenseRating}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Enemies:</span>
                <span className="font-bold text-rose-300 tabular-nums">{enemyCount} active</span>
              </div>
            </div>

            {/* Test Cheats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  soundManager.playLootPickup();
                  onAddCredits(1000);
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                +1,000 Credits
              </button>

              <button
                onClick={() => {
                  soundManager.playLevelUp();
                  onGainLevel();
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gain Level (+5 SP)
              </button>

              <button
                onClick={() => {
                  soundManager.playHeal();
                  onHealPlayer();
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                Heal Player
              </button>

              <button
                onClick={() => {
                  soundManager.playUIClick();
                  onSpawnEnemy();
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Respawn All
              </button>

              <button
                onClick={() => {
                  soundManager.playUIClick();
                  onResetSave();
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 active:scale-95 transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
