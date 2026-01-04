import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameContainer from './GameContainer';
import Shop from './Shop';
import Help from './Help';
import Settings from './Settings';
import { CosmeticState, GameState } from './types';
import { THEMES, EMOJI_SETS, PRICING, COMBO_PHRASES, GAME_HEIGHT } from './constants';

const App: React.FC = () => {
  const [showShop, setShowShop] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [discoveredTiers, setDiscoveredTiers] = useState<number[]>([]);
  const [activeTiers, setActiveTiers] = useState<number[]>([]);
  const [fillLevel, setFillLevel] = useState(0); // 0 to 1
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('suika_muted') === 'true');
  const [gameKey, setGameKey] = useState(0);
  
  const [comboState, setComboState] = useState({
    count: 1,
    lastMergeTime: 0,
    displayText: '',
    showCombo: false
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

  const playBroomSound = useCallback(() => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }, [isMuted]);

  const playSparkleSound = useCallback(() => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + (i * 0.08));
      gain.gain.setValueAtTime(0.15, ctx.currentTime + (i * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + (i * 0.1));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (i * 0.08));
      osc.stop(ctx.currentTime + 1.0);
    });
  }, [isMuted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('suika_muted', String(nextMute));
  };

  const handleScoreChange = useCallback((newScore: number, tier: number) => {
    const now = Date.now();
    setComboState(prev => {
      let newCount = 1;
      if (now - prev.lastMergeTime < 2000) {
        newCount = Math.min(prev.count + 1, 5);
      }
      const phrases = COMBO_PHRASES[cosmetics.skin] || COMBO_PHRASES['sk_fruit'];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      return {
        count: newCount,
        lastMergeTime: now,
        displayText: newCount > 1 ? `${randomPhrase} ${newCount}x` : '',
        showCombo: newCount > 1
      };
    });

    setGameState(prev => {
      const multiplier = now - comboState.lastMergeTime < 2000 ? Math.min(comboState.count + 1, 5) : 1;
      const actualScoreGain = newScore * multiplier;
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
  }, [playPop, comboState, cosmetics.skin]);

  useEffect(() => {
    if (comboState.showCombo) {
      const timer = setTimeout(() => {
        setComboState(prev => ({ ...prev, showCombo: false }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [comboState.showCombo]);

  useEffect(() => {
    localStorage.setItem('suika_cosmetics', JSON.stringify(cosmetics));
  }, [cosmetics]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      currentTier: Math.floor(Math.random() * 5),
      nextTier: Math.floor(Math.random() * 5),
      isGameOver: false,
      activePowerUp: null,
    }));
    setComboState({ count: 1, lastMergeTime: 0, displayText: '', showCombo: false });
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

  const startPowerUpDrag = (type: 'bomb' | 'broom' | 'sparkle', e: React.MouseEvent | React.TouchEvent) => {
    const cost = PRICING[type];
    if (gameState.coins >= cost && !gameState.isGameOver) {
      setGameState(prev => ({ ...prev, activePowerUp: type }));
    }
  };

  const onPowerUpUsed = (type: 'bomb' | 'broom' | 'sparkle') => {
    const cost = PRICING[type];
    if (type === 'bomb') playBombSound();
    else if (type === 'broom') playBroomSound();
    else if (type === 'sparkle') playSparkleSound();

    setGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      activePowerUp: null
    }));
  };

  const currentTheme = THEMES.find(t => t.id === cosmetics.theme) || THEMES[0];
  const themeBgClass = currentTheme.bg;
  const isDarkTheme = themeBgClass.includes('950') || themeBgClass.includes('900') || themeBgClass.includes('black') || themeBgClass.includes('700') || themeBgClass.includes('600');
  const textColor = isDarkTheme ? 'text-white' : 'text-zinc-900';
  const mutedTextColor = isDarkTheme ? 'text-zinc-400' : 'text-zinc-500';

  const PowerUpButton = ({ type, emoji, cost }: { type: 'bomb' | 'broom' | 'sparkle', emoji: string, cost: number }) => {
    const canAfford = gameState.coins >= cost;
    const isActive = gameState.activePowerUp === type;
    return (
      <div className="flex flex-col items-center gap-1">
        <button 
          onMouseDown={(e) => startPowerUpDrag(type, e)}
          onTouchStart={(e) => startPowerUpDrag(type, e)}
          className={`w-full h-14 rounded-2xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing text-xl
            ${isActive ? 'bg-white scale-110 shadow-2xl z-50 ring-4 ring-white' : 'bg-zinc-800 text-white'}
            ${canAfford ? 'hover:bg-zinc-700 shadow-lg' : 'opacity-40 grayscale'}
            ${canAfford && !isActive ? 'ring-1 ring-amber-400/50' : ''}
          `}
        >
          {emoji}
        </button>
        <span className={`text-[9px] font-black tracking-tighter uppercase ${canAfford ? 'text-amber-400' : 'text-zinc-600'}`}>${cost}</span>
      </div>
    );
  };

  return (
    <div 
      className={`relative w-full h-[100dvh] overflow-hidden ${themeBgClass} flex flex-col items-center p-4 transition-colors duration-700`}
      onTouchStart={initAudio}
      onMouseDown={initAudio}
    >
      <div className="w-full max-w-[420px] pt-[env(safe-area-inset-top)] z-30 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-center w-full px-1 py-1">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowHelp(true)}
              className={`w-8 h-8 rounded-full bg-black/10 flex items-center justify-center ${textColor} hover:bg-black/20 transition-colors border border-white/10`}
            >
              ❓
            </button>
            <div className="bg-zinc-900/90 text-white h-8 px-3 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
              <span className="text-xs font-black">💰</span>
              <span className="text-[11px] font-black tabular-nums">{gameState.coins}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowShop(true)}
              className="bg-amber-400 text-amber-950 h-8 px-3 rounded-full flex items-center gap-1 shadow-sm border border-amber-500/50 hover:scale-105 transition-transform"
            >
              <span className="text-xs font-black">🛒</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">Shop</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className={`w-8 h-8 rounded-full bg-black/10 flex items-center justify-center ${textColor} hover:bg-black/20 transition-colors border border-white/10`}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Improved Progress / Tier Bar */}
        <div className="w-full bg-black/5 backdrop-blur-md rounded-xl p-2 border border-black/10 flex justify-between items-center px-4 shadow-inner h-8 overflow-hidden">
          {EMOJI_SETS[cosmetics.skin].map((emoji, idx) => {
            const isDiscovered = discoveredTiers.includes(idx);
            const isActiveOnBoard = activeTiers.includes(idx);
            const isLit = isDiscovered || isActiveOnBoard;
            return (
              <span 
                key={idx} 
                className={`text-[10px] transition-all duration-300 transform
                  ${isLit ? 'opacity-100 scale-125' : 'opacity-10 grayscale scale-90'}
                  ${isActiveOnBoard ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : ''}
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
        {/* Fullness Progress Bar */}
        <div className="absolute top-0 left-4 right-4 h-1.5 bg-black/20 rounded-full overflow-hidden z-40 border border-white/5 shadow-inner">
           <div 
             className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_currentColor] 
               ${fillLevel > 0.8 ? 'bg-red-500 animate-pulse' : fillLevel > 0.5 ? 'bg-amber-400' : 'bg-cyan-400'}`}
             style={{ width: `${Math.min(1, fillLevel) * 100}%` }}
           />
           {fillLevel > 0.8 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="text-[6px] font-black text-white uppercase tracking-tighter">Container Critical</span>
             </div>
           )}
        </div>

        {comboState.showCombo && (
          <div className="absolute inset-x-0 top-1/4 flex justify-center z-40 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm px-6 py-2 rounded-2xl shadow-2xl border-4 border-amber-400 animate-bounce scale-110">
              <span className="text-2xl font-black text-amber-600 italic tracking-tighter">
                {comboState.displayText}
              </span>
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
          usePowerUp={(type) => {
            if (type === null) {
              setGameState(prev => ({ ...prev, activePowerUp: null }));
            }
          }}
          onPowerUpEffected={(type) => onPowerUpUsed(type)}
        />
      </div>
        
      <div className="w-full max-w-[420px] pt-2 pb-[env(safe-area-inset-bottom)] z-10 shrink-0">
        <div className="grid grid-cols-3 gap-3 px-2">
          <PowerUpButton type="bomb" emoji="💣" cost={PRICING.bomb} />
          <PowerUpButton type="broom" emoji="🧹" cost={PRICING.broom} />
          <PowerUpButton type="sparkle" emoji="✨" cost={PRICING.sparkle} />
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur-xl animate-in fade-in duration-500">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 italic tracking-tighter drop-shadow-lg text-center">Game Over!</h2>
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="text-center">
              <p className="text-zinc-500 uppercase text-xs font-black tracking-[0.2em] mb-1">Current Score</p>
              <p className="text-white text-6xl font-black">{gameState.score}</p>
            </div>
            <div className="h-px w-24 bg-zinc-800" />
            <div className="text-center">
              <p className="text-zinc-500 uppercase text-xs font-black tracking-[0.2em] mb-1">High Score</p>
              <p className="text-zinc-300 text-3xl font-black">{gameState.highScore}</p>
            </div>
          </div>
          <button 
            onClick={restartGame}
            className="px-16 py-5 bg-white text-black font-black text-2xl rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-2xl"
          >
            RETRY
          </button>
        </div>
      )}

      {showShop && (
        <Shop 
          currentCosmetics={cosmetics} 
          coins={gameState.coins}
          onUpdate={setCosmetics}
          onDeductCoins={(amount) => setGameState(prev => ({ ...prev, coins: prev.coins - amount }))}
          onClose={() => setShowShop(false)} 
        />
      )}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}
      {showSettings && (
        <Settings 
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;
