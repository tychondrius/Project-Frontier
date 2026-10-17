/**
 * Project Frontier - Server-Authoritative Ready Combat System
 * Separates Player Intent from Combat Resolution
 */

import type {
  AbilityDefinition,
  ActiveBuff,
  CombatEvent,
  EnemyAIState,
  LootDropEntry,
  LootTable,
  NPCDefinition,
  PlayerStatsState,
  PrimaryStatType,
  QuestState,
} from './types.ts';
import type { CalculatedCharacterSheet } from './stats.ts';
import { applyOrRefreshBuff } from './abilities.ts';
import { createScaledItem } from './items.ts';

export interface CombatEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  position: { x: number; y: number; z: number };
  currentHealth: number;
  maxHealth: number;
  currentEnergy?: number;
  maxEnergy?: number;
  attackRating: number;
  defenseRating: number;
  armor: number;
  critChance: number;
  attackSpeedMultiplier: number;
  buffs: ActiveBuff[];
  isDead: boolean;
}

export interface EnemyInstance extends CombatEntity {
  defId: string;
  definition: NPCDefinition;
  aiState: EnemyAIState;
  spawnPoint: { x: number; y: number; z: number };
  targetEntityId: string | null;
  threatTable: Map<string, number>; // EntityId -> Threat Value
  attackCooldown: number;
  specialAbilityCooldown: number;
  patrolAngle: number;
  patrolTimer: number;
}

export interface AbilityExecutionResult {
  success: boolean;
  errorReason?: string;
  events: CombatEvent[];
}

export class CombatSystem {
  /**
   * Calculates hit chance, critical strike, and final mitigated damage
   */
  public static resolveAttackDamage(
    attackerAR: number,
    defenderDR: number,
    baseDamage: number,
    attackerCritChance: number,
    defenderArmor: number
  ): { damage: number; isCrit: boolean; isMiss: boolean } {
    // Hit chance based on Attack Rating vs Defense Rating
    const arVsDrRatio = attackerAR / Math.max(1, defenderDR);
    const hitChance = Math.min(0.98, Math.max(0.40, 0.75 + (arVsDrRatio - 1.0) * 0.25));

    if (Math.random() > hitChance) {
      return { damage: 0, isCrit: false, isMiss: true };
    }

    // Critical Strike check
    const isCrit = (Math.random() * 100) < attackerCritChance;
    let rawDamage = baseDamage * (0.9 + Math.random() * 0.2); // +/- 10% damage variance
    if (isCrit) {
      rawDamage *= 1.75;
    }

    // Armor mitigation formula: Damage * (100 / (100 + Armor))
    const effectiveArmor = Math.max(0, defenderArmor);
    const mitigationMultiplier = 100 / (100 + effectiveArmor * 1.5);
    const mitigatedDamage = Math.max(1, Math.round(rawDamage * mitigationMultiplier));

    return {
      damage: mitigatedDamage,
      isCrit,
      isMiss: false,
    };
  }

