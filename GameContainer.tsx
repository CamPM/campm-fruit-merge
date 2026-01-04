
import React, { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CosmeticState, GameState, PhysicsProps } from './types';
import { PHYSICS_HIERARCHY, GAME_WIDTH, GAME_HEIGHT, EMOJI_SETS, TIER_COLORS, BORDERS } from './constants';

interface GameContainerProps {
  cosmetics: CosmeticState;
  gameState: GameState;
  onScoreChange: (score: number, tier: number, x: number, y: number) => void;
  onGameOver: () => void;
  onNextTier: () => void;
  onTiersChange?: (tiers: number[]) => void;
  onFillLevel?: (level: number) => void;
  usePowerUp: (type: 'bomb' | 'broom' | 'sparkle' | null) => void;
  onPowerUpEffected?: (type: 'bomb' | 'broom' | 'sparkle') => void;
}

interface SuikaBody extends Matter.Body {
  tier: number;
  sq: number;
  birthTime: number;
  position: { x: number; y: number };
  angle: number;
  label: string;
  isStatic: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  emoji?: string;
}

interface TransientEffect {
  type: 'bomb' | 'broom' | 'sparkle';
  x: number;
  y: number;
  startTime: number;
  duration: number;
  radius?: number;
  particles?: Particle[];
}

