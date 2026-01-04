
import { SkinType, PhysicsProps } from './types';

// Vibe-Logic Hierarchy
export const PHYSICS_HIERARCHY: Record<SkinType, PhysicsProps> = {
  sk_space: { restitution: 0.2, friction: 0.1 },
  sk_nature: { restitution: 0.2, friction: 0.1 },
  sk_fruit: { restitution: 0.5, friction: 0.02 },
  sk_music: { restitution: 0.5, friction: 0.02 },
  sk_weather: { restitution: 0.5, friction: 0.02 },
  sk_animals: { restitution: 0.8, friction: 0.01 },
  sk_dessert: { restitution: 0.8, friction: 0.01 },
  sk_ocean: { restitution: 0.5, friction: 0.02 },
};

export const PRICING = {
  skin: 10000,
  outline: 2000,
  theme: 1000,
  border: 750,
  hitbox: 5000,
  bomb: 75,
  broom: 150,
  sparkle: 300
};

export const SKINS_METADATA = [
  { id: 'sk_fruit', name: 'Fruit', emoji: '🍓', category: 'Medium' },
  { id: 'sk_animals', name: 'Animals', emoji: '🦁', category: 'Soft' },
  { id: 'sk_music', name: 'Music', emoji: '🎵', category: 'Medium' },
  { id: 'sk_weather', name: 'Weather', emoji: '⛈️', category: 'Medium' },
  { id: 'sk_space', name: 'Space', emoji: '🪐', category: 'Hard' },
  { id: 'sk_dessert', name: 'Dessert', emoji: '🍰', category: 'Soft' },
  { id: 'sk_ocean', name: 'Ocean', emoji: '🌊', category: 'Medium' },
  { id: 'sk_nature', name: 'Nature', emoji: '🌿', category: 'Hard' },
];

export const EMOJI_SETS: Record<string, string[]> = {
  sk_space: ['⭐', '🌒', '🛸', '👽', '🌕', '🪐', '🌌', '🌠', '☄️', '🛰️', '🚀', '👾'],
  sk_weather: ['🌫️', '🌧️', '🌦️', '🌩️', '🌪️', '❄️', '🌈', '☀️', '☁️', '💨', '🌊', '🌋'],
  sk_ocean: ['🦐', '🐠', '🐡', '🐙', '🦑', '🦈', '🐋', '🐳', '🐚', '🦀', '🐬', '🧜'],
  sk_nature: ['🌱', '🌿', '🍃', '☘️', '🍄', '🌴', '🌲', '🌳', '🌻', '🌹', '🪻', '🌵'],
  sk_music: ['🪈', '🪘', '🎸', '🎹', '🎷', '🎺', '🎻', '🎼', '🥁', '🎧', '📻', '🎙️'],
  sk_animals: ['🐭', '🐱', '🐶', '🦊', '🦁', '🐯', '🐼', '🐨', '🐻', '🐒', '🦍', '🦄'],
  sk_fruit: ['🍇', '🍓', '🍒', '🍑', '🍊', '🍎', '🍐', '🍍', '🍈', '🍉', '🎃', '🥥'],
  sk_dessert: ['🧁', '🍪', '🍩', '🍫', '🍦', '🍨', '🍧', '🍰', '🍮', '🍭', '🍬', '🎂'],
};

export const COMBO_PHRASES: Record<string, string[]> = {
  sk_space: ['Cosmic!', 'Supernova!', 'Galactic!', 'Stellar!', 'Interstellar!'],
  sk_weather: ['Electric!', 'Thunderous!', 'Stormy!', 'Cloudy!', 'Breezy!'],
  sk_ocean: ['Splash!', 'Deep Sea!', 'Tidal!', 'Aquatic!', 'Bubbly!'],
  sk_nature: ['Blooming!', 'Wild!', 'Leafy!', 'Earthy!', 'Organic!'],
  sk_music: ['Harmonious!', 'Rhythmic!', 'Melodic!', 'Funky!', 'Tuneful!'],
  sk_animals: ['Primal!', 'Wild!', 'Beastly!', 'Pawsome!', 'Furry!'],
  sk_fruit: ['Fruity!', 'Juicy!', 'Sweet!', 'Ripe!', 'Zesty!'],
  sk_dessert: ['Sugary!', 'Delicious!', 'Sweet!', 'Treat!', 'Yummy!'],
};

