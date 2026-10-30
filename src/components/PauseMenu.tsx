import React, { useState } from 'react';
import { Play, Download, Copy, Check, HelpCircle, Monitor, Smartphone, X } from 'lucide-react';
import { generateSingleHtmlCode } from '../utils/generateSingleHtml';
import { sounds } from '../audio/SoundEffects';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ isOpen, onResume }) => {
  const [copied, setCopied] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  if (!isOpen) return null;

  const handleDownloadHtml = () => {
    sounds.playClick();
    const html = generateSingleHtmlCode();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'survx_supervivencia_modulo1.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    sounds.playClick();
    try {
      const html = generateSingleHtmlCode();
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-wider text-cyan-400">
              SURVX · SISTEMA EN PAUSA
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              MÓDULO 1: SUPERVIVENCIA Y EXPLORACIÓN
            </p>
          </div>
          <button
            onClick={onResume}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold text-base tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            REANUDAR MISIÓN
          </button>

          <button
            onClick={handleDownloadHtml}
            className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            DESCARGAR ARCHIVO HTML AUTÓNOMO (1 SOLO ARCHIVO)
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyCode}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">¡COPIADO!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>COPIAR CÓDIGO HTML</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCodePreview(!showCodePreview)}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>{showCodePreview ? 'OCULTAR CÓDIGO' : 'VER CÓDIGO HTML'}</span>
            </button>
          </div>
        </div>

        {/* Optional Code Preview Box */}
        {showCodePreview && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 select-text">
            <pre className="whitespace-pre-wrap">{generateSingleHtmlCode().slice(0, 1500)}...</pre>
          </div>
        )}

        {/* Guide Controls Summary */}
        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Guía de Operaciones y Controles</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* PC Box */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold mb-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>PC / TECLADO Y RATÓN</span>
              </div>
              <p><span className="text-cyan-400 font-bold">WASD:</span> Desplazamiento</p>
              <p><span className="text-cyan-400 font-bold">Shift:</span> Sprint / Correr</p>
              <p><span className="text-cyan-400 font-bold">Espacio:</span> Saltar</p>
              <p><span className="text-cyan-400 font-bold">E:</span> Recoger e interactuar</p>
              <p><span className="text-cyan-400 font-bold">V:</span> 3ª / 1ª Persona</p>
              <p><span className="text-cyan-400 font-bold">Clic:</span> Captura de ratón</p>
            </div>

            {/* Mobile Box */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold mb-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>MÓVIL / PANTALLA TÁCTIL</span>
              </div>
              <p><span className="text-amber-400 font-bold">Joystick Izq:</span> Movimiento 360°</p>
              <p><span className="text-amber-400 font-bold">Deslizar Der:</span> Rotación de cámara</p>
              <p><span className="text-amber-400 font-bold">Botón SALTO:</span> Salto vertical</p>
              <p><span className="text-amber-400 font-bold">Botón RUN:</span> Activar sprint</p>
              <p><span className="text-amber-400 font-bold">Botón E:</span> Recoger objeto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
