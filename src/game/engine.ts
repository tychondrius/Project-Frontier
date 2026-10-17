/**
 * Project Frontier - 3D Engine & Procedural Sci-Fi World
 * Built with Three.js (Composite 3-12 Part Models, PBR, Particle Effects)
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  FRIENDLY_NPCS,
  NPC_DEFINITIONS,
  OUTPOST_SPAWN,
  WORLD_ENEMY_SPAWNS,
  FriendlyNPCConfig,
} from './worldData.ts';
import { CombatEntity, EnemyInstance } from './combat.ts';
import { soundManager } from './audio.ts';

export interface FloatingText {
  id: string;
  text: string;
  worldPos: THREE.Vector3;
  color: string;
  scale: number;
  opacity: number;
  life: number;
  maxLife: number;
  velocityY: number;
}

export interface Projectile {
  id: string;
  mesh: THREE.Group;
  start: THREE.Vector3;
  target: THREE.Vector3;
  progress: number;
  speed: number;
  color: number;
  onHit?: () => void;
}

export class Game3DEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Player state in 3D
  public playerMesh: THREE.Group;
  public playerPosition = new THREE.Vector3(OUTPOST_SPAWN.x, 0, OUTPOST_SPAWN.z);
  public playerRotationY = 0;
  private playerVelocity = new THREE.Vector3();
  private isMoving = false;
  private moveWalkTimer = 0;

  // Camera Orbit
  public cameraDistance = 7.5;
  public cameraAzimuth = 0; // Horizontal rotation
  public cameraPolar = 0.45; // Vertical rotation (radians)
  private cameraLookTarget = new THREE.Vector3();

  // Entities in 3D
  public enemyInstances: Map<string, EnemyInstance> = new Map();
  public enemyMeshes: Map<string, THREE.Group> = new Map();
  public friendlyMeshes: Map<string, THREE.Group> = new Map();

  // Visuals
  public targetRing: THREE.Group;
  public currentTargetId: string | null = null;
  public floatingTexts: FloatingText[] = [];
  public projectiles: Projectile[] = [];

  // Animation & Loop
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();
  private isDestroyed = false;

  // Callbacks to React HUD
  public onTargetChanged?: (target: EnemyInstance | FriendlyNPCConfig | null) => void;
  public onPlayerPositionChanged?: (pos: { x: number; y: number; z: number }) => void;
  public onFloatingTextsUpdated?: (texts: FloatingText[]) => void;
  public onInteractTargetAvailable?: (target: FriendlyNPCConfig | null) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Sci-Fi Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.2, 300);

    // 3. Modern WebGL Renderer
    const isHeadless = typeof navigator !== 'undefined' && 
      (Boolean((navigator as any).webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback if RoomEnvironment fails
    }

    // 5. Lighting Rig
    this.setupLighting();

    // 6. World Terrain, Outpost Buildings & Ruin Monuments
    this.setupWorldEnvironment();

    // 7. Player Character Mesh
    this.playerMesh = this.createPlayerCharacterModel();
    this.playerMesh.position.copy(this.playerPosition);
    this.scene.add(this.playerMesh);

    // 8. Ground Target Ring
    this.targetRing = this.createTargetRing();
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);

    // 9. Spawn Friendly NPCs
    this.spawnFriendlyNPCs();

    // 10. Spawn World Enemies
    this.spawnWorldEnemies();

    // 11. Initial Camera Position
    this.updateCamera(0.016);

    // 12. Start Render Loop
    this.startLoop();

    // 13. Handle Window Resize
    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
    // Key Sun Light (Warm alien star)
    const sunLight = new THREE.DirectionalLight(0xffecd0, 2.4);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool Sky & Warm Ground Fill Light
    const hemiLight = new THREE.HemisphereLight(0x446699, 0x221a14, 1.2);
    this.scene.add(hemiLight);

    // Atmospheric Outpost Accent Lights (Cyan & Amber)
    const outpostBeacon = new THREE.PointLight(0x00f0ff, 3.5, 30);
    outpostBeacon.position.set(0, 12, -6);
    this.scene.add(outpostBeacon);

    const ruinsGlow = new THREE.PointLight(0xff3366, 4.0, 45);
    ruinsGlow.position.set(4, 5, 72);
    this.scene.add(ruinsGlow);
  }

  private setupWorldEnvironment() {
    // Procedural Alien Desert / Regolith Terrain
    const groundGeo = new THREE.PlaneGeometry(280, 280, 40, 40);
    groundGeo.rotateX(-Math.PI / 2);

    // Subtle natural desert undulation
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Keep outpost center flat
      const distFromCenter = Math.sqrt(vx * vx + vz * vz);
      if (distFromCenter > 15) {
        const elevation = Math.sin(vx * 0.04) * Math.cos(vz * 0.04) * 1.5 +
                          Math.sin(vx * 0.08 + vz * 0.08) * 0.8;
        posAttr.setY(i, elevation);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      roughness: 0.88,
      metalness: 0.12,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Outpost Landing Pad Platform
    const padGeo = new THREE.CylinderGeometry(14, 14.5, 0.4, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2a3648,
      metalness: 0.6,
      roughness: 0.35,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.2, -6);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Outer Pad Ring Decal
    const padRingGeo = new THREE.RingGeometry(12.5, 13.5, 32);
    padRingGeo.rotateX(-Math.PI / 2);
    const padRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.position.set(0, 0.42, -6);
    this.scene.add(padRing);

    // Outpost Main Habitat Module (Composite 8-part structure)
    const outpostGroup = new THREE.Group();
    
    // Core dome
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x3d4b60, metalness: 0.4, roughness: 0.4 });
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 4.5, 8), domeMat);
    dome.position.y = 2.25;
    dome.castShadow = true;
    dome.receiveShadow = true;
    outpostGroup.add(dome);

    // Roof dome cap
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.8, 8), domeMat);
    roof.position.y = 5.4;
    outpostGroup.add(roof);

    // Communications Spire Tower
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x202936, metalness: 0.8, roughness: 0.2 });
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 9, 6), spireMat);
    spire.position.set(0, 9.5, 0);
    outpostGroup.add(spire);

    // Glowing Communication Beacon Tip
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    beacon.position.set(0, 14, 0);
    outpostGroup.add(beacon);

    // Outpost Entrance Airlock
    const airlock = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1d2430, metalness: 0.5, roughness: 0.3 })
    );
    airlock.position.set(0, 1.4, 5.2);
    outpostGroup.add(airlock);

    // Solar Power Relays
    for (let i = -1; i <= 1; i += 2) {
      const solarArm = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.2, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0b3252, metalness: 0.9, roughness: 0.15 })
      );
      solarArm.position.set(i * 7, 3.8, -2);
      solarArm.rotation.z = i * 0.15;
      outpostGroup.add(solarArm);
    }

    outpostGroup.position.set(0, 0, -18);
    this.scene.add(outpostGroup);

    // Perimeter Defense Energy Pylons around Outpost
    const pylonCoords = [
      [-14, 0], [14, 0], [-16, -14], [16, -14]
    ];
    pylonCoords.forEach(([px, pz]) => {
      const pylon = new THREE.Group();
      const pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3.5, 6), domeMat);
      pBase.position.y = 1.75;
      pylon.add(pBase);

      const pCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: false })
      );
      pCrystal.position.y = 4.2;
      pylon.add(pCrystal);

      pylon.position.set(px, 0, pz);
      this.scene.add(pylon);
    });

    // Enemy Camp Outpost Barricades (at x: 30, z: 38)
    const campGroup = new THREE.Group();
    const scrapWallMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2d, roughness: 0.9, metalness: 0.4 });
    for (let i = -3; i <= 3; i++) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 0.6), scrapWallMat);
      wall.position.set(i * 2.2, 1.25, 0);
      wall.rotation.y = (Math.random() - 0.5) * 0.3;
      wall.castShadow = true;
      campGroup.add(wall);
    }
    campGroup.position.set(30, 0, 32);
    this.scene.add(campGroup);

    // Ancient Alien Ruins & Boss Arena (Monolith Pillars & Rune Dias at x: 4, z: 72)
    const ruinsGroup = new THREE.Group();
    const ruinsMat = new THREE.MeshStandardMaterial({ color: 0x1f1624, roughness: 0.7, metalness: 0.3 });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xff0066, side: THREE.DoubleSide });

    // Boss Arena Hexagonal Platform
    const bossPlatform = new THREE.Mesh(new THREE.CylinderGeometry(18, 19, 0.6, 6), ruinsMat);
    bossPlatform.position.y = 0.3;
    bossPlatform.receiveShadow = true;
    ruinsGroup.add(bossPlatform);

    // Rune Circle Decal
    const runeRing = new THREE.Mesh(new THREE.RingGeometry(12, 13.5, 6), runeMat);
    runeRing.rotateX(-Math.PI / 2);
    runeRing.position.y = 0.62;
    ruinsGroup.add(runeRing);

    // Ancient Monolith Pillars
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const px = Math.cos(a) * 16;
      const pz = Math.sin(a) * 16;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9, 2.2), ruinsMat);
      pillar.position.set(px, 4.5, pz);
      pillar.rotation.y = a;
      pillar.castShadow = true;
      ruinsGroup.add(pillar);

      const pillarGlyph = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4), runeMat);
      pillarGlyph.position.set(px * 0.92, 4.5, pz * 0.92);
      pillarGlyph.lookAt(0, 4.5, 0);
      ruinsGroup.add(pillarGlyph);
    }

    ruinsGroup.position.set(4, 0, 72);
    this.scene.add(ruinsGroup);

    // Natural Desert Alien Rock Formations (Instanced or grouped)
    this.spawnDesertLandscapeRocks();
  }

  private spawnDesertLandscapeRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x2b2230,
      roughness: 0.95,
      metalness: 0.05,
    });

    const rockGeo = new THREE.DodecahedronGeometry(1.8, 1);
    const rockGroup = new THREE.Group();

    const rockLocations = [
      [-22, 16], [-35, 30], [-18, 55], [38, 18], [42, 60], [-8, 48], [18, 88], [-25, 80]
    ];

    rockLocations.forEach(([rx, rz]) => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const scale = 1.2 + Math.random() * 1.5;
      rock.scale.set(scale, scale * 1.4, scale);
      rock.position.set(rx, scale * 0.6, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    });

    this.scene.add(rockGroup);
  }

  // ==========================================
  // PROCEDURAL COMPOSITE 3D MODELS (3-12 parts)
  // ==========================================

  private createPlayerCharacterModel(): THREE.Group {
    const group = new THREE.Group();

    const suitMat = new THREE.MeshStandardMaterial({ color: 0x2b384e, metalness: 0.4, roughness: 0.4 });
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
    const darkArmorMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.7, roughness: 0.3 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // 1. Torso / Chest Chassis
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    chest.position.y = 1.35;
    chest.castShadow = true;
    group.add(chest);

    // 2. Chest Armor Plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.45, 0.48), armorMat);
    chestPlate.position.set(0, 1.45, 0.02);
    chestPlate.castShadow = true;
    group.add(chestPlate);

    // 3. Head & Helmet
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.44), darkArmorMat);
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    // 4. Glowing Ocular Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.15), visorMat);
    visor.position.set(0, 2.02, 0.2);
    group.add(visor);

    // 5. Jet Thruster Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), darkArmorMat);
    pack.position.set(0, 1.4, -0.32);
    pack.castShadow = true;
    group.add(pack);

    // Thruster exhaust nozzles with glow
    for (let i = -1; i <= 1; i += 2) {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x00bfff })
      );
      nozzle.position.set(i * 0.16, 1.05, -0.32);
      group.add(nozzle);
    }

    // 6 & 7. Left & Right Pauldrons
    for (let i = -1; i <= 1; i += 2) {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.34), armorMat);
      pauldron.position.set(i * 0.48, 1.68, 0);
      pauldron.castShadow = true;
      group.add(pauldron);
    }

    // 8 & 9. Arms & Hands
    for (let i = -1; i <= 1; i += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), suitMat);
      arm.position.set(i * 0.48, 1.25, 0.05);
      arm.name = i === 1 ? 'right_arm' : 'left_arm';
      group.add(arm);
    }

    // 10. Equipped Weapon (Frontier Plasma Rifle) in right hand
    const gun = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.8), darkArmorMat);
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), armorMat);
    gunBarrel.rotateX(Math.PI / 2);
    gunBarrel.position.set(0, 0.02, 0.45);
    const gunCore = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.25), visorMat);
    gunCore.position.set(0, 0.05, 0.05);
    gun.add(gunBody, gunBarrel, gunCore);
    gun.position.set(0.48, 1.1, 0.45);
    gun.name = 'player_weapon';
    group.add(gun);

    // 11 & 12. Legs and Boots
    for (let i = -1; i <= 1; i += 2) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.26), suitMat);
      leg.position.set(i * 0.22, 0.48, 0);
      leg.castShadow = true;
      leg.name = i === 1 ? 'right_leg' : 'left_leg';
      group.add(leg);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.38), darkArmorMat);
      boot.position.set(i * 0.22, 0.11, 0.05);
      boot.castShadow = true;
      group.add(boot);
    }

    return group;
  }

  // Friendly NPC Model
  private createFriendlyNPCModel(role: 'mission' | 'shop' | 'medic'): THREE.Group {
    const group = new THREE.Group();

    const coatMat = new THREE.MeshStandardMaterial({
      color: role === 'mission' ? 0x224466 : 0x775522,
      roughness: 0.5,
      metalness: 0.3,
    });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 });
    const visorMat = new THREE.MeshBasicMaterial({ color: role === 'mission' ? 0x00f0ff : 0xffaa00 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 8), coatMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), headMat);
    head.position.y = 1.9;
    group.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.15, 8), coatMat);
    cap.position.y = 2.1;
    group.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.15), visorMat);
    visor.position.set(0, 1.92, 0.22);
    group.add(visor);

    // Floating Icon indicator above head
    const iconMat = new THREE.MeshBasicMaterial({
      color: role === 'mission' ? 0x00f0ff : 0xffd700,
      wireframe: true,
    });
    const indicator = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), iconMat);
    indicator.position.y = 2.6;
    indicator.name = 'head_indicator';
    group.add(indicator);

    return group;
  }

  // Scavenger Drone 3D Model (Composite hovering robot)
  private createDroneModel(): THREE.Group {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x485568, metalness: 0.8, roughness: 0.25 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), hullMat);
    core.position.y = 1.5;
    core.castShadow = true;
    group.add(core);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), glowMat);
    eye.position.set(0, 1.5, 0.55);
    group.add(eye);

    // 4 Quad Thruster pods
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 6), hullMat);
      arm.position.set(Math.cos(angle) * 0.75, 1.5, Math.sin(angle) * 0.75);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      group.add(arm);

      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.45, 8), hullMat);
      pod.position.set(Math.cos(angle) * 1.1, 1.5, Math.sin(angle) * 1.1);
      group.add(pod);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.35, 6),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      flame.position.set(Math.cos(angle) * 1.1, 1.15, Math.sin(angle) * 1.1);
      flame.rotation.x = Math.PI;
      group.add(flame);
    }

    return group;
  }

  // Mutated Stalker 3D Model (Quadruped alien beast)
  private createStalkerModel(): THREE.Group {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x6e263c, roughness: 0.7, metalness: 0.2 });
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x2e0f1a, roughness: 0.3, metalness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });

    // Torso / body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.5), skinMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 6), skinMat);
    head.rotateX(Math.PI / 2);
    head.position.set(0, 1.15, 1.05);
    group.add(head);

    // Spines along back
    for (let z = -0.5; z <= 0.5; z += 0.3) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 4), spineMat);
      spine.position.set(0, 1.5, z);
      group.add(spine);
    }

    // 4 Articulated legs
    const legCoords = [
      [-0.45, 0.5], [0.45, 0.5], [-0.45, -0.5], [0.45, -0.5]
    ];
    legCoords.forEach(([lx, lz], idx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.0, 6), skinMat);
      leg.position.set(lx * 1.2, 0.5, lz);
      leg.rotation.z = lx > 0 ? -0.2 : 0.2;
      leg.name = `stalker_leg_${idx}`;
      leg.castShadow = true;
      group.add(leg);
    });

    return group;
  }

  // Security Automaton 3D Model (Heavy combat droid)
  private createAutomatonModel(): THREE.Group {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3f4e5a, metalness: 0.85, roughness: 0.25 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const sensorMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.8), metalMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    group.add(torso);

    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.82), sensorMat);
    eyeSlot.position.set(0, 1.9, 0.02);
    group.add(eyeSlot);

    // Heavy Gatling cannon arm
    const cannon = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), brassMat);
    barrel.rotateX(Math.PI / 2);
    cannon.add(barrel);
    cannon.position.set(0.75, 1.5, 0.4);
    group.add(cannon);

    // Shield arm
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.6), metalMat);
    shield.position.set(-0.75, 1.5, 0.2);
    group.add(shield);

    // Heavy hydraulic legs
    for (let i = -1; i <= 1; i += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.1, 8), metalMat);
      leg.position.set(i * 0.4, 0.55, 0);
      leg.castShadow = true;
      group.add(leg);
    }

    return group;
  }

  // Alien Predator Model
  private createPredatorModel(): THREE.Group {
    const group = new THREE.Group();
    const xenoMat = new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.7, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.5, 7), xenoMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    group.add(torso);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.1), xenoMat);
    crest.position.set(0, 2.4, -0.3);
    crest.rotation.x = -0.4;
    group.add(crest);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.2), glowMat);
    eye.position.set(0, 2.3, 0.25);
    group.add(eye);

    for (let i = -1; i <= 1; i += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.18), xenoMat);
      arm.position.set(i * 0.55, 1.5, 0.2);
      arm.rotation.x = 0.4;
      group.add(arm);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.25), xenoMat);
      leg.position.set(i * 0.3, 0.55, 0);
      leg.castShadow = true;
      group.add(leg);
    }

    return group;
  }

  // Apex Colossus BOSS 3D Model (Towering biomech monolith construct, 2.5x scale)
  private createBossModel(): THREE.Group {
    const group = new THREE.Group();
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x18101e, metalness: 0.75, roughness: 0.25 });
    const crimsonArmorMat = new THREE.MeshStandardMaterial({ color: 0x8a1c32, metalness: 0.85, roughness: 0.2 });
    const corePowerMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Massive Core Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 1.8), obsidianMat);
    chassis.position.y = 3.6;
    chassis.castShadow = true;
    group.add(chassis);

    // Glowing Ancient Core Matrix
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.85), corePowerMat);
    core.position.set(0, 3.8, 0.95);
    core.name = 'boss_core';
    group.add(core);

    // Horned Monolith Crown / Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), obsidianMat);
    head.position.y = 5.8;
    head.castShadow = true;
    group.add(head);

    for (let i = -1; i <= 1; i += 2) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 5), crimsonArmorMat);
      horn.position.set(i * 0.9, 6.8, 0);
      horn.rotation.z = -i * 0.35;
      group.add(horn);
    }

    // Heavy Shoulder Laser Cannons
    for (let i = -1; i <= 1; i += 2) {
      const cannon = new THREE.Group();
      const mount = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.4), obsidianMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 8), crimsonArmorMat);
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0, 0.9);
      cannon.add(mount, barrel);
      cannon.position.set(i * 1.8, 4.8, 0);
      group.add(cannon);
    }

    // Colossal Piston Legs
    for (let i = -1; i <= 1; i += 2) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.5, 1.1), obsidianMat);
      leg.position.set(i * 0.9, 1.25, 0);
      leg.castShadow = true;
      group.add(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.6), crimsonArmorMat);
      foot.position.set(i * 0.9, 0.25, 0.2);
      foot.castShadow = true;
      group.add(foot);
    }

    return group;
  }

  // Ground Target Ring (Concentric pulsing reticle)
  private createTargetRing(): THREE.Group {
    const group = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3344,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const outerRing = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.35, 32), ringMat);
    outerRing.rotateX(-Math.PI / 2);
    group.add(outerRing);

    const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.72, 32), ringMat);
    innerRing.rotateX(-Math.PI / 2);
    group.add(innerRing);

    // Chevron indicators
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.5), ringMat);
      marker.position.set(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5);
      marker.rotation.y = -a;
      group.add(marker);
    }

    group.position.y = 0.05;
    return group;
  }

  // ==========================================
  // SPAWNING
  // ==========================================

  private spawnFriendlyNPCs() {
    FRIENDLY_NPCS.forEach(cfg => {
      const model = this.createFriendlyNPCModel(cfg.role);
      model.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
      // Face towards outpost center
      model.lookAt(0, 0, 0);
      this.friendlyMeshes.set(cfg.id, model);
      this.scene.add(model);
    });
  }

  private spawnWorldEnemies() {
    WORLD_ENEMY_SPAWNS.forEach(spawn => {
      const def = NPC_DEFINITIONS[spawn.defId];
      if (!def) return;

      const instance: EnemyInstance = {
        id: spawn.id,
        defId: spawn.defId,
        definition: def,
        name: def.name,
        isPlayer: false,
        position: { ...spawn.position },
        spawnPoint: { ...spawn.position },
        currentHealth: def.maxHealth,
        maxHealth: def.maxHealth,
        attackRating: def.level * 18,
        defenseRating: def.level * 14,
        armor: def.level * 4,
        critChance: 6,
        attackSpeedMultiplier: 1.0,
        buffs: [],
        isDead: false,
        aiState: 'Idle',
        targetEntityId: null,
        threatTable: new Map(),
        attackCooldown: 0,
        specialAbilityCooldown: 4.0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolTimer: 2.0 + Math.random() * 3.0,
      };

      let mesh: THREE.Group;
      if (def.modelType === 'drone') mesh = this.createDroneModel();
      else if (def.modelType === 'stalker') mesh = this.createStalkerModel();
      else if (def.modelType === 'automaton') mesh = this.createAutomatonModel();
      else if (def.modelType === 'predator') mesh = this.createPredatorModel();
      else mesh = this.createBossModel();

      mesh.position.set(spawn.position.x, spawn.position.y, spawn.position.z);
      this.enemyInstances.set(spawn.id, instance);
      this.enemyMeshes.set(spawn.id, mesh);
      this.scene.add(mesh);
    });
  }

  // ==========================================
  // CONTROLS & MOVEMENT
  // ==========================================

  public setMovementInput(dx: number, dz: number, speed: number = 6.0, dt: number = 0.016) {
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length > 0.05) {
      this.isMoving = true;
      const normalizedLength = Math.min(1.0, length);

      // Rotate input relative to camera's horizontal azimuth
      const angle = Math.atan2(dx, dz) + this.cameraAzimuth;
      const moveX = Math.sin(angle) * speed * normalizedLength;
      const moveZ = Math.cos(angle) * speed * normalizedLength;

      // Exponential damping acceleration
      this.playerPosition.x += moveX * dt;
      this.playerPosition.z += moveZ * dt;

      // Smooth turning towards movement direction
      const targetRotationY = angle;
      const diff = ((targetRotationY - this.playerRotationY + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.playerRotationY += diff * Math.min(1.0, dt * 14);

      this.moveWalkTimer += dt * 10;
    } else {
      this.isMoving = false;
    }

    // Clamp player to world boundary (-130 to 130)
    this.playerPosition.x = Math.max(-125, Math.min(125, this.playerPosition.x));
    this.playerPosition.z = Math.max(-125, Math.min(125, this.playerPosition.z));

    // Update 3D mesh
    this.playerMesh.position.copy(this.playerPosition);
    this.playerMesh.rotation.y = this.playerRotationY;

    // Subtle walk animation (swaying limbs)
    const rightArm = this.playerMesh.getObjectByName('right_arm');
    const leftArm = this.playerMesh.getObjectByName('left_arm');
    const rightLeg = this.playerMesh.getObjectByName('right_leg');
    const leftLeg = this.playerMesh.getObjectByName('left_leg');

    if (this.isMoving) {
      const swing = Math.sin(this.moveWalkTimer) * 0.45;
      if (rightArm) rightArm.rotation.x = -swing;
      if (leftArm) leftArm.rotation.x = swing;
      if (rightLeg) rightLeg.rotation.x = swing;
      if (leftLeg) leftLeg.rotation.x = -swing;
    } else {
      if (rightArm) rightArm.rotation.x = 0;
      if (leftArm) leftArm.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (leftLeg) leftLeg.rotation.x = 0;
    }

    // Notify React HUD
    if (this.onPlayerPositionChanged) {
      this.onPlayerPositionChanged({
        x: this.playerPosition.x,
        y: this.playerPosition.y,
        z: this.playerPosition.z,
      });
    }

    // Check distance to friendly NPCs for interaction prompt
    this.checkNearbyInteractables();
  }

  // Camera Orbit Controls (Azimuth & Polar limits)
  public rotateCamera(deltaX: number, deltaY: number) {
    const sensitivity = 0.005;
    this.cameraAzimuth -= deltaX * sensitivity;
    this.cameraPolar = Math.max(0.12, Math.min(1.35, this.cameraPolar + deltaY * sensitivity));
  }

  public zoomCamera(deltaDistance: number) {
    this.cameraDistance = Math.max(3.5, Math.min(16.0, this.cameraDistance + deltaDistance));
  }

  private updateCamera(dt: number) {
    // Target is player torso
    this.cameraLookTarget.set(
      this.playerPosition.x,
      this.playerPosition.y + 1.5,
      this.playerPosition.z
    );

    // Calculate spherical camera offset
    const cosPolar = Math.cos(this.cameraPolar);
    const sinPolar = Math.sin(this.cameraPolar);
    const sinAzimuth = Math.sin(this.cameraAzimuth);
    const cosAzimuth = Math.cos(this.cameraAzimuth);

    const targetCamX = this.cameraLookTarget.x + this.cameraDistance * cosPolar * sinAzimuth;
    const targetCamY = this.cameraLookTarget.y + this.cameraDistance * sinPolar;
    const targetCamZ = this.cameraLookTarget.z + this.cameraDistance * cosPolar * cosAzimuth;

    // Exponential damping for silky smooth camera glide
    const camLerpSpeed = Math.min(1.0, dt * 15);
    this.camera.position.x += (targetCamX - this.camera.position.x) * camLerpSpeed;
    this.camera.position.y += (targetCamY - this.camera.position.y) * camLerpSpeed;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * camLerpSpeed;

    // Prevent camera dipping below ground
    if (this.camera.position.y < 0.8) {
      this.camera.position.y = 0.8;
    }

    this.camera.lookAt(this.cameraLookTarget);
  }

  // ==========================================
  // TARGETING SYSTEM
  // ==========================================

  public selectTarget(targetId: string | null) {
    this.currentTargetId = targetId;

    if (!targetId) {
      this.targetRing.visible = false;
      if (this.onTargetChanged) this.onTargetChanged(null);
      return;
    }

    const enemy = this.enemyInstances.get(targetId);
    if (enemy && !enemy.isDead) {
      this.targetRing.visible = true;
      const mesh = this.enemyMeshes.get(targetId);
      if (mesh) {
        this.targetRing.position.set(mesh.position.x, 0.05, mesh.position.z);
      }
      if (this.onTargetChanged) this.onTargetChanged(enemy);
      return;
    }

    const friendly = FRIENDLY_NPCS.find(f => f.id === targetId);
    if (friendly) {
      this.targetRing.visible = true;
      this.targetRing.position.set(friendly.position.x, 0.05, friendly.position.z);
      if (this.onTargetChanged) this.onTargetChanged(friendly);
      return;
    }

    this.targetRing.visible = false;
    if (this.onTargetChanged) this.onTargetChanged(null);
  }

  public cycleNextTarget() {
    const aliveEnemies = Array.from(this.enemyInstances.values()).filter(e => !e.isDead);
    if (aliveEnemies.length === 0) return;

    // Sort by distance to player
    aliveEnemies.sort((a, b) => {
      const da = Math.hypot(a.position.x - this.playerPosition.x, a.position.z - this.playerPosition.z);
      const db = Math.hypot(b.position.x - this.playerPosition.x, b.position.z - this.playerPosition.z);
      return da - db;
    });

    const currentIndex = aliveEnemies.findIndex(e => e.id === this.currentTargetId);
    const nextIndex = (currentIndex + 1) % aliveEnemies.length;
    this.selectTarget(aliveEnemies[nextIndex].id);
    soundManager.playUIClick();
  }

  // Tap-to-target via screen Raycast
  public handleScreenTap(screenX: number, screenY: number): boolean {
    const rect = this.container.getBoundingClientRect();
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((screenY - rect.top) / rect.height) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    // Test enemy meshes
    const enemyObjects: THREE.Object3D[] = [];
    this.enemyMeshes.forEach((mesh, id) => {
      const inst = this.enemyInstances.get(id);
      if (inst && !inst.isDead) {
        enemyObjects.push(mesh);
      }
    });

    // Test friendly meshes
    const friendlyObjects: THREE.Object3D[] = Array.from(this.friendlyMeshes.values());

    const intersects = raycaster.intersectObjects([...enemyObjects, ...friendlyObjects], true);
    if (intersects.length > 0) {
      let topHit = intersects[0].object;
      while (topHit.parent && topHit.parent !== this.scene) {
        topHit = topHit.parent;
      }

      // Check which enemy this belongs to
      for (const [id, mesh] of this.enemyMeshes.entries()) {
        if (mesh === topHit) {
          this.selectTarget(id);
          soundManager.playUIClick();
          return true;
        }
      }

      // Check friendly
      for (const [id, mesh] of this.friendlyMeshes.entries()) {
        if (mesh === topHit) {
          this.selectTarget(id);
          soundManager.playUIClick();
          return true;
        }
      }
    }

    return false;
  }

  private checkNearbyInteractables() {
    let nearestFriendly: FriendlyNPCConfig | null = null;
    let minDist = 4.0; // Within 4m interaction radius

    for (const friendly of FRIENDLY_NPCS) {
      const d = Math.hypot(friendly.position.x - this.playerPosition.x, friendly.position.z - this.playerPosition.z);
      if (d < minDist) {
        minDist = d;
        nearestFriendly = friendly;
      }
    }

    if (this.onInteractTargetAvailable) {
      this.onInteractTargetAvailable(nearestFriendly);
    }
  }

  // ==========================================
  // COMBAT VISUALS & PARTICLES
  // ==========================================

  public spawnPlasmaProjectile(
    startPos: { x: number; y: number; z: number },
    targetPos: { x: number; y: number; z: number },
    color: number = 0x00f0ff,
    onHit?: () => void
  ) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    );
    group.add(core, glow);
    group.position.set(startPos.x, startPos.y + 1.4, startPos.z);
    this.scene.add(group);

    const projectile: Projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      mesh: group,
      start: new THREE.Vector3(startPos.x, startPos.y + 1.4, startPos.z),
      target: new THREE.Vector3(targetPos.x, targetPos.y + 1.4, targetPos.z),
      progress: 0,
      speed: 38.0, // meters per second
      color,
      onHit,
    };

    this.projectiles.push(projectile);
  }

  public addFloatingCombatText(
    text: string,
    worldPos: { x: number; y: number; z: number },
    color: string = '#ffffff',
    isCrit: boolean = false
  ) {
    this.floatingTexts.push({
      id: `ftext_${Date.now()}_${Math.random()}`,
      text,
      worldPos: new THREE.Vector3(
        worldPos.x + (Math.random() - 0.5) * 0.4,
        worldPos.y + 2.2,
        worldPos.z + (Math.random() - 0.5) * 0.4
      ),
      color,
      scale: isCrit ? 1.4 : 1.0,
      opacity: 1.0,
      life: 0,
      maxLife: 1.2,
      velocityY: 1.8,
    });
  }

  // ==========================================
  // SIMULATION TICK LOOP
  // ==========================================

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      this.updateSimulation(dt);
      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private updateSimulation(dt: number) {
    // 1. Camera
    this.updateCamera(dt);

    // 2. Animate Target Ring
    if (this.targetRing.visible && this.currentTargetId) {
      const enemy = this.enemyInstances.get(this.currentTargetId);
      if (enemy && !enemy.isDead) {
        this.targetRing.position.set(enemy.position.x, 0.05, enemy.position.z);
        this.targetRing.rotation.y += dt * 2.0;
      } else {
        const friendly = FRIENDLY_NPCS.find(f => f.id === this.currentTargetId);
        if (friendly) {
          this.targetRing.position.set(friendly.position.x, 0.05, friendly.position.z);
          this.targetRing.rotation.y += dt * 1.0;
        } else {
          this.targetRing.visible = false;
        }
      }
    }

    // 3. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dist = p.start.distanceTo(p.target);
      const moveDist = p.speed * dt;
      p.progress += moveDist / Math.max(0.1, dist);

      if (p.progress >= 1.0) {
        this.scene.remove(p.mesh);
        if (p.onHit) p.onHit();
        this.projectiles.splice(i, 1);
      } else {
        p.mesh.position.lerpVectors(p.start, p.target, p.progress);
      }
    }

    // 4. Update Floating Combat Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.worldPos.y += ft.velocityY * dt;
      ft.opacity = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
    if (this.onFloatingTextsUpdated) {
      this.onFloatingTextsUpdated([...this.floatingTexts]);
    }

    // 5. Update NPC & Enemy AI (Patrol, Idle, Chase, Aggro)
    this.updateEnemyAI(dt);

    // 6. Animate Friendly Indicators
    this.friendlyMeshes.forEach(mesh => {
      const ind = mesh.getObjectByName('head_indicator');
      if (ind) {
        ind.rotation.y += dt * 2.5;
        ind.position.y = 2.6 + Math.sin(this.clock.elapsedTime * 3) * 0.12;
      }
    });

    // 7. Animate Boss Core Pulsing
    const bossMesh = this.enemyMeshes.get('spawn_boss');
    if (bossMesh) {
      const core = bossMesh.getObjectByName('boss_core');
      if (core) {
        core.rotation.y += dt * 3.0;
        core.rotation.x += dt * 1.5;
      }
    }
  }

  private updateEnemyAI(dt: number) {
    this.enemyInstances.forEach((enemy, id) => {
      if (enemy.isDead) return;

      const mesh = this.enemyMeshes.get(id);
      if (!mesh) return;

      // Distance to player
      const distToPlayer = Math.hypot(
        this.playerPosition.x - enemy.position.x,
        this.playerPosition.z - enemy.position.z
      );

      // Distance to spawn point (leash)
      const distToSpawn = Math.hypot(
        enemy.spawnPoint.x - enemy.position.x,
        enemy.spawnPoint.z - enemy.position.z
      );

      // Update cooldowns
      if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
      if (enemy.specialAbilityCooldown > 0) enemy.specialAbilityCooldown -= dt;

      // Leash check
      if (distToSpawn > enemy.definition.leashRange) {
        enemy.aiState = 'Return';
        enemy.threatTable.clear();
      }

      // State Machine
      switch (enemy.aiState) {
        case 'Idle':
        case 'Patrol': {
          // Check aggro proximity
          if (distToPlayer <= enemy.definition.aggroRange) {
            enemy.aiState = 'Chase';
            enemy.targetEntityId = 'player';
            enemy.threatTable.set('player', 10);
            break;
          }

          // Gentle ambient patrol around spawn
          enemy.patrolTimer -= dt;
          if (enemy.patrolTimer <= 0) {
            enemy.patrolAngle = Math.random() * Math.PI * 2;
            enemy.patrolTimer = 3.0 + Math.random() * 4.0;
          }

          const patrolTargetX = enemy.spawnPoint.x + Math.cos(enemy.patrolAngle) * (enemy.definition.isBoss ? 4 : 3);
          const patrolTargetZ = enemy.spawnPoint.z + Math.sin(enemy.patrolAngle) * (enemy.definition.isBoss ? 4 : 3);
          const pDist = Math.hypot(patrolTargetX - enemy.position.x, patrolTargetZ - enemy.position.z);

          if (pDist > 0.5) {
            const pAngle = Math.atan2(patrolTargetX - enemy.position.x, patrolTargetZ - enemy.position.z);
            enemy.position.x += Math.sin(pAngle) * 1.5 * dt;
            enemy.position.z += Math.cos(pAngle) * 1.5 * dt;
            mesh.rotation.y = pAngle;
          }
          break;
        }

        case 'Chase': {
          if (distToPlayer <= enemy.definition.attackRange) {
            enemy.aiState = 'Attack';
          } else {
            // Run towards player
            const angle = Math.atan2(this.playerPosition.x - enemy.position.x, this.playerPosition.z - enemy.position.z);
            const speed = enemy.definition.isBoss ? 4.5 : 3.8;
            enemy.position.x += Math.sin(angle) * speed * dt;
            enemy.position.z += Math.cos(angle) * speed * dt;
            mesh.rotation.y = angle;
          }
          break;
        }

        case 'Attack': {
          // Face player
          const angle = Math.atan2(this.playerPosition.x - enemy.position.x, this.playerPosition.z - enemy.position.z);
          mesh.rotation.y = angle;

          if (distToPlayer > enemy.definition.attackRange + 1.0) {
            enemy.aiState = 'Chase';
          }
          break;
        }

        case 'Return': {
          const rDist = Math.hypot(enemy.spawnPoint.x - enemy.position.x, enemy.spawnPoint.z - enemy.position.z);
          if (rDist <= 1.0) {
            enemy.position.x = enemy.spawnPoint.x;
            enemy.position.z = enemy.spawnPoint.z;
            enemy.currentHealth = enemy.maxHealth;
            enemy.aiState = 'Idle';
          } else {
            const rAngle = Math.atan2(enemy.spawnPoint.x - enemy.position.x, enemy.spawnPoint.z - enemy.position.z);
            enemy.position.x += Math.sin(rAngle) * 4.0 * dt;
            enemy.position.z += Math.cos(rAngle) * 4.0 * dt;
            mesh.rotation.y = rAngle;
          }
          break;
        }
      }

      // Sync 3D mesh position
      mesh.position.x = enemy.position.x;
      mesh.position.z = enemy.position.z;

      // Drone hover bobbing
      if (enemy.definition.modelType === 'drone') {
        mesh.position.y = 1.6 + Math.sin(this.clock.elapsedTime * 4 + id.charCodeAt(0)) * 0.25;
      }
    });
  }

  // Handle enemy death
  public setEnemyDead(enemyId: string) {
    const enemy = this.enemyInstances.get(enemyId);
    if (!enemy) return;

    enemy.isDead = true;
    enemy.aiState = 'Dead';

    const mesh = this.enemyMeshes.get(enemyId);
    if (mesh) {
      // Death visual: collapse downward and sink
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = 0.2;
    }

    if (this.currentTargetId === enemyId) {
      this.selectTarget(null);
    }

    // Respawn after 20 seconds (or 35s for boss)
    const respawnTime = enemy.definition.isBoss ? 35000 : 20000;
    setTimeout(() => {
      this.respawnEnemy(enemyId);
    }, respawnTime);
  }

  public respawnEnemy(enemyId: string) {
    const enemy = this.enemyInstances.get(enemyId);
    const mesh = this.enemyMeshes.get(enemyId);
    if (!enemy || !mesh) return;

    enemy.isDead = false;
    enemy.currentHealth = enemy.maxHealth;
    enemy.position = { ...enemy.spawnPoint };
    enemy.aiState = 'Idle';
    enemy.threatTable.clear();

    mesh.rotation.x = 0;
    mesh.position.set(enemy.spawnPoint.x, 0, enemy.spawnPoint.z);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    try {
      this.renderer.dispose();
      this.container.innerHTML = '';
    } catch {
      // Ignore teardown errors
    }
  }
}
