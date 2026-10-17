/**
 * Project Frontier - Generic Stat System & Classic MMO Progression
 * Base + Equipment + Buffs = Final
 * Includes Over-Equipping (OE), Initiative, and Agg/Def calculations
 */

import type {
  Archetype,
  DerivedStatType,
  EquipmentRequirement,
  EquipmentSlot,
  ItemDefinition,
  PlayerStatsState,
  PrimaryStatType,
  SkillType,
  StatModifier,
  ActiveBuff,
} from './types.ts';

export const XP_PER_LEVEL: Record<number, number> = {
  1: 120,
  2: 280,
  3: 500,
  4: 850,
  5: 1400,
};

export const INITIAL_ARCHETYPE_STATS: Record<Archetype, {
  primary: Record<PrimaryStatType, number>;
  skills: Record<SkillType, number>;
}> = {
  Vanguard: {
    primary: {
      Strength: 16,
      Agility: 14,
      Endurance: 18,
      Intelligence: 10,
      Perception: 12,
      Willpower: 10,
    },
    skills: {
      Rifle: 15,
      Pistol: 8,
      Melee: 12,
      Defense: 16,
      Initiative: 14,
      Engineering: 6,
      Biotechnology: 6,
      Cybernetics: 8,
    },
  },
  Technician: {
    primary: {
      Strength: 10,
      Agility: 12,
      Endurance: 12,
      Intelligence: 18,
      Perception: 15,
      Willpower: 15,
    },
    skills: {
      Rifle: 10,
      Pistol: 12,
      Melee: 5,
      Defense: 10,
      Initiative: 12,
      Engineering: 16,
      Biotechnology: 14,
      Cybernetics: 16,
    },
  },
};

export interface CalculatedCharacterSheet {
  primaryStats: Record<PrimaryStatType, number>;
  skills: Record<SkillType, number>;
  derived: Record<DerivedStatType, number>;
  equippedOeStatus: Record<EquipmentSlot, {
    efficiency: number;
    tier: number;
    isOverEquipped: boolean;
    missingSkills: { name: string; required: number; current: number; ratio: number }[];
  }>;
}

/**
 * Evaluates whether an equipped item is Over-Equipped (OE)
 * and determines its effectiveness multiplier (100%, 75%, 50%, or 25%).
 */
export function evaluateItemOverEquip(
  requirements: EquipmentRequirement[],
  primaryStats: Record<PrimaryStatType, number>,
  skills: Record<SkillType, number>,
  level: number
): {
  efficiency: number;
  tier: number;
  isOverEquipped: boolean;
  missingSkills: { name: string; required: number; current: number; ratio: number }[];
} {
  if (!requirements || requirements.length === 0) {
    return { efficiency: 1.0, tier: 0, isOverEquipped: false, missingSkills: [] };
  }

  let lowestRatio = 1.0;
  const missingSkills: { name: string; required: number; current: number; ratio: number }[] = [];

  for (const req of requirements) {
    let currentVal = 0;
    if (req.type === 'level') {
      currentVal = level;
    } else if (req.type === 'stat') {
      currentVal = primaryStats[req.name as PrimaryStatType] || 0;
    } else if (req.type === 'skill') {
      currentVal = skills[req.name as SkillType] || 0;
    }

    const ratio = currentVal / Math.max(1, req.minValue);
    if (ratio < 1.0) {
      missingSkills.push({
        name: req.name,
        required: req.minValue,
        current: currentVal,
        ratio: Math.round(ratio * 100) / 100,
      });
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
      }
    }
  }

  // Classic OE Rule:
  // Ratio >= 0.80 -> 100% efficiency (Tier 1: mild drop, no penalty)
  // Ratio >= 0.60 -> 75% efficiency (Tier 2: 25% penalty)
  // Ratio >= 0.40 -> 50% efficiency (Tier 3: 50% penalty)
  // Ratio < 0.40  -> 25% efficiency (Tier 4: severe 75% penalty)
  let efficiency = 1.0;
  let tier = 0;
  let isOverEquipped = false;

  if (lowestRatio >= 1.0) {
    efficiency = 1.0;
    tier = 0;
  } else if (lowestRatio >= 0.80) {
    efficiency = 1.0;
    tier = 1;
    isOverEquipped = false; // Within allowable 80% threshold
  } else if (lowestRatio >= 0.60) {
    efficiency = 0.75;
    tier = 2;
    isOverEquipped = true;
  } else if (lowestRatio >= 0.40) {
    efficiency = 0.50;
    tier = 3;
    isOverEquipped = true;
  } else {
    efficiency = 0.25;
    tier = 4;
    isOverEquipped = true;
  }

  return { efficiency, tier, isOverEquipped, missingSkills };
}

/**
 * Calculates all final stats, skills, derived combat values,
 * accurately applying base + equipment + buffs + Agg/Def slider + Over-equipping.
 */
