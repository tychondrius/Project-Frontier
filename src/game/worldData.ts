/**
 * Project Frontier - World Geography, Spawns, and NPC Definitions
 */

import { NPCDefinition } from './types.ts';
import { ENEMY_LOOT_TABLES } from './items.ts';

export interface WorldSpawnConfig {
  id: string;
  defId: string;
  name: string;
  position: { x: number; y: number; z: number };
  patrolRadius: number;
}

export interface FriendlyNPCConfig {
  id: string;
  name: string;
  title: string;
  role: 'mission' | 'shop' | 'medic';
  position: { x: number; y: number; z: number };
  dialogue: {
    greeting: string;
    options: {
      label: string;
      action: 'open_quests' | 'open_shop' | 'heal' | 'lore';
      response: string;
    }[];
  };
}

export const OUTPOST_SPAWN = { x: 0, y: 0, z: -4 };

export const FRIENDLY_NPCS: FriendlyNPCConfig[] = [
  {
    id: 'npc_vance',
    name: 'Officer Vance',
    title: 'Frontier Mission Coordinator',
    role: 'mission',
    position: { x: -4.5, y: 0, z: -7 },
    dialogue: {
      greeting: 'Operative, Outpost Delta is holding on by a thread. Hostile rogue automatons and alien lifeforms are closing in on our perimeter. Do you have combat capability to assist?',
      options: [
        {
          label: 'I am ready for assignments.',
          action: 'open_quests',
          response: 'Excellent. Check our active priority bounties and clear the sectors.',
        },
        {
          label: 'What is this place?',
          action: 'lore',
          response: 'Outpost Delta was established as a deep-space research station studying the anomalous ancient monoliths to the south-east. Ever since the seismic pulses, rogue security drones and mutant xenos have gone berserk.',
        },
      ],
    },
  },
  {
    id: 'npc_jax',
    name: 'Vendor Jax',
    title: 'Surplus & Tech Merchant',
    role: 'shop',
    position: { x: 4.5, y: 0, z: -7 },
    dialogue: {
      greeting: 'Greetings operative. Need fresh kinetic magazines, armor plating, or cybernetic implants? Standard Frontier Credits accepted.',
      options: [
        {
          label: 'Show me your wares.',
          action: 'open_shop',
          response: 'Browse through our field requisition gear.',
        },
      ],
    },
  },
];

export const NPC_DEFINITIONS: Record<string, NPCDefinition> = {
  drone: {
    id: 'drone',
    name: 'Scavenger Drone',
    title: 'Rogue Survey Droid',
    level: 1,
    maxHealth: 95,
    attackDamage: 12,
    attackSpeed: 1.8,
    attackRange: 14,
    aggroRange: 12,
    leashRange: 24,
    xpReward: 35,
    lootTable: ENEMY_LOOT_TABLES.drone,
    modelType: 'drone',
  },
  stalker: {
    id: 'stalker',
    name: 'Mutated Stalker',
    title: 'Bio-Aberration',
    level: 2,
    maxHealth: 160,
    attackDamage: 18,
    attackSpeed: 1.5,
    attackRange: 2.8,
    aggroRange: 11,
    leashRange: 22,
    xpReward: 55,
    lootTable: ENEMY_LOOT_TABLES.stalker,
    modelType: 'stalker',
  },
  automaton: {
    id: 'automaton',
    name: 'Security Automaton',
    title: 'Heavy Enforcer Unit',
    level: 3,
    maxHealth: 260,
    attackDamage: 26,
    attackSpeed: 2.2,
    attackRange: 15,
    aggroRange: 13,
    leashRange: 26,
    xpReward: 85,
    lootTable: ENEMY_LOOT_TABLES.automaton,
    modelType: 'automaton',
  },
  predator: {
    id: 'predator',
    name: 'Alien Predator',
    title: 'Apex Hunter',
    level: 4,
    maxHealth: 340,
    attackDamage: 36,
    attackSpeed: 1.4,
    attackRange: 3.2,
    aggroRange: 14,
    leashRange: 28,
    xpReward: 120,
    lootTable: ENEMY_LOOT_TABLES.predator,
    modelType: 'predator',
  },
  boss: {
    id: 'boss',
    name: 'Apex Colossus Overlord',
    title: 'Ancient Biomech Titan (BOSS)',
    level: 6,
    maxHealth: 1150,
    attackDamage: 52,
    attackSpeed: 2.0,
    attackRange: 18,
    aggroRange: 16,
    leashRange: 35,
    xpReward: 450,
    isBoss: true,
    bossAbilities: ['emp_shockwave', 'hyper_beam'],
    lootTable: ENEMY_LOOT_TABLES.boss,
    modelType: 'boss',
  },
};

/**
 * World Enemy Spawns: Outskirts, Wilderness, Enemy Camp, and Ruins Boss Arena
 */
export const WORLD_ENEMY_SPAWNS: WorldSpawnConfig[] = [
  // Outskirts (Easy Drones)
  { id: 'spawn_drone_1', defId: 'drone', name: 'Scavenger Drone A', position: { x: -12, y: 0, z: 12 }, patrolRadius: 4 },
  { id: 'spawn_drone_2', defId: 'drone', name: 'Scavenger Drone B', position: { x: 14, y: 0, z: 15 }, patrolRadius: 5 },
  { id: 'spawn_drone_3', defId: 'drone', name: 'Scavenger Drone C', position: { x: -6, y: 0, z: 22 }, patrolRadius: 4 },
  { id: 'spawn_drone_4', defId: 'drone', name: 'Scavenger Drone D', position: { x: 8, y: 0, z: 26 }, patrolRadius: 6 },

  // Wilderness (Stalkers & Drones)
  { id: 'spawn_stalker_1', defId: 'stalker', name: 'Mutated Stalker Alpha', position: { x: -24, y: 0, z: 32 }, patrolRadius: 6 },
  { id: 'spawn_stalker_2', defId: 'stalker', name: 'Mutated Stalker Beta', position: { x: -16, y: 0, z: 42 }, patrolRadius: 5 },
  { id: 'spawn_stalker_3', defId: 'stalker', name: 'Mutated Stalker Gamma', position: { x: -28, y: 0, z: 48 }, patrolRadius: 7 },

  // Enemy Fortified Camp (Automatons & Predators)
  { id: 'spawn_automaton_1', defId: 'automaton', name: 'Security Automaton 01', position: { x: 26, y: 0, z: 34 }, patrolRadius: 5 },
  { id: 'spawn_automaton_2', defId: 'automaton', name: 'Security Automaton 02', position: { x: 34, y: 0, z: 42 }, patrolRadius: 6 },
  { id: 'spawn_predator_1', defId: 'predator', name: 'Alien Predator X-1', position: { x: 22, y: 0, z: 52 }, patrolRadius: 6 },

  // Ancient Ruins Boss Arena (South-East Temple Plateau)
  { id: 'spawn_boss', defId: 'boss', name: 'Apex Colossus Overlord', position: { x: 4, y: 0, z: 72 }, patrolRadius: 8 },
];
