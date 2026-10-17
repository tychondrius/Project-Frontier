/**
 * Project Frontier - Items, Equipment, Quality Level (QL) Scaling & Loot Tables
 */

import type { EquipmentSlot, ItemDefinition, LootTable } from './types.ts';

export interface BaseItemTemplate {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'implant' | 'consumable' | 'quest';
  slot?: EquipmentSlot;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  baseValue: number;
  icon: string;
  stackable?: boolean;
  baseRequirements: {
    type: 'stat' | 'skill' | 'level';
    name: any;
    baseValue: number;
    qlScale: number;
  }[];
  baseModifiers: {
    target: any;
    type: 'flat' | 'percent';
    baseValue: number;
    qlScale: number;
  }[];
  consumableEffect?: {
    healHp?: number;
    restoreEnergy?: number;
    buffId?: string;
  };
}

export const ITEM_TEMPLATES: Record<string, BaseItemTemplate> = {
  // WEAPONS
  scout_carbine: {
    id: 'scout_carbine',
    name: 'Frontier Scout Carbine',
    description: 'Standard issue kinetic rifle calibrated for perimeter scouting.',
    type: 'weapon',
    slot: 'Weapon',
    rarity: 'common',
    baseValue: 40,
    icon: 'crosshair',
    baseRequirements: [
      { type: 'skill', name: 'Rifle', baseValue: 8, qlScale: 2.2 },
      { type: 'stat', name: 'Agility', baseValue: 10, qlScale: 0.8 },
    ],
    baseModifiers: [
      { target: 'AttackRating', type: 'flat', baseValue: 12, qlScale: 3.5 },
      { target: 'CriticalChance', type: 'flat', baseValue: 3, qlScale: 0.4 },
    ],
  },
  plasma_repeater: {
    id: 'plasma_repeater',
    name: 'Ionized Plasma Repeater',
    description: 'Advanced military firearm discharging rapid superheated bolts.',
    type: 'weapon',
    slot: 'Weapon',
    rarity: 'rare',
    baseValue: 120,
    icon: 'zap',
    baseRequirements: [
      { type: 'skill', name: 'Rifle', baseValue: 16, qlScale: 2.6 },
      { type: 'stat', name: 'Perception', baseValue: 14, qlScale: 1.0 },
    ],
    baseModifiers: [
      { target: 'AttackRating', type: 'flat', baseValue: 24, qlScale: 5.0 },
      { target: 'AttackSpeed', type: 'percent', baseValue: 10, qlScale: 1.2 },
      { target: 'CriticalChance', type: 'flat', baseValue: 6, qlScale: 0.8 },
    ],
  },

  // ARMOR
  recon_helm: {
    id: 'recon_helm',
    name: 'Tactical Recon Visor',
    description: 'Hardened composite helmet featuring integrated optical sensors.',
    type: 'armor',
    slot: 'Head',
    rarity: 'common',
    baseValue: 25,
    icon: 'eye',
    baseRequirements: [
      { type: 'stat', name: 'Perception', baseValue: 8, qlScale: 1.0 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 4, qlScale: 1.2 },
      { target: 'Perception', type: 'flat', baseValue: 2, qlScale: 0.5 },
    ],
  },
  ballistic_vest: {
    id: 'ballistic_vest',
    name: 'Reinforced Kevlar Plate',
    description: 'Heavy torso armor engineered to withstand alien projectile strikes.',
    type: 'armor',
    slot: 'Chest',
    rarity: 'common',
    baseValue: 45,
    icon: 'shield',
    baseRequirements: [
      { type: 'stat', name: 'Endurance', baseValue: 10, qlScale: 1.2 },
      { type: 'skill', name: 'Defense', baseValue: 8, qlScale: 1.5 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 10, qlScale: 2.5 },
      { target: 'MaxHealth', type: 'flat', baseValue: 20, qlScale: 6.0 },
      { target: 'Endurance', type: 'flat', baseValue: 2, qlScale: 0.6 },
    ],
  },
  strider_boots: {
    id: 'strider_boots',
    name: 'Mag-Lev Strider Boots',
    description: 'Hydraulic-assisted mobility greaves optimizing terrain traversal.',
    type: 'armor',
    slot: 'Feet',
    rarity: 'uncommon',
    baseValue: 30,
    icon: 'footprints',
    baseRequirements: [
      { type: 'stat', name: 'Agility', baseValue: 10, qlScale: 1.0 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 5, qlScale: 1.4 },
      { target: 'MovementSpeed', type: 'percent', baseValue: 8, qlScale: 0.5 },
      { target: 'Agility', type: 'flat', baseValue: 2, qlScale: 0.4 },
    ],
  },
  combat_gloves: {
    id: 'combat_gloves',
    name: 'Exo-Grip Combat Bracers',
    description: 'Micro-motor gauntlets enhancing trigger discipline and recoil control.',
    type: 'armor',
    slot: 'Hands',
    rarity: 'common',
    baseValue: 25,
    icon: 'hand',
    baseRequirements: [
      { type: 'skill', name: 'Rifle', baseValue: 6, qlScale: 1.5 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 3, qlScale: 1.0 },
      { target: 'AttackRating', type: 'flat', baseValue: 6, qlScale: 1.8 },
    ],
  },
  nanite_chassis_legs: {
    id: 'nanite_chassis_legs',
    name: 'Reinforced Exoskeleton Greaves',
    description: 'Segmented alloy plating shielding vital joints and lower body.',
    type: 'armor',
    slot: 'Legs',
    rarity: 'common',
    baseValue: 35,
    icon: 'shield-check',
    baseRequirements: [
      { type: 'stat', name: 'Endurance', baseValue: 8, qlScale: 1.0 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 7, qlScale: 2.0 },
      { target: 'MaxHealth', type: 'flat', baseValue: 15, qlScale: 4.0 },
    ],
  },
  tactical_pack: {
    id: 'tactical_pack',
    name: 'Sub-Orbital Jump Pack',
    description: 'Auxiliary stabilizer rig mounting micro-thrusters and shielding.',
    type: 'armor',
    slot: 'Back',
    rarity: 'rare',
    baseValue: 80,
    icon: 'backpack',
    baseRequirements: [
      { type: 'skill', name: 'Engineering', baseValue: 10, qlScale: 1.5 },
    ],
    baseModifiers: [
      { target: 'Armor', type: 'flat', baseValue: 6, qlScale: 1.6 },
      { target: 'MaxEnergy', type: 'flat', baseValue: 25, qlScale: 5.0 },
    ],
  },

  // CYBERNETIC IMPLANTS
  neural_targeting_implant: {
    id: 'neural_targeting_implant',
    name: 'Neural Optics Augment',
    description: 'Cranial cyberware syncing ocular feed with targeting telemetry.',
    type: 'implant',
    slot: 'CyberImplant',
    rarity: 'rare',
    baseValue: 150,
    icon: 'cpu',
    baseRequirements: [
      { type: 'skill', name: 'Cybernetics', baseValue: 10, qlScale: 2.0 },
      { type: 'stat', name: 'Perception', baseValue: 12, qlScale: 1.0 },
    ],
    baseModifiers: [
      { target: 'Rifle', type: 'flat', baseValue: 4, qlScale: 1.0 },
      { target: 'Perception', type: 'flat', baseValue: 3, qlScale: 0.8 },
      { target: 'CriticalChance', type: 'flat', baseValue: 4, qlScale: 0.5 },
    ],
  },
  bio_adrenal_implant: {
    id: 'bio_adrenal_implant',
    name: 'Bio-Adrenal Synthesizer',
    description: 'Direct vascular pump releasing synthetic stimulants during intense combat.',
    type: 'implant',
    slot: 'Accessory1',
    rarity: 'uncommon',
    baseValue: 90,
    icon: 'activity',
    baseRequirements: [
      { type: 'skill', name: 'Biotechnology', baseValue: 8, qlScale: 1.8 },
    ],
    baseModifiers: [
      { target: 'Endurance', type: 'flat', baseValue: 4, qlScale: 0.8 },
      { target: 'MaxHealth', type: 'flat', baseValue: 30, qlScale: 8.0 },
    ],
  },
  overclock_subroutine_chip: {
    id: 'overclock_subroutine_chip',
    name: 'Cyber-Subroutine Processor',
    description: 'Nanosecond neural coprocessor optimizing energy matrix throughput.',
    type: 'implant',
    slot: 'Accessory2',
    rarity: 'epic',
    baseValue: 200,
    icon: 'zap',
    baseRequirements: [
      { type: 'skill', name: 'Cybernetics', baseValue: 15, qlScale: 2.5 },
      { type: 'stat', name: 'Intelligence', baseValue: 14, qlScale: 1.2 },
    ],
    baseModifiers: [
      { target: 'MaxEnergy', type: 'flat', baseValue: 40, qlScale: 10.0 },
      { target: 'Intelligence', type: 'flat', baseValue: 4, qlScale: 1.0 },
      { target: 'AttackSpeed', type: 'percent', baseValue: 8, qlScale: 1.0 },
    ],
  },

  // CONSUMABLES
  health_stim: {
    id: 'health_stim',
    name: 'Nano-Med Injector',
    description: 'Rapid-acting coagulant restoring 75 Health points upon activation.',
    type: 'consumable',
    rarity: 'common',
    baseValue: 15,
    icon: 'heart',
    stackable: true,
    baseRequirements: [],
    baseModifiers: [],
    consumableEffect: {
      healHp: 75,
    },
  },
  energy_stim: {
    id: 'energy_stim',
    name: 'Capacitor Battery Cell',
    description: 'Discharges 50 Nano-Energy into cybernetic power relays.',
    type: 'consumable',
    rarity: 'common',
    baseValue: 15,
    icon: 'battery-charging',
    stackable: true,
    baseRequirements: [],
    baseModifiers: [],
    consumableEffect: {
      restoreEnergy: 50,
    },
  },

  // QUEST ITEMS
  neural_component: {
    id: 'neural_component',
    name: 'Salvaged Neural Core',
    description: 'Intact cybernetic core recovered from hostile automatons and drones.',
    type: 'quest',
    rarity: 'uncommon',
    baseValue: 10,
    icon: 'box',
    stackable: true,
    baseRequirements: [],
    baseModifiers: [],
  },
};

