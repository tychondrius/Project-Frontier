/**
 * Project Frontier - Mobile-Optimized Inventory & Item Inspection Modal
 */

import React, { useState } from 'react';
import { InventoryItem, ItemDefinition } from '../game/types.ts';
import { CalculatedCharacterSheet, checkEquipmentRequirements } from '../game/stats.ts';
import { soundManager } from '../game/audio.ts';
import { X, Package, Shield, Zap, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

interface InventoryModalProps {
  items: InventoryItem[];
  sheet: CalculatedCharacterSheet;
  playerLevel: number;
  credits: number;
  onEquipItem: (item: ItemDefinition) => void;
  onUseConsumable: (item: ItemDefinition) => void;
  onDropItem: (instanceId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  items,
  sheet,
  playerLevel,
  credits,
  onEquipItem,
  onUseConsumable,
  onDropItem,
  onClose,
}) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    items.length > 0 ? items[0].id : null
  );

  const selectedEntry = items.find(i => i.id === selectedInstanceId);
  const selectedItem = selectedEntry?.item;

  const reqCheck = selectedItem
    ? checkEquipmentRequirements(selectedItem.requirements, sheet, playerLevel)
    : { canEquip: false, missing: [] };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'rare':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50';
      case 'epic':
        return 'text-purple-400 bg-purple-950/70 border-purple-500/50';
      case 'uncommon':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Field Inventory ({items.length} / 24)
              </h2>
              <span className="text-xs text-amber-400 font-semibold">{credits} Credits</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Inventory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Left Grid, Right Inspection Card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Inventory Grid (7 Cols on MD) */}
          <div className="md:col-span-7 space-y-2">
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
              {Array.from({ length: 24 }).map((_, idx) => {
                const entry = items[idx];
                const isSelected = entry && entry.id === selectedInstanceId;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (entry) {
                        soundManager.playUIClick();
                        setSelectedInstanceId(entry.id);
                      }
                    }}
                    className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1.5 transition ${
                      entry
                        ? isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/40'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-dashed border-slate-800/80 cursor-default'
                    }`}
                  >
                    {entry && (
                      <>
                        <span className="text-xs font-bold text-slate-200 line-clamp-2 text-center leading-tight">
                          {entry.item.name.replace(/ \(QL \d+\)/, '')}
                        </span>

                        {entry.item.ql && (
                          <span className="absolute top-1 left-1.5 text-[8.5px] font-black text-cyan-400">
                            QL{entry.item.ql}
                          </span>
                        )}

                        {entry.quantity > 1 && (
                          <span className="absolute bottom-1 right-1.5 px-1 bg-slate-800 rounded text-[9px] font-bold text-white">
                            x{entry.quantity}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Details Inspection Card (5 Cols on MD) */}
          <div className="md:col-span-5 bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-3.5">
                {/* Item Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRarityBadge(selectedItem.rarity)}`}>
                      {selectedItem.rarity}
                    </span>
                    <span className="text-[11px] font-bold text-cyan-300">
                      QL {selectedItem.ql}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {selectedItem.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Requirements */}
                {selectedItem.requirements.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wide">
                      Requirements:
                    </span>
                    {selectedItem.requirements.map((req, rIdx) => {
                      const meetsReq = !reqCheck.missing.some(m => m.includes(req.name));
                      return (
                        <div key={rIdx} className="flex items-center justify-between text-xs">
                          <span className={meetsReq ? 'text-slate-300' : 'text-rose-400'}>
                            {req.name} ≥ {req.minValue}
                          </span>
                          {meetsReq ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modifiers */}
                {selectedItem.modifiers.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 block uppercase tracking-wide">
                      Stat Modifiers:
                    </span>
                    {selectedItem.modifiers.map((mod, mIdx) => (
                      <div key={mIdx} className="text-xs text-emerald-300 font-medium">
                        +{mod.value}{mod.type === 'percent' ? '%' : ''} {mod.target}
                      </div>
                    ))}
                  </div>
                )}

                {/* Consumable Effects */}
                {selectedItem.consumableEffect && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-0.5">
                    {selectedItem.consumableEffect.healHp && (
                      <div>Restores {selectedItem.consumableEffect.healHp} Health instantly.</div>
                    )}
                    {selectedItem.consumableEffect.restoreEnergy && (
                      <div>Restores {selectedItem.consumableEffect.restoreEnergy} Energy instantly.</div>
                    )}
                  </div>
                )}

                <div className="text-xs text-amber-300 font-semibold">
                  Value: {selectedItem.value} Credits
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  {selectedItem.slot && (
                    <button
                      onClick={() => {
                        soundManager.playUIClick();
                        onEquipItem(selectedItem);
                      }}
                      disabled={!reqCheck.canEquip}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                        reqCheck.canEquip
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-lg'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {reqCheck.canEquip ? 'Equip Gear' : 'Requirements Unmet'}
                    </button>
                  )}

                  {selectedItem.type === 'consumable' && (
                    <button
                      onClick={() => {
                        soundManager.playHeal();
                        onUseConsumable(selectedItem);
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 shadow-lg transition"
                    >
                      Use Consumable
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (selectedInstanceId) {
                        soundManager.playUIClick();
                        onDropItem(selectedInstanceId);
                        setSelectedInstanceId(null);
                      }
                    }}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                <Package className="w-10 h-10 mb-2 opacity-30" />
                Select an item to inspect telemetry and equip
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
