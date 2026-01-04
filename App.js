
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameContainer from './GameContainer.js';
import Shop from './Shop.js';
import Help from './Help.js';
import Settings from './Settings.js';
import { CosmeticState, GameState } from './types.js';
import { THEMES, EMOJI_SETS, PRICING, COMBO_PHRASES, GAME_HEIGHT, GAME_WIDTH } from './constants.js';

const App: React.FC = () => {
  const [showShop, setShowShop] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [discoveredTiers, setDiscoveredTiers] = useState<number[]>([]);
  const [activeTiers, setActiveTiers] = useState<number[]>([]);
  const [fillLevel, setFillLevel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('suika_muted') === 'true');
  const [gameKey, setGameKey] = useState(0);
  
  const [comboState, setComboState] = useState({
    count: 1,
    lastMergeTime: 0,
    displayText: '',
    showCombo: false,
    x: 0,
    y: 0
  });
  
  const [cosmetics, setCosmetics] = useState<CosmeticState>(() => {
    const saved = localStorage.getItem('suika_cosmetics');
    return saved ? JSON.parse(saved) : {
      skin: 'sk_fruit',
      hitbox: 'hb_default',
      outline: 'ot_default',
      theme: 'th_0',
      border: 'bd_0',
      unlocked: ['sk_fruit', 'hb_default', 'ot_default', 'th_0', 'bd_0'],
    };
  });

  const [gameState, setGameState] = useState<GameState>(() => ({
    score: 0,
    highScore: parseInt(localStorage.getItem('suika_highscore') || '0'),
    coins: parseInt(localStorage.getItem('suika_coins') || '0'),
    currentTier: 0,
    nextTier: Math.floor(Math.random() * 5),
    isGameOver: false,
    activePowerUp: null,
  }));

  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playPop = useCallback(() => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [isMuted]);

  const playBombSound = useCallback(() => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    subGain.gain.setValueAtTime(0.8, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start();
    sub.stop(ctx.currentTime + 0.5);

    const bufferSize = ctx.sampleRate * 0.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  }, [isMuted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleScoreChange = useCallback((newScore: number, tier: number, x: number, y: number) => {
    const now = Date.now();
    let currentMult = 1;

    setComboState(prev => {
      let newCount = 1;
      // Capped multiplier at 5x as requested
      if (now - prev.lastMergeTime < 2000) {
        newCount = Math.min(prev.count + 1, 5);
      }
      currentMult = newCount;
      const phrases = COMBO_PHRASES[cosmetics.skin] || COMBO_PHRASES['sk_fruit'];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      return {
        count: newCount,
        lastMergeTime: now,
        displayText: newCount > 1 ? `${randomPhrase} ${newCount}x` : '',
        showCombo: newCount > 1,
        x, y
      };
    });

    setGameState(prev => {
      const actualScoreGain = newScore * currentMult;
      const addedCoins = (tier * 20);
      const updatedScore = prev.score + actualScoreGain;
      const updatedCoins = prev.coins + addedCoins;
      localStorage.setItem('suika_coins', updatedCoins.toString());
      if (updatedScore > prev.highScore) {
        localStorage.setItem('suika_highscore', updatedScore.toString());
        return { ...prev, score: updatedScore, highScore: updatedScore, coins: updatedCoins };
      }
      return { ...prev, score: updatedScore, coins: updatedCoins };
    });
    
    setDiscoveredTiers(prev => {
      if (!prev.includes(tier)) return [...prev, tier].sort((a,b) => a-b);
      return prev;
    });

    playPop();
  }, [playPop, cosmetics.skin]);

  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      currentTier: Math.floor(Math.random() * 5),
      nextTier: Math.floor(Math.random() * 5),
      isGameOver: false,
      activePowerUp: null,
    }));
    setComboState({ count: 1, lastMergeTime: 0, displayText: '', showCombo: false, x: 0, y: 0 });
    setDiscoveredTiers([]);
    setActiveTiers([]);
    setFillLevel(0);
    setGameKey(prev => prev + 1);
  }, []);

  const handleNextTier = () => {
    const droppedTier = gameState.currentTier;
    setDiscoveredTiers(prev => {
      if (!prev.includes(droppedTier)) return [...prev, droppedTier].sort((a,b) => a-b);
      return prev;
    });
    setGameState(prev => ({
      ...prev,
      currentTier: prev.nextTier,
      nextTier: Math.floor(Math.random() * 5)
    }));
  };

  const currentTheme = THEMES.find(t => t.id === cosmetics.theme) || THEMES[0];
  const themeBgClass = currentTheme.bg;
  const isDarkTheme = themeBgClass.includes('950') || themeBgClass.includes('900') || themeBgClass.includes('black') || themeBgClass.includes('700') || themeBgClass.includes('600');
  const textColor = isDarkTheme ? 'text-white' : 'text-zinc-900';
  const mutedTextColor = isDarkTheme ? 'text-zinc-400' : 'text-zinc-500';

  useEffect(() => {
    if (comboState.showCombo) {
      const timer = setTimeout(() => {
        setComboState(prev => ({ ...prev, showCombo: false }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [comboState.showCombo]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${themeBgClass} flex flex-col items-center p-4 transition-colors duration-700`}
      onTouchStart={initAudio}
      onMouseDown={initAudio}
    >
      <div className="w-full max-w-[420px] pt-[env(safe-area-inset-top)] z-30 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-center w-full px-1 py-1">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowHelp(true)} className={`w-8 h-8 rounded-full bg-black/10 flex items-center justify-center ${textColor} hover:bg-black/20 transition-colors border border-white/10`}>❓</button>
            <div className="bg-zinc-900/90 text-white h-8 px-3 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
              <span className="text-xs font-black">💰</span>
              <span className="text-[11px] font-black tabular-nums">{gameState.coins}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowShop(true)} className="bg-amber-400 text-amber-950 h-8 px-3 rounded-full flex items-center gap-1 shadow-sm border border-amber-500/50 hover:scale-105 transition-transform">
              <span className="text-xs font-black">🛒</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">Shop</span>
            </button>
            <button onClick={() => setShowSettings(true)} className={`w-8 h-8 rounded-full bg-black/10 flex items-center justify-center ${textColor} hover:bg-black/20 transition-colors border border-white/10`}>⚙️</button>
          </div>
        </div>

        <div className="w-full bg-black/5 backdrop-blur-md rounded-xl p-2 border border-black/10 flex justify-between items-center px-4 shadow-inner h-8 overflow-hidden">
          {EMOJI_SETS[cosmetics.skin].map((emoji, idx) => {
            const isLit = discoveredTiers.includes(idx) || activeTiers.includes(idx);
            const isOnBoard = activeTiers.includes(idx);
            return (
              <span 
                key={idx} 
                className={`text-[10px] transition-all duration-300 transform
                  ${isLit ? 'opacity-100 scale-125' : 'opacity-10 grayscale scale-90'}
                  ${isOnBoard ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : ''}
                `}
              >
                {emoji}
              </span>
            );
          })}
        </div>

        <div className="flex justify-between items-center px-4 py-1">
           <div className="flex flex-col min-w-[80px]">
              <span className={`${mutedTextColor} text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-0.5`}>Score</span>
              <span className={`${textColor} text-2xl font-black tabular-nums leading-none tracking-tighter`}>{gameState.score}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className={`${mutedTextColor} text-[7px] font-black uppercase tracking-widest mb-0.5 leading-none`}>Next</span>
              <div className="w-10 h-10 bg-black/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                 <span className="text-2xl">{EMOJI_SETS[cosmetics.skin]?.[gameState.nextTier] || '❓'}</span>
              </div>
            </div>
            <div className="flex flex-col items-end min-w-[80px]">
              <span className={`${mutedTextColor} text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-0.5`}>Best</span>
              <span className={`${mutedTextColor} text-xl font-black tabular-nums leading-none`}>{gameState.highScore}</span>
            </div>
        </div>
      </div>

      <div className="relative w-full max-w-[420px] flex-1 min-h-0 mt-2 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-4 right-4 h-1.5 bg-black/20 rounded-full overflow-hidden z-40 border border-white/5 shadow-inner">
           <div 
             className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_currentColor] 
               ${fillLevel > 0.8 ? 'bg-red-500 animate-pulse' : fillLevel > 0.5 ? 'bg-amber-400' : 'bg-cyan-400'}`}
             style={{ width: `${Math.min(1, fillLevel) * 100}%` }}
           />
        </div>

        {comboState.showCombo && (
          <div 
            className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-50 slide-in-from-bottom-2 duration-300"
            style={{ 
              left: `${(comboState.x / GAME_WIDTH) * 100}%`, 
              top: `${(comboState.y / GAME_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border-4 border-amber-400 scale-110">
              <span className="text-xl font-black text-amber-600 italic tracking-tighter">{comboState.displayText}</span>
            </div>
          </div>
        )}

        <GameContainer 
          key={gameKey}
          cosmetics={cosmetics}
          gameState={gameState}
          onScoreChange={handleScoreChange}
          onGameOver={() => setGameState(prev => ({ ...prev, isGameOver: true }))}
          onNextTier={handleNextTier}
          onTiersChange={setActiveTiers}
          onFillLevel={setFillLevel}
          usePowerUp={(type) => setGameState(prev => ({ ...prev, activePowerUp: type }))}
          onPowerUpEffected={(type) => {
            if (type === 'bomb') playBombSound();
            setGameState(prev => ({ ...prev, coins: prev.coins - PRICING[type], activePowerUp: null }));
          }}
        />
      </div>
        
      <div className="w-full max-w-[420px] pt-2 pb-[env(safe-area-inset-bottom)] z-10 shrink-0">
        <div className="grid grid-cols-3 gap-3 px-2">
          {['bomb', 'broom', 'sparkle'].map((type) => {
            const cost = PRICING[type as keyof typeof PRICING];
            const canAfford = gameState.coins >= cost;
            const emoji = type === 'bomb' ? '💣' : type === 'broom' ? '🧹' : '✨';
            return (
              <div key={type} className="flex flex-col items-center gap-1">
                <button 
                  onMouseDown={() => canAfford && !gameState.isGameOver && setGameState(prev => ({ ...prev, activePowerUp: type as any }))}
                  onTouchStart={() => canAfford && !gameState.isGameOver && setGameState(prev => ({ ...prev, activePowerUp: type as any }))}
                  className={`w-full h-14 rounded-2xl flex items-center justify-center transition-all text-xl
                    ${gameState.activePowerUp === type ? 'bg-white scale-110 shadow-2xl ring-4 ring-white' : 'bg-zinc-800 text-white'}
                    ${canAfford ? 'hover:bg-zinc-700 shadow-lg' : 'opacity-40 grayscale'}
                  `}
                >
                  {emoji}
                </button>
                <span className={`text-[9px] font-black uppercase ${canAfford ? 'text-amber-400' : 'text-zinc-600'}`}>${cost}</span>
              </div>
            );
          })}
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 backdrop-blur-2xl animate-in fade-in duration-700">
          <div className="flex flex-col items-center p-8 bg-zinc-900 border-4 border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-[320px] w-full text-center">
            <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">GAME OVER!</h2>
            <div className="w-full h-1 bg-white/10 rounded-full mb-6" />
            
            <div className="flex flex-col gap-1 mb-8">
              <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest leading-none">Your Final Score</span>
              <span className="text-white text-6xl font-black tracking-tighter leading-none">{gameState.score}</span>
            </div>

            <div className="flex flex-col gap-1 mb-10 p-4 bg-white/5 rounded-2xl w-full border border-white/5">
              <span className="text-amber-500 uppercase text-[10px] font-black tracking-widest leading-none">Personal Best</span>
              <span className="text-white text-2xl font-black tabular-nums">{gameState.highScore}</span>
            </div>

            <button 
              onClick={restartGame} 
              className="w-full py-5 bg-white text-black font-black text-2xl rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {showShop && <Shop currentCosmetics={cosmetics} coins={gameState.coins} onUpdate={setCosmetics} onDeductCoins={(a) => setGameState(prev => ({ ...prev, coins: prev.coins - a }))} onClose={() => setShowShop(false)} />}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}
      {showSettings && <Settings isMuted={isMuted} isFullscreen={isFullscreen} onToggleMute={() => { setIsMuted(!isMuted); localStorage.setItem('suika_muted', String(!isMuted)); }} onToggleFullscreen={toggleFullscreen} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
