import React, { useMemo } from 'react';
import { DiceSkin } from '../types/game';

interface Dice3DProps {
  value: number; // 1 to 6 (or 0 for unrolled/idle)
  isRolling?: boolean;
  isDragging?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  skin?: DiceSkin;
  rotationOffset?: { x: number; y: number; z: number };
  className?: string;
  onClick?: () => void;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling = false,
  isDragging = false,
  size = 'lg',
  skin = 'classic',
  rotationOffset,
  className = '',
  onClick,
}) => {
  // Dimensions based on size
  const dim = useMemo(() => {
    switch (size) {
      case 'sm':
        return { sizePx: 44, halfPx: 22, pipSize: 'w-2 h-2', radius: 'rounded-md' };
      case 'md':
        return { sizePx: 68, halfPx: 34, pipSize: 'w-3 h-3', radius: 'rounded-xl' };
      case 'xl':
        return { sizePx: 120, halfPx: 60, pipSize: 'w-5 h-5', radius: 'rounded-2xl' };
      case 'lg':
      default:
        return { sizePx: 96, halfPx: 48, pipSize: 'w-4 h-4', radius: 'rounded-2xl' };
    }
  }, [size]);

  // Skin themes
  const theme = useMemo(() => {
    switch (skin) {
      case 'crimson':
        return {
          faceBg: 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border border-red-500/40 shadow-inner',
          pipColor: 'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]',
          pipOneColor: 'bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,1)]',
          sheen: 'from-white/20 via-transparent to-black/30',
        };
      case 'obsidian':
        return {
          faceBg: 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-zinc-700 shadow-inner',
          pipColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]',
          pipOneColor: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]',
          sheen: 'from-cyan-400/10 via-transparent to-black/40',
        };
      case 'golden':
        return {
          faceBg: 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-yellow-200/80 shadow-inner',
          pipColor: 'bg-rose-900 shadow-[0_1px_2px_rgba(0,0,0,0.5)]',
          pipOneColor: 'bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.8)]',
          sheen: 'from-white/50 via-transparent to-amber-900/30',
        };
      case 'classic':
      default:
        return {
          faceBg: 'bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 border border-stone-300 shadow-inner',
          pipColor: 'bg-stone-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]',
          pipOneColor: 'bg-rose-600 shadow-[inset_0_1px_2px_rgba(159,18,57,0.6)]',
          sheen: 'from-white/80 via-transparent to-stone-400/20',
        };
    }
  }, [skin]);

  // Rotations for 1-6 pointing forward to camera
  const targetAngles = useMemo(() => {
    switch (value) {
      case 1:
        return { x: 0, y: 0 };
      case 6:
        return { x: 180, y: 0 };
      case 2:
        return { x: 0, y: -90 };
      case 5:
        return { x: 0, y: 90 };
      case 3:
        return { x: -90, y: 0 };
      case 4:
        return { x: 90, y: 0 };
      default:
        // Idle perspective tilt
        return { x: -25, y: 35 };
    }
  }, [value]);

  const currentRot = rotationOffset ?? { x: targetAngles.x, y: targetAngles.y, z: 0 };

  const transformStyle: React.CSSProperties = {
    transform: `rotateX(${currentRot.x}deg) rotateY(${currentRot.y}deg) rotateZ(${currentRot.z}deg)`,
    transition: isRolling
      ? 'transform 0.08s linear'
      : isDragging
      ? 'none'
      : 'transform 0.12s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    transformStyle: 'preserve-3d',
    width: `${dim.sizePx}px`,
    height: `${dim.sizePx}px`,
  };

  // Render authentic pips for face
  const renderPips = (faceNum: number) => {
    const isOne = faceNum === 1;
    const pipStyle = isOne ? theme.pipOneColor : theme.pipColor;

    return (
      <div className="w-full h-full p-2 grid grid-cols-3 grid-rows-3 relative">
        {/* Face 1 */}
        {faceNum === 1 && (
          <div className="col-start-2 row-start-2 flex items-center justify-center">
            <span
              className={`${dim.pipSize} rounded-full ${pipStyle} transform scale-150 transition-transform`}
            />
          </div>
        )}

        {/* Face 2 */}
        {faceNum === 2 && (
          <>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
          </>
        )}

        {/* Face 3 */}
        {faceNum === 3 && (
          <>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-2 row-start-2 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
          </>
        )}

        {/* Face 4 */}
        {faceNum === 4 && (
          <>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-1 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
          </>
        )}

        {/* Face 5 */}
        {faceNum === 5 && (
          <>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-2 row-start-2 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-1 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
          </>
        )}

        {/* Face 6 */}
        {faceNum === 6 && (
          <>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-1 row-start-2 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-2 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-1 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
            <div className="col-start-3 row-start-3 flex items-center justify-center">
              <span className={`${dim.pipSize} rounded-full ${pipStyle}`} />
            </div>
          </>
        )}
      </div>
    );
  };

  const faceBaseStyle = `absolute inset-0 select-none backface-visible ${dim.radius} ${theme.faceBg} overflow-hidden flex items-center justify-center`;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer group ${className}`}
      style={{
        perspective: '1000px',
        width: `${dim.sizePx + 24}px`,
        height: `${dim.sizePx + 28}px`,
      }}
    >
      {/* Dynamic Drop Shadow below */}
      <div
        className={`absolute bottom-0 w-3/4 h-3 bg-black/40 rounded-full blur-md transition-all duration-300 ${
          isRolling ? 'scale-75 opacity-30 translate-y-2' : 'scale-100 opacity-60'
        }`}
      />

      {/* 3D Cube Container */}
      <div
        className={`relative ${isRolling ? 'animate-bounce' : 'transition-transform duration-300'}`}
        style={transformStyle}
      >
        {/* Face 1: Front */}
        <div
          className={faceBaseStyle}
          style={{ transform: `translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(1)}
        </div>

        {/* Face 6: Back */}
        <div
          className={faceBaseStyle}
          style={{ transform: `rotateY(180deg) translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(6)}
        </div>

        {/* Face 2: Right */}
        <div
          className={faceBaseStyle}
          style={{ transform: `rotateY(90deg) translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(2)}
        </div>

        {/* Face 5: Left */}
        <div
          className={faceBaseStyle}
          style={{ transform: `rotateY(-90deg) translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(5)}
        </div>

        {/* Face 3: Top */}
        <div
          className={faceBaseStyle}
          style={{ transform: `rotateX(90deg) translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(3)}
        </div>

        {/* Face 4: Bottom */}
        <div
          className={faceBaseStyle}
          style={{ transform: `rotateX(-90deg) translateZ(${dim.halfPx}px)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.sheen} pointer-events-none`} />
          {renderPips(4)}
        </div>
      </div>
    </div>
  );
};
