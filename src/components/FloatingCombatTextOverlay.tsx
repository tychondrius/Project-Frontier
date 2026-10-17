/**
 * Project Frontier - Floating Combat Text Screen Overlay
 * Converts 3D world combat events into screen-space floating damage/healing numbers
 */

import React from 'react';
import * as THREE from 'three';
import { FloatingText } from '../game/engine.ts';

interface FloatingCombatTextOverlayProps {
  texts: FloatingText[];
  camera: THREE.Camera | null;
}

export const FloatingCombatTextOverlay: React.FC<FloatingCombatTextOverlayProps> = ({
  texts,
  camera,
}) => {
  if (!camera || texts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30 select-none">
      {texts.map(ft => {
        const v = ft.worldPos.clone().project(camera);
        if (v.z >= 1.0) return null; // Behind camera

        const screenX = (v.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-v.y * 0.5 + 0.5) * window.innerHeight;

        return (
          <div
            key={ft.id}
            className="absolute font-black text-sm tracking-wide pointer-events-none transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              color: ft.color,
              opacity: ft.opacity,
              transform: `translate(-50%, -50%) scale(${ft.scale})`,
            }}
          >
            {ft.text}
          </div>
        );
      })}
    </div>
  );
};
