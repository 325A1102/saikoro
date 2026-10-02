import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiceSkin } from '../types/game';
import { Dice3D } from './Dice3D';
import { sound } from '../utils/audio';
import { Sparkles, Move, Play, RefreshCw, Compass, Hand } from 'lucide-react';

interface InteractiveDiceTableProps {
  value: number; // Current value 1-6
  isRolling: boolean;
  canRoll: boolean;
  skin: DiceSkin;
  onRollStart: () => void;
  onRollComplete: (finalValue: number) => void;
  isCpuTurn: boolean;
}

type MouseMode = 'spin' | 'flick'; // spin: mouse cursor spins the dice freely; flick: dragging throws the dice

export const InteractiveDiceTable: React.FC<InteractiveDiceTableProps> = ({
  value,
  isRolling,
  canRoll,
  skin,
  onRollStart,
  onRollComplete,
  isCpuTurn,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Position on table relative to center (0, 0)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });

  // 3D rotation angles in degrees
  const [rotation, setRotation] = useState({ x: -20, y: 30, z: 0 });
  const rotationRef = useRef({ x: -20, y: 30, z: 0 });

  // Cursor hover tilt offset
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });

  // Mode: 'spin' (rotate freely with cursor) vs 'flick' (flick to toss)
  const [mouseMode, setMouseMode] = useState<MouseMode>('spin');

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Cup shake state
  const [isCupShaking, setIsCupShaking] = useState(false);

  // Active physics flag
  const physicsActiveRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const safetyTimeoutRef = useRef<number | null>(null);

  // Drag tracking refs
  const dragStartRef = useRef<{ clientX: number; clientY: number; time: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastShakeAudioTime = useRef<number>(0);

  // Spin inertia animation
  const inertiaFrameRef = useRef<number | null>(null);

  // Sync state and refs
  const updatePos = (newPos: { x: number; y: number }) => {
    posRef.current = newPos;
    setPos(newPos);
  };

  const updateRotation = (newRot: { x: number; y: number; z: number }) => {
    rotationRef.current = newRot;
    setRotation(newRot);
  };

  // Canonical angles for dice faces
  const getTargetFaceAngles = (val: number) => {
    switch (val) {
      case 1:
        return { x: 0, y: 0, z: 0 };
      case 6:
        return { x: 180, y: 0, z: 0 };
      case 2:
        return { x: 0, y: -90, z: 0 };
      case 5:
        return { x: 0, y: 90, z: 0 };
      case 3:
        return { x: -90, y: 0, z: 0 };
      case 4:
        return { x: 90, y: 0, z: 0 };
      default:
        return { x: -20, y: 30, z: 0 };
    }
  };

  // When value changes from external game logic and not rolling, orient face forward
  useEffect(() => {
    if (!isRolling && !physicsActiveRef.current && !isDraggingRef.current) {
      const canonical = getTargetFaceAngles(value);
      updateRotation(canonical);
    }
  }, [value, isRolling]);

  // Complete roll cleanly
  const finishRoll = useCallback(
    (finalFace: number, canonicalAngles: { x: number; y: number; z: number }) => {
      physicsActiveRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }

      // Smooth landing at table center
      updatePos({ x: 0, y: 0 });
      updateRotation(canonicalAngles);
      setHoverOffset({ x: 0, y: 0 });

      sound.playDiceLand(finalFace);
      onRollComplete(finalFace);
    },
    [onRollComplete]
  );

  // Launch throw physics simulation (deterministic duration with realistic bounce)
  const launchPhysics = useCallback(
    (initialVx: number, initialVy: number, targetFace: number) => {
      if (physicsActiveRef.current) return;
      physicsActiveRef.current = true;

      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
      }

      onRollStart();
      sound.playWhoosh();
      sound.playDiceRoll();

      // Clamp initial velocities
      const speed = Math.sqrt(initialVx * initialVx + initialVy * initialVy);
      const cappedSpeed = Math.min(26, Math.max(9, speed));
      const factor = cappedSpeed / (speed || 1);
      let curVx = initialVx * factor;
      let curVy = initialVy * factor;

      let curX = posRef.current.x;
      let curY = posRef.current.y;
      let curRotX = rotationRef.current.x;
      let curRotY = rotationRef.current.y;
      let curRotZ = rotationRef.current.z;

      let omegaX = curVy * 1.6 + (Math.random() - 0.5) * 8;
      let omegaY = -curVx * 1.6 + (Math.random() - 0.5) * 8;
      let omegaZ = (Math.random() - 0.5) * 12;

      const canonical = getTargetFaceAngles(targetFace);
      // Nearest 360 multiples for smooth settle
      const targetRotX = canonical.x + Math.round((curRotX - canonical.x) / 360) * 360;
      const targetRotY = canonical.y + Math.round((curRotY - canonical.y) / 360) * 360;
      const targetRotZ = 0;

      const tableRect = tableRef.current?.getBoundingClientRect();
      const boundX = tableRect ? Math.max(80, (tableRect.width - 120) / 2) : 180;
      const boundY = tableRect ? Math.max(60, (tableRect.height - 120) / 2) : 80;

      const duration = 850; // Total roll duration in ms
      const startTime = performance.now();
      let lastBounceTime = 0;

      // Fail-safe timeout
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = window.setTimeout(() => {
        if (physicsActiveRef.current) {
          finishRoll(targetFace, { x: targetRotX, y: targetRotY, z: targetRotZ });
        }
      }, duration + 200);

      const loop = (currentTime: number) => {
        if (!physicsActiveRef.current) return;

        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 0.65) {
          // Free tumble phase with wall bounces
          curX += curVx;
          curY += curVy;

          // Wall bounce X
          if (curX > boundX) {
            curX = boundX;
            curVx = -Math.abs(curVx) * 0.7;
            omegaY = -omegaY * 0.8;
            const now = Date.now();
            if (now - lastBounceTime > 120) {
              sound.playBounce();
              lastBounceTime = now;
            }
          } else if (curX < -boundX) {
            curX = -boundX;
            curVx = Math.abs(curVx) * 0.7;
            omegaY = -omegaY * 0.8;
            const now = Date.now();
            if (now - lastBounceTime > 120) {
              sound.playBounce();
              lastBounceTime = now;
            }
          }

          // Wall bounce Y
          if (curY > boundY) {
            curY = boundY;
            curVy = -Math.abs(curVy) * 0.7;
            omegaX = -omegaX * 0.8;
            const now = Date.now();
            if (now - lastBounceTime > 120) {
              sound.playBounce();
              lastBounceTime = now;
            }
          } else if (curY < -boundY) {
            curY = -boundY;
            curVy = Math.abs(curVy) * 0.7;
            omegaX = -omegaX * 0.8;
            const now = Date.now();
            if (now - lastBounceTime > 120) {
              sound.playBounce();
              lastBounceTime = now;
            }
          }

          curRotX += omegaX;
          curRotY += omegaY;
          curRotZ += omegaZ;

          // Friction damping
          curVx *= 0.94;
          curVy *= 0.94;
          omegaX *= 0.94;
          omegaY *= 0.94;
          omegaZ *= 0.94;

          updatePos({ x: curX, y: curY });
          updateRotation({ x: curRotX, y: curRotY, z: curRotZ });
        } else {
          // Settling phase (progress 0.65 -> 1.0)
          const settleProgress = (progress - 0.65) / 0.35;
          const ease = 1 - Math.pow(1 - settleProgress, 3);

          curX *= 0.88;
          curY *= 0.88;

          const settleRotX = curRotX + (targetRotX - curRotX) * ease;
          const settleRotY = curRotY + (targetRotY - curRotY) * ease;
          const settleRotZ = curRotZ + (targetRotZ - curRotZ) * ease;

          updatePos({ x: curX, y: curY });
          updateRotation({ x: settleRotX, y: settleRotY, z: settleRotZ });
        }

        if (progress >= 1) {
          finishRoll(targetFace, { x: targetRotX, y: targetRotY, z: targetRotZ });
          return;
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    },
    [onRollStart, finishRoll]
  );

  // When isRolling becomes true from external trigger (button or CPU), launch if not already rolling
  useEffect(() => {
    if (isRolling && !physicsActiveRef.current) {
      const targetFace = Math.floor(Math.random() * 6) + 1;
      const angle = Math.random() * Math.PI * 2;
      const force = 14 + Math.random() * 6;
      launchPhysics(Math.cos(angle) * force, Math.sin(angle) * force, targetFace);
    }
  }, [isRolling, launchPhysics]);

  // Mouse move over table (hover tilt tracking + drag rotation)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (physicsActiveRef.current) return;

    const tableRect = tableRef.current?.getBoundingClientRect();
    if (!tableRect) return;

    if (!isDraggingRef.current) {
      // Hover mode: tilt smoothly based on mouse cursor position
      const relX = (e.clientX - (tableRect.left + tableRect.width / 2)) / (tableRect.width / 2);
      const relY = (e.clientY - (tableRect.top + tableRect.height / 2)) / (tableRect.height / 2);

      // Clamped tilt angles
      const tiltX = -Math.max(-1, Math.min(1, relY)) * 28;
      const tiltY = Math.max(-1, Math.min(1, relX)) * 28;
      setHoverOffset({ x: tiltX, y: tiltY });
      return;
    }

    // Dragging mode
    if (!lastPointerRef.current) return;

    const now = Date.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;

    velocityRef.current = {
      vx: (dx / dt) * 16,
      vy: (dy / dt) * 16,
    };

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

    // Play subtle rattle while revolving with mouse cursor
    if (now - lastShakeAudioTime.current > 120 && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      sound.playShake();
      lastShakeAudioTime.current = now;
    }

    // Direct 3D spin following mouse drag (X and Y axes)
    updateRotation({
      x: rotationRef.current.x - dy * 1.1,
      y: rotationRef.current.y + dx * 1.1,
      z: rotationRef.current.z + (dx - dy) * 0.1,
    });

    if (mouseMode === 'flick') {
      const boundX = (tableRect.width - 120) / 2;
      const boundY = (tableRect.height - 120) / 2;
      updatePos({
        x: Math.max(-boundX, Math.min(boundX, posRef.current.x + dx * 0.35)),
        y: Math.max(-boundY, Math.min(boundY, posRef.current.y + dy * 0.35)),
      });
    }
  };

  // Pointer Down (Mouse press)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRolling || physicsActiveRef.current || isCpuTurn) return;

    if (inertiaFrameRef.current) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }

    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY, time: Date.now() };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    velocityRef.current = { vx: 0, vy: 0 };
    setHoverOffset({ x: 0, y: 0 });
    sound.playShake();
  };

  // Pointer Up (Mouse release)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;

    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    const { vx, vy } = velocityRef.current;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (mouseMode === 'flick' && canRoll && speed > 2.8) {
      // Flick Throw mode
      const targetFace = Math.floor(Math.random() * 6) + 1;
      launchPhysics(vx * 1.2, vy * 1.2, targetFace);
    } else {
      // Free Spin mode: continue spinning with inertia!
      if (speed > 1.5) {
        let inertiaVx = -vy * 0.8;
        let inertiaVy = vx * 0.8;

        const inertiaLoop = () => {
          if (isDraggingRef.current || physicsActiveRef.current) return;

          updateRotation({
            x: rotationRef.current.x + inertiaVx,
            y: rotationRef.current.y + inertiaVy,
            z: rotationRef.current.z,
          });

          inertiaVx *= 0.95;
          inertiaVy *= 0.95;

          if (Math.abs(inertiaVx) > 0.05 || Math.abs(inertiaVy) > 0.05) {
            inertiaFrameRef.current = requestAnimationFrame(inertiaLoop);
          } else {
            inertiaFrameRef.current = null;
          }
        };

        if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = requestAnimationFrame(inertiaLoop);
      }
    }
  };

  // Mouse wheel scroll to spin dice along X/Y
  const handleWheel = (e: React.WheelEvent) => {
    if (physicsActiveRef.current || isRolling) return;
    e.preventDefault();

    sound.playShake();
    updateRotation({
      x: rotationRef.current.x + e.deltaY * 0.35,
      y: rotationRef.current.y + (e.shiftKey ? e.deltaY * 0.35 : 0),
      z: rotationRef.current.z,
    });
  };

  // Quick Spin Preset Action (spin full 360 with sound)
  const handleQuickSpin = (axis: 'x' | 'y') => {
    if (physicsActiveRef.current || isRolling) return;
    sound.playShake();

    const targetRotX = axis === 'x' ? rotationRef.current.x + 360 : rotationRef.current.x;
    const targetRotY = axis === 'y' ? rotationRef.current.y + 360 : rotationRef.current.y;
    const startX = rotationRef.current.x;
    const startY = rotationRef.current.y;
    const startTime = performance.now();
    const duration = 400;

    const spinStep = (t: number) => {
      const elapsed = t - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      updateRotation({
        x: startX + (targetRotX - startX) * ease,
        y: startY + (targetRotY - startY) * ease,
        z: rotationRef.current.z,
      });

      if (progress < 1) {
        requestAnimationFrame(spinStep);
      }
    };

    requestAnimationFrame(spinStep);
  };

  // Leather Cup Shake
  const handleCupShake = () => {
    if (!canRoll || isRolling || isCupShaking || isCpuTurn || physicsActiveRef.current) return;
    setIsCupShaking(true);
    sound.playShake();

    let count = 0;
    const timer = window.setInterval(() => {
      count++;
      sound.playShake();
      updateRotation({
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360,
      });

      if (count >= 3) {
        clearInterval(timer);
        setIsCupShaking(false);
        const targetFace = Math.floor(Math.random() * 6) + 1;
        launchPhysics(
          (Math.random() - 0.5) * 18,
          8 + Math.random() * 8,
          targetFace
        );
      }
    }, 110);
  };

  // Combined rotation (base rotation + hover tilt offset)
  const displayRotation = {
    x: rotation.x + (isDragging ? 0 : hoverOffset.x),
    y: rotation.y + (isDragging ? 0 : hoverOffset.y),
    z: rotation.z,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-2">
      {/* Mode Controls Bar above table */}
      <div className="w-full flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMouseMode('spin');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mouseMode === 'spin'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🖱️ マウスで回す</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMouseMode('flick');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mouseMode === 'flick'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>🎯 スワイプで投げる</span>
          </button>
        </div>

        {/* Quick Spin Shortcut Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickSpin('y')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold cursor-pointer transition-colors"
            title="左右に360度スピン"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>横回転</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickSpin('x')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold cursor-pointer transition-colors"
            title="上下に360度スピン"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>縦回転</span>
          </button>
        </div>
      </div>

      {/* Felt Rolling Arena */}
      <div
        ref={tableRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoverOffset({ x: 0, y: 0 })}
        onDoubleClick={() => {
          if (canRoll && !isRolling && !isCpuTurn) {
            const target = Math.floor(Math.random() * 6) + 1;
            const angle = Math.random() * Math.PI * 2;
            const force = 14 + Math.random() * 6;
            launchPhysics(Math.cos(angle) * force, Math.sin(angle) * force, target);
          }
        }}
        className={`relative w-full min-h-[260px] sm:min-h-[300px] rounded-3xl bg-gradient-to-b from-emerald-950/80 via-stone-900 to-stone-950 border border-emerald-800/50 p-6 flex flex-col items-center justify-center select-none shadow-[inset_0_2px_30px_rgba(6,78,59,0.4)] overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Felt Table Ring / Boundary Border */}
        <div className="absolute inset-2 border border-emerald-500/15 rounded-2xl pointer-events-none" />

        {/* Interactive Guidance Badge */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs pointer-events-none z-20">
          <div className="flex items-center gap-1.5 text-emerald-300/90 font-semibold bg-stone-950/70 border border-emerald-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {isDragging
                ? mouseMode === 'spin'
                  ? 'マウスドラッグでぐるぐる回転中！離すと慣性スピン！'
                  : 'スワイプ中！素早く離すと投球！'
                : isRolling
                ? 'サイコロが転がっています…！'
                : mouseMode === 'spin'
                ? 'カーソルを動かすと傾き、ドラッグやホイールで360度回せます！'
                : 'サイコロをつかんでスワイプ投球できます！'}
            </span>
          </div>

          {/* Quick Cup Shake Button */}
          {canRoll && !isCpuTurn && !isRolling && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCupShake();
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCupShaking ? 'animate-spin' : ''}`} />
              <span>カップで振る</span>
            </button>
          )}
        </div>

        {/* 3D Dice Object in Table Space */}
        <div
          className="relative z-10"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          }}
        >
          <Dice3D
            value={value}
            isRolling={isRolling}
            isDragging={isDragging}
            size="xl"
            skin={skin}
            rotationOffset={displayRotation}
            className={`${
              isDragging
                ? 'scale-110 drop-shadow-[0_15px_25px_rgba(245,158,11,0.4)]'
                : isCupShaking
                ? 'animate-bounce'
                : ''
            } transition-transform`}
          />
        </div>

        {/* Bottom Hint and Quick Roll Button */}
        <div className="absolute bottom-3 flex items-center gap-3 text-xs font-mono text-stone-400 z-20">
          <span className="flex items-center gap-1.5 bg-stone-950/70 px-3 py-1 rounded-full border border-stone-800">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>出目: 【 {value} 】</span>
          </span>

          {canRoll && !isCpuTurn && !isRolling && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const target = Math.floor(Math.random() * 6) + 1;
                const angle = Math.random() * Math.PI * 2;
                const force = 14 + Math.random() * 6;
                launchPhysics(Math.cos(angle) * force, Math.sin(angle) * force, target);
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/50 text-emerald-200 font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-950/40"
            >
              <Play className="w-3 h-3 fill-current text-emerald-400" />
              <span>🎲 投げる（ROLL）</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