  /**
   * Processes player intent to use an ability on a target
   */
  public static executeAbilityIntent(
    ability: AbilityDefinition,
    cooldownRemaining: number,
    playerSheet: CalculatedCharacterSheet,
    playerStats: PlayerStatsState,
    playerPosition: { x: number; y: number; z: number },
    target: EnemyInstance | null,
    playerBuffs: ActiveBuff[]
  ): {
    result: AbilityExecutionResult;
    updatedPlayerEnergy: number;
    updatedPlayerBuffs: ActiveBuff[];
    updatedTargetBuffs: ActiveBuff[];
    damageDealt: number;
    threatGenerated: number;
  } {
    const events: CombatEvent[] = [];
    let updatedEnergy = playerStats.currentEnergy;
    let updatedPlayerBuffs = [...playerBuffs];
    let updatedTargetBuffs = target ? [...target.buffs] : [];
    let totalDamage = 0;
    let threat = 0;

    // Check Cooldown
    if (cooldownRemaining > 0) {
      return {
        result: { success: false, errorReason: `${ability.name} is on cooldown (${cooldownRemaining.toFixed(1)}s)`, events },
        updatedPlayerEnergy: updatedEnergy,
        updatedPlayerBuffs,
        updatedTargetBuffs,
        damageDealt: 0,
        threatGenerated: 0,
      };
    }

    // Check Resource Cost
    if (updatedEnergy < ability.energyCost) {
      return {
        result: { success: false, errorReason: `Insufficient Energy (Requires ${ability.energyCost})`, events },
        updatedPlayerEnergy: updatedEnergy,
        updatedPlayerBuffs,
        updatedTargetBuffs,
        damageDealt: 0,
        threatGenerated: 0,
      };
    }

    // Range and Target validity
    const isTargetedAbility = ability.range > 0;
    if (isTargetedAbility) {
      if (!target || target.isDead) {
        return {
          result: { success: false, errorReason: 'Target invalid or dead', events },
          updatedPlayerEnergy: updatedEnergy,
          updatedPlayerBuffs,
          updatedTargetBuffs,
          damageDealt: 0,
          threatGenerated: 0,
        };
      }

      const dx = target.position.x - playerPosition.x;
      const dy = target.position.y - playerPosition.y;
      const dz = target.position.z - playerPosition.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > ability.range) {
        return {
          result: { success: false, errorReason: `Target out of range (${dist.toFixed(1)}m / ${ability.range}m)`, events },
          updatedPlayerEnergy: updatedEnergy,
          updatedPlayerBuffs,
          updatedTargetBuffs,
          damageDealt: 0,
          threatGenerated: 0,
        };
      }
    }

    // Consume Energy
    updatedEnergy -= ability.energyCost;

    // Apply Effects
    for (const effect of ability.effects) {
      if (effect.type === 'Damage' && target) {
        let baseDmg = effect.amount || 20;
        if (effect.statScale) {
          const statVal = playerSheet.primaryStats[effect.statScale] || 10;
          baseDmg += statVal * (effect.scaleFactor || 1.0);
        }

        const combatRes = CombatSystem.resolveAttackDamage(
          playerSheet.derived.AttackRating,
          target.defenseRating,
          baseDmg,
          playerSheet.derived.CriticalChance,
          target.armor
        );

        if (combatRes.isMiss) {
          events.push({
            type: 'miss',
            sourceName: 'Player',
            targetName: target.name,
            abilityName: ability.name,
            text: 'Miss!',
            position: target.position,
          });
        } else {
          totalDamage += combatRes.damage;
          threat += combatRes.damage * 1.25;

          events.push({
            type: combatRes.isCrit ? 'crit' : 'damage',
            sourceName: 'Player',
            targetName: target.name,
            value: combatRes.damage,
            abilityName: ability.name,
            isCrit: combatRes.isCrit,
            position: target.position,
          });
        }
      } else if (effect.type === 'Heal') {
        let healAmt = effect.amount || 50;
        if (effect.statScale) {
          const statVal = playerSheet.primaryStats[effect.statScale] || 10;
          healAmt += statVal * (effect.scaleFactor || 1.0);
        }
        healAmt = Math.round(healAmt);

        events.push({
          type: 'heal',
          sourceName: 'Player',
          targetName: 'Player',
          value: healAmt,
          abilityName: ability.name,
          position: playerPosition,
        });

        if (effect.buff) {
          updatedPlayerBuffs = applyOrRefreshBuff(updatedPlayerBuffs, effect.buff);
        }
      } else if (effect.type === 'Buff' && effect.buff) {
        updatedPlayerBuffs = applyOrRefreshBuff(updatedPlayerBuffs, effect.buff);
        events.push({
          type: 'buff_applied',
          sourceName: 'Player',
          targetName: 'Player',
          abilityName: effect.buff.name,
          text: effect.buff.name,
          position: playerPosition,
        });
      } else if (effect.type === 'Debuff' && effect.buff && target) {
        updatedTargetBuffs = applyOrRefreshBuff(updatedTargetBuffs, effect.buff);
        events.push({
          type: 'buff_applied',
          sourceName: 'Player',
          targetName: target.name,
          abilityName: effect.buff.name,
          text: effect.buff.name,
          position: target.position,
        });
        threat += 30; // Debuff threat
      }
    }

