import React, { useState } from 'react';
import {
  X,
  Crosshair,
  Heart,
  Zap,
  Shield,
  Layers,
  ArrowDownCircle,
  Plus,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { CollectibleItem, InventorySlot, ItemCategory } from '../types/game';
import { sounds } from '../audio/SoundEffects';

interface GraphicalInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventorySlot[];
  onUseItem: (item: CollectibleItem) => void;
  onDropItem: (item: CollectibleItem) => void;
  playerHealth: number;
  playerStamina: number;
}

export const GraphicalInventory: React.FC<GraphicalInventoryProps> = ({
  isOpen,
  onClose,
  inventory,
  onUseItem,
  onDropItem,
  playerHealth,
  playerStamina,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');

  if (!isOpen) return null;

  const totalCapacity = 16;
  const filteredSlots = inventory.filter(
    (slot) => activeCategory === 'all' || slot.item.category === activeCategory
  );

  const selectedSlot =
    selectedSlotIndex !== null && selectedSlotIndex < inventory.length
      ? inventory[selectedSlotIndex]
      : inventory.length > 0
      ? inventory[0]
      : null;

  const getItemIcon = (cat: ItemCategory, className: string = 'w-6 h-6') => {
    switch (cat) {
      case 'weapon':
        return <Crosshair className={className} />;
      case 'medical':
        return <Heart className={className} />;
      case 'energy':
        return <Zap className={className} />;
      case 'resource':
        return <Shield className={className} />;
      case 'ammo':
        return <Layers className={className} />;
      default:
        return <Package className={className} />;
    }
  };

  const getRarityBadge = (item: CollectibleItem) => {
    switch (item.category) {
      case 'weapon':
        return { label: 'RARO', border: 'border-cyan-500/60', bg: 'bg-cyan-950/40', text: 'text-cyan-400' };
      case 'medical':
        return { label: 'CRÍTICO', border: 'border-emerald-500/60', bg: 'bg-emerald-950/40', text: 'text-emerald-400' };
      case 'energy':
        return { label: 'ALTA POTENCIA', border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400' };
      default:
        return { label: 'ESTÁNDAR', border: 'border-slate-700', bg: 'bg-slate-900', text: 'text-slate-400' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-white tracking-wider">
                  SISTEMA DE INVENTARIO GRÁFICO
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  SECTOR 04
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                CAPACIDAD: {inventory.length} / {totalCapacity} RANURAS · GESTIÓN DE EQUIPO TÁCTICO
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cerrar (Esc / Tab)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          {[
            { id: 'all', label: 'TODOS', count: inventory.length },
            { id: 'weapon', label: 'ARMAS', count: inventory.filter((s) => s.item.category === 'weapon').length },
            { id: 'medical', label: 'MÉDICO', count: inventory.filter((s) => s.item.category === 'medical').length },
            { id: 'energy', label: 'ENERGÍA', count: inventory.filter((s) => s.item.category === 'energy').length },
            { id: 'resource', label: 'RECURSOS', count: inventory.filter((s) => s.item.category === 'resource').length },
            { id: 'ammo', label: 'MUNICIÓN', count: inventory.filter((s) => s.item.category === 'ammo').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                setActiveCategory(cat.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeCategory === cat.id ? 'bg-slate-900/30 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Main Body: Grid (Left) & Inspector (Right) */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          {/* 16-SLOT GRAPHICAL GRID (Left, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                RANURAS DE ALMACENAMIENTO ({inventory.length}/{totalCapacity})
              </span>
              <span>HAZ CLIC EN UN ICONO PARA INSPECCIONAR</span>
            </div>

            {/* 4x4 Graphical Item Grid */}
            <div className="grid grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {Array.from({ length: totalCapacity }).map((_, idx) => {
                const slot = inventory[idx];
                const isSelected = selectedSlot && slot && selectedSlot.item.id === slot.item.id;
                const rarity = slot ? getRarityBadge(slot.item) : null;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (slot) {
                        sounds.playClick();
                        setSelectedSlotIndex(idx);
                      }
                    }}
                    className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-between border transition-all cursor-pointer group ${
                      slot
                        ? isSelected
                          ? 'border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : `${rarity?.border} ${rarity?.bg} hover:border-slate-400 hover:bg-slate-800/70`
                        : 'border-dashed border-slate-800 bg-slate-950/30 cursor-default opacity-40'
                    }`}
                  >
                    {/* Slot Index Number */}
                    <span className="self-start text-[9px] font-mono text-slate-500">
                      {idx + 1}
                    </span>

                    {slot ? (
                      <>
                        {/* Graphical Item Icon with Glow */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ color: slot.item.color }}
                        >
                          {getItemIcon(slot.item.category, 'w-7 h-7 drop-shadow-md')}
                        </div>

                        {/* Item Name Label */}
                        <span className="text-[10px] text-slate-200 font-sans truncate text-center w-full px-1">
                          {slot.item.name}
                        </span>

                        {/* Quantity Counter Badge */}
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.2 bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-white rounded shadow">
                          x{slot.quantity}
                        </span>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-mono">
                        VACÍO
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Hotbar Loadout Summary */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">ACCESO RÁPIDO HUD:</span>
              <div className="flex items-center gap-2">
                {inventory.slice(0, 4).map((slot, i) => (
                  <div
                    key={slot.item.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedSlotIndex(i);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded hover:border-cyan-400 cursor-pointer"
                  >
                    <span className="text-cyan-400 font-bold">{i + 1}:</span>
                    <span className="text-slate-200 truncate max-w-[80px]">{slot.item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ITEM INSPECTION & ACTIONS CARD (Right, 5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            {selectedSlot ? (
              <div className="space-y-4">
                {/* Item Hero Preview */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-900 border-2 shadow-inner"
                    style={{
                      borderColor: selectedSlot.item.color,
                      color: selectedSlot.item.color,
                      backgroundColor: `${selectedSlot.item.color}15`,
                    }}
                  >
                    {getItemIcon(selectedSlot.item.category, 'w-9 h-9 drop-shadow')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                        {selectedSlot.item.category}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        {getRarityBadge(selectedSlot.item).label}
                      </span>
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mt-1">
                      {selectedSlot.item.name}
                    </h3>
                  </div>
                </div>

                {/* Lore / Gameplay Description */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-sm text-slate-300 leading-relaxed">
                  {selectedSlot.item.description}
                </div>

                {/* Tactical Stats Matrix */}
                <div className="space-y-2 text-xs font-mono border-t border-slate-800 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">UNIDADES DISPONIBLES:</span>
                    <span className="text-white font-bold">{selectedSlot.quantity}</span>
                  </div>

                  {selectedSlot.item.category === 'medical' && (
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="text-emerald-400">EFECTO DE RESTAURACIÓN:</span>
                      <span className="text-emerald-300 font-bold">+30 PUNTOS DE SALUD</span>
                    </div>
                  )}

                  {selectedSlot.item.category === 'energy' && (
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="text-amber-400">EFECTO DE ENERGÍA:</span>
                      <span className="text-amber-300 font-bold">RECARGA 100% ESTAMINA</span>
                    </div>
                  )}

                  {selectedSlot.item.category === 'weapon' && (
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="text-cyan-400">POTENCIA DE FUEGO:</span>
                      <span className="text-cyan-300 font-bold">35 DPS (CALIBRE 5.56 MM)</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">PESO TOTAL:</span>
                    <span className="text-slate-200">{(selectedSlot.quantity * 0.75).toFixed(1)} KG</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-3">
                <Info className="w-8 h-8 text-slate-600" />
                <p className="text-sm">No hay ningún objeto seleccionado.</p>
                <p className="text-xs text-slate-600">
                  Explora el mapa y recoge cajas o armas con [E].
                </p>
              </div>
            )}

            {/* Action Buttons: Use, Equip, Drop */}
            {selectedSlot && (
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                {selectedSlot.item.category === 'medical' ? (
                  <button
                    onClick={() => onUseItem(selectedSlot.item)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Plus className="w-5 h-5" />
                    USAR ESTIMULANTE (+30 SALUD)
                  </button>
                ) : selectedSlot.item.category === 'energy' ? (
                  <button
                    onClick={() => onUseItem(selectedSlot.item)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Zap className="w-5 h-5 fill-slate-950" />
                    CONSUMIR NÚCLEO (RECARGA ESTAMINA 100%)
                  </button>
                ) : (
                  <button
                    onClick={() => onUseItem(selectedSlot.item)}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    EQUIPAR EN RANURA PRINCIPAL
                  </button>
                )}

                {/* Drop Item Button */}
                <button
                  onClick={() => onDropItem(selectedSlot.item)}
                  className="w-full py-2 bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowDownCircle className="w-4 h-4 text-rose-400" />
                  SOLTAR AL SUELO (DESECHAR EN MUNDO 3D)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              SALUD ACTUAL: <b className="text-red-400">{playerHealth}%</b>
            </span>
            <span>
              ENERGÍA / ESTAMINA: <b className="text-cyan-400">{playerStamina}%</b>
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            VOLVER AL JUEGO (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
