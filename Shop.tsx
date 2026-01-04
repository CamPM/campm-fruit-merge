
import React from 'react';
import { CosmeticState } from './types.ts';
import { SKINS_METADATA, THEMES, BORDERS, HITBOX_STYLES, OUTLINE_STYLES, PRICING } from './constants.ts';

interface ShopProps {
  currentCosmetics: CosmeticState;
  coins: number;
  onUpdate: (cosmetics: CosmeticState) => void;
  onDeductCoins: (amount: number) => void;
  onClose: () => void;
}

const Shop: React.FC<ShopProps> = ({ currentCosmetics, coins, onUpdate, onDeductCoins, onClose }) => {
  const select = (key: keyof CosmeticState, id: string, cost: number) => {
    const isUnlocked = currentCosmetics.unlocked.includes(id);
    
    if (isUnlocked) {
      if (currentCosmetics[key] !== id) {
        onUpdate({ ...currentCosmetics, [key]: id });
      }
      return;
    }

    if (coins >= cost) {
      onDeductCoins(cost);
      onUpdate({
        ...currentCosmetics,
        [key]: id,
        unlocked: [...currentCosmetics.unlocked, id]
      });
    }
  };

  const Item = ({ id, label, emoji, cost, selected, category }: any) => {
    const unlocked = currentCosmetics.unlocked.includes(id);
    return (
      <button
        onClick={() => select(category, id, cost)}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all overflow-hidden 
          ${selected ? 'bg-amber-400 border-amber-600 scale-95 shadow-lg' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
          ${unlocked && !selected ? 'border-zinc-500' : ''}`}
      >
        {!unlocked ? (
          <div className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg text-amber-950">
            ${cost}
          </div>
        ) : (
          <div className={`absolute top-0 right-0 ${selected ? 'bg-amber-700' : 'bg-zinc-700'} text-[7px] font-black px-1.5 py-0.5 rounded-bl-lg text-white`}>
            OWNED
          </div>
        )}
        <span className="text-xl mb-1">{emoji || '✨'}</span>
        <span className={`text-[8px] font-black uppercase tracking-tighter text-center line-clamp-1 ${selected ? 'text-amber-950' : 'text-zinc-500'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center p-6 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">Fruit Merge</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">v1.6.0 Armory</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900 px-3 py-1 rounded-full text-amber-400 font-black text-sm border border-amber-500/30">${coins}</div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xl border border-white/5 hover:bg-zinc-700 transition-colors">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
        <section>
          <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 px-1">Skins (8)</h2>
          <div className="grid grid-cols-4 gap-2">
            {SKINS_METADATA.map(s => (
              <Item key={s.id} id={s.id} label={s.name} emoji={s.emoji} cost={PRICING.skin} category="skin" selected={currentCosmetics.skin === s.id} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 px-1">Outlines (4)</h2>
          <div className="grid grid-cols-4 gap-2">
            {OUTLINE_STYLES.map(o => (
              <Item key={o.id} id={o.id} label={o.name} emoji={o.emoji} cost={PRICING.outline} category="outline" selected={currentCosmetics.outline === o.id} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 px-1">Hitboxes (4)</h2>
          <div className="grid grid-cols-4 gap-2">
            {HITBOX_STYLES.map(h => (
              <Item key={h.id} id={h.id} label={h.name} emoji={h.emoji} cost={PRICING.hitbox} category="hitbox" selected={currentCosmetics.hitbox === h.id} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 px-1">Backgrounds (16)</h2>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button 
                key={t.id} 
                onClick={() => select('theme', t.id, PRICING.theme)} 
                className={`h-12 rounded-xl border-2 relative ${t.bg} ${currentCosmetics.theme === t.id ? 'ring-2 ring-amber-500 border-transparent' : 'border-zinc-800'}
                  ${currentCosmetics.unlocked.includes(t.id) && currentCosmetics.theme !== t.id ? 'opacity-80' : ''}`}
                title={t.name}
              >
                {!currentCosmetics.unlocked.includes(t.id) ? (
                   <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-400 bg-black/60 rounded-lg">
                     ${PRICING.theme}
                   </span>
                ) : (
                  <span className={`absolute top-0 right-0 text-[6px] font-black px-1 rounded-bl-sm text-white ${currentCosmetics.theme === t.id ? 'bg-amber-600' : 'bg-zinc-700'}`}>
                    OWNED
                  </span>
                )}
                <span className={`absolute bottom-0 left-0 right-0 text-[6px] font-black uppercase py-0.5 text-center ${t.bg === 'bg-white' ? 'text-black' : 'text-white'} bg-black/20`}>{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 px-1">Borders (16)</h2>
          <div className="grid grid-cols-4 gap-2">
            {BORDERS.map(b => (
              <button 
                key={b.id} 
                onClick={() => select('border', b.id, PRICING.border)} 
                className={`h-12 rounded-xl border-[6px] relative ${b.color} bg-black/10 ${currentCosmetics.border === b.id ? 'ring-2 ring-amber-500 border-opacity-100' : 'border-opacity-60'}`}
                title={b.name}
              >
                 {!currentCosmetics.unlocked.includes(b.id) ? (
                   <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-400 bg-black/60 rounded-lg">
                     ${PRICING.border}
                   </span>
                ) : (
                  <span className={`absolute top-0 right-0 text-[6px] font-black px-1 rounded-bl-sm text-white ${currentCosmetics.border === b.id ? 'bg-amber-600' : 'bg-zinc-700'}`}>
                    OWNED
                  </span>
                )}
                <span className="absolute inset-0 flex items-end justify-center">
                  <span className="text-[6px] font-black uppercase bg-black/40 text-white px-1 rounded-t-sm w-full text-center truncate">{b.name}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Shop;