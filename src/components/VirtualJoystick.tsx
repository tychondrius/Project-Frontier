/**
 * Project Frontier - Mobile Virtual Touch Joystick
 * Refined bottom-left placement, low visual clutter, isolated movement zone
 */

import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (dx: number, dz: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchActive, setTouchActive] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeVector = useRef<{ dx: number; dz: number }>({ dx: 0, dz: 0 });
  const touchIdRef = useRef<number | null>(null);

  // Keyboard WASD tracking for desktop
  const keysDown = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;
      keysDown.current[e.key.toLowerCase()] = true;
      updateKeyboardVector();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = false;
      updateKeyboardVector();
    };

    const updateKeyboardVector = () => {
      if (touchIdRef.current !== null) return;
      let kx = 0;
      let kz = 0;
      if (keysDown.current['w'] || keysDown.current['arrowup']) kz += 1;
      if (keysDown.current['s'] || keysDown.current['arrowdown']) kz -= 1;
      if (keysDown.current['a'] || keysDown.current['arrowleft']) kx -= 1;
      if (keysDown.current['d'] || keysDown.current['arrowright']) kx += 1;

      const len = Math.hypot(kx, kz);
      if (len > 0) {
        activeVector.current = { dx: kx / len, dz: kz / len };
        onMove(activeVector.current.dx, activeVector.current.dz);
      } else {
        activeVector.current = { dx: 0, dz: 0 };
        onMove(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setOrigin({ x: touch.clientX, y: touch.clientY });
    setKnobPos({ x: 0, y: 0 });
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current === null || !origin) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const rawDx = touch.clientX - origin.x;
        const rawDy = touch.clientY - origin.y;
        const maxDist = 38; // Radius in px

        const dist = Math.hypot(rawDx, rawDy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(rawDy, rawDx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        setKnobPos({ x: knobX, y: knobY });

        const normalizedDx = knobX / maxDist;
        const normalizedDz = -knobY / maxDist;
        activeVector.current = { dx: normalizedDx, dz: normalizedDz };
        onMove(normalizedDx, normalizedDz);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setTouchActive(false);
        setKnobPos({ x: 0, y: 0 });
        setOrigin(null);
        activeVector.current = { dx: 0, dz: 0 };
        onMove(0, 0);
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="absolute w-28 h-28 rounded-full flex items-center justify-center pointer-events-auto touch-none select-none z-20"
      style={{
        left: 'max(0.6rem, env(safe-area-inset-left, 0.6rem))',
        bottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))',
        background: 'radial-gradient(circle, rgba(15,23,42,0.55) 0%, rgba(30,41,59,0.2) 75%, rgba(0,240,255,0.08) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.22)',
        boxShadow: '0 0 10px rgba(0, 240, 255, 0.08)',
      }}
      aria-label="Movement Virtual Joystick"
      role="region"
    >
      {/* Outer directional ticks */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-0.5 h-2 bg-cyan-400 absolute top-1.5 rounded-full" />
        <div className="w-0.5 h-2 bg-cyan-400 absolute bottom-1.5 rounded-full" />
        <div className="h-0.5 w-2 bg-cyan-400 absolute left-1.5 rounded-full" />
        <div className="h-0.5 w-2 bg-cyan-400 absolute right-1.5 rounded-full" />
      </div>

      {/* Floating analog thumb knob */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          background: touchActive
            ? 'linear-gradient(135deg, rgba(0,240,255,0.9) 0%, rgba(2,132,199,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(56,189,248,0.5) 0%, rgba(14,116,144,0.5) 100%)',
          boxShadow: touchActive ? '0 0 12px #00f0ff' : '0 0 6px rgba(0,240,255,0.2)',
          border: '1.5px solid rgba(255,255,255,0.6)',
        }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
      </div>
    </div>
  );
};
