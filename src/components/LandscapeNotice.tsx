import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

export const LandscapeNotice: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const portrait = window.innerHeight > window.innerWidth && isMobile;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="w-20 h-28 rounded-2xl border-4 border-slate-600 flex items-center justify-center animate-pulse">
          <Smartphone className="w-10 h-10 text-cyan-400" />
        </div>
        <RotateCw className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-spin" />
      </div>

      <h2 className="font-heading text-2xl font-black text-white tracking-wider mb-2">
        MODO HORIZONTAL REQUERIDO
      </h2>
      <p className="text-sm font-sans text-slate-300 max-w-xs leading-relaxed mb-6">
        Para disfrutar de la experiencia táctica de supervivencia móvil estilo <b>Call of Duty Mobile</b>, gira tu teléfono a orientación horizontal.
      </p>

      <button
        onClick={() => {
          // Attempt fullscreen to trigger auto landscape if supported
          document.documentElement.requestFullscreen?.().catch(() => {});
        }}
        className="px-6 py-3 bg-cyan-500 text-slate-950 font-heading font-black text-xs tracking-wider rounded-xl shadow-xl"
      >
        ACTIVAR PANTALLA COMPLETA
      </button>
    </div>
  );
};