/**
 * Creates an item definition scaled to the requested Quality Level (QL 1-100)
 */
export function createScaledItem(templateId: string, ql: number = 1): ItemDefinition {
  const template = ITEM_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown item template: ${templateId}`);
  }

  const clampedQl = Math.max(1, Math.min(100, Math.round(ql)));

  // Requirements scale with QL
  const requirements = template.baseRequirements.map(req => ({
    type: req.type,
    name: req.name,
    minValue: Math.round(req.baseValue + (clampedQl - 1) * req.qlScale),
  }));

  // Modifiers scale with QL
  const modifiers = template.baseModifiers.map(mod => ({
    target: mod.target,
    type: mod.type,
    value: Math.round(mod.baseValue + (clampedQl - 1) * mod.qlScale),
  }));

  // Value scales quadratically with QL
  const value = Math.round(template.baseValue * (1 + (clampedQl - 1) * 0.45));

  // Name gets QL badge
  const name = `${template.name} (QL ${clampedQl})`;

  return {
    id: `${template.id}_ql${clampedQl}`,
    name,
    description: template.description,
    type: template.type,
    slot: template.slot,
    ql: clampedQl,
    rarity: template.rarity,
    requirements,
    modifiers,
    value,
    icon: template.icon,
    stackable: template.stackable,
    consumableEffect: template.consumableEffect,
  };
}

/**
 * Enemy Loot Tables
 */
export const ENEMY_LOOT_TABLES: Record<string, LootTable> = {
  drone: {
    creditsMin: 8,
    creditsMax: 22,
    drops: [
      { itemDefId: 'health_stim', chance: 0.35, minQty: 1, maxQty: 2 },
      { itemDefId: 'energy_stim', chance: 0.30, minQty: 1, maxQty: 1 },
      { itemDefId: 'neural_component', chance: 0.65, minQty: 1, maxQty: 1 },
      { itemDefId: 'scout_carbine', chance: 0.15, minQty: 1, maxQty: 1 },
      { itemDefId: 'recon_helm', chance: 0.12, minQty: 1, maxQty: 1 },
    ],
  },
  stalker: {
    creditsMin: 14,
    creditsMax: 32,
    drops: [
      { itemDefId: 'health_stim', chance: 0.40, minQty: 1, maxQty: 2 },
      { itemDefId: 'strider_boots', chance: 0.18, minQty: 1, maxQty: 1 },
      { itemDefId: 'combat_gloves', chance: 0.20, minQty: 1, maxQty: 1 },
      { itemDefId: 'bio_adrenal_implant', chance: 0.08, minQty: 1, maxQty: 1 },
    ],
  },
  automaton: {
    creditsMin: 22,
    creditsMax: 50,
    drops: [
      { itemDefId: 'energy_stim', chance: 0.50, minQty: 1, maxQty: 2 },
      { itemDefId: 'neural_component', chance: 0.80, minQty: 1, maxQty: 1 },
      { itemDefId: 'ballistic_vest', chance: 0.22, minQty: 1, maxQty: 1 },
      { itemDefId: 'nanite_chassis_legs', chance: 0.20, minQty: 1, maxQty: 1 },
      { itemDefId: 'neural_targeting_implant', chance: 0.10, minQty: 1, maxQty: 1 },
    ],
  },
  predator: {
    creditsMin: 35,
    creditsMax: 75,
    drops: [
      { itemDefId: 'health_stim', chance: 0.60, minQty: 2, maxQty: 3 },
      { itemDefId: 'plasma_repeater', chance: 0.25, minQty: 1, maxQty: 1 },
      { itemDefId: 'tactical_pack', chance: 0.20, minQty: 1, maxQty: 1 },
      { itemDefId: 'neural_targeting_implant', chance: 0.15, minQty: 1, maxQty: 1 },
    ],
  },
  boss: {
    creditsMin: 200,
    creditsMax: 450,
    drops: [
      { itemDefId: 'plasma_repeater', chance: 1.0, minQty: 1, maxQty: 1 }, // Guaranteed rare weapon
      { itemDefId: 'overclock_subroutine_chip', chance: 0.85, minQty: 1, maxQty: 1 }, // High tier implant
      { itemDefId: 'tactical_pack', chance: 0.70, minQty: 1, maxQty: 1 },
      { itemDefId: 'health_stim', chance: 1.0, minQty: 3, maxQty: 5 },
      { itemDefId: 'energy_stim', chance: 1.0, minQty: 3, maxQty: 5 },
    ],
  },
};

/**
 * Shop Merchant Inventory
 */
export const SHOP_INVENTORY: { templateId: string; ql: number }[] = [
  { templateId: 'health_stim', ql: 1 },
  { templateId: 'energy_stim', ql: 1 },
  { templateId: 'scout_carbine', ql: 2 },
  { templateId: 'recon_helm', ql: 2 },
  { templateId: 'ballistic_vest', ql: 3 },
  { templateId: 'strider_boots', ql: 3 },
  { templateId: 'combat_gloves', ql: 2 },
  { templateId: 'neural_targeting_implant', ql: 3 },
  { templateId: 'plasma_repeater', ql: 5 },
  { templateId: 'overclock_subroutine_chip', ql: 5 },
];
