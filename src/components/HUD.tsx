import React from 'react';
import {
  Heart,
  Zap,
  Crosshair,
  Volume2,
  VolumeX,
  Maximize2,
  Pause,
  CloudRain,
  Sun,
  Sunset,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import { CollectibleItem, PlayerStats, CameraViewMode, InventorySlot, EnemyInfo, TimeState, WeatherState, ShelterInfo } from '../types/game';
import { MinimapOverlay } from './MinimapOverlay';

interface HUDProps {
  stats: PlayerStats;
  nearbyItem: CollectibleItem | null;
  inventory: InventorySlot[];
  viewMode: CameraViewMode;
  soundEnabled: boolean;
  compassDegree: number;
  recentToast: string | null;
  enemies: EnemyInfo[];
  timeState: TimeState | null;
  weatherState: WeatherState | null;
  screenDamageFlash: boolean;
  hitmarkerFlash: boolean;
  shelters: ShelterInfo[];
  playerPosition: [number, number, number];
  playerHeading: number;
  onSelectCharacter: (gender: 'male' | 'female') => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onToggleViewMode: () => void;
  onToggleInventory: () => void;
  onCycleWeather: () => void;
  onPause: () => void;
  onInteract: () => void;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  nearbyItem,
  inventory,
  viewMode,
  soundEnabled,
  compassDegree,
  recentToast,
  enemies,
  timeState,
  weatherState,
  screenDamageFlash,
  hitmarkerFlash,
  shelters,
  playerPosition,
  playerHeading,
  onSelectCharacter,
  onToggleSound,
  onToggleFullscreen,
  onToggleViewMode,
  onToggleInventory,
  onCycleWeather,
  onPause,
  onInteract,
  isPointerLocked,
  onRequestPointerLock,
}) => {
  const totalItemCount = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const discoveredSheltersCount = shelters.filter((s) => s.discovered).length;

  // Check if any infected is in combat or chase
  const activeThreat = enemies.find((e) => e.state === 'CHASE' || e.state === 'ATTACK');

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden">
      {/* SCREEN RED DAMAGE VIGNETTE FLASH */}
      {screenDamageFlash && (
        <div className="absolute inset-0 bg-red-600/35 border-8 border-red-600/70 pointer-events-none animate-ping z-10" />
      )}

      {/* TOP BAR */}
      <div className="flex justify-between items-start w-full gap-2">
        {/* Top-Left: Survivor Avatar & Tactical Minimap Radar */}
        <div className="flex items-start gap-2 sm:gap-3 pointer-events-auto">
          {/* Survivor Portraits Selection (Click to Swap Joel / Ellie) */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onSelectCharacter('male')}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-lg relative group cursor-pointer transition-all ${
                stats.activeCharacter === 'male'
                  ? 'border-2 border-cyan-400 ring-2 ring-cyan-500/50 scale-105'
                  : 'border border-slate-700 opacity-60 hover:opacity-100'
              }`}
              title="Jugar con Joel (Superviviente)"
            >
              <img
                src="/assets/aistudio/3d_character_render_of_a_gritty_male_zombie_apocalypse_survivor_standing_08d7ae1b.png"
                alt="Superviviente Masculino"
                className="w-full h-full object-cover object-top scale-125"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-[8px] font-mono text-center text-cyan-300 font-bold">
                JOEL
              </span>
            </button>

            <button
              onClick={() => onSelectCharacter('female')}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-lg relative group cursor-pointer transition-all ${
                stats.activeCharacter === 'female'
                  ? 'border-2 border-emerald-400 ring-2 ring-emerald-500/50 scale-105'
                  : 'border border-slate-700 opacity-60 hover:opacity-100'
              }`}
              title="Jugar con Ellie (Superviviente)"
            >
              <img
                src="/assets/aistudio/full_body_3d_character_render_of_a_gritty_female_zombie_apocalypse_survivor_a6255089.png"
                alt="Superviviente Femenina"
                className="w-full h-full object-cover object-top scale-125"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-[8px] font-mono text-center text-emerald-300 font-bold">
                ELLIE
              </span>
            </button>
          </div>

          {/* REAL-TIME RADAR OVERLAY (Discovered shelters, proximity alerts, live heading) */}
          <MinimapOverlay
            playerPos={playerPosition}
            playerHeading={playerHeading}
            compassDegree={compassDegree}
            shelters={shelters}
            enemies={enemies}
            discoveredCount={discoveredSheltersCount}
          />
        </div>

        {/* Top-Center: Apocalyptic Weather & Celestial Clock */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          {/* Weather & Time Pill */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg font-mono text-xs text-slate-200">
            <button
              onClick={onCycleWeather}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Alternar Clima (Lluvia / Despejado)"
            >
              {weatherState?.rainIntensity ? (
                <>
                  <CloudRain className="w-4 h-4 text-blue-400 animate-bounce" />
                  <span className="font-bold text-blue-300">LLUVIA TÓXICA</span>
                </>
              ) : (
                <>
                  <Sunset className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300">ATARDECER</span>
                </>
              )}
            </button>

            <span className="text-slate-600">|</span>

            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-[11px] font-bold">{timeState?.timeFormatted || '18:45'}</span>
            </div>
          </div>

          {/* Threat Warning Banner */}
          {activeThreat && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-500 text-red-200 text-xs font-mono rounded-lg shadow-xl animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>
                {activeThreat.type === 'mutated_brute' ? '¡ALERTA MÁXIMA: TIRANO APEX!' : '¡INFECTADOS EN PERSECUCIÓN!'}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Military Survival Vitals (matching image #7 mockup) */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* System Tag */}
          <div className="px-2.5 py-0.5 bg-slate-900/85 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-400">
            SECTOR CIUDAD EN RUINAS · DIA 42
          </div>

          {/* Health Bar (Salud 100/100) */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 px-3 py-1.5 rounded-lg min-w-[190px] sm:min-w-[220px] shadow-lg">
            <div className="w-5 h-5 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <Heart className="w-3.5 h-3.5 fill-red-400/40" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono mb-0.5">
                <span className="text-red-400 font-bold">SALUD</span>
                <span className="text-white font-bold">{stats.health} / {stats.maxHealth}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-200"
                  style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Energy / Stamina Bar */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 px-3 py-1.5 rounded-lg min-w-[190px] sm:min-w-[220px] shadow-lg">
            <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Zap className="w-3.5 h-3.5 fill-cyan-400/40" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono mb-0.5">
                <span className="text-cyan-400 font-bold">ENERGÍA</span>
                <span className="text-white font-bold">{stats.stamina}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-150"
                  style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ammo & Kills Status */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Ammo counter */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/85 border border-amber-500/50 rounded-lg text-amber-300 font-bold shadow">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.ammo} / {stats.reserveAmmo}</span>
            </div>

            {/* Inventory Trigger */}
            <button
              onClick={onToggleInventory}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>MOCHILA ({totalItemCount})</span>
            </button>

            {/* Pause & Tools */}
            <button
              onClick={onPause}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER CROSSHAIR & HITMARKER */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Dynamic Crosshair (Tightens when Aiming ADS) */}
        <div
          className={`relative transition-all duration-200 flex items-center justify-center ${
            stats.isAiming ? 'w-5 h-5 opacity-90' : 'w-9 h-9 opacity-75'
          }`}
        >
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          <div className="absolute w-5 h-[1px] bg-cyan-400/70" />
          <div className="absolute h-5 w-[1px] bg-cyan-400/70" />
        </div>

        {/* HITMARKER FLASH (Red X when hitting infected) */}
        {hitmarkerFlash && (
          <div className="absolute w-7 h-7 flex items-center justify-center animate-ping pointer-events-none">
            <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute" />
            <div className="w-6 h-0.5 bg-red-500 -rotate-45 absolute" />
          </div>
        )}

        {/* Mouse capture hint for PC desktop */}
        {!isPointerLocked && (
          <div
            onClick={onRequestPointerLock}
            className="mt-6 pointer-events-auto cursor-pointer bg-slate-900/90 border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2 hover:bg-cyan-950/60 transition-all shadow-xl"
          >
            <Crosshair className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Haz clic para capturar el ratón (Apuntar / Disparar)</span>
          </div>
        )}

        {/* Nearby Loot Interaction Prompt */}
        {nearbyItem && (
          <div className="mt-8 pointer-events-auto transform animate-bounce">
            <button
              onClick={onInteract}
              className="flex items-center gap-3 px-5 py-2.5 bg-slate-950/95 border-2 border-cyan-400 text-white rounded-xl shadow-2xl hover:bg-cyan-950/80 transition-all cursor-pointer group"
            >
              <div className="px-2 py-1 bg-cyan-500 text-slate-950 font-black text-sm rounded tracking-wider shadow">
                E
              </div>
              <div className="text-left">
                <div className="text-[10px] text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  <span>RECOGER SUMINISTRO</span>
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                </div>
                <div className="font-heading font-bold text-sm text-white group-hover:text-cyan-200">
                  {nearbyItem.name}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Floating Toast Notification */}
        {recentToast && (
          <div className="mt-4 px-4 py-2 bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 rounded-lg text-xs font-mono shadow-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{recentToast}</span>
          </div>
        )}
      </div>

      {/* BOTTOM BAR / CONTROLS HINT */}
      <div className="flex items-center justify-between w-full text-xs font-mono text-slate-400">
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-4 py-1.5 rounded-lg border border-slate-800">
          <span><b className="text-cyan-400">WASD</b> Mover</span>
          <span><b className="text-cyan-400">Clic Izq</b> Disparar</span>
          <span><b className="text-cyan-400">Clic Der / Q</b> Apuntar (ADS)</span>
          <span><b className="text-cyan-400">R</b> Recargar</span>
          <span><b className="text-cyan-400">Shift</b> Correr</span>
          <span><b className="text-cyan-400">E</b> Recoger</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg">
          <span className="text-slate-300">CÁMARA: 3ª Persona (Sobre Hombro)</span>
        </div>
      </div>
    </div>
  );
};
