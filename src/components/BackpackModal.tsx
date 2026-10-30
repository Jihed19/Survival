import React, { useState } from 'react';
import { X, Backpack, Heart, Zap, Crosshair, Shield, Layers, Plus } from 'lucide-react';
import { InventorySlot, CollectibleItem } from '../types/game';

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventorySlot[];
  onUseItem: (item: CollectibleItem) => void;
  playerHealth: number;
  playerStamina: number;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUseItem,
  playerHealth,
  playerStamina,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<InventorySlot | null>(
    inventory.length > 0 ? inventory[0] : null
  );

  if (!isOpen) return null;

  const currentSelection =
    selectedSlot && inventory.find((s) => s.item.id === selectedSlot.item.id)
      ? inventory.find((s) => s.item.id === selectedSlot.item.id)!
      : inventory.length > 0
      ? inventory[0]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Backpack className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                MOCHILA DE SUPERVIVENCIA
              </h2>
              <p className="text-xs font-mono text-slate-400">
                CAPACIDAD: {inventory.length} / 16 SLOTS DE CARGA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Inventory Grid */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-3">
              Objetos Recolectados
            </h3>

            {inventory.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                No tienes suministros aún. Explora el mapa y busca balizas de luz para recoger equipo con [E].
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {inventory.map((slot) => {
                  const isSelected = currentSelection?.item.id === slot.item.id;
                  return (
                    <div
                      key={slot.item.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                        style={{ color: slot.item.color }}
                      >
                        {slot.item.category === 'weapon' && <Crosshair className="w-6 h-6" />}
                        {slot.item.category === 'medical' && <Heart className="w-6 h-6" />}
                        {slot.item.category === 'energy' && <Zap className="w-6 h-6" />}
                        {slot.item.category === 'resource' && <Shield className="w-6 h-6" />}
                        {slot.item.category === 'ammo' && <Layers className="w-6 h-6" />}
                      </div>
                      <span className="text-[10px] text-slate-300 font-sans truncate text-center w-full">
                        {slot.item.name}
                      </span>
                      <span className="absolute top-1 right-1 px-1.5 py-0.2 bg-slate-800 text-[10px] font-mono font-bold text-white rounded">
                        x{slot.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Inspector Panel */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            {currentSelection ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-700"
                    style={{ color: currentSelection.item.color }}
                  >
                    {currentSelection.item.category === 'weapon' && <Crosshair className="w-7 h-7" />}
                    {currentSelection.item.category === 'medical' && <Heart className="w-7 h-7" />}
                    {currentSelection.item.category === 'energy' && <Zap className="w-7 h-7" />}
                    {currentSelection.item.category === 'resource' && <Shield className="w-7 h-7" />}
                    {currentSelection.item.category === 'ammo' && <Layers className="w-7 h-7" />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {currentSelection.item.category}
                    </span>
                    <h4 className="font-heading text-lg font-bold text-white mt-1">
                      {currentSelection.item.name}
                    </h4>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  {currentSelection.item.description}
                </p>

                <div className="space-y-2 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span>CANTIDAD:</span>
                    <span className="text-white font-bold">{currentSelection.quantity} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PESO EN MOCHILA:</span>
                    <span className="text-white">{(currentSelection.quantity * 0.8).toFixed(1)} kg</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">
                Selecciona un objeto para ver especificaciones y detalles.
              </div>
            )}

            {currentSelection && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                {currentSelection.item.category === 'medical' ? (
                  <button
                    onClick={() => onUseItem(currentSelection.item)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    USAR ESTIMULANTE (+30 SALUD)
                  </button>
                ) : currentSelection.item.category === 'energy' ? (
                  <button
                    onClick={() => onUseItem(currentSelection.item)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-heading font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    CONSUMIR NÚCLEO (RECARGA ENERGÍA 100%)
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 bg-slate-800 text-slate-500 font-mono text-xs rounded-xl cursor-not-allowed"
                  >
                    EQUIPADO / OBJETO PASIVO
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Vitals */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>SALUD ACTUAL: <b className="text-red-400">{playerHealth}%</b></span>
            <span>ENERGÍA: <b className="text-cyan-400">{playerStamina}%</b></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            CERRAR (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
