/**
 * Project Frontier - Main Application Component
 * Complete 3D Mobile-First Sci-Fi MMORPG Prototype
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Game3DEngine, FloatingText } from './game/engine.ts';
import {
  Archetype,
  EquipmentSlot,
  InventoryItem,
  ItemDefinition,
  PlayerStatsState,
  QuestState,
  SkillType,
  ActiveBuff,
} from './game/types.ts';
import {
  calculateEffectiveStats,
  INITIAL_ARCHETYPE_STATS,
  XP_PER_LEVEL,
} from './game/stats.ts';
import { CORE_ABILITIES } from './game/abilities.ts';
import { QUEST_DEFINITIONS } from './game/quests.ts';
import { createScaledItem } from './game/items.ts';
import { CombatSystem, EnemyInstance } from './game/combat.ts';
import { defaultSaveService, GameSaveData } from './game/saveService.ts';
import { FriendlyNPCConfig, OUTPOST_SPAWN } from './game/worldData.ts';
import { soundManager } from './game/audio.ts';

// UI Components
import { VirtualJoystick } from './components/VirtualJoystick.tsx';
import { PlayerFrame } from './components/PlayerFrame.tsx';
import { TargetFrame } from './components/TargetFrame.tsx';
import { ActionBar } from './components/ActionBar.tsx';
import { Minimap } from './components/Minimap.tsx';
import { CharacterModal } from './components/CharacterModal.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { QuestModal } from './components/QuestModal.tsx';
import { NPCModal } from './components/NPCModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { FloatingCombatTextOverlay } from './components/FloatingCombatTextOverlay.tsx';

// Icons
import {
  User,
  Package,
  Target,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Check for autostart URL parameter (for automated tests or fast skip)
  const isAutostart = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<'title' | 'playing' | 'dead'>(
    isAutostart ? 'playing' : 'title'
  );

  // Canvas container ref
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Game3DEngine | null>(null);

  // Player State
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>(() => {
    const init = INITIAL_ARCHETYPE_STATS.Vanguard;
    return {
      archetype: 'Vanguard',
      level: 1,
      xp: 0,
      xpToNextLevel: XP_PER_LEVEL[1] || 120,
      unspentSkillPoints: 0,
      credits: 60,
      primaryStats: { ...init.primary },
      skills: { ...init.skills },
      currentHealth: 340,
      currentEnergy: 160,
    };
  });

  const [equipment, setEquipment] = useState<Partial<Record<EquipmentSlot, ItemDefinition>>>(() => ({
    Weapon: createScaledItem('scout_carbine', 1),
    Chest: createScaledItem('ballistic_vest', 1),
  }));

  const [inventory, setInventory] = useState<InventoryItem[]>(() => [
    { id: 'inv_1', definitionId: 'health_stim', item: createScaledItem('health_stim', 1), quantity: 3 },
    { id: 'inv_2', definitionId: 'energy_stim', item: createScaledItem('energy_stim', 1), quantity: 2 },
    { id: 'inv_3', definitionId: 'recon_helm', item: createScaledItem('recon_helm', 1), quantity: 1 },
    { id: 'inv_4', definitionId: 'neural_targeting_implant', item: createScaledItem('neural_targeting_implant', 1), quantity: 1 },
  ]);

  const [quests, setQuests] = useState<QuestState[]>(() => [
    {
      definitionId: 'quest_drones',
      title: QUEST_DEFINITIONS.quest_drones.title,
      description: QUEST_DEFINITIONS.quest_drones.description,
      objectives: QUEST_DEFINITIONS.quest_drones.objectives.map(o => ({ ...o })),
      rewards: QUEST_DEFINITIONS.quest_drones.rewards,
      status: 'in_progress',
    },
    {
      definitionId: 'quest_neural_cores',
      title: QUEST_DEFINITIONS.quest_neural_cores.title,
      description: QUEST_DEFINITIONS.quest_neural_cores.description,
      objectives: QUEST_DEFINITIONS.quest_neural_cores.objectives.map(o => ({ ...o })),
      rewards: QUEST_DEFINITIONS.quest_neural_cores.rewards,
      status: 'in_progress',
    },
    {
      definitionId: 'quest_kill_boss',
      title: QUEST_DEFINITIONS.quest_kill_boss.title,
      description: QUEST_DEFINITIONS.quest_kill_boss.description,
      objectives: QUEST_DEFINITIONS.quest_kill_boss.objectives.map(o => ({ ...o })),
      rewards: QUEST_DEFINITIONS.quest_kill_boss.rewards,
      status: 'in_progress',
    },
  ]);

  const [playerBuffs, setPlayerBuffs] = useState<ActiveBuff[]>([]);

  // Combat State
  const [currentTarget, setCurrentTarget] = useState<EnemyInstance | FriendlyNPCConfig | null>(null);
  const [isAutoAttacking, setIsAutoAttacking] = useState(false);
  const [autoAttackTimer, setAutoAttackTimer] = useState(0);
  const [abilityCooldowns, setAbilityCooldowns] = useState<Record<string, number>>({});
  const [nearbyInteractable, setNearbyInteractable] = useState<FriendlyNPCConfig | null>(null);

  // Floating text & Minimap state
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [playerWorldPos, setPlayerWorldPos] = useState({ x: OUTPOST_SPAWN.x, y: 0, z: OUTPOST_SPAWN.z });
  const [playerHeading, setPlayerHeading] = useState(0);
  const [fps, setFps] = useState(60);
  const [graphicsQuality, setGraphicsQuality] = useState<'Low' | 'Medium' | 'High'>('High');

  // Modals
  const [activeModal, setActiveModal] = useState<'character' | 'inventory' | 'quests' | 'npc' | 'settings' | null>(null);
  const [talkingNPC, setTalkingNPC] = useState<FriendlyNPCConfig | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  }, []);

  // Compute effective character sheet
  const characterSheet = React.useMemo(() => {
    return calculateEffectiveStats(playerStats, equipment, playerBuffs);
  }, [playerStats, equipment, playerBuffs]);

  // Sync Max HP and Max Energy clamp
  useEffect(() => {
    if (playerStats.currentHealth > characterSheet.derived.MaxHealth) {
      setPlayerStats(prev => ({ ...prev, currentHealth: characterSheet.derived.MaxHealth }));
    }
    if (playerStats.currentEnergy > characterSheet.derived.MaxEnergy) {
      setPlayerStats(prev => ({ ...prev, currentEnergy: characterSheet.derived.MaxEnergy }));
    }
  }, [characterSheet.derived.MaxHealth, characterSheet.derived.MaxEnergy]);

  // Load Saved Game on startup
  useEffect(() => {
    defaultSaveService.load().then(save => {
      if (save && !isAutostart) {
        setPlayerStats(save.playerStats);
        if (save.equipment) setEquipment(save.equipment);
        if (save.inventory) setInventory(save.inventory);
        if (save.quests) setQuests(save.quests);
      }
    });
  }, [isAutostart]);

  // Periodically save game state
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      defaultSaveService.save({
        version: 1,
        lastSaved: Date.now(),
        playerStats,
        equipment,
        inventory,
        quests,
        position: { x: playerWorldPos.x, y: playerWorldPos.y, z: playerWorldPos.z, rotationY: playerHeading },
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState, playerStats, equipment, inventory, quests, playerWorldPos, playerHeading]);

  // Initialize Three.js Engine when playing
  useEffect(() => {
    if (gameState !== 'playing' || !canvasMountRef.current) return;

    const engine = new Game3DEngine(canvasMountRef.current);
    engineRef.current = engine;
    (window as any).__engine = engine;

    engine.onTargetChanged = target => {
      setCurrentTarget(target ? { ...target } as any : null);
    };

    engine.onPlayerPositionChanged = pos => {
      setPlayerWorldPos(pos);
      setPlayerHeading(engine.playerRotationY);
    };

    engine.onFloatingTextsUpdated = texts => {
      setFloatingTexts(texts);
    };

    engine.onInteractTargetAvailable = friendly => {
      setNearbyInteractable(friendly);
    };

    // FPS Counter
    let lastTime = performance.now();
    let frames = 0;
    const fpsInterval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      setFps(Math.round(frames / delta));
      frames = 0;
      lastTime = now;
    }, 1000);

    const countFrame = () => {
      frames++;
      if (engineRef.current) {
        requestAnimationFrame(countFrame);
      }
    };
    requestAnimationFrame(countFrame);

    return () => {
      clearInterval(fpsInterval);
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameState]);

  // Ensure mobile scrolling is enabled on title/archetype selection and locked during gameplay
  useEffect(() => {
    if (gameState === 'title') {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'pan-y';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.touchAction = 'pan-y';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.touchAction = 'none';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.touchAction = '';
    };
  }, [gameState]);

  // Mobile Touch Camera Drag on Right Half of Screen
  const touchCameraRef = useRef<{ isDragging: boolean; lastX: number; lastY: number; touchId: number | null }>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    touchId: null,
  });

  const handleCameraTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    // Check if touch is on right half and not on buttons
    const touch = e.changedTouches[0];
    if (touch.clientX > window.innerWidth * 0.35) {
      touchCameraRef.current = {
        isDragging: true,
        lastX: touch.clientX,
        lastY: touch.clientY,
        touchId: touch.identifier,
      };
    }
  };

  const handleCameraTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !touchCameraRef.current.isDragging || !engineRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchCameraRef.current.touchId) {
        const deltaX = touch.clientX - touchCameraRef.current.lastX;
        const deltaY = touch.clientY - touchCameraRef.current.lastY;
        engineRef.current.rotateCamera(deltaX, deltaY);
        touchCameraRef.current.lastX = touch.clientX;
        touchCameraRef.current.lastY = touch.clientY;
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchCameraRef.current.touchId) {
        touchCameraRef.current.isDragging = false;
        touchCameraRef.current.touchId = null;
        break;
      }
    }
  };

  // Mouse drag for desktop camera rotation
  const isMouseDownRef = useRef(false);
  const mouseLastPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 || e.button === 2) {
      isMouseDownRef.current = true;
      mouseLastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownRef.current && engineRef.current) {
      const deltaX = e.clientX - mouseLastPosRef.current.x;
      const deltaY = e.clientY - mouseLastPosRef.current.y;
      engineRef.current.rotateCamera(deltaX, deltaY);
      mouseLastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (engineRef.current) {
      engineRef.current.zoomCamera(e.deltaY * 0.008);
    }
  };

  // Screen tap for raycast targeting
  const handleViewportClick = (e: React.MouseEvent) => {
    if (engineRef.current) {
      engineRef.current.handleScreenTap(e.clientX, e.clientY);
    }
  };

  // ==========================================
  // COMBAT ENGINE TICK (Auto-attack, Cooldowns, Buffs, Energy Regen)
  // ==========================================

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const dt = 0.1; // 100ms combat resolution tick

      // 1. Ability Cooldowns Countdown
      setAbilityCooldowns(prev => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [id, cd] of Object.entries(prev)) {
          if (cd > 0) {
            next[id] = Math.max(0, cd - dt);
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      // 2. Buffs Countdown & Expiry
      setPlayerBuffs(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(b => ({ ...b, remainingTime: b.remainingTime - dt }))
          .filter(b => b.remainingTime > 0);
      });

      // 3. Passive Energy & Health Regeneration
      setPlayerStats(prev => {
        const maxE = characterSheet.derived.MaxEnergy;
        const maxH = characterSheet.derived.MaxHealth;
        const newE = Math.min(maxE, prev.currentEnergy + dt * 2.5); // +2.5 energy/s
        const newH = Math.min(maxH, prev.currentHealth + dt * 1.0); // +1.0 health/s out of heavy combat
        if (newE !== prev.currentEnergy || newH !== prev.currentHealth) {
          return { ...prev, currentEnergy: newE, currentHealth: newH };
        }
        return prev;
      });

      // 4. Auto Attack Cycle
      if (isAutoAttacking && currentTarget && 'currentHealth' in currentTarget && !currentTarget.isDead) {
        const enemy = currentTarget as EnemyInstance;
        const weaponSpeed = 2.0 / Math.max(0.5, characterSheet.derived.AttackSpeed);

        setAutoAttackTimer(prevTimer => {
          const nextTimer = prevTimer + dt;
          if (nextTimer >= weaponSpeed) {
            // Trigger auto-attack hit!
            executeAutoAttackHit(enemy);
            return 0;
          }
          return nextTimer;
        });
      } else {
        setAutoAttackTimer(0);
      }

      // 5. Enemy Attacks on Player
      if (engineRef.current) {
        engineRef.current.enemyInstances.forEach(enemy => {
          if (enemy.isDead || enemy.aiState !== 'Attack') return;

          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = enemy.definition.attackSpeed;

            // Attack player
            const combatRes = CombatSystem.resolveAttackDamage(
              enemy.attackRating,
              characterSheet.derived.DefenseRating,
              enemy.definition.attackDamage,
              enemy.critChance,
              characterSheet.derived.Armor
            );

            soundManager.playHitImpact(combatRes.isCrit);

            if (combatRes.isMiss) {
              engineRef.current?.addFloatingCombatText('Miss!', playerWorldPos, '#94a3b8');
            } else {
              engineRef.current?.addFloatingCombatText(
                `-${combatRes.damage}${combatRes.isCrit ? ' CRIT!' : ''}`,
                playerWorldPos,
                combatRes.isCrit ? '#ff0055' : '#ef4444',
                combatRes.isCrit
              );

              setPlayerStats(prev => {
                const nextHp = Math.max(0, prev.currentHealth - combatRes.damage);
                if (nextHp <= 0) {
                  // Player death!
                  handlePlayerDeath();
                }
                return { ...prev, currentHealth: nextHp };
              });
            }
          }
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, isAutoAttacking, currentTarget, characterSheet, playerWorldPos]);

  // Execute Auto Attack Hit
  const executeAutoAttackHit = (target: EnemyInstance) => {
    if (!engineRef.current || target.isDead) return;

    // Check Range (Max 22m for rifle)
    const dist = Math.hypot(target.position.x - playerWorldPos.x, target.position.z - playerWorldPos.z);
    if (dist > 22) {
      showToast('Target is out of range');
      setIsAutoAttacking(false);
      return;
    }

    soundManager.playAutoAttack();

    // Spawn visual projectile
    engineRef.current.spawnPlasmaProjectile(playerWorldPos, target.position, 0x00f0ff, () => {
      const res = CombatSystem.resolvePlayerAutoAttack(characterSheet, target, 24);

      if (res.isMiss) {
        engineRef.current?.addFloatingCombatText('Miss!', target.position, '#94a3b8');
      } else {
        soundManager.playHitImpact(res.isCrit);
        engineRef.current?.addFloatingCombatText(
          `${res.damage}${res.isCrit ? ' CRIT!' : ''}`,
          target.position,
          res.isCrit ? '#ffaa00' : '#ffffff',
          res.isCrit
        );

        // Apply damage to enemy
        applyDamageToEnemy(target.id, res.damage);
      }
    });
  };

  // Execute Player Ability Intent
  const handleUseAbility = (abilityId: string) => {
    const ability = CORE_ABILITIES[abilityId];
    if (!ability || !engineRef.current) return;

    const cd = abilityCooldowns[abilityId] || 0;
    const enemyTarget = currentTarget && 'currentHealth' in currentTarget ? (currentTarget as EnemyInstance) : null;

    const res = CombatSystem.executeAbilityIntent(
      ability,
      cd,
      characterSheet,
      playerStats,
      playerWorldPos,
      enemyTarget,
      playerBuffs
    );

    if (!res.result.success) {
      showToast(res.result.errorReason || 'Cannot use ability');
      return;
    }

    // Ability succeeded!
    setAbilityCooldowns(prev => ({ ...prev, [abilityId]: ability.rechargeTime }));
    setPlayerStats(prev => ({ ...prev, currentEnergy: res.updatedPlayerEnergy }));
    setPlayerBuffs(res.updatedPlayerBuffs);

    if (abilityId === 'plasma_shot') soundManager.playPlasmaShot();
    else if (abilityId === 'disruptor_pulse') soundManager.playDisruptorPulse();
    else if (abilityId === 'emergency_stim') soundManager.playHeal();
    else if (abilityId === 'overclock') soundManager.playOverclock();

    // Spawn projectile or text effects
    if (enemyTarget && res.damageDealt > 0) {
      engineRef.current.spawnPlasmaProjectile(playerWorldPos, enemyTarget.position, 0xff5500, () => {
        soundManager.playHitImpact(true);
        applyDamageToEnemy(enemyTarget.id, res.damageDealt);
      });
    }

    res.result.events.forEach(evt => {
      if (evt.type === 'heal' && evt.value) {
        setPlayerStats(prev => ({
          ...prev,
          currentHealth: Math.min(characterSheet.derived.MaxHealth, prev.currentHealth + (evt.value || 0)),
        }));
        engineRef.current?.addFloatingCombatText(`+${evt.value} HP`, playerWorldPos, '#10b981');
      } else if (evt.type === 'buff_applied') {
        engineRef.current?.addFloatingCombatText(`+${evt.abilityName}`, playerWorldPos, '#00f0ff');
      }
    });
  };

  // Apply damage and handle enemy death / loot / quests
  const applyDamageToEnemy = (enemyId: string, damage: number) => {
    if (!engineRef.current) return;
    const enemy = engineRef.current.enemyInstances.get(enemyId);
    if (!enemy || enemy.isDead) return;

    enemy.currentHealth = Math.max(0, enemy.currentHealth - damage);
    setCurrentTarget(prev => (prev && prev.id === enemyId ? { ...enemy } : prev));

    if (enemy.currentHealth <= 0) {
      // Enemy Dead!
      engineRef.current.setEnemyDead(enemyId);
      setIsAutoAttacking(false);

      // 1. Award XP
      const xpGained = enemy.definition.xpReward;
      addPlayerXP(xpGained);

      // 2. Generate Loot & Drop
      const loot = CombatSystem.generateLoot(enemy.definition.lootTable);
      soundManager.playLootPickup();

      setPlayerStats(prev => ({ ...prev, credits: prev.credits + loot.credits }));
      showToast(`+${xpGained} XP · +${loot.credits} Credits salvaged!`);

      // Add items to inventory
      loot.items.forEach(drop => {
        const itemDef = createScaledItem(drop.itemDefId, enemy.definition.level);
        setInventory(prevInv => {
          const existing = prevInv.find(i => i.definitionId === itemDef.id);
          if (existing && itemDef.stackable) {
            return prevInv.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + drop.quantity } : i);
          } else if (prevInv.length < 24) {
            return [...prevInv, { id: `loot_${Date.now()}_${Math.random()}`, definitionId: itemDef.id, item: itemDef, quantity: drop.quantity }];
          }
          return prevInv;
        });
      });

      // 3. Update Quests (Kill & Collect)
      setQuests(prevQuests => {
        const { updatedQuests, completedQuests } = CombatSystem.updateQuestProgress(
          prevQuests,
          'Kill',
          enemy.defId,
          1
        );

        completedQuests.forEach(cq => {
          showToast(`Objective complete: ${cq.title}! Return to Outpost.`);
          soundManager.playLevelUp();
        });

        return updatedQuests;
      });
    }
  };

  // Add XP and handle Level Up
  const addPlayerXP = (amount: number) => {
    setPlayerStats(prev => {
      let currentXp = prev.xp + amount;
      let currentLvl = prev.level;
      let nextXpTarget = XP_PER_LEVEL[currentLvl] || 120;
      let sp = prev.unspentSkillPoints;

      if (currentXp >= nextXpTarget && currentLvl < 5) {
        // LEVEL UP!
        currentXp -= nextXpTarget;
        currentLvl += 1;
        sp += 5;
        soundManager.playLevelUp();
        showToast(`LEVEL UP! You reached Level ${currentLvl}! +5 Skill Points awarded.`);
        engineRef.current?.addFloatingCombatText('LEVEL UP!', playerWorldPos, '#ffd700', true);
      }

      return {
        ...prev,
        level: currentLvl,
        xp: currentXp,
        xpToNextLevel: XP_PER_LEVEL[currentLvl] || 120,
        unspentSkillPoints: sp,
      };
    });
  };

  // Player Death & Respawn
  const handlePlayerDeath = () => {
    setIsAutoAttacking(false);
    setGameState('dead');
  };

  const handleRespawn = () => {
    setGameState('playing');
    setPlayerStats(prev => ({
      ...prev,
      currentHealth: characterSheet.derived.MaxHealth,
      currentEnergy: characterSheet.derived.MaxEnergy,
    }));
    if (engineRef.current) {
      engineRef.current.playerPosition.set(OUTPOST_SPAWN.x, 0, OUTPOST_SPAWN.z);
      engineRef.current.selectTarget(null);
    }
    showToast('Nano-reconstruction complete. Deployed at Outpost Delta.');
  };

  // Cycle Target
  const handleCycleTarget = () => {
    if (engineRef.current) {
      engineRef.current.cycleNextTarget();
    }
  };

  // Interact with NPC
  const handleInteract = () => {
    const targetNpc = nearbyInteractable || (currentTarget && !('currentHealth' in currentTarget) ? (currentTarget as FriendlyNPCConfig) : null);
    if (targetNpc) {
      soundManager.playUIClick();
      setTalkingNPC(targetNpc);
      setActiveModal('npc');
    }
  };

  // Start Game from Title
  const handleStartGame = (selectedArchetype: Archetype) => {
    const init = INITIAL_ARCHETYPE_STATS[selectedArchetype];
    setPlayerStats(prev => ({
      ...prev,
      archetype: selectedArchetype,
      primaryStats: { ...init.primary },
      skills: { ...init.skills },
      currentHealth: selectedArchetype === 'Vanguard' ? 360 : 280,
      currentEnergy: selectedArchetype === 'Technician' ? 220 : 160,
    }));
    setGameState('playing');
  };

  // Character Sheet Actions
  const handleAllocateSkillPoint = (skill: SkillType) => {
    setPlayerStats(prev => {
      if (prev.unspentSkillPoints <= 0) return prev;
      return {
        ...prev,
        unspentSkillPoints: prev.unspentSkillPoints - 1,
        skills: {
          ...prev.skills,
          [skill]: (prev.skills[skill] || 0) + 1,
        },
      };
    });
  };

  const handleUnequipSlot = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    if (!item) return;

    setEquipment(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });

    setInventory(prev => [
      ...prev,
      { id: `inv_${Date.now()}`, definitionId: item.id, item, quantity: 1 },
    ]);
  };

  // Inventory Actions
  const handleEquipItem = (item: ItemDefinition) => {
    if (!item.slot) return;

    // Remove from inventory
    setInventory(prev => {
      const idx = prev.findIndex(i => i.definitionId === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });

    // If something was already equipped in slot, move back to inventory
    const existing = equipment[item.slot];
    if (existing) {
      setInventory(prev => [
        ...prev,
        { id: `inv_${Date.now()}`, definitionId: existing.id, item: existing, quantity: 1 },
      ]);
    }

    setEquipment(prev => ({ ...prev, [item.slot!]: item }));
    showToast(`Equipped: ${item.name}`);
  };

  const handleUseConsumable = (item: ItemDefinition) => {
    if (!item.consumableEffect) return;

    // Apply effects
    if (item.consumableEffect.healHp) {
      setPlayerStats(prev => ({
        ...prev,
        currentHealth: Math.min(characterSheet.derived.MaxHealth, prev.currentHealth + item.consumableEffect!.healHp!),
      }));
      engineRef.current?.addFloatingCombatText(`+${item.consumableEffect.healHp} HP`, playerWorldPos, '#10b981');
    }

    if (item.consumableEffect.restoreEnergy) {
      setPlayerStats(prev => ({
        ...prev,
        currentEnergy: Math.min(characterSheet.derived.MaxEnergy, prev.currentEnergy + item.consumableEffect!.restoreEnergy!),
      }));
      engineRef.current?.addFloatingCombatText(`+${item.consumableEffect.restoreEnergy} Energy`, playerWorldPos, '#00f0ff');
    }

    // Deduct quantity
    setInventory(prev => {
      const idx = prev.findIndex(i => i.definitionId === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });
  };

  const handleDropItem = (instanceId: string) => {
    setInventory(prev => prev.filter(i => i.id !== instanceId));
    showToast('Item discarded');
  };

  // Quest Claim Action
  const handleClaimQuest = (questDefId: string) => {
    setQuests(prev => prev.map(q => q.definitionId === questDefId ? { ...q, status: 'completed' } : q));
    const qDef = QUEST_DEFINITIONS[questDefId];
    if (qDef) {
      addPlayerXP(qDef.rewards.xp);
      setPlayerStats(prev => ({ ...prev, credits: prev.credits + qDef.rewards.credits }));
      showToast(`Quest Turn-in: +${qDef.rewards.xp} XP · +${qDef.rewards.credits} Credits!`);
    }
  };

  // Shop Buy & Sell Actions
  const handleBuyItem = (item: ItemDefinition) => {
    if (playerStats.credits < item.value) return;

    setPlayerStats(prev => ({ ...prev, credits: prev.credits - item.value }));
    setInventory(prev => [
      ...prev,
      { id: `buy_${Date.now()}_${Math.random()}`, definitionId: item.id, item, quantity: 1 },
    ]);
    showToast(`Purchased: ${item.name}`);
  };

  const handleSellItem = (instanceId: string, item: ItemDefinition) => {
    const sellValue = Math.max(5, Math.floor(item.value * 0.6));
    setPlayerStats(prev => ({ ...prev, credits: prev.credits + sellValue }));

    setInventory(prev => {
      const idx = prev.findIndex(i => i.id === instanceId);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });

    showToast(`Sold ${item.name} for +${sellValue} Credits`);
  };

  return (
    <div 
      className={`relative w-full ${
        gameState === 'playing' 
          ? 'h-[100dvh] overflow-hidden touch-none overscroll-none' 
          : 'min-h-[100dvh]'
      } bg-slate-950 font-sans select-none`}
    >
      {/* 1. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen onStartGame={handleStartGame} />
      )}

      {/* 2. 3D WebGL Canvas Viewport */}
      {gameState !== 'title' && (
        <div
          ref={canvasMountRef}
          onClick={handleViewportClick}
          onTouchStart={handleCameraTouchStart}
          onTouchMove={handleCameraTouchMove}
          onTouchEnd={handleCameraTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="absolute inset-0 z-0 cursor-crosshair"
        />
      )}

      {/* 3. Floating Combat Text Overlay */}
      {gameState === 'playing' && engineRef.current && (
        <FloatingCombatTextOverlay
          texts={floatingTexts}
          camera={engineRef.current.camera}
        />
      )}

      {/* 4. Active Game HUD (Perimeter clusters with zero central obstruction) */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Top Bar: Player Cluster, Target Cluster, System Icons */}
          <div 
            className="flex items-start justify-between w-full gap-2 pointer-events-none"
            style={{
              paddingLeft: 'max(0.4rem, env(safe-area-inset-left, 0.4rem))',
              paddingRight: 'max(0.4rem, env(safe-area-inset-right, 0.4rem))',
              paddingTop: 'max(0.4rem, env(safe-area-inset-top, 0.4rem))',
            }}
          >
            {/* Top Left: Player Status */}
            <PlayerFrame
              archetype={playerStats.archetype}
              level={playerStats.level}
              currentHp={playerStats.currentHealth}
              maxHp={characterSheet.derived.MaxHealth}
              currentEnergy={playerStats.currentEnergy}
              maxEnergy={characterSheet.derived.MaxEnergy}
              credits={playerStats.credits}
              buffs={playerBuffs}
              onOpenCharacterSheet={() => {
                soundManager.playUIClick();
                setActiveModal('character');
              }}
            />

            {/* Top Center: Target Status Frame */}
            <TargetFrame
              target={currentTarget}
              onClearTarget={() => {
                soundManager.playUIClick();
                engineRef.current?.selectTarget(null);
              }}
            />

            {/* Top Right: Minimap & Quick Menu Buttons */}
            <div className="flex items-start gap-1.5 pointer-events-auto">
              <Minimap
                playerPos={playerWorldPos}
                playerHeading={playerHeading}
                enemies={engineRef.current?.enemyInstances || new Map()}
              />

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    soundManager.playUIClick();
                    setActiveModal('character');
                  }}
                  className="p-1.5 rounded-lg bg-slate-950/75 border border-cyan-500/25 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition shadow-sm"
                  title="Character Sheet & Skills (C)"
                  aria-label="Character Sheet"
                >
                  <User className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    soundManager.playUIClick();
                    setActiveModal('inventory');
                  }}
                  className="p-1.5 rounded-lg bg-slate-950/75 border border-cyan-500/25 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition shadow-sm"
                  title="Inventory (I)"
                  aria-label="Inventory"
                >
                  <Package className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    soundManager.playUIClick();
                    setActiveModal('quests');
                  }}
                  className="p-1.5 rounded-lg bg-slate-950/75 border border-cyan-500/25 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition shadow-sm"
                  title="Mission Directives (L)"
                  aria-label="Mission Directives"
                >
                  <Target className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    soundManager.playUIClick();
                    setActiveModal('settings');
                  }}
                  className="p-1.5 rounded-lg bg-slate-950/75 border border-cyan-500/25 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition shadow-sm"
                  title="Settings & Debug Panel"
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Feedback Toasts */}
          {toastMessage && (
            <div className="self-center mb-auto mt-14 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-400/40 text-cyan-200 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 pointer-events-none">
              {toastMessage}
            </div>
          )}

          {/* Bottom Controls Area (Safe Area Aware) */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            {/* Left: Virtual Touch Joystick (Isolated Movement Area) */}
            <VirtualJoystick
              onMove={(dx, dz) => {
                if (engineRef.current) {
                  engineRef.current.setMovementInput(dx, dz, characterSheet.derived.MovementSpeed);
                }
              }}
            />

            {/* Combat Actions, Target/Talk cluster, and Auto-Attack */}
            <ActionBar
              abilities={Object.values(CORE_ABILITIES)}
              cooldowns={abilityCooldowns}
              playerEnergy={playerStats.currentEnergy}
              isAutoAttacking={isAutoAttacking}
              autoAttackProgress={autoAttackTimer / Math.max(0.5, 2.0 / characterSheet.derived.AttackSpeed)}
              hasTarget={currentTarget !== null}
              canInteract={nearbyInteractable !== null || (currentTarget !== null && !('currentHealth' in currentTarget))}
              onToggleAutoAttack={() => {
                if (!currentTarget || !('currentHealth' in currentTarget)) {
                  showToast('Select a hostile target first');
                  return;
                }
                soundManager.playUIClick();
                setIsAutoAttacking(prev => !prev);
              }}
              onUseAbility={handleUseAbility}
              onCycleTarget={handleCycleTarget}
              onInteract={handleInteract}
            />
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {activeModal === 'character' && (
        <CharacterModal
          playerState={playerStats}
          sheet={characterSheet}
          equipment={equipment}
          onAllocateSkillPoint={handleAllocateSkillPoint}
          onUnequipSlot={handleUnequipSlot}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryModal
          items={inventory}
          sheet={characterSheet}
          playerLevel={playerStats.level}
          credits={playerStats.credits}
          onEquipItem={handleEquipItem}
          onUseConsumable={handleUseConsumable}
          onDropItem={handleDropItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'quests' && (
        <QuestModal
          quests={quests}
          onClaimQuest={handleClaimQuest}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'npc' && talkingNPC && (
        <NPCModal
          npc={talkingNPC}
          playerCredits={playerStats.credits}
          playerInventory={inventory}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
          onOpenQuests={() => {
            setActiveModal('quests');
          }}
          onClose={() => {
            setActiveModal(null);
            setTalkingNPC(null);
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          graphicsQuality={graphicsQuality}
          fps={fps}
          playerPos={playerWorldPos}
          playerLevel={playerStats.level}
          attackRating={characterSheet.derived.AttackRating}
          defenseRating={characterSheet.derived.DefenseRating}
          targetId={currentTarget?.id || null}
          enemyCount={engineRef.current?.enemyInstances.size || 0}
          onSetGraphicsQuality={setGraphicsQuality}
          onAddCredits={amt => setPlayerStats(prev => ({ ...prev, credits: prev.credits + amt }))}
          onGainLevel={() => addPlayerXP(XP_PER_LEVEL[playerStats.level] || 120)}
          onHealPlayer={() => setPlayerStats(prev => ({ ...prev, currentHealth: characterSheet.derived.MaxHealth, currentEnergy: characterSheet.derived.MaxEnergy }))}
          onSpawnEnemy={() => {
            engineRef.current?.enemyInstances.forEach((_, id) => engineRef.current?.respawnEnemy(id));
            showToast('All enemies respawned');
          }}
          onResetSave={async () => {
            await defaultSaveService.deleteSave();
            window.location.reload();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 6. Death & Revivification Screen */}
      {gameState === 'dead' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="p-4 bg-red-950/60 border border-red-500 rounded-full mb-4 text-red-400">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">
            CRITICAL SYSTEM FAILURE
          </h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Operative vitals collapsed in the wilderness. Emergency beacon transmitting coordinates to Outpost Delta.
          </p>
          <button
            onClick={handleRespawn}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95 transition"
          >
            REVIVIFY AT OUTPOST DELTA
          </button>
        </div>
      )}
    </div>
  );
}
