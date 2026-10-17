/**
 * Project Frontier - Abilities, Weapon Specials & Generic Buff Definitions
 * Modular data-driven ability, weapon special, and effect system
 */

import type { AbilityDefinition, BuffDefinition, ActiveBuff, WeaponSpecialDefinition } from './types.ts';

export const BUFF_DEFINITIONS: Record<string, BuffDefinition> = {
  overclock_buff: {
    id: 'overclock_buff',
    name: 'Overclock Protocol',
    description: 'Cybernetic actuators overcharged, boosting attack speed and critical strike chance.',
    duration: 15,
    stackGroup: 'combat_haste',
    stackPriority: 10,
    icon: 'zap',
    modifiers: [
      { target: 'AttackSpeed', type: 'percent', value: 35 },
      { target: 'CriticalChance', type: 'flat', value: 10 },
      { target: 'Initiative', type: 'flat', value: 25 },
      { target: 'MovementSpeed', type: 'percent', value: 15 },
    ],
  },
  rifle_expertise: {
    id: 'rifle_expertise',
    name: 'Rifle Expertise',
    description: 'Tactical targeting telemetry injected into optic feed, temporarily increasing Rifle skill and Perception.',
    duration: 45,
    stackGroup: 'weapon_expertise',
    stackPriority: 5,
    icon: 'crosshair',
    modifiers: [
      { target: 'Rifle', type: 'flat', value: 18 },
      { target: 'Perception', type: 'flat', value: 10 },
    ],
  },
  nano_shielding: {
    id: 'nano_shielding',
    name: 'Deflective Nanite Barrier',
    description: 'Electrostatically active nanites hardening personal armor against impacts.',
    duration: 30,
    stackGroup: 'armor_buff',
    stackPriority: 8,
    icon: 'shield',
    modifiers: [
      { target: 'Armor', type: 'flat', value: 24 },
      { target: 'DefenseRating', type: 'flat', value: 20 },
    ],
  },
  disruptor_debuff: {
    id: 'disruptor_debuff',
    name: 'Shield Disrupted',
    description: 'Target armor and defensive matrix fractured by electromagnetic pulse.',
    duration: 10,
    stackGroup: 'defense_down',
    stackPriority: 5,
    icon: 'shield-alert',
    isDebuff: true,
    modifiers: [
      { target: 'Armor', type: 'flat', value: -10 },
      { target: 'DefenseRating', type: 'flat', value: -18 },
    ],
  },
  emergency_stim_regen: {
    id: 'emergency_stim_regen',
    name: 'Nanite Infusion',
    description: 'Medical nanites actively stitching cellular tissue over time.',
    duration: 6,
    stackGroup: 'regen_buff',
    stackPriority: 5,
    icon: 'activity',
    modifiers: [
      { target: 'Endurance', type: 'flat', value: 5 },
    ],
  },
  boss_emp_debuff: {
    id: 'boss_emp_debuff',
    name: 'EMP Scramble',
    description: 'Sensory systems scrambling, lowering attack rating.',
    duration: 8,
    stackGroup: 'emp_debuff',
    stackPriority: 10,
    icon: 'radio',
    isDebuff: true,
    modifiers: [
      { target: 'AttackRating', type: 'flat', value: -25 },
      { target: 'MovementSpeed', type: 'percent', value: -20 },
    ],
  },
};

