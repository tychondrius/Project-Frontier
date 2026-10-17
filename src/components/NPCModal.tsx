/**
 * Project Frontier - Outpost NPC Dialogue & Shop Trading Window
 */

import React, { useState } from 'react';
import { FriendlyNPCConfig } from '../game/worldData.ts';
import { InventoryItem, ItemDefinition } from '../game/types.ts';
import { SHOP_INVENTORY, createScaledItem } from '../game/items.ts';
import { soundManager } from '../game/audio.ts';
import { X, MessageSquare, ShoppingBag, Coins, ShieldCheck, Heart } from 'lucide-react';

interface NPCModalProps {
  npc: FriendlyNPCConfig;
  playerCredits: number;
  playerInventory: InventoryItem[];
  onBuyItem: (item: ItemDefinition) => void;
  onSellItem: (instanceId: string, item: ItemDefinition) => void;
  onOpenQuests: () => void;
  onClose: () => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({
  npc,
  playerCredits,
  playerInventory,
  onBuyItem,
  onSellItem,
  onOpenQuests,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'buy' | 'sell'>(
    npc.role === 'shop' ? 'buy' : 'dialogue'
  );
  const [dialogueText, setDialogueText] = useState(npc.dialogue.greeting);

  // Scaled shop goods
  const shopItems: ItemDefinition[] = React.useMemo(() => {
    return SHOP_INVENTORY.map(entry => createScaledItem(entry.templateId, entry.ql));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {npc.name}
              </h2>
              <span className="text-xs text-cyan-400">{npc.title}</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close NPC Dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'dialogue'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Comms Feed
          </button>

          {npc.role === 'shop' && (
            <>
              <button
                onClick={() => setActiveTab('buy')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'buy'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Requisition Store
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'sell'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Liquidate Salvage
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-400 py-1">
            <Coins className="w-3.5 h-3.5" />
            {playerCredits} Credits
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200">
          {activeTab === 'dialogue' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 leading-relaxed text-sm text-slate-300">
                "{dialogueText}"
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Select Response:
                </span>
                {npc.dialogue.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playUIClick();
                      setDialogueText(opt.response);
                      if (opt.action === 'open_quests') {
                        onClose();
                        onOpenQuests();
                      } else if (opt.action === 'open_shop') {
                        setActiveTab('buy');
                      }
                    }}
                    className="w-full text-left p-3 rounded-xl bg-slate-950/50 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-xs font-medium text-cyan-200 transition flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-slate-500">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'buy' && (
            <div className="space-y-2.5">
              {shopItems.map(item => {
                const canAfford = playerCredits >= item.value;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800">
                          QL{item.ql}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-amber-300 tabular-nums">
                        {item.value} cr
                      </span>

                      <button
                        onClick={() => {
                          if (canAfford) {
                            soundManager.playLootPickup();
                            onBuyItem(item);
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                          canAfford
                            ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'sell' && (
            <div className="space-y-2.5">
              {playerInventory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Inventory is currently empty.
                </div>
              ) : (
                playerInventory.map(entry => {
                  const sellValue = Math.max(5, Math.floor(entry.item.value * 0.6));

                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {entry.item.name} {entry.quantity > 1 ? `x${entry.quantity}` : ''}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Salvage Value: {sellValue} Credits each
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          soundManager.playLootPickup();
                          onSellItem(entry.id, entry.item);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-md"
                      >
                        Sell (+{sellValue} cr)
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
