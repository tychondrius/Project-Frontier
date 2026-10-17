/**
 * Project Frontier - Save Persistence Interface & Local Storage Implementation
 */

import type {
  EquipmentSlot,
  InventoryItem,
  ItemDefinition,
  PlayerStatsState,
  QuestState,
} from './types.ts';

export interface GameSaveData {
  version: number;
  lastSaved: number;
  playerStats: PlayerStatsState;
  equipment: Partial<Record<EquipmentSlot, ItemDefinition>>;
  inventory: InventoryItem[];
  quests: QuestState[];
  position: { x: number; y: number; z: number; rotationY: number };
}

export interface ISaveService {
  save(data: GameSaveData): Promise<boolean>;
  load(): Promise<GameSaveData | null>;
  hasSave(): Promise<boolean>;
  deleteSave(): Promise<boolean>;
}

export class LocalSaveService implements ISaveService {
  private readonly storageKey = 'project_frontier_save_v1';

  async save(data: GameSaveData): Promise<boolean> {
    try {
      const serialized = JSON.stringify({
        ...data,
        lastSaved: Date.now(),
      });
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (e) {
      console.error('Failed to save game state to LocalStorage:', e);
      return false;
    }
  }

  async load(): Promise<GameSaveData | null> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GameSaveData;
      if (!parsed || !parsed.playerStats) return null;
      return parsed;
    } catch (e) {
      console.error('Failed to load game state from LocalStorage:', e);
      return null;
    }
  }

  async hasSave(): Promise<boolean> {
    return localStorage.getItem(this.storageKey) !== null;
  }

  async deleteSave(): Promise<boolean> {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.error('Failed to delete save:', e);
      return false;
    }
  }
}

export const defaultSaveService: ISaveService = new LocalSaveService();