export const CORE_ABILITIES: Record<string, AbilityDefinition> = {
  plasma_shot: {
    id: 'plasma_shot',
    name: 'Plasma Shot',
    description: 'Unleashes a concentrated superheated plasma bolt at the target.',
    icon: 'flame',
    energyCost: 15,
    range: 22,
    castTime: 0.4,
    rechargeTime: 3.5,
    effects: [
      {
        type: 'Damage',
        amount: 40,
        statScale: 'Perception',
        scaleFactor: 1.2,
      },
    ],
  },
  disruptor_pulse: {
    id: 'disruptor_pulse',
    name: 'Disruptor Pulse',
    description: 'Fires an ionized burst causing moderate damage and softening enemy defenses.',
    icon: 'shield-alert',
    energyCost: 22,
    range: 18,
    castTime: 0.2,
    rechargeTime: 7.0,
    effects: [
      {
        type: 'Damage',
        amount: 24,
        statScale: 'Intelligence',
        scaleFactor: 0.9,
      },
      {
        type: 'Debuff',
        buff: BUFF_DEFINITIONS.disruptor_debuff,
      },
    ],
  },
  emergency_stim: {
    id: 'emergency_stim',
    name: 'Emergency Stim',
    description: 'Deploys combat-grade nanites directly into bloodstream, restoring vital health.',
    icon: 'heart-pulse',
    energyCost: 20,
    range: 0, // Self-target
    castTime: 0.0,
    rechargeTime: 10.0,
    effects: [
      {
        type: 'Heal',
        amount: 65,
        statScale: 'Intelligence',
        scaleFactor: 1.5,
      },
      {
        type: 'Buff',
        buff: BUFF_DEFINITIONS.emergency_stim_regen,
      },
    ],
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    description: 'Temporarily overrides safety governors, surging attack speed and agility.',
    icon: 'zap',
    energyCost: 25,
    range: 0, // Self-target
    castTime: 0.0,
    rechargeTime: 20.0,
    effects: [
      {
        type: 'Buff',
        buff: BUFF_DEFINITIONS.overclock_buff,
      },
    ],
  },
  rifle_expertise_buff: {
    id: 'rifle_expertise_buff',
    name: 'Rifle Expertise',
    description: 'Activates ballistic subroutine, temporarily granting +18 Rifle skill to assist in handling high-QL weaponry.',
    icon: 'crosshair',
    energyCost: 15,
    range: 0,
    castTime: 0.0,
    rechargeTime: 40.0,
    effects: [
      {
        type: 'Buff',
        buff: BUFF_DEFINITIONS.rifle_expertise,
      },
    ],
  },
};

/**
 * Data-Driven Weapon Special Attacks with Independent Cooldowns
 */
export const WEAPON_SPECIALS: Record<string, WeaponSpecialDefinition> = {
  burst: {
    id: 'burst',
    name: 'Burst Fire',
    description: 'Rapid three-round kinetic discharge dealing concentrated burst damage.',
    icon: 'crosshair',
    cooldown: 11.0,
    energyCost: 14,
    weaponTypeRequirement: 'Rifle',
    damageMultiplier: 2.6,
    shotsCount: 3,
    critBonusChance: 8,
  },
  flingshot: {
    id: 'flingshot',
    name: 'Fling Shot',
    description: 'Rapid snap-shot fired with minimal recoil recovery.',
    icon: 'zap',
    cooldown: 6.5,
    energyCost: 10,
    weaponTypeRequirement: 'Rifle',
    damageMultiplier: 1.45,
    shotsCount: 1,
    critBonusChance: 5,
  },
  aimed_shot: {
    id: 'aimed_shot',
    name: 'Aimed Shot',
    description: 'Calculated critical precision shot penetrating armor.',
    icon: 'eye',
    cooldown: 16.0,
    energyCost: 22,
    weaponTypeRequirement: 'Rifle',
    damageMultiplier: 3.2,
    shotsCount: 1,
    critBonusChance: 40,
  },
};

/**
 * Helper to update buffs array with stacking group and priority enforcement
 */
export function applyOrRefreshBuff(
  existingBuffs: ActiveBuff[],
  newBuffDef: BuffDefinition
): ActiveBuff[] {
  const buffs = [...existingBuffs];
  const existingIndex = buffs.findIndex(b => b.stackGroup === newBuffDef.stackGroup);

  if (existingIndex >= 0) {
    const existing = buffs[existingIndex];
    if (newBuffDef.stackPriority >= existing.stackPriority) {
      // Replace with higher or equal priority and refresh duration
      buffs[existingIndex] = {
        definitionId: newBuffDef.id,
        name: newBuffDef.name,
        duration: newBuffDef.duration,
        remainingTime: newBuffDef.duration,
        stackGroup: newBuffDef.stackGroup,
        stackPriority: newBuffDef.stackPriority,
        icon: newBuffDef.icon,
        isDebuff: newBuffDef.isDebuff,
        modifiers: [...newBuffDef.modifiers],
      };
    }
  } else {
    // Add new buff
    buffs.push({
      definitionId: newBuffDef.id,
      name: newBuffDef.name,
      duration: newBuffDef.duration,
      remainingTime: newBuffDef.duration,
      stackGroup: newBuffDef.stackGroup,
      stackPriority: newBuffDef.stackPriority,
      icon: newBuffDef.icon,
      isDebuff: newBuffDef.isDebuff,
      modifiers: [...newBuffDef.modifiers],
    });
  }

  return buffs;
}
