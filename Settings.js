
import React from 'react';

interface SettingsProps {
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isMuted, isFullscreen, onToggleMute, onToggleFullscreen, onClose }) => {
  return (
    <div className="fixed inset-0 bg-zinc-950/95 z-[102] flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xl hover:bg-zinc-700 transition-colors"
        >
          ✕
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-white italic tracking-tighter">SETTINGS</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Global Preferences</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-white font-black text-xs uppercase tracking-wider">Audio Output</span>
              <span className="text-zinc-500 text-[10px] font-bold">{isMuted ? 'Muted' : 'Active'}</span>
            </div>
            <button 
              onClick={onToggleMute}
              className={`w-14 h-8 rounded-full p-1 transition-colors relative ${isMuted ? 'bg-zinc-700' : 'bg-amber-500'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md flex items-center justify-center text-[10px] ${isMuted ? 'translate-x-0' : 'translate-x-6'}`}>
                {isMuted ? '🔇' : '🔊'}
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-white font-black text-xs uppercase tracking-wider">Display Mode</span>
              <span className="text-zinc-500 text-[10px] font-bold">{isFullscreen ? 'Fullscreen' : 'Windowed'}</span>
            </div>
            <button 
              onClick={onToggleFullscreen}
              className={`w-14 h-8 rounded-full p-1 transition-colors relative ${isFullscreen ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md flex items-center justify-center text-[10px] ${isFullscreen ? 'translate-x-6' : 'translate-x-0'}`}>
                {isFullscreen ? '⇙' : '⇗'}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.3em]">Fruit Merge v1.5.9</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
