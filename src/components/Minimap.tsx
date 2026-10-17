/**
 * Project Frontier - High-Tech Tactical Minimap / Radar
 */

import React, { useEffect, useRef } from 'react';
import { FRIENDLY_NPCS, WORLD_ENEMY_SPAWNS } from '../game/worldData.ts';
import { EnemyInstance } from '../game/combat.ts';

interface MinimapProps {
  playerPos: { x: number; y: number; z: number };
  playerHeading: number;
  enemies: Map<string, EnemyInstance>;
  onToggleExpand?: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos,
  playerHeading,
  enemies,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radarRadius = width / 2 - 2;
    const radarScale = 1.35; // Pixels per meter

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Radar background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.stroke();
    ctx.clip();

    // Range rings
    [20, 40, 60].forEach(r => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * radarScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.stroke();

    // Outpost Center Marker (at 0, 0)
    const outpostRelX = (0 - playerPos.x) * radarScale;
    const outpostRelZ = (0 - playerPos.z) * radarScale;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX + outpostRelX, centerY - outpostRelZ, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Friendly NPCs (green)
    FRIENDLY_NPCS.forEach(npc => {
      const relX = (npc.position.x - playerPos.x) * radarScale;
      const relZ = (npc.position.z - playerPos.z) * radarScale;
      if (Math.hypot(relX, relZ) <= radarRadius) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(centerX + relX, centerY - relZ, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Enemies (red/crimson)
    enemies.forEach(enemy => {
      if (enemy.isDead) return;
      const relX = (enemy.position.x - playerPos.x) * radarScale;
      const relZ = (enemy.position.z - playerPos.z) * radarScale;
      if (Math.hypot(relX, relZ) <= radarRadius) {
        ctx.fillStyle = enemy.definition.isBoss ? '#ff0055' : '#ef4444';
        ctx.beginPath();
        const dotSize = enemy.definition.isBoss ? 5 : 2.5;
        ctx.arc(centerX + relX, centerY - relZ, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player arrow in center
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(playerHeading);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }, [playerPos, playerHeading, enemies]);

  return (
    <div className="relative w-20 h-20 rounded-full border border-cyan-500/25 shadow-lg overflow-hidden bg-slate-950/80 pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        className="w-full h-full block"
      />
      <div className="absolute top-1 left-2 text-[6.5px] font-black text-cyan-400/80 font-mono tracking-tighter">
        RADAR
      </div>
    </div>
  );
};
