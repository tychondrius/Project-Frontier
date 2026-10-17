/**
 * Project Frontier - Character Sheet, Equipment Paperdoll & Skill Points Modal
 */

import React, { useState } from 'react';
import {
  Archetype,
  EquipmentSlot,
  ItemDefinition,
  PlayerStatsState,
  PrimaryStatType,
  SkillType,
} from '../game/types.ts';
import { CalculatedCharacterSheet } from '../game/stats.ts';
import { soundManager } from '../game/audio.ts';
import { X, Shield, Plus, Cpu, Zap, Activity } from 'lucide-react';

interface CharacterModalProps {
  playerState: PlayerStatsState;
  sheet: CalculatedCharacterSheet;
  equipment: Partial<Record<EquipmentSlot, ItemDefinition>>;
  onAllocateSkillPoint: (skill: SkillType) => void;
  onUnequipSlot: (slot: EquipmentSlot) => void;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  playerState,
  sheet,
  equipment,
  onAllocateSkillPoint,
  onUnequipSlot,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'skills'>('equipment');

  const slots: { slot: EquipmentSlot; label: string }[] = [
    { slot: 'Head', label: 'Head' },
    { slot: 'Chest', label: 'Chest' },
    { slot: 'Back', label: 'Back' },
    { slot: 'Hands', label: 'Hands' },
    { slot: 'Legs', label: 'Legs' },
    { slot: 'Feet', label: 'Feet' },
    { slot: 'Weapon', label: 'Primary Weapon' },
    { slot: 'CyberImplant', label: 'Cyber Implant' },
    { slot: 'Accessory1', label: 'Bio Augment 1' },
    { slot: 'Accessory2', label: 'Bio Augment 2' },
  ];

  const primaryStatKeys: PrimaryStatType[] = [
    'Strength', 'Agility', 'Endurance', 'Intelligence', 'Perception', 'Willpower'
  ];

  const skillKeys: SkillType[] = [
    'Rifle', 'Pistol', 'Melee', 'Defense', 'Engineering', 'Biotechnology', 'Cybernetics'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Operative Dossier
              </h2>
              <p className="text-xs text-slate-400">
                {playerState.archetype} · Level {playerState.level} · {playerState.credits} Credits
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Character Sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'equipment'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Equipment & Combat Stats
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'skills'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Skills & Progression
            {playerState.unspentSkillPoints > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                +{playerState.unspentSkillPoints}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200 space-y-5">
          {activeTab === 'equipment' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Equipment Slots */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Equipped Gear & Implants
                </h3>
                <div className="space-y-1.5">
                  {slots.map(({ slot, label }) => {
                    const item = equipment[slot];
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                            item
                              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-dashed border-slate-700 text-slate-600'
                          }`}>
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block leading-tight">{label}</span>
                            <span className="text-xs font-semibold truncate block text-slate-100">
                              {item ? item.name : 'Empty Slot'}
                            </span>
                          </div>
                        </div>

                        {item && (
                          <button
                            onClick={() => {
                              soundManager.playUIClick();
                              onUnequipSlot(slot);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded transition"
                          >
                            Unequip
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combat Stats Column */}
              <div className="space-y-4">
                {/* Primary Stats */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5">
                    Primary Attributes
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {primaryStatKeys.map(stat => (
                      <div key={stat} className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">{stat}</span>
                        <span className="font-bold text-white tabular-nums">{sheet.primaryStats[stat]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Derived Combat Stats */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                    Derived Combat Ratings
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Attack Rating (AR)</span>
                      <span className="font-bold text-amber-300 tabular-nums">{sheet.derived.AttackRating}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Defense Rating (DR)</span>
                      <span className="font-bold text-cyan-300 tabular-nums">{sheet.derived.DefenseRating}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Armor Rating</span>
                      <span className="font-bold text-emerald-300 tabular-nums">{sheet.derived.Armor}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Critical Strike Chance</span>
                      <span className="font-bold text-rose-300 tabular-nums">{sheet.derived.CriticalChance}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Movement Speed</span>
                      <span className="font-bold text-white tabular-nums">{sheet.derived.MovementSpeed.toFixed(1)} m/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Skills Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <div>
                  <span className="text-xs text-cyan-300 font-semibold block">Available Skill Points</span>
                  <span className="text-xl font-black text-white">{playerState.unspentSkillPoints}</span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs text-right">
                  Earn +5 Skill Points per Level Up. Allocate points to satisfy weapon and cybernetic requirements!
                </p>
              </div>

              <div className="space-y-2">
                {skillKeys.map(skill => {
                  const val = sheet.skills[skill] || 0;
                  const canSpend = playerState.unspentSkillPoints > 0;

                  return (
                    <div
                      key={skill}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                    >
                      <div>
                        <span className="text-sm font-bold text-white block">{skill}</span>
                        <span className="text-[11px] text-slate-400">
                          {skill === 'Rifle' && 'Increases kinetic/energy weapon damage and requirements'}
                          {skill === 'Defense' && 'Increases evasion and mitigates hostile incoming blows'}
                          {skill === 'Cybernetics' && 'Enables high-tier neural and reflex implants'}
                          {skill === 'Engineering' && 'Boosts energy capacity and armor shield matrix'}
                          {skill === 'Biotechnology' && 'Improves stim recovery potency and bio-implants'}
                          {skill === 'Pistol' && 'Sidearm handling and critical hit accuracy'}
                          {skill === 'Melee' && 'Close-quarters combat mastery'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-cyan-400 tabular-nums">
                          {val}
                        </span>

                        <button
                          onClick={() => {
                            if (canSpend) {
                              soundManager.playUIClick();
                              onAllocateSkillPoint(skill);
                            }
                          }}
                          disabled={!canSpend}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition ${
                            canSpend
                              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-lg'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                          }`}
                          title="Increase skill by 1 point"
                          aria-label={`Increase ${skill}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
