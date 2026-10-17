/**
 * Project Frontier - Core Data Types & Definitions
 * Data-driven architecture for classic-MMO inspired combat and progression
 */

export type PrimaryStatType = 
  | 'Strength' 
  | 'Agility' 
  | 'Endurance' 
  | 'Intelligence' 
  | 'Perception' 
  | 'Willpower';

export type SkillType = 
  | 'Rifle' 
  | 'Pistol' 
  | 'Melee' 
  | 'Defense' 
  | 'Initiative'
  | 'Engineering' 
  | 'Biotechnology' 
  | 'Cybernetics';

export type DerivedStatType = 
  | 'Health'
  | 'MaxHealth'
  | 'Energy'
  | 'MaxEnergy'
  | 'AttackRating'
  | 'DefenseRating'
  | 'Armor'
  | 'CriticalChance'
  | 'MovementSpeed'
  | 'AttackSpeed'
  | 'AttackTime'
  | 'RechargeTime';

export type EquipmentSlot = 
  | 'Head'
  | 'Chest'
  | 'Legs'
  | 'Feet'
  | 'Hands'
  | 'Back'
  | 'Weapon'
  | 'Accessory1'
  | 'Accessory2'
  | 'CyberImplant';

export type Archetype = 'Vanguard' | 'Technician';

export interface StatModifier {
  target: PrimaryStatType | DerivedStatType | SkillType;
  type: 'flat' | 'percent';
  value: number;
}

export interface EquipmentRequirement {
  type: 'stat' | 'skill' | 'level';
  name: PrimaryStatType | SkillType | 'Level';
  minValue: number;
}

export type ItemType = 'weapon' | 'armor' | 'implant' | 'consumable' | 'quest' | 'junk';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  slot?: EquipmentSlot;
  ql: number; // Quality Level (1-100)
  rarity: ItemRarity;
  requirements: EquipmentRequirement[];
  modifiers: StatModifier[];
  value: number; // Value in credits
  icon: string;
  stackable?: boolean;
  // Weapon specific attributes
  attackTime?: number; // Base attack execution time (e.g. 1.2s)
  rechargeTime?: number; // Base recharge delay (e.g. 1.6s)
  minDamage?: number;
  maxDamage?: number;
  damageType?: 'kinetic' | 'energy' | 'plasma';
  specials?: string[]; // IDs of available specials: e.g. ['burst', 'flingshot']
  criticalBonus?: number;
  // Over-equipping status (calculated dynamically on equipped gear)
  oeEfficiency?: number; // 1.0 (100%), 0.75 (75%), 0.50 (50%), 0.25 (25%)
  oeTier?: number; // 0 = qualified, 1 = 80-99% (no penalty), 2 = 60-79% (-25%), 3 = 40-59% (-50%), 4 = <40% (-75%)
  oeMissingSkills?: { name: string; required: number; current: number; ratio: number }[];
  consumableEffect?: {
    healHp?: number;
    restoreEnergy?: number;
    buffId?: string;
  };
}

export interface InventoryItem {
  id: string; // Unique instance id
  definitionId: string;
  item: ItemDefinition;
  quantity: number;
}

export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  stackGroup: string;
  stackPriority: number;
  icon: string;
  isDebuff?: boolean;
  modifiers: StatModifier[];
}

export interface ActiveBuff {
  definitionId: string;
  name: string;
  duration: number;
  remainingTime: number;
  stackGroup: string;
  stackPriority: number;
  icon: string;
  isDebuff?: boolean;
  modifiers: StatModifier[];
}

export type EffectType = 'Damage' | 'Heal' | 'Buff' | 'Debuff';

export interface AbilityEffect {
  type: EffectType;
  amount?: number;
  statScale?: PrimaryStatType;
  scaleFactor?: number;
  buff?: BuffDefinition;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  energyCost: number;
  range: number;
  castTime: number; // in seconds (0 = instant)
  rechargeTime: number; // Cooldown in seconds
  requirements?: EquipmentRequirement[];
  effects: AbilityEffect[];
}

export interface WeaponSpecialDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number; // in seconds
  energyCost: number;
  weaponTypeRequirement?: 'Rifle' | 'Pistol' | 'Melee';
  damageMultiplier: number;
  shotsCount: number; // e.g. Burst = 3 shots
  critBonusChance?: number;
}

export type EnemyAIState = 
  | 'Idle' 
  | 'Patrol' 
  | 'Aggro' 
  | 'Chase' 
  | 'Attack' 
  | 'Return' 
  | 'Dead';

export interface LootDropEntry {
  itemDefId: string;
  chance: number; // 0.0 - 1.0
  minQty: number;
  maxQty: number;
}

export interface LootTable {
  creditsMin: number;
  creditsMax: number;
  drops: LootDropEntry[];
}

export interface NPCDefinition {
  id: string;
  name: string;
  title?: string;
  level: number;
  maxHealth: number;
  attackDamage: number;
  attackSpeed: number; // Seconds per attack
  attackRange: number;
  aggroRange: number;
  leashRange: number;
  xpReward: number;
  isBoss?: boolean;
  bossAbilities?: string[];
  lootTable: LootTable;
  modelType: 'drone' | 'stalker' | 'automaton' | 'predator' | 'boss' | 'human_npc';
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'Kill' | 'Collect' | 'Interact';
  targetId: string;
  currentAmount: number;
  requiredAmount: number;
  completed: boolean;
}

export interface QuestReward {
  xp: number;
  credits: number;
  items?: { itemDefId: string; quantity: number }[];
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
}

export interface QuestState {
  definitionId: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: 'available' | 'in_progress' | 'ready_to_turn_in' | 'completed';
}

export interface PlayerStatsState {
  archetype: Archetype;
  level: number;
  xp: number;
  xpToNextLevel: number;
  unspentSkillPoints: number;
  credits: number;
  primaryStats: Record<PrimaryStatType, number>;
  skills: Record<SkillType, number>;
  currentHealth: number;
  currentEnergy: number;
  aggDefSlider: number; // 0 (Full Defensive) to 100 (Full Aggressive), default 80
}

export interface CombatRollResult {
  timestamp: number;
  roll: number;
  hitChance: number;
  isHit: boolean;
  isCrit: boolean;
  isEvade: boolean;
  attackerAR: number;
  defenderDR: number;
  rawDamage: number;
  armorMitigation: number;
  finalDamage: number;
  damageType: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  type: 'hit' | 'crit' | 'miss' | 'heal' | 'buff' | 'special' | 'oe_warning' | 'info';
  message: string;
}

export interface CombatEvent {
  type: 'damage' | 'heal' | 'miss' | 'crit' | 'buff_applied' | 'death' | 'level_up' | 'quest_update' | 'special';
  sourceName: string;
  targetName: string;
  value?: number;
  abilityName?: string;
  isCrit?: boolean;
  text?: string;
  damageType?: string;
  position?: { x: number; y: number; z: number };
}