    return {
      result: { success: true, events },
      updatedPlayerEnergy: updatedEnergy,
      updatedPlayerBuffs,
      updatedTargetBuffs,
      damageDealt: totalDamage,
      threatGenerated: threat,
    };
  }

  /**
   * Resolves Auto-Attack cycle hit
   */
  public static resolvePlayerAutoAttack(
    playerSheet: CalculatedCharacterSheet,
    target: EnemyInstance,
    baseWeaponDamage: number
  ): {
    damage: number;
    isCrit: boolean;
    isMiss: boolean;
    threat: number;
    events: CombatEvent[];
  } {
    const res = CombatSystem.resolveAttackDamage(
      playerSheet.derived.AttackRating,
      target.defenseRating,
      baseWeaponDamage,
      playerSheet.derived.CriticalChance,
      target.armor
    );

    const events: CombatEvent[] = [];

    if (res.isMiss) {
      events.push({
        type: 'miss',
        sourceName: 'Player',
        targetName: target.name,
        abilityName: 'Auto Attack',
        text: 'Miss!',
        position: target.position,
      });
    } else {
      events.push({
        type: res.isCrit ? 'crit' : 'damage',
        sourceName: 'Player',
        targetName: target.name,
        value: res.damage,
        abilityName: 'Auto Attack',
        isCrit: res.isCrit,
        position: target.position,
      });
    }

    return {
      damage: res.damage,
      isCrit: res.isCrit,
      isMiss: res.isMiss,
      threat: res.damage,
      events,
    };
  }

  /**
   * Roll loot from an enemy's loot table upon death
   */
  public static generateLoot(lootTable: LootTable): {
    credits: number;
    items: { itemDefId: string; quantity: number }[];
  } {
    const credits = Math.floor(
      lootTable.creditsMin + Math.random() * (lootTable.creditsMax - lootTable.creditsMin + 1)
    );

    const items: { itemDefId: string; quantity: number }[] = [];

    for (const drop of lootTable.drops) {
      if (Math.random() <= drop.chance) {
        const qty = Math.floor(drop.minQty + Math.random() * (drop.maxQty - drop.minQty + 1));
        if (qty > 0) {
          items.push({
            itemDefId: drop.itemDefId,
            quantity: qty,
          });
        }
      }
    }

    return { credits, items };
  }

  /**
   * Update quest objectives on enemy kill or item collection
   */
  public static updateQuestProgress(
    quests: QuestState[],
    type: 'Kill' | 'Collect',
    targetId: string,
    amount: number = 1
  ): { updatedQuests: QuestState[]; completedQuests: QuestState[] } {
    let completedQuests: QuestState[] = [];
    const updated = quests.map(q => {
      if (q.status !== 'in_progress') return q;

      let changed = false;
      const objectives = q.objectives.map(obj => {
        if (obj.type === type && (obj.targetId === targetId || targetId.includes(obj.targetId))) {
          const newCurrent = Math.min(obj.requiredAmount, obj.currentAmount + amount);
          if (newCurrent !== obj.currentAmount) {
            changed = true;
            return {
              ...obj,
              currentAmount: newCurrent,
              completed: newCurrent >= obj.requiredAmount,
            };
          }
        }
        return obj;
      });

      const allCompleted = objectives.every(obj => obj.completed);
      let newStatus: QuestState['status'] = q.status;
      if (allCompleted && q.status === 'in_progress') {
        newStatus = 'ready_to_turn_in';
        completedQuests.push({ ...q, objectives, status: newStatus });
      }

      return changed || newStatus !== q.status ? { ...q, objectives, status: newStatus } : q;
    });

    return { updatedQuests: updated, completedQuests };
  }
}
