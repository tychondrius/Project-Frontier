/**
 * Pure Logic Unit Tests for Project Frontier
 * Executable via `node --test` in Node 22
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateEffectiveStats,
  checkEquipmentRequirements,
  INITIAL_ARCHETYPE_STATS,
} from './stats.ts';
import {
  BUFF_DEFINITIONS,
  applyOrRefreshBuff,
  CORE_ABILITIES,
} from './abilities.ts';
import {
  ITEM_TEMPLATES,
  createScaledItem,
  ENEMY_LOOT_TABLES,
} from './items.ts';
import { CombatSystem } from './combat.ts';
import type { EnemyInstance } from './combat.ts';
import { QUEST_DEFINITIONS } from './quests.ts';
import type {
  ActiveBuff,
  EquipmentSlot,
  ItemDefinition,
  PlayerStatsState,
  QuestState,
} from './types.ts';

test('Initial Archetype stats and derived sheet calculation', () => {
  const vanguardInit = INITIAL_ARCHETYPE_STATS.Vanguard;
  const playerState: PlayerStatsState = {
    archetype: 'Vanguard',
    level: 1,
    xp: 0,
    xpToNextLevel: 120,
    unspentSkillPoints: 0,
    credits: 50,
    primaryStats: { ...vanguardInit.primary },
    skills: { ...vanguardInit.skills },
    currentHealth: 300,
    currentEnergy: 150,
  };

  const sheet = calculateEffectiveStats(playerState, {}, []);

  // Check Vanguard baseline
  assert.equal(sheet.primaryStats.Strength, 16);
  assert.equal(sheet.primaryStats.Endurance, 18);
  assert.ok(sheet.derived.MaxHealth > 200, 'Max health should be calculated properly');
  assert.ok(sheet.derived.AttackRating > 20, 'Attack rating should scale with skills and stats');
  assert.ok(sheet.derived.DefenseRating > 20, 'Defense rating should scale with defense skill');
});

test('Equipment modifiers increase character sheet stats', () => {
  const vanguardInit = INITIAL_ARCHETYPE_STATS.Vanguard;
  const playerState: PlayerStatsState = {
    archetype: 'Vanguard',
    level: 1,
    xp: 0,
    xpToNextLevel: 120,
    unspentSkillPoints: 0,
    credits: 50,
    primaryStats: { ...vanguardInit.primary },
    skills: { ...vanguardInit.skills },
    currentHealth: 300,
    currentEnergy: 150,
  };

  const baseSheet = calculateEffectiveStats(playerState, {}, []);

  // Equip tactical recon helm (adds Armor + Perception)
  const helm = createScaledItem('recon_helm', 1);
  const equipMap: Partial<Record<EquipmentSlot, ItemDefinition>> = {
    Head: helm,
  };

  const equippedSheet = calculateEffectiveStats(playerState, equipMap, []);

  assert.ok(
    equippedSheet.primaryStats.Perception > baseSheet.primaryStats.Perception,
    'Perception should increase with helm'
  );
  assert.ok(
    equippedSheet.derived.Armor > baseSheet.derived.Armor,
    'Armor should increase with helm'
  );
});

test('Equipment requirement checks prevent equipping unqualified gear', () => {
  const playerState: PlayerStatsState = {
    archetype: 'Technician',
    level: 1,
    xp: 0,
    xpToNextLevel: 120,
    unspentSkillPoints: 0,
    credits: 50,
    primaryStats: {
      Strength: 8,
      Agility: 10,
      Endurance: 10,
      Intelligence: 18,
      Perception: 14,
      Willpower: 14,
    },
    skills: {
      Rifle: 5, // low rifle skill
      Pistol: 10,
      Melee: 5,
      Defense: 8,
      Engineering: 15,
      Biotechnology: 12,
      Cybernetics: 14,
    },
    currentHealth: 200,
    currentEnergy: 200,
  };

  const sheet = calculateEffectiveStats(playerState, {}, []);

  // High QL weapon requiring high Rifle skill
  const highTierRifle = createScaledItem('plasma_repeater', 5);
  const check = checkEquipmentRequirements(highTierRifle.requirements, sheet, playerState.level);

  assert.equal(check.canEquip, false, 'Technician with low rifle should not equip high-QL rifle');
  assert.ok(check.missing.length > 0, 'Missing requirements should be listed');
});

test('Buff system enforces stacking group and priority replacement', () => {
  let buffs: ActiveBuff[] = [];

  // Apply Overclock buff
  buffs = applyOrRefreshBuff(buffs, BUFF_DEFINITIONS.overclock_buff);
  assert.equal(buffs.length, 1);
  assert.equal(buffs[0].stackGroup, 'combat_haste');
  assert.equal(buffs[0].duration, 15);

  // Apply another buff in same stack group with equal or higher priority
  const strongerHaste = {
    ...BUFF_DEFINITIONS.overclock_buff,
    duration: 20,
    stackPriority: 12,
  };
  buffs = applyOrRefreshBuff(buffs, strongerHaste);
  assert.equal(buffs.length, 1, 'Same stack group should not duplicate');
  assert.equal(buffs[0].duration, 20, 'Duration should update');
});

test('CombatSystem resolves ability execution with resource and range validation', () => {
  const playerState: PlayerStatsState = {
    archetype: 'Vanguard',
    level: 2,
    xp: 50,
    xpToNextLevel: 280,
    unspentSkillPoints: 0,
    credits: 100,
    primaryStats: {
      Strength: 16,
      Agility: 14,
      Endurance: 18,
      Intelligence: 12,
      Perception: 14,
      Willpower: 10,
    },
    skills: {
      Rifle: 16,
      Pistol: 8,
      Melee: 12,
      Defense: 16,
      Engineering: 6,
      Biotechnology: 6,
      Cybernetics: 8,
    },
    currentHealth: 250,
    currentEnergy: 10, // Not enough energy for 15-cost ability
  };

  const sheet = calculateEffectiveStats(playerState, {}, []);

  const dummyTarget: EnemyInstance = {
    id: 'enemy_1',
    name: 'Scavenger Drone',
    isPlayer: false,
    position: { x: 5, y: 0, z: 5 },
    currentHealth: 100,
    maxHealth: 100,
    attackRating: 20,
    defenseRating: 15,
    armor: 5,
    critChance: 5,
    attackSpeedMultiplier: 1.0,
    buffs: [],
    isDead: false,
    defId: 'drone',
    definition: {} as any,
    aiState: 'Idle',
    spawnPoint: { x: 5, y: 0, z: 5 },
    targetEntityId: null,
    threatTable: new Map(),
    attackCooldown: 0,
    specialAbilityCooldown: 0,
    patrolAngle: 0,
    patrolTimer: 0,
  };

  // 1. Should fail due to insufficient energy
  const failResult = CombatSystem.executeAbilityIntent(
    CORE_ABILITIES.plasma_shot,
    0,
    sheet,
    playerState,
    { x: 0, y: 0, z: 0 },
    dummyTarget,
    []
  );
  assert.equal(failResult.result.success, false);
  assert.ok(failResult.result.errorReason?.includes('Insufficient Energy'));

  // 2. Replenish energy, execute successfully
  playerState.currentEnergy = 50;
  const successResult = CombatSystem.executeAbilityIntent(
    CORE_ABILITIES.plasma_shot,
    0,
    sheet,
    playerState,
    { x: 0, y: 0, z: 0 },
    dummyTarget,
    []
  );
  assert.equal(successResult.result.success, true);
  assert.equal(successResult.updatedPlayerEnergy, 35, 'Energy should be deducted');
  assert.ok(successResult.damageDealt > 0, 'Damage should be dealt');
  assert.ok(successResult.threatGenerated > 0, 'Threat should be generated');
});

test('Quest progress tracking updates objectives and completion status', () => {
  const initialQuests: QuestState[] = [
    {
      definitionId: 'quest_drones',
      title: QUEST_DEFINITIONS.quest_drones.title,
      description: QUEST_DEFINITIONS.quest_drones.description,
      objectives: [
        {
          id: 'obj_kill_drones',
          description: 'Neutralize Scavenger Drones',
          type: 'Kill',
          targetId: 'drone',
          currentAmount: 3,
          requiredAmount: 4,
          completed: false,
        },
      ],
      rewards: QUEST_DEFINITIONS.quest_drones.rewards,
      status: 'in_progress',
    },
  ];

  // Kill 1 drone -> objective completes -> quest status moves to 'ready_to_turn_in'
  const { updatedQuests, completedQuests } = CombatSystem.updateQuestProgress(
    initialQuests,
    'Kill',
    'drone',
    1
  );

  assert.equal(updatedQuests[0].objectives[0].currentAmount, 4);
  assert.equal(updatedQuests[0].objectives[0].completed, true);
  assert.equal(updatedQuests[0].status, 'ready_to_turn_in');
  assert.equal(completedQuests.length, 1);
});

test('Enemy loot table generation yields credits and expected drops', () => {
  const droneTable = ENEMY_LOOT_TABLES.drone;
  const loot = CombatSystem.generateLoot(droneTable);

  assert.ok(loot.credits >= droneTable.creditsMin, 'Credits should be above minimum');
  assert.ok(loot.credits <= droneTable.creditsMax, 'Credits should be below maximum');
  assert.ok(Array.isArray(loot.items), 'Drops should be an array');
});