export const TIER_COLORS = [
  '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#eab308',
  '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#fbbf24',
];

export const GAME_WIDTH = 380;
export const GAME_HEIGHT = 600;
export const DROP_LIMIT = 4;

export const OUTLINE_STYLES = [
  { id: 'ot_default', name: 'Default', emoji: '🎨' },
  { id: 'ot_rainbow', name: 'Rainbow', emoji: '🌈' },
  { id: 'ot_white', name: 'White', emoji: '⚪' },
  { id: 'ot_black', name: 'Black', emoji: '⚫' },
];

export const HITBOX_STYLES = [
  { id: 'hb_default', name: 'Default', emoji: '📦' },
  { id: 'hb_transparent', name: 'Transparent', emoji: '🫙' },
  { id: 'hb_white', name: 'White', emoji: '⬜' },
  { id: 'hb_rainbow', name: 'Rainbow', emoji: '🎡' },
];

export const THEMES = [
  { id: 'th_0', bg: 'bg-white', name: 'White' },
  { id: 'th_1', bg: 'bg-black', name: 'Black' },
  { id: 'th_2', bg: 'bg-red-500', name: 'Red' },
  { id: 'th_3', bg: 'bg-orange-500', name: 'Orange' },
  { id: 'th_4', bg: 'bg-yellow-400', name: 'Yellow' },
  { id: 'th_5', bg: 'bg-green-500', name: 'Green' },
  { id: 'th_6', bg: 'bg-blue-500', name: 'Blue' },
  { id: 'th_7', bg: 'bg-purple-500', name: 'Purple' },
  { id: 'th_8', bg: 'bg-pink-500', name: 'Pink' },
  { id: 'th_9', bg: 'bg-sky-400', name: 'Light Blue' },
  { id: 'th_10', bg: 'bg-gray-500', name: 'Gray' },
  { id: 'th_11', bg: 'bg-red-900', name: 'Maroon' },
  { id: 'th_12', bg: 'bg-cyan-400', name: 'Cyan' },
  { id: 'th_13', bg: 'bg-rose-400', name: 'Rose' },
  { id: 'th_14', bg: 'bg-fuchsia-600', name: 'Magenta' },
  { id: 'th_15', bg: 'bg-violet-300', name: 'Light Purple' },
];

export const BORDERS = [
  { id: 'bd_0', color: 'border-gray-400', name: 'Gray' },
  { id: 'bd_1', color: 'border-white', name: 'White' },
  { id: 'bd_2', color: 'border-black', name: 'Black' },
  { id: 'bd_3', color: 'border-red-600', name: 'Red' },
  { id: 'bd_4', color: 'border-orange-600', name: 'Orange' },
  { id: 'bd_5', color: 'border-yellow-600', name: 'Yellow' },
  { id: 'bd_6', color: 'border-green-600', name: 'Green' },
  { id: 'bd_7', color: 'border-blue-600', name: 'Blue' },
  { id: 'bd_8', color: 'border-purple-600', name: 'Purple' },
  { id: 'bd_9', color: 'border-pink-600', name: 'Pink' },
  { id: 'bd_10', color: 'border-sky-500', name: 'Light Blue' },
  { id: 'bd_11', color: 'border-red-950', name: 'Maroon' },
  { id: 'bd_12', color: 'border-cyan-600', name: 'Cyan' },
  { id: 'bd_13', color: 'border-rose-600', name: 'Rose' },
  { id: 'bd_14', color: 'border-fuchsia-700', name: 'Magenta' },
  { id: 'bd_15', color: 'border-violet-400', name: 'Light Purple' },
];