/**
 * Project Frontier - Data-driven Quest System
 */

import type { QuestDefinition } from './types.ts';

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  quest_drones: {
    id: 'quest_drones',
    title: 'Perimeter Sweep',
    description: 'Rogue Scavenger Drones are swarming the outskirts of Outpost Delta. Neutralize 4 Scavenger Drones to secure our supply line.',
    objectives: [
      {
        id: 'obj_kill_drones',
        description: 'Neutralize Scavenger Drones',
        type: 'Kill',
        targetId: 'drone',
        currentAmount: 0,
        requiredAmount: 4,
        completed: false,
      },
    ],
    rewards: {
      xp: 150,
      credits: 100,
      items: [
        { itemDefId: 'health_stim', quantity: 2 },
      ],
    },
  },
  quest_neural_cores: {
    id: 'quest_neural_cores',
    title: 'Neural Core Salvage',
    description: 'We need undamaged neural processing cores from the autonomous units wandering the wilderness. Recover 3 Neural Components.',
    objectives: [
      {
        id: 'obj_collect_cores',
        description: 'Salvage Neural Components',
        type: 'Collect',
        targetId: 'neural_component',
        currentAmount: 0,
        requiredAmount: 3,
        completed: false,
      },
    ],
    rewards: {
      xp: 220,
      credits: 180,
      items: [
        { itemDefId: 'recon_helm', quantity: 1 },
      ],
    },
  },
  quest_kill_boss: {
    id: 'quest_kill_boss',
    title: 'Apex Elimination',
    description: 'An ancient bio-cybernetic monstrosity—the Apex Colossus—has reawakened in the ruins to the south-east. Terminate it before it marches on the Outpost.',
    objectives: [
      {
        id: 'obj_kill_boss',
        description: 'Defeat the Apex Colossus in Ancient Ruins',
        type: 'Kill',
        targetId: 'boss',
        currentAmount: 0,
        requiredAmount: 1,
        completed: false,
      },
    ],
    rewards: {
      xp: 500,
      credits: 500,
      items: [
        { itemDefId: 'neural_targeting_implant', quantity: 1 },
      ],
    },
  },
};
