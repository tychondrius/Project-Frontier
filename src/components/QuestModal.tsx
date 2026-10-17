/**
 * Project Frontier - Quest Log Modal
 */

import React from 'react';
import { QuestState } from '../game/types.ts';
import { soundManager } from '../game/audio.ts';
import { X, Target, CheckCircle2, Clock, Gift } from 'lucide-react';

interface QuestModalProps {
  quests: QuestState[];
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quests,
  onClaimQuest,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Mission Log & Directives
              </h2>
              <span className="text-xs text-slate-400">Priority Outpost Delta Assignments</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Mission Log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {quests.map(quest => {
            const isReady = quest.status === 'ready_to_turn_in';
            const isCompleted = quest.status === 'completed';

            return (
              <div
                key={quest.definitionId}
                className={`p-4 rounded-xl border transition ${
                  isReady
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                    : isCompleted
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
                      Bounty Directive
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {quest.title}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isReady
                      ? 'bg-amber-500 text-slate-950'
                      : isCompleted
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isReady ? 'Ready for Turn-in' : isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {quest.description}
                </p>

                {/* Objectives */}
                <div className="space-y-1.5 mb-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Objectives:
                  </span>
                  {quest.objectives.map(obj => (
                    <div key={obj.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {obj.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className={obj.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>
                          {obj.description}
                        </span>
                      </div>
                      <span className="font-bold text-cyan-400 tabular-nums">
                        {obj.currentAmount} / {obj.requiredAmount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rewards & Claim Button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-3 text-xs">
                    <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-slate-400">Rewards:</span>
                    <span className="font-bold text-cyan-300">+{quest.rewards.xp} XP</span>
                    <span className="font-bold text-amber-300">+{quest.rewards.credits} Credits</span>
                  </div>

                  {isReady && (
                    <button
                      onClick={() => {
                        soundManager.playLevelUp();
                        onClaimQuest(quest.definitionId);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition"
                    >
                      Turn In Bounty
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
