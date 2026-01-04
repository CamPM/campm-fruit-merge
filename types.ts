
export type SkinType = string;
export type HitboxStyle = 'hb_tiered' | 'hb_transparent' | 'hb_white' | 'hb_rainbow';
export type OutlineStyle = 'ot_thin' | 'ot_thick' | 'ot_glow' | 'ot_none';
export type ThemeType = string;
export type BorderType = string;

export interface CosmeticState {
  skin: SkinType;
  hitbox: HitboxStyle;
  outline: OutlineStyle;
  theme: ThemeType;
  border: BorderType;
  unlocked: string[];
}

export interface GameState {
  score: number;
  highScore: number;
  coins: number;
  currentTier: number;
  nextTier: number;
  isGameOver: boolean;
  activePowerUp: 'bomb' | 'broom' | 'sparkle' | null;
}

export interface PhysicsProps {
  restitution: number;
  friction: number;
}
