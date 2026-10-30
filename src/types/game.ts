export type ItemCategory = 'weapon' | 'medical' | 'energy' | 'resource' | 'ammo';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface CollectibleItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity?: ItemRarity;
  count: number;
  icon: string;
  position: [number, number, number];
  color: string;
  modelType: 'rifle' | 'medkit' | 'powercell' | 'crate' | 'scrap' | 'shotgun_shells';
  collected?: boolean;
  stats?: {
    healAmount?: number;
    energyAmount?: number;
    damage?: number;
    ammoAmount?: number;
    weight?: number;
  };
}

export interface InventorySlot {
  slotId: number;
  item: CollectibleItem;
  quantity: number;
  isEquipped?: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  isSprinting: boolean;
  isAiming: boolean;
  isShooting: boolean;
  isMoving: boolean;
  isGrounded: boolean;
  kills: number;
  activeCharacter: 'male' | 'female';
}

export type CameraViewMode = 'third_person' | 'first_person';

export type EnemyType = 'infected_shambler' | 'mutated_clicker' | 'mutated_brute' | 'agile_stalker';
export type EnemyState = 'PATROL' | 'ALERT' | 'CHASE' | 'ATTACK' | 'RETURN' | 'DEAD';

export interface EnemyInfo {
  id: string;
  name: string;
  type: EnemyType;
  state: EnemyState;
  health: number;
  maxHealth: number;
  position: [number, number, number];
  distanceToPlayer: number;
}

export interface ShelterInfo {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  discovered: boolean;
  type: 'bunker' | 'outpost' | 'warehouse';
  distanceToPlayer: number;
}

export type WeatherType = 'clear_sunset' | 'heavy_rain' | 'toxic_fog' | 'storm_night';

export interface WeatherState {
  current: WeatherType;
  rainIntensity: number;
  fogDensity: number;
  thunderActive: boolean;
}

export interface TimeState {
  timeHours: number;
  timeFormatted: string;
  periodName: string;
  isNight: boolean;
  timeSpeed: number;
}
