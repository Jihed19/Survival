import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Zap, Sparkles, Target, Crosshair, RotateCcw } from 'lucide-react';
import { CollectibleItem } from '../types/game';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onCameraRotate: (deltaX: number, deltaY: number) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSprintToggle: (sprinting: boolean) => void;
  onAimToggle: (aiming: boolean) => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  onReload: () => void;
  onInteract: () => void;
  nearbyItem: CollectibleItem | null;
  isSprinting: boolean;
  isAiming: boolean;
  ammo: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onCameraRotate,
  onJumpStart,
  onJumpEnd,
  onSprintToggle,
  onAimToggle,
  onShootStart,
  onShootEnd,
  onReload,
  onInteract,
  nearbyItem,
  isSprinting,
  isAiming,
  ammo,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });

  // Camera look swipe
  const cameraTouchId = useRef<number | null>(null);
  const lastCameraTouchPos = useRef({ x: 0, y: 0 });

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: TouchEvent) => {
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: TouchEvent) => {
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const maxRadius = 45;
    const dx = clientX - joystickCenter.current.x;
    const dy = clientY - joystickCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let stickX = dx;
    let stickY = dy;

    if (dist > maxRadius) {
      stickX = (dx / dist) * maxRadius;
      stickY = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: stickX, y: stickY });
    onJoystickMove(stickX / maxRadius, -(stickY / maxRadius));
  };

  // Camera swipe
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    if (cameraTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    cameraTouchId.current = touch.identifier;
    lastCameraTouchPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCameraTouchMove = (e: TouchEvent) => {
    if (cameraTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchId.current) {
        const deltaX = touch.clientX - lastCameraTouchPos.current.x;
        const deltaY = touch.clientY - lastCameraTouchPos.current.y;
        lastCameraTouchPos.current = { x: touch.clientX, y: touch.clientY };
        onCameraRotate(deltaX, deltaY);
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: TouchEvent) => {
    if (cameraTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchId.current) {
        cameraTouchId.current = null;
        break;
      }
    }
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      handleJoystickTouchMove(e);
      handleCameraTouchMove(e);
    };
    const onTouchEnd = (e: TouchEvent) => {
      handleJoystickTouchEnd(e);
      handleCameraTouchEnd(e);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* RIGHT SIDE CAMERA SWIPE SURFACE */}
      <div
        className="absolute top-16 right-0 bottom-24 w-1/2 pointer-events-auto touch-none"
        onTouchStart={handleCameraTouchStart}
      />

      {/* LEFT SIDE FLOATING JOYSTICK */}
      <div className="absolute bottom-6 left-6 pointer-events-auto touch-none">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors flex items-center justify-center relative shadow-2xl ${
            isJoystickActive
              ? 'border-cyan-400 bg-cyan-950/40 backdrop-blur-sm'
              : 'border-slate-700/60 bg-slate-950/40'
          }`}
        >
          <div className="w-14 h-[1px] bg-slate-500/40 absolute"></div>
          <div className="h-14 w-[1px] bg-slate-500/40 absolute"></div>

          <div
            className={`w-12 h-12 rounded-full border-2 transition-transform duration-75 flex items-center justify-center shadow-lg ${
              isJoystickActive
                ? 'border-cyan-300 bg-cyan-500/80 shadow-cyan-500/50'
                : 'border-slate-500 bg-slate-800/80'
            }`}
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/80"></div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE COD MOBILE STYLE TACTICAL ACTION CLUSTER */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex flex-col items-end gap-3 touch-none">
        {/* Interaction Prompt (Pops up when near loot) */}
        {nearbyItem && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            onClick={onInteract}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-heading font-black text-xs tracking-wider shadow-2xl active:scale-95 transition-transform border border-white animate-bounce"
          >
            <Sparkles className="w-4 h-4" />
            <span>RECOGER [E]</span>
          </button>
        )}

        {/* Buttons Row 1: Reload & Aim ADS */}
        <div className="flex items-center gap-3">
          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            onClick={onReload}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg text-[9px] font-mono"
            title="Recargar arma"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RECARGAR</span>
          </button>

          {/* Aim (ADS Zoom) Toggle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAimToggle(!isAiming);
            }}
            onClick={() => onAimToggle(!isAiming)}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center font-mono text-[10px] font-bold active:scale-95 transition-all shadow-xl ${
              isAiming
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/50 ring-2 ring-amber-300'
                : 'bg-slate-950/75 border-slate-700 text-slate-200 backdrop-blur-sm'
            }`}
          >
            <Target className={`w-5 h-5 ${isAiming ? 'text-slate-950 stroke-[3]' : 'text-amber-400'}`} />
            <span>APUNTAR</span>
          </button>
        </div>

        {/* Buttons Row 2: Sprint, Jump, and Primary SHOOT */}
        <div className="flex items-center gap-3">
          {/* Sprint Toggle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onSprintToggle(!isSprinting);
            }}
            onClick={() => onSprintToggle(!isSprinting)}
            className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center font-mono text-[9px] font-bold active:scale-95 transition-all shadow-lg ${
              isSprinting
                ? 'bg-amber-500 border-amber-300 text-slate-950'
                : 'bg-slate-950/75 border-slate-700 text-slate-300'
            }`}
          >
            <Zap className={`w-4 h-4 ${isSprinting ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span>CORRER</span>
          </button>

          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onJumpStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onJumpEnd();
            }}
            className="w-12 h-12 rounded-full bg-slate-950/75 border border-slate-700 text-white flex flex-col items-center justify-center font-mono text-[9px] font-bold active:scale-95 transition-all shadow-lg"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            <span>SALTAR</span>
          </button>

          {/* Primary FIRE / DISPARAR Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onShootStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onShootEnd();
            }}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-red-300 text-white flex flex-col items-center justify-center font-heading font-black text-xs tracking-wider shadow-2xl shadow-red-600/50 active:scale-90 active:from-red-500 active:to-orange-500 transition-all cursor-pointer"
          >
            <Crosshair className="w-7 h-7 stroke-[3] mb-0.5 animate-pulse" />
            <span>DISPARAR</span>
            <span className="text-[10px] font-mono text-red-100 opacity-90">{ammo}/8</span>
          </button>
        </div>
      </div>
    </div>
  );
};
