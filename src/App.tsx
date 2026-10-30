/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameWorld } from './world/GameWorld';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { GraphicalInventory } from './components/GraphicalInventory';
import { PauseMenu } from './components/PauseMenu';
import { LandscapeNotice } from './components/LandscapeNotice';
import { CollectibleItem, PlayerStats, CameraViewMode, InventorySlot, EnemyInfo, TimeState, WeatherState, ShelterInfo } from './types/game';
import { sounds } from './audio/SoundEffects';
import { Play, Sparkles, Crosshair, Shield } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);

  // Game Shell State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');

  // Player & HUD State
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    ammo: 8,
    maxAmmo: 8,
    reserveAmmo: 32,
    isSprinting: false,
    isAiming: false,
    isShooting: false,
    isMoving: false,
    isGrounded: true,
    kills: 0,
    activeCharacter: 'male',
  });

  const [nearbyItem, setNearbyItem] = useState<CollectibleItem | null>(null);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [viewMode, setViewMode] = useState<CameraViewMode>('third_person');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [compassDegree, setCompassDegree] = useState<number>(0);
  const [recentToast, setRecentToast] = useState<string | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // New Apocalypse, Shelter & Shooter states
  const [enemies, setEnemies] = useState<EnemyInfo[]>([]);
  const [shelters, setShelters] = useState<ShelterInfo[]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 8]);
  const [playerHeading, setPlayerHeading] = useState<number>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<'male' | 'female'>('male');
  const [timeState, setTimeState] = useState<TimeState | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [screenDamageFlash, setScreenDamageFlash] = useState<boolean>(false);
  const [hitmarkerFlash, setHitmarkerFlash] = useState<boolean>(false);

  // Initialize 3D Engine once on mount
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    if (!canvasRef.current || gameWorldRef.current) return;

    const game = new GameWorld(canvasRef.current, {
      onNearbyItemChange: (item) => {
        setNearbyItem(item);
      },
      onItemCollected: (item) => {
        setInventory((prev) => {
          const existing = prev.find((s) => s.item.id === item.id);
          if (existing) {
            return prev.map((s) =>
              s.item.id === item.id ? { ...s, quantity: s.quantity + item.count } : s
            );
          }
          return [
            ...prev,
            { slotId: prev.length, item, quantity: item.count },
          ];
        });

        setRecentToast(`+${item.count} ${item.name}`);
        setTimeout(() => setRecentToast(null), 3000);
      },
      onPlayerStatsChange: (stats) => {
        setPlayerStats(stats);
      },
      onViewModeChange: (mode) => {
        setViewMode(mode);
      },
      onEnemyInfoChange: (enemyList) => {
        setEnemies(enemyList);
      },
      onTimeChange: (time) => {
        setTimeState(time);
      },
      onWeatherChange: (weather) => {
        setWeatherState(weather);
      },
      onSheltersUpdate: (shelterList) => {
        setShelters(shelterList);
      },
      onShelterDiscovered: (shelter) => {
        setRecentToast(`¡REFUGIO DESCUBIERTO: ${shelter.name.toUpperCase()}!`);
        setTimeout(() => setRecentToast(null), 4500);
      },
      onPlayerPositionChange: (pos, heading) => {
        setPlayerPosition(pos);
        setPlayerHeading(heading);
      },
      onPlayerDamaged: () => {
        setScreenDamageFlash(true);
        setTimeout(() => setScreenDamageFlash(false), 240);
      },
      onHitEnemy: () => {
        setHitmarkerFlash(true);
        setTimeout(() => setHitmarkerFlash(false), 140);
      },
    });

    gameWorldRef.current = game;

    // Compass interval update
    const compassInterval = setInterval(() => {
      if (gameWorldRef.current) {
        setCompassDegree(gameWorldRef.current.getCompassBearing());
        setIsPointerLocked(gameWorldRef.current.isPointerLocked);
      }
    }, 120);

    // Global keyboard shortcuts
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        setIsInventoryOpen((open) => !open);
      } else if (e.code === 'Escape') {
        if (isInventoryOpen) {
          setIsInventoryOpen(false);
        } else {
          setGameState((st) => (st === 'playing' ? 'paused' : st === 'paused' ? 'playing' : st));
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);

    return () => {
      clearInterval(compassInterval);
      window.removeEventListener('keydown', handleGlobalKeys);
      game.dispose();
      gameWorldRef.current = null;
    };
  }, []);

  // Title screen space / enter listener
  useEffect(() => {
    if (gameState !== 'title') return;
    const handleStartKeys = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        startGame();
      }
    };
    window.addEventListener('keydown', handleStartKeys);
    return () => window.removeEventListener('keydown', handleStartKeys);
  }, [gameState]);

  const startGame = () => {
    sounds.playClick();
    setGameState('playing');
    if (gameWorldRef.current) {
      gameWorldRef.current.spatialAudio.resume();
      if (!isTouchDevice) {
        gameWorldRef.current.requestPointerLock();
      }
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (gameWorldRef.current) {
      gameWorldRef.current.spatialAudio.enabled = next;
    }
    if (next) sounds.playClick();
  };

  const handleToggleFullscreen = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleToggleViewMode = () => {
    if (gameWorldRef.current) {
      gameWorldRef.current.toggleViewMode();
    }
  };

  const handleInteract = () => {
    if (gameWorldRef.current) {
      gameWorldRef.current.tryInteract();
    }
  };

  const handleCycleWeather = () => {
    if (!gameWorldRef.current) return;
    sounds.playClick();
    const curr = gameWorldRef.current.weather.currentWeather;
    const next = curr === 'heavy_rain' ? 'clear_sunset' : curr === 'clear_sunset' ? 'toxic_fog' : 'heavy_rain';
    gameWorldRef.current.weather.setWeather(next);
  };

  const handleUseInventoryItem = (item: CollectibleItem) => {
    if (!gameWorldRef.current) return;
    gameWorldRef.current.useItem(item);

    setInventory((prev) =>
      prev
        .map((s) => (s.item.id === item.id ? { ...s, quantity: s.quantity - 1 } : s))
        .filter((s) => s.quantity > 0)
    );
  };

  const handleDropItem = (item: CollectibleItem) => {
    if (!gameWorldRef.current) return;
    gameWorldRef.current.dropItem(item);

    setInventory((prev) =>
      prev
        .map((s) => (s.item.id === item.id ? { ...s, quantity: s.quantity - 1 } : s))
        .filter((s) => s.quantity > 0)
    );
  };

  const handleSelectCharacter = (gender: 'male' | 'female') => {
    setSelectedCharacter(gender);
    if (gameWorldRef.current) {
      gameWorldRef.current.setCharacterGender(gender);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Landscape Orientation Warning for Mobile Devices */}
      <LandscapeNotice />

      {/* 1. Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* 2. TITLE SCREEN (Accessible & Compact for Mobile Landscape) */}
      {gameState === 'title' && (
        <div
          onClick={startGame}
          className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm pointer-events-auto cursor-pointer"
        >
          {/* Top Title Lockup & Status */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-xl shrink-0">
                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-widest text-red-400 uppercase font-bold block leading-tight">
                  SURVIVAL ACTION SHOOTER 3D · SECTOR RUINAS
                </span>
                <h1 className="font-heading text-xl sm:text-3xl font-extrabold tracking-wider text-white leading-tight">
                  LAST FRONTIER <span className="text-red-500">APOCALIPSIS</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 border border-slate-700 rounded-md text-[10px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>RADAR & AUDIO 3D ACTIVADOS</span>
            </div>
          </div>

          {/* Center Call To Action & Character Picker */}
          <div className="max-w-xl mx-auto text-center space-y-2 sm:space-y-3 my-auto py-1">
            {/* Character Selector Pre-Game */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl"
            >
              <span className="text-[10px] font-mono font-bold text-slate-400 pl-2">PERSONAJE:</span>
              
              <button
                type="button"
                onClick={() => handleSelectCharacter('male')}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCharacter === 'male'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40 ring-1 ring-cyan-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <img
                  src="/assets/aistudio/3d_character_render_of_a_gritty_male_zombie_apocalypse_survivor_standing_08d7ae1b.png"
                  alt="Joel"
                  className="w-5 h-5 rounded-md object-cover object-top"
                />
                <span>JOEL</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCharacter('female')}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCharacter === 'female'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <img
                  src="/assets/aistudio/full_body_3d_character_render_of_a_gritty_female_zombie_apocalypse_survivor_a6255089.png"
                  alt="Ellie"
                  className="w-5 h-5 rounded-md object-cover object-top"
                />
                <span>ELLIE</span>
              </button>
            </div>

            {/* Big Prominent Start Button */}
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-heading font-black text-base sm:text-lg tracking-wider rounded-xl shadow-2xl shadow-red-600/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 mx-auto animate-pulse"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>▶ TOCAR AQUÍ PARA JUGAR AHORA</span>
              </button>
            </div>

            <p className="text-[11px] font-mono text-slate-400">
              (Toca cualquier parte de la pantalla o presiona Espacio para entrar de inmediato)
            </p>
          </div>

          {/* Footer Controls Flat Line */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>WASD: Mover · Clic / Botón: Disparar · Apuntar ADS · R: Recargar</span>
            <span className="text-emerald-400 font-bold">✓ REFUGIOS Y ENEMIGOS DE TUS FOTOS ACTIVADOS</span>
          </div>
        </div>
      )}

      {/* 3. ACTIVE PLAYING HUD */}
      {gameState === 'playing' && (
        <HUD
          stats={playerStats}
          nearbyItem={nearbyItem}
          inventory={inventory}
          viewMode={viewMode}
          soundEnabled={soundEnabled}
          compassDegree={compassDegree}
          recentToast={recentToast}
          enemies={enemies}
          timeState={timeState}
          weatherState={weatherState}
          screenDamageFlash={screenDamageFlash}
          hitmarkerFlash={hitmarkerFlash}
          shelters={shelters}
          playerPosition={playerPosition}
          playerHeading={playerHeading}
          onSelectCharacter={handleSelectCharacter}
          onToggleSound={handleToggleSound}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleViewMode={handleToggleViewMode}
          onToggleInventory={() => setIsInventoryOpen((open) => !open)}
          onCycleWeather={handleCycleWeather}
          onPause={() => setGameState('paused')}
          onInteract={handleInteract}
          isPointerLocked={isPointerLocked}
          onRequestPointerLock={() => gameWorldRef.current?.requestPointerLock()}
        />
      )}

      {/* 4. MOBILE ON-SCREEN TOUCH CONTROLS (COD MOBILE STYLE) */}
      {gameState === 'playing' && isTouchDevice && (
        <MobileControls
          onJoystickMove={(x, y) => {
            if (gameWorldRef.current) {
              gameWorldRef.current.joystickVector = { x, y };
            }
          }}
          onCameraRotate={(dx, dy) => {
            if (gameWorldRef.current) {
              gameWorldRef.current.rotateCameraTouch(dx, dy);
            }
          }}
          onJumpStart={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchJumping = true;
            }
          }}
          onJumpEnd={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchJumping = false;
            }
          }}
          onSprintToggle={(sprinting) => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchSprinting = sprinting;
            }
          }}
          onAimToggle={(aiming) => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchAiming = aiming;
              gameWorldRef.current.isAiming = aiming;
            }
          }}
          onShootStart={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchShooting = true;
              gameWorldRef.current.shootWeapon();
            }
          }}
          onShootEnd={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.touchShooting = false;
            }
          }}
          onReload={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.reloadWeapon();
            }
          }}
          onInteract={handleInteract}
          nearbyItem={nearbyItem}
          isSprinting={playerStats.isSprinting}
          isAiming={playerStats.isAiming}
          ammo={playerStats.ammo}
        />
      )}

      {/* 5. ADVANCED GRAPHICAL INVENTORY MODAL */}
      <GraphicalInventory
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={inventory}
        onUseItem={handleUseInventoryItem}
        onDropItem={handleDropItem}
        playerHealth={playerStats.health}
        playerStamina={playerStats.stamina}
      />

      {/* 6. PAUSE MENU & STANDALONE HTML EXPORTER */}
      <PauseMenu
        isOpen={gameState === 'paused'}
        onResume={() => {
          setGameState('playing');
          if (!isTouchDevice && gameWorldRef.current) {
            gameWorldRef.current.requestPointerLock();
          }
        }}
      />
    </div>
  );
}