export function calculateEffectiveStats(
  player: PlayerStatsState,
  equipment: Partial<Record<EquipmentSlot, ItemDefinition>>,
  buffs: ActiveBuff[]
): CalculatedCharacterSheet {
  // First pass: compute primary stats and skills without equipment penalties
  // so we can evaluate over-equipping accurately.
  const tempPrimary: Record<PrimaryStatType, number> = {} as any;
  const tempSkills: Record<SkillType, number> = {} as any;

  const primaryKeys: PrimaryStatType[] = [
    'Strength', 'Agility', 'Endurance', 'Intelligence', 'Perception', 'Willpower'
  ];
  const skillKeys: SkillType[] = [
    'Rifle', 'Pistol', 'Melee', 'Defense', 'Initiative', 'Engineering', 'Biotechnology', 'Cybernetics'
  ];

  // Raw active modifiers from buffs and base
  const buffModifiers: StatModifier[] = [];
  buffs.forEach(buff => {
    if (buff.modifiers) {
      buffModifiers.push(...buff.modifiers);
    }
  });

  // Base primary + buff modifiers
  primaryKeys.forEach(stat => {
    const base = player.primaryStats[stat] || 10;
    const flat = buffModifiers
      .filter(m => m.target === stat && m.type === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    const percent = buffModifiers
      .filter(m => m.target === stat && m.type === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    tempPrimary[stat] = Math.max(1, Math.round((base + flat) * (1 + percent / 100)));
  });

  // Base skills + buff modifiers
  skillKeys.forEach(skill => {
    const base = player.skills[skill] || 5;
    const flat = buffModifiers
      .filter(m => m.target === skill && m.type === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    const percent = buffModifiers
      .filter(m => m.target === skill && m.type === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    tempSkills[skill] = Math.max(1, Math.round((base + flat) * (1 + percent / 100)));
  });

  // Evaluate Over-Equipping for each equipped item
  const equippedOeStatus: Record<EquipmentSlot, {
    efficiency: number;
    tier: number;
    isOverEquipped: boolean;
    missingSkills: { name: string; required: number; current: number; ratio: number }[];
  }> = {} as any;

  const effectiveEquipmentModifiers: StatModifier[] = [];

  (Object.keys(equipment) as EquipmentSlot[]).forEach(slot => {
    const item = equipment[slot];
    if (item) {
      const oe = evaluateItemOverEquip(item.requirements, tempPrimary, tempSkills, player.level);
      equippedOeStatus[slot] = oe;

      // Apply scaled item modifiers based on OE efficiency
      if (item.modifiers) {
        item.modifiers.forEach(mod => {
          effectiveEquipmentModifiers.push({
            target: mod.target,
            type: mod.type,
            value: mod.type === 'flat' ? Math.round(mod.value * oe.efficiency) : mod.value * oe.efficiency,
          });
        });
      }
    }
  });

  // Combined modifiers
  const allModifiers = [...buffModifiers, ...effectiveEquipmentModifiers];

  // Final Primary Stats
  const finalPrimary: Record<PrimaryStatType, number> = {} as any;
  primaryKeys.forEach(stat => {
    const base = player.primaryStats[stat] || 10;
    const flat = allModifiers
      .filter(m => m.target === stat && m.type === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    const percent = allModifiers
      .filter(m => m.target === stat && m.type === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    finalPrimary[stat] = Math.max(1, Math.round((base + flat) * (1 + percent / 100)));
  });

  // Final Skills
  const finalSkills: Record<SkillType, number> = {} as any;
  skillKeys.forEach(skill => {
    const base = player.skills[skill] || 5;
    const flat = allModifiers
      .filter(m => m.target === skill && m.type === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    const percent = allModifiers
      .filter(m => m.target === skill && m.type === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    finalSkills[skill] = Math.max(1, Math.round((base + flat) * (1 + percent / 100)));
  });

  // Derived Combat Stats
  const lvl = player.level;
  const str = finalPrimary.Strength;
  const agi = finalPrimary.Agility;
  const end = finalPrimary.Endurance;
  const int = finalPrimary.Intelligence;
  const per = finalPrimary.Perception;
  const wil = finalPrimary.Willpower;
  const init = finalSkills.Initiative || 10;

  // Max Health & Energy
  const baseMaxHp = 120 + (lvl * 35) + (end * 8) + (str * 3);
  const baseMaxEnergy = 80 + (lvl * 25) + (int * 7) + (wil * 4);

  // Attack Rating & Defense Rating
  const weaponItem = equipment.Weapon;
  let primaryCombatSkill = finalSkills.Rifle;
  if (weaponItem) {
    if (weaponItem.name.toLowerCase().includes('pistol')) primaryCombatSkill = finalSkills.Pistol;
    else if (weaponItem.name.toLowerCase().includes('blade') || weaponItem.name.toLowerCase().includes('melee')) primaryCombatSkill = finalSkills.Melee;
  }

  // Attack Rating
  const baseAttackRating = Math.round(primaryCombatSkill * 1.6 + per * 0.9 + agi * 0.5);

  // Defense Rating with Agg/Def Slider modifier:
  // Agg/Def slider: 0 (Defensive) to 100 (Aggressive). Baseline: 50.
  // Full Aggressive gives -25 DR penalty. Full Defensive gives +35 DR bonus.
  const aggDef = player.aggDefSlider !== undefined ? player.aggDefSlider : 80;
  const aggDefFactor = (aggDef - 50) / 50; // -1.0 (Full Def) to +1.0 (Full Agg)
  const aggDefDrMod = Math.round(-aggDefFactor * 30); // Full Def: +30 DR, Full Agg: -30 DR

  const baseDefenseRating = Math.max(5, Math.round(finalSkills.Defense * 1.6 + agi * 0.8 + end * 0.5 + aggDefDrMod));

  // Armor Rating (Endurance contribution + equipment armor values)
  const baseArmor = Math.round(4 + end * 0.4);
  const baseCritChance = Math.min(50, Math.round(5 + (per * 0.25) + (agi * 0.15)));
  const baseSpeed = 6.0;

  // Attack Time and Recharge Time calculations:
  // Weapon base Attack Time & Recharge Time
  const weaponAttackTime = weaponItem?.attackTime || 1.2;
  const weaponRechargeTime = weaponItem?.rechargeTime || 1.6;

  // Initiative effect:
  // Every 100 Initiative reduces Attack Time by 0.1s and Recharge Time by 0.2s
  const initReductionAttack = (init / 100) * 0.15;
  const initReductionRecharge = (init / 100) * 0.30;

  // Agg/Def slider effect on speed:
  // Full Aggressive (100%): -0.4s Attack Time, -0.6s Recharge Time
  // Full Defensive (0%): +0.5s Attack Time, +0.8s Recharge Time
  const aggDefAttackSpeedMod = aggDefFactor * 0.45; // Positive reduces time in aggressive
  const aggDefRechargeSpeedMod = aggDefFactor * 0.65;

  const effectiveAttackTime = Math.max(0.35, Math.round((weaponAttackTime - initReductionAttack - aggDefAttackSpeedMod) * 100) / 100);
  const effectiveRechargeTime = Math.max(0.50, Math.round((weaponRechargeTime - initReductionRecharge - aggDefRechargeSpeedMod) * 100) / 100);

  const derivedValues: Record<DerivedStatType, number> = {
    Health: player.currentHealth,
    MaxHealth: applyModifiersToValue(baseMaxHp, 'MaxHealth', allModifiers),
    Energy: player.currentEnergy,
    MaxEnergy: applyModifiersToValue(baseMaxEnergy, 'MaxEnergy', allModifiers),
    AttackRating: applyModifiersToValue(baseAttackRating, 'AttackRating', allModifiers),
    DefenseRating: applyModifiersToValue(baseDefenseRating, 'DefenseRating', allModifiers),
    Armor: applyModifiersToValue(baseArmor, 'Armor', allModifiers),
    CriticalChance: applyModifiersToValue(baseCritChance, 'CriticalChance', allModifiers),
    MovementSpeed: Math.max(2, applyModifiersToValue(baseSpeed, 'MovementSpeed', allModifiers)),
    AttackSpeed: Math.max(0.5, applyModifiersToValue(1.0 + (aggDefFactor * 0.25), 'AttackSpeed', allModifiers)),
    AttackTime: effectiveAttackTime,
    RechargeTime: effectiveRechargeTime,
  };

  return {
    primaryStats: finalPrimary,
    skills: finalSkills,
    derived: derivedValues,
    equippedOeStatus,
  };
}

function applyModifiersToValue(base: number, target: DerivedStatType, modifiers: StatModifier[]): number {
  const flat = modifiers
    .filter(m => m.target === target && m.type === 'flat')
    .reduce((sum, m) => sum + m.value, 0);
  const percent = modifiers
    .filter(m => m.target === target && m.type === 'percent')
    .reduce((sum, m) => sum + m.value, 0);

  const val = (base + flat) * (1 + percent / 100);
  return Math.round(val * 100) / 100;
}

/**
 * Validates whether character meets equipment requirements to equip initially.
 * Supports temporary buffs and cybernetic implants!
 */
export function checkEquipmentRequirements(
  requirements: EquipmentRequirement[],
  sheet: CalculatedCharacterSheet,
  level: number
): { canEquip: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const req of requirements) {
    if (req.type === 'level') {
      if (level < req.minValue) {
        missing.push(`Level ${req.minValue} (Current: ${level})`);
      }
    } else if (req.type === 'stat') {
      const current = sheet.primaryStats[req.name as PrimaryStatType] || 0;
      if (current < req.minValue) {
        missing.push(`${req.name} ${req.minValue} (Current: ${current})`);
      }
    } else if (req.type === 'skill') {
      const current = sheet.skills[req.name as SkillType] || 0;
      if (current < req.minValue) {
        missing.push(`${req.name} ${req.minValue} (Current: ${current})`);
      }
    }
  }

  return {
    canEquip: missing.length === 0,
    missing,
  };
}
