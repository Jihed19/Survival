import React, { useState } from 'react';
import {
  Shield,
  Radio,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Crosshair,
  MapPin,
  Building,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { ShelterInfo, EnemyInfo } from '../types/game';

interface MinimapOverlayProps {
  playerPos: [number, number, number];
  playerHeading: number;
  compassDegree: number;
  shelters: ShelterInfo[];
  enemies: EnemyInfo[];
  discoveredCount: number;
}

export const MinimapOverlay: React.FC<MinimapOverlayProps> = ({
  playerPos,
  compassDegree,
  shelters,
  enemies,
  discoveredCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeShelterDetail, setActiveShelterDetail] = useState<ShelterInfo | null>(null);

  // Radar Range (meters represented on radar)
  const radarRange = isExpanded ? 80 : 42;
  const mapSize = isExpanded ? 240 : 110;
  const halfSize = mapSize / 2;

  // Find nearest enemy and check for proximity alerts
  const livingEnemies = enemies.filter((e) => e.state !== 'DEAD');
  const nearestEnemy = [...livingEnemies].sort((a, b) => a.distanceToPlayer - b.distanceToPlayer)[0];
  const isApexNear = livingEnemies.some((e) => e.type === 'mutated_brute' && e.distanceToPlayer < 28);
  const isThreatNear = nearestEnemy && nearestEnemy.distanceToPlayer < 20;

  // Convert world coordinate (X, Z) to radar coordinate relative to player
  const toRadarPos = (worldX: number, worldZ: number) => {
    const relX = worldX - playerPos[0];
    const relZ = worldZ - playerPos[2];

    const px = halfSize + (relX / radarRange) * halfSize;
    const py = halfSize + (relZ / radarRange) * halfSize;

    // Clamp inside circular radar boundary
    const dx = px - halfSize;
    const dy = py - halfSize;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = halfSize - 8;

    if (dist > maxRadius) {
      const angle = Math.atan2(dy, dx);
      return {
        x: halfSize + Math.cos(angle) * maxRadius,
        y: halfSize + Math.sin(angle) * maxRadius,
        isOffscreen: true,
      };
    }

    return { x: px, y: py, isOffscreen: false };
  };

  return (
    <div className="flex flex-col gap-1.5 pointer-events-auto select-none">
      {/* 1. CRITICAL PROXIMITY ALERT BANNER */}
      {isApexNear && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-gradient-to-r from-red-950/95 via-rose-950/95 to-slate-950/90 border border-red-500/80 shadow-lg shadow-red-950/50 animate-pulse text-[11px] font-mono text-red-200">
          <Flame className="w-4 h-4 text-orange-400 animate-bounce shrink-0" />
          <span className="font-bold text-red-100">
            ¡AMENAZA APEX: TIRANO BIO-ORGÁNICO A {livingEnemies.find((e) => e.type === 'mutated_brute')?.distanceToPlayer.toFixed(0)}M!
          </span>
        </div>
      )}

      {!isApexNear && isThreatNear && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-950/90 border border-amber-500/70 shadow-md text-[11px] font-mono text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            ALERTA: {nearestEnemy.name} a {nearestEnemy.distanceToPlayer.toFixed(0)}m ({nearestEnemy.state})
          </span>
        </div>
      )}

      {/* 2. RADAR CONTAINER */}
      <div
        className={`relative rounded-2xl bg-slate-950/90 border-2 ${
          isApexNear
            ? 'border-red-500/80 shadow-red-900/40 shadow-xl'
            : isThreatNear
            ? 'border-amber-500/70'
            : 'border-cyan-500/40'
        } shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300`}
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Radar Background Grid & Concentric Scanning Rings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_75%)] pointer-events-none" />
        
        {/* Concentric distance range rings */}
        <div className="absolute inset-[15%] rounded-full border border-cyan-500/20 pointer-events-none" />
        <div className="absolute inset-[35%] rounded-full border border-cyan-500/15 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-cyan-500/15" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-[1px] bg-cyan-500/15" />
        </div>

        {/* Dynamic Sweeping Radar Beam */}
        <div
          className="absolute inset-0 origin-center pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(6,182,212,0.25) 0deg, rgba(6,182,212,0.02) 60deg, transparent 90deg)',
            animation: 'spin 3.2s linear infinite',
          }}
        />

        {/* Discovered Shelters on Radar */}
        {shelters.map((shelter) => {
          const pos = toRadarPos(shelter.position[0], shelter.position[2]);
          const isDiscovered = shelter.discovered;

          return (
            <div
              key={shelter.id}
              onClick={() => setActiveShelterDetail(shelter)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-transform ${
                pos.isOffscreen ? 'opacity-70 scale-90' : 'hover:scale-125'
              }`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
              title={`${shelter.name} (${shelter.distanceToPlayer.toFixed(0)}m)`}
            >
              {isDiscovered ? (
                <div className="relative flex items-center justify-center">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-sm shadow-emerald-500/50">
                    <Shield className="w-2.5 h-2.5" />
                  </div>
                  {isExpanded && (
                    <span className="absolute left-full ml-1 px-1 py-0.5 rounded bg-slate-900/90 text-[8px] font-mono text-emerald-300 whitespace-nowrap border border-emerald-500/30">
                      {shelter.name.split(' ')[0]} {shelter.distanceToPlayer.toFixed(0)}m
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500/60 flex items-center justify-center text-[7px] font-mono text-slate-300">
                  ?
                </div>
              )}
            </div>
          );
        })}

        {/* Infected Enemies on Radar */}
        {livingEnemies.map((enemy) => {
          const pos = toRadarPos(enemy.position[0], enemy.position[2]);
          const isTitan = enemy.type === 'mutated_brute';
          const isClicker = enemy.type === 'mutated_clicker';

          return (
            <div
              key={enemy.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-200 ${
                isTitan
                  ? 'w-3.5 h-3.5 bg-red-600 border border-amber-300 rounded-sm shadow-md shadow-red-600 animate-pulse'
                  : isClicker
                  ? 'w-2.5 h-2.5 bg-fuchsia-500 rounded-full shadow-sm animate-ping'
                  : 'w-2 h-2 bg-red-500 rounded-full shadow-sm'
              }`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            />
          );
        })}

        {/* Player Icon at Radar Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          {/* Pulsing player core */}
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80" />
            {/* Player Heading Pointer */}
            <div
              className="absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-300 transition-transform duration-75"
              style={{ transform: `rotate(${compassDegree}deg) translateY(-3px)` }}
            />
          </div>
        </div>

        {/* Top Radar Info Header */}
        <div className="absolute top-1 inset-x-1.5 flex justify-between items-center pointer-events-none">
          <span className="text-[8px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
            {isExpanded ? 'RADAR SECTOR 80M' : 'RADAR 40M'}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="pointer-events-auto p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
          </button>
        </div>

        {/* Bottom Coordinates & Discovered Counter */}
        <div className="absolute bottom-1 inset-x-1.5 flex justify-between items-center text-[7.5px] font-mono text-slate-400 pointer-events-none">
          <span>
            {playerPos[0].toFixed(0)}E {playerPos[2].toFixed(0)}S
          </span>
          <span className="text-emerald-400 font-bold">
            REFUGIOS: {discoveredCount}/{shelters.length}
          </span>
        </div>
      </div>

      {/* 3. SHELTER INSPECTION MODAL (When player clicks on a shelter icon) */}
      {activeShelterDetail && (
        <div className="p-2 rounded-xl bg-slate-950/95 border border-emerald-500/50 shadow-xl max-w-[200px] text-[10px] font-sans">
          <div className="flex justify-between items-start gap-1">
            <div className="font-bold text-emerald-300 font-mono text-[11px] leading-tight">
              {activeShelterDetail.name}
            </div>
            <button
              onClick={() => setActiveShelterDetail(null)}
              className="text-slate-400 hover:text-white px-1 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="text-slate-300 text-[10px] mt-1 leading-snug">
            {activeShelterDetail.description}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800 text-[9px] font-mono">
            <span className={activeShelterDetail.discovered ? 'text-emerald-400' : 'text-amber-400'}>
              {activeShelterDetail.discovered ? '✓ DESCUBIERTO' : '⚠ NO EXPLORADO'}
            </span>
            <span className="text-cyan-300 font-bold">
              {activeShelterDetail.distanceToPlayer.toFixed(0)}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