const GameContainer: React.FC<GameContainerProps> = ({ 
  cosmetics, 
  gameState, 
  onScoreChange, 
  onGameOver,
  onNextTier,
  onTiersChange,
  onFillLevel,
  usePowerUp,
  onPowerUpEffected
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const requestRef = useRef<number>();
  const touchPosRef = useRef({ x: GAME_WIDTH / 2, y: 0 });
  const cooldownRef = useRef(false);
  const deathTimerStartRef = useRef<number | null>(null);
  const effectsRef = useRef<TransientEffect[]>([]);
  const shakeIntensityRef = useRef(0);

  const getRadius = (tier: number) => tier * 10 + 22;

  const createParticles = (x: number, y: number, count: number, color: string, speed = 5, emoji?: string): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = Math.random() * speed + speed/2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 1,
        maxLife: Math.random() * 0.5 + 0.5,
        color,
        size: Math.random() * 4 + 2,
        emoji
      });
    }
    return particles;
  };

  const createFruit = (x: number, y: number, tier: number, isStatic = false): SuikaBody => {
    const physics: PhysicsProps = PHYSICS_HIERARCHY[cosmetics.skin] || { restitution: 0.5, friction: 0.02 };
    const radius = getRadius(tier);
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: physics.restitution,
      friction: physics.friction,
      label: 'fruit',
      isStatic: isStatic,
      collisionFilter: { group: isStatic ? -1 : 0 },
      density: 0.001 * (tier + 1)
    }) as SuikaBody;
    body.tier = tier;
    body.sq = 1.5;
    body.birthTime = Date.now();
    return body;
  };

  useEffect(() => {
    const engine = engineRef.current;
    engine.gravity.y = 1.2;
    const ground = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 250, GAME_WIDTH * 2, 500, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(-250, GAME_HEIGHT / 2, 500, GAME_HEIGHT * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(GAME_WIDTH + 250, GAME_HEIGHT / 2, 500, GAME_HEIGHT * 2, { isStatic: true });
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    const collisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
          const a = bodyA as SuikaBody;
          const b = bodyB as SuikaBody;
          if (a.tier === b.tier && a.tier < 11) {
            const newX = (a.position.x + b.position.x) / 2;
            const newY = (a.position.y + b.position.y) / 2;
            const newTier = a.tier + 1;
            Matter.Composite.remove(engine.world, [a, b]);
            Matter.Composite.add(engine.world, createFruit(newX, newY, newTier));
            onScoreChange((newTier + 1) * 10, newTier, newX, newY);
          }
        }
      });
    };

    Matter.Events.on(engine, 'collisionStart', collisionHandler);
    return () => {
      Matter.Events.off(engine, 'collisionStart', collisionHandler);
      Matter.Engine.clear(engine);
    };
  }, [cosmetics.skin, onScoreChange]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    if (shakeIntensityRef.current > 0) {
      const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
      const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
      ctx.translate(dx, dy);
      shakeIntensityRef.current *= 0.92;
      if (shakeIntensityRef.current < 0.1) shakeIntensityRef.current = 0;
    }

    const bodies = Matter.Composite.allBodies(engineRef.current.world) as SuikaBody[];
    const now = Date.now();
    const deathY = 85;
    const DEATH_THRESHOLD = 2000;

    const fruitsAboveLine = bodies.filter(b => 
      b.label === 'fruit' && !b.isStatic && (b.position.y - getRadius(b.tier)) < deathY && now - b.birthTime > 1200
    );

    if (fruitsAboveLine.length > 0) {
      if (!deathTimerStartRef.current) deathTimerStartRef.current = now;
      if (now - deathTimerStartRef.current > DEATH_THRESHOLD) onGameOver();
    } else {
      deathTimerStartRef.current = null;
    }

    if (onTiersChange || onFillLevel) {
      const activeTiersSet = new Set<number>();
      let highestY = GAME_HEIGHT;
      bodies.forEach(b => {
        if (b.label === 'fruit' && !b.isStatic) {
          activeTiersSet.add(b.tier);
          const topY = b.position.y - getRadius(b.tier);
          if (topY < highestY) highestY = topY;
        }
      });
      onTiersChange?.(Array.from(activeTiersSet).sort((a, b) => a - b));
      const fillP = (GAME_HEIGHT - highestY) / (GAME_HEIGHT - deathY);
      onFillLevel?.(Math.max(0, fillP));
    }

    let highlightTier: number | null = null;
    if (gameState.activePowerUp === 'broom' || gameState.activePowerUp === 'sparkle') {
      const hovered = bodies.find(b => {
        if (b.label !== 'fruit' || b.isStatic) return false;
        const d = Math.sqrt(Math.pow(b.position.x - touchPosRef.current.x, 2) + Math.pow(b.position.y - touchPosRef.current.y, 2));
        return d < getRadius(b.tier) + 20;
      });
      if (hovered) highlightTier = hovered.tier;
    }

    // Pass 1: Draw Hitboxes, Outlines, and Targeting Glows (The Background Layer)
    bodies.forEach(body => {
      if (body.label !== 'fruit') return;
      if (body.sq > 1.0) body.sq -= 0.05;

      const radius = getRadius(body.tier) * body.sq;
      const tierColor = TIER_COLORS[body.tier];

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      // Danger logic
      const topOfFruit = body.position.y - (getRadius(body.tier) * body.sq);
      const distToLine = topOfFruit - deathY;
      if (distToLine < 100 && !body.isStatic && now - body.birthTime > 500) {
        const intensity = Math.max(0, 1 - (distToLine / 100));
        ctx.shadowBlur = intensity * 30;
        ctx.shadowColor = 'red';
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + intensity * 0.6})`;
        ctx.lineWidth = 2 + intensity * 6;
        ctx.beginPath(); ctx.arc(0, 0, radius + 2, 0, Math.PI * 2); ctx.stroke();
      }

      // Targeting Logic
      let isTargeted = false;
      if (gameState.activePowerUp === 'bomb') {
        const dist = Math.sqrt(Math.pow(body.position.x - touchPosRef.current.x, 2) + Math.pow(body.position.y - touchPosRef.current.y, 2));
        if (dist < 80 + getRadius(body.tier)) isTargeted = true;
      } else if (highlightTier !== null && body.tier === highlightTier) {
        isTargeted = true;
      }

      if (isTargeted) {
        const pulse = 0.5 + Math.sin(now / 150) * 0.5;
        ctx.shadowBlur = 40 + pulse * 20;
        const glowColor = gameState.activePowerUp === 'bomb' ? '#ef4444' : (gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7');
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 4 + pulse * 6;
        ctx.beginPath(); ctx.arc(0, 0, radius + 8, 0, Math.PI * 2); ctx.stroke();
      }

      // Hitbox: Semi-transparent shell
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = cosmetics.hitbox === 'hb_default' ? tierColor + '66' : (cosmetics.hitbox === 'hb_transparent' ? 'transparent' : (cosmetics.hitbox === 'hb_white' ? '#FFFFFF66' : 'transparent'));
      ctx.fill();

      // Outline: Opaque boundary reflecting shop selection
      if (cosmetics.outline !== 'ot_none') {
        let outlineColor = tierColor;
        if (cosmetics.outline === 'ot_white') outlineColor = '#FFFFFF';
        else if (cosmetics.outline === 'ot_black') outlineColor = '#000000';
        else if (cosmetics.outline === 'ot_rainbow') outlineColor = `hsl(${(now / 10) % 360}, 80%, 60%)`;
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Pass 2: Draw Emojis (The Foreground Layer)
    bodies.forEach(body => {
      if (body.label !== 'fruit') return;
      const radius = getRadius(body.tier) * body.sq;
      const emoji = EMOJI_SETS[cosmetics.skin]?.[body.tier] || '❓';

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      
      // Fruit Emoji: Opaque foreground
      ctx.font = `${radius * 1.3}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    });

    // Particle/Transient Effects
    effectsRef.current = effectsRef.current.filter(effect => {
      const elapsed = now - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1);
      
      if (effect.particles) {
        effect.particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
          if (p.life > 0) {
            ctx.save();
            ctx.globalAlpha = p.life;
            if (p.emoji) {
              ctx.font = `${p.size * 5}px Arial`;
              ctx.fillText(p.emoji, p.x, p.y);
            } else {
              ctx.fillStyle = p.color;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
        });
      }

      ctx.save();
      ctx.translate(effect.x, effect.y);
      if (effect.type === 'bomb') {
        const ringRadius = 80 + (progress * 250);
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 15 * (1 - progress);
        ctx.beginPath(); ctx.arc(0, 0, ringRadius, 0, Math.PI * 2); ctx.stroke();
      } else if (effect.type === 'broom') {
        const sweepProgress = Math.sin(progress * Math.PI);
        ctx.globalAlpha = sweepProgress * 0.8;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(0, 0, (effect.radius || 30) * (1 + sweepProgress), 0, Math.PI * 2); ctx.fill();
      } else if (effect.type === 'sparkle') {
        const ringRadius = (effect.radius || 30) * (1 + progress * 2);
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(0, 0, ringRadius, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      
      const hasLiveParticles = effect.particles ? effect.particles.some(p => p.life > 0) : false;
      return progress < 1 || hasLiveParticles;
    });

    if (!gameState.isGameOver) {
      ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = deathTimerStartRef.current ? 'red' : 'rgba(239, 68, 68, 0.4)';
      ctx.moveTo(0, deathY); ctx.lineTo(GAME_WIDTH, deathY); ctx.stroke();
      
      if (deathTimerStartRef.current) {
        const timeLeft = Math.max(0, (DEATH_THRESHOLD - (now - deathTimerStartRef.current)) / 1000).toFixed(1);
        ctx.fillStyle = 'red'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`CRITICAL: ${timeLeft}s`, GAME_WIDTH / 2, deathY - 15);
      }

      if (gameState.activePowerUp) {
        const { x, y } = touchPosRef.current;
        const emoji = gameState.activePowerUp === 'bomb' ? '💣' : gameState.activePowerUp === 'broom' ? '🧹' : '✨';
        const glowColor = gameState.activePowerUp === 'bomb' ? '#ef4444' : (gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7');
        
        ctx.save();
        ctx.shadowBlur = 50;
        ctx.shadowColor = glowColor;
        ctx.font = '70px Arial'; 
        ctx.textAlign = 'center';
        ctx.fillText(emoji, x, y > 150 ? y : 150);
        ctx.restore();
      } else {
        const dropX = touchPosRef.current.x;
        ctx.font = `${getRadius(gameState.currentTier) * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(EMOJI_SETS[cosmetics.skin][gameState.currentTier], dropX, 45);
      }
    }

    ctx.restore();
    requestRef.current = requestAnimationFrame(render);
  }, [cosmetics, gameState, onGameOver, onTiersChange, onFillLevel, onScoreChange]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [render]);

  const onInteraction = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * GAME_HEIGHT;
    touchPosRef.current = { 
      x: Math.max(25, Math.min(GAME_WIDTH - 25, x)), 
      y: Math.max(0, Math.min(GAME_HEIGHT, y)) 
    };
  };

  const onRelease = () => {
    if (gameState.isGameOver) return;
    
    if (gameState.activePowerUp) {
      const bodies = Matter.Composite.allBodies(engineRef.current.world) as SuikaBody[];
      const { x, y } = touchPosRef.current;
      const type = gameState.activePowerUp;
      let used = false;

      if (type === 'bomb') {
        const affected = bodies.filter(b => {
          if (b.label !== 'fruit') return false;
          const d = Math.sqrt(Math.pow(b.position.x - x, 2) + Math.pow(b.position.y - y, 2));
          return d < 80 + getRadius(b.tier);
        });
        if (affected.length > 0) {
          Matter.Composite.remove(engineRef.current.world, affected);
          onScoreChange(affected.length * 5, 0, x, y);
          effectsRef.current.push({ 
            type: 'bomb', x, y, startTime: Date.now(), duration: 600,
            particles: createParticles(x, y, 40, '#ef4444', 12)
          });
          shakeIntensityRef.current = 25;
          used = true;
        }
      } else {
        const hovered = bodies.find(b => {
          if (b.label !== 'fruit' || b.isStatic) return false;
          const d = Math.sqrt(Math.pow(b.position.x - x, 2) + Math.pow(b.position.y - y, 2));
          return d < getRadius(b.tier) + 50;
        });

        if (hovered) {
          const tierToProcess = hovered.tier;
          const sameTier = bodies.filter(b => b.tier === tierToProcess && b.label === 'fruit');
          
          if (type === 'broom') {
            Matter.Composite.remove(engineRef.current.world, sameTier);
            sameTier.forEach(b => {
              effectsRef.current.push({ 
                type: 'broom', x: b.position.x, y: b.position.y, startTime: Date.now(), duration: 500, radius: getRadius(b.tier),
                particles: createParticles(b.position.x, b.position.y, 15, '#f59e0b', 8)
              });
            });
            onScoreChange(sameTier.length * 10, tierToProcess, x, y);
            used = true;
          } else if (type === 'sparkle') {
            sameTier.forEach(b => {
              if (b.tier < 11) {
                const bx = b.position.x; const by = b.position.y; const br = getRadius(b.tier);
                Matter.Composite.remove(engineRef.current.world, b);
                Matter.Composite.add(engineRef.current.world, createFruit(bx, by, b.tier + 1));
                effectsRef.current.push({ 
                  type: 'sparkle', x: bx, y: by, startTime: Date.now(), duration: 800, radius: br,
                  particles: createParticles(bx, by, 10, '#a855f7', 6, '⭐')
                });
              }
            });
            onScoreChange(sameTier.length * 2, tierToProcess + 1, x, y);
            used = true;
          }
        }
      }
      
      if (used && onPowerUpEffected) {
        onPowerUpEffected(type);
      } else {
        usePowerUp(null);
      }
      return;
    }

    if (cooldownRef.current) return;
    Matter.Composite.add(engineRef.current.world, createFruit(touchPosRef.current.x, 100, gameState.currentTier));
    onNextTier();
    cooldownRef.current = true;
    setTimeout(() => cooldownRef.current = false, 700);
  };

  return (
    <div 
      className={`relative w-full h-full border-[8px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 bg-white/5 ${BORDERS.find(b => b.id === cosmetics.border)?.color}`}
      onMouseMove={onInteraction} onTouchMove={onInteraction}
      onMouseUp={onRelease} onTouchEnd={onRelease}
    >
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full object-contain pointer-events-none" />
    </div>
  );
};

export default GameContainer;