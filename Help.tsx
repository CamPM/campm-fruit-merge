
import React from 'react';

const Help: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-zinc-950 z-[101] flex flex-col pt-[env(safe-area-inset-top)] animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-6 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">FIELD MANUAL</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Operational Intelligence</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xl hover:bg-zinc-700 transition-colors">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-12 pb-20 max-w-2xl mx-auto">
        <section>
          <h3 className="text-amber-400 font-black text-sm uppercase mb-3 border-b border-amber-400/20 pb-1">Core Mechanics</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Drop items into the container. When two items of the same tier touch, they <strong className="text-white">FUSE</strong> into the next tier. There are <strong className="text-white">12 Tiers</strong> to discover in total.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The <strong className="text-red-500 italic">Death Line</strong> (red) at the top is sensitive. If an item rests above it for more than 1.5 seconds, the mission is aborted.
          </p>
        </section>

        <section>
          <h3 className="text-blue-400 font-black text-sm uppercase mb-3 border-b border-blue-400/20 pb-1">Tactical Power-Ups (Drag & Drop)</h3>
          <p className="text-zinc-400 text-sm mb-4">Power-ups now have an <strong className="text-amber-400">associated coin cost</strong>. Drag them from the HUD onto the board to use.</p>
          <ul className="space-y-6">
            <li className="flex gap-4 items-start">
              <span className="text-3xl bg-zinc-900 p-2 rounded-xl">💣</span>
              <div>
                <p className="text-white font-bold text-sm uppercase">Bomb ($75)</p>
                <p className="text-zinc-500 text-xs mt-1">Drag and release to clear an area. Highly effective for breaking jams.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="text-3xl bg-zinc-900 p-2 rounded-xl">🧹</span>
              <div>
                <p className="text-white font-bold text-sm uppercase">Broom ($150)</p>
                <p className="text-zinc-500 text-xs mt-1">Drag onto a fruit to eliminate all instances of that tier from the entire field.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="text-3xl bg-zinc-900 p-2 rounded-xl">✨</span>
              <div>
                <p className="text-white font-bold text-sm uppercase">Sparkle ($300)</p>
                <p className="text-zinc-500 text-xs mt-1">Drag onto a fruit to instantly evolve all fruits of that tier. Massive strategic advantage.</p>
              </div>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-green-400 font-black text-sm uppercase mb-3 border-b border-green-400/20 pb-1">The Economy & Shop</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Every merge earns currency. Higher tier merges result in massive payouts. Use coins to buy cosmetic upgrades or deploy tactical power-ups during gameplay.
          </p>
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
            <h4 className="text-zinc-300 font-bold text-xs uppercase mb-2">Shop Categories:</h4>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div className="text-zinc-500">Skins (8)</div>
              <div className="text-zinc-300">Affects Physics (Hard/Soft)</div>
              <div className="text-zinc-500">Outlines (4)</div>
              <div className="text-zinc-300">Visual style + Rainbow</div>
              <div className="text-zinc-500">Hitboxes (4)</div>
              <div className="text-zinc-300">Core shell visibility</div>
              <div className="text-zinc-500">Backgrounds (16)</div>
              <div className="text-zinc-300">Set the game vibe</div>
              <div className="text-zinc-500">Borders (16)</div>
              <div className="text-zinc-300">Play area boundary style</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;