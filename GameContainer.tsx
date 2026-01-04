import React, { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CosmeticState, GameState, PhysicsProps } from './types';
import { PHYSICS_HIERARCHY, GAME_WIDTH, GAME_HEIGHT, EMOJI_SETS, TIER_COLORS, THEMES, BORDERS } from './constants';

interface GameContainerProps {
  cosmetics: CosmeticState;
  gameState: GameState;
  onScoreChange: (score: number, tier: number) => void;
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
  position: Matter.Vector;
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

const getRainbowColor = (offset = 0) => {
  const hue = (Date.now() / 20 + offset) % 360;
  return `hsl(${hue}, 80%, 60%)`;
};

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
  const effectsRef = useRef<TransientEffect[]>([]);
  const shakeIntensityRef = useRef(0);
  const deathTimerStartRef = useRef<number | null>(null);

  const getRadius = (tier: number) => tier * 10 + 22;

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

  const handleMerge = (bodyA: SuikaBody, bodyB: SuikaBody) => {
    if (bodyA.tier === bodyB.tier && bodyA.tier < 11) {
      const newX = (bodyA.position.x + bodyB.position.x) / 2;
      const newY = (bodyA.position.y + bodyB.position.y) / 2;
      const newTier = bodyA.tier + 1;
      
      Matter.Composite.remove(engineRef.current.world, [bodyA, bodyB]);
      const newFruit = createFruit(newX, newY, newTier);
      Matter.Composite.add(engineRef.current.world, newFruit);
      
      onScoreChange((newTier + 1) * 10, newTier);
    }
  };

  useEffect(() => {
    const engine = engineRef.current;
    engine.gravity.y = 1.0;

    const ground = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 250, GAME_WIDTH * 2, 500, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(-250, GAME_HEIGHT / 2, 500, GAME_HEIGHT * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(GAME_WIDTH + 250, GAME_HEIGHT / 2, 500, GAME_HEIGHT * 2, { isStatic: true });
    
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
          handleMerge(bodyA as SuikaBody, bodyB as SuikaBody);
        }
      });
    });

    return () => Matter.Engine.clear(engine);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Apply screen shake
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
    const pulse = Math.sin(now / 150);
    const globalRainbow = getRainbowColor();

    // Death Line Check Logic
    const deathY = 80;
    const DEATH_THRESHOLD = 2000;
    const fruitsAboveLine = bodies.filter(b => 
      b.label === 'fruit' && 
      !b.isStatic && 
      (b.position.y - getRadius(b.tier)) < deathY && 
      now - b.birthTime > 1000
    );

    if (fruitsAboveLine.length > 0) {
      if (!deathTimerStartRef.current) deathTimerStartRef.current = now;
      const elapsed = now - deathTimerStartRef.current;
      if (elapsed > DEATH_THRESHOLD) {
        onGameOver();
      }
    } else {
      deathTimerStartRef.current = null;
    }

    // Tier Tracking and Filling Level
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
      if (onTiersChange) onTiersChange(Array.from(activeTiersSet).sort((a,b) => a-b));
      if (onFillLevel) {
        // Calculate percentage: 0 is empty (GAME_HEIGHT), 1 is death line (deathY)
        const fillP = (GAME_HEIGHT - highestY) / (GAME_HEIGHT - deathY);
        onFillLevel(Math.max(0, fillP));
      }
    }

    let highlightTier: number | null = null;
    if (gameState.activePowerUp === 'broom' || gameState.activePowerUp === 'sparkle') {
      const hovered = bodies.find(b => {
        if (b.label !== 'fruit' || b.isStatic) return false;
        const d = Math.sqrt(Math.pow(b.position.x - touchPosRef.current.x, 2) + Math.pow(b.position.y - touchPosRef.current.y, 2));
        return d < getRadius(b.tier);
      });
      if (hovered) highlightTier = hovered.tier;
    }

    bodies.forEach(body => {
      if (body.label !== 'fruit') return;

      if (body.sq > 1.0) body.sq -= 0.05;
      if (body.sq < 1.0) body.sq = 1.0;

      const radius = getRadius(body.tier) * body.sq;
      const emoji = EMOJI_SETS[cosmetics.skin]?.[body.tier] || '❓';
      const tierColor = TIER_COLORS[body.tier] || '#fff';

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      // Enhanced Proximity Hazard Glow
      const topOfFruit = body.position.y - (getRadius(body.tier) * body.sq);
      const distToLine = topOfFruit - deathY; 
      const dangerRange = 80;

      if (distToLine < dangerRange && !body.isStatic && now - body.birthTime > 500) {
        const dangerFactor = Math.min(1.5, Math.max(0, 1 - (distToLine / dangerRange)));
        ctx.save();
        ctx.shadowBlur = 10 + dangerFactor * 30;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.9)';
        ctx.strokeStyle = `rgba(255, 0, 0, ${Math.min(1, 0.3 + dangerFactor)})`;
        ctx.lineWidth = 3 + dangerFactor * 8;
        const hazardPulse = Math.abs(Math.sin(now / 100)) * dangerFactor;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 2 + hazardPulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      let isTargeted = false;
      if (gameState.activePowerUp === 'bomb') {
        const dist = Math.sqrt(Math.pow(body.position.x - touchPosRef.current.x, 2) + Math.pow(body.position.y - touchPosRef.current.y, 2));
        if (dist < 80 + getRadius(body.tier)) isTargeted = true;
      } else if (highlightTier !== null && body.tier === highlightTier) {
        isTargeted = true;
      }

      if (isTargeted) {
        ctx.shadowBlur = 20 + pulse * 10;
        const glowColor = gameState.activePowerUp === 'bomb' ? '#ef4444' : (gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7');
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 5 + pulse * 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([15, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      
      ctx.save();
      if (cosmetics.hitbox === 'hb_default') {
        ctx.fillStyle = `${tierColor}33`;
        ctx.fill();
      } else if (cosmetics.hitbox === 'hb_white') {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
      } else if (cosmetics.hitbox === 'hb_rainbow') {
        ctx.fillStyle = globalRainbow.replace(')', ', 0.3)');
        ctx.fill();
      }
      ctx.restore();
      
      if (cosmetics.outline !== 'ot_none') {
        let outlineColor = tierColor;
        if (cosmetics.outline === 'ot_rainbow') outlineColor = globalRainbow;
        if (cosmetics.outline === 'ot_white') outlineColor = '#FFFFFF';
        if (cosmetics.outline === 'ot_black') outlineColor = '#000000';

        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = cosmetics.outline === 'ot_thick' ? 4 : 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      ctx.font = `${radius * 1.3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    });

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

    // Interaction & UI Overlays
    if (!gameState.isGameOver) {
      ctx.save();
      
      // Death Line Visualization
      const isDying = deathTimerStartRef.current !== null;
      const elapsedDeath = isDying ? now - deathTimerStartRef.current! : 0;
      const deathProgress = isDying ? Math.min(elapsedDeath / DEATH_THRESHOLD, 1) : 0;

      ctx.beginPath();
      ctx.lineWidth = isDying ? 8 + Math.abs(Math.sin(now / 50)) * 8 : 2;
      ctx.strokeStyle = isDying 
        ? `rgba(255, ${Math.floor((1-deathProgress) * 255)}, 0, 1)` 
        : 'rgba(239, 68, 68, 0.6)';
      
      if (isDying) {
        ctx.shadowBlur = 25 + deathProgress * 40;
        ctx.shadowColor = 'red';
      }
      ctx.moveTo(0, deathY);
      ctx.lineTo(GAME_WIDTH, deathY);
      ctx.stroke();

      if (isDying) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        const timeLeft = Math.max(0, (DEATH_THRESHOLD - elapsedDeath) / 1000).toFixed(1);
        ctx.fillText(`CRITICAL: ${timeLeft}s`, GAME_WIDTH / 2, deathY - 25);
      }
      ctx.restore();

      ctx.save();
      if (gameState.activePowerUp) {
        const x = touchPosRef.current.x;
        const y = touchPosRef.current.y;
        if (gameState.activePowerUp === 'bomb') {
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(now / 100) * 0.3})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.stroke();
          ctx.font = '48px Arial'; ctx.textAlign = 'center';
          ctx.fillText('💣', x, y - 60 + Math.sin(now / 200) * 10);
        } else {
          const color = gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7';
          ctx.strokeStyle = color; ctx.lineWidth = 4;
          const sz = 40;
          ctx.beginPath(); ctx.moveTo(x - sz, y); ctx.lineTo(x + sz, y); ctx.moveTo(x, y - sz); ctx.lineTo(x, y + sz); ctx.stroke();
          ctx.beginPath(); ctx.arc(x, y, 25 + pulse * 15, 0, Math.PI * 2); ctx.stroke();
          ctx.font = '48px Arial'; ctx.textAlign = 'center';
          ctx.fillText(gameState.activePowerUp === 'broom' ? '🧹' : '✨', x, y - 60 + Math.sin(now / 200) * 10);
        }
      } else {
        const dropX = touchPosRef.current.x;
        const radius = getRadius(gameState.currentTier);
        const emoji = EMOJI_SETS[cosmetics.skin]?.[gameState.currentTier] || '❓';
        
        ctx.save();
        ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
        ctx.setLineDash([12, 6]);
        ctx.beginPath(); ctx.moveTo(dropX, 85); ctx.lineTo(dropX, GAME_HEIGHT); ctx.stroke();
        ctx.restore();

        ctx.font = `${radius * 1.5}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(emoji, dropX, 40);
      }
      ctx.restore();
    }
    ctx.restore();

    requestRef.current = requestAnimationFrame(render);
  }, [cosmetics, gameState, onGameOver, onTiersChange, onFillLevel]);

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
      const x = touchPosRef.current.x;
      const y = touchPosRef.current.y;
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
          onScoreChange(affected.length * 5, 0);
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
          return d < getRadius(b.tier);
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
            onScoreChange(sameTier.length * 10, tierToProcess);
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
            onScoreChange(sameTier.length * 2, tierToProcess + 1);
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

  const selectedBorder = BORDERS.find(b => b.id === cosmetics.border) || BORDERS[0];

  return (
    <div 
      className={`relative w-full h-full border-[8px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 bg-white/5 ${selectedBorder.color} ${gameState.isGameOver ? 'scale-95 blur-sm' : ''}`}
      onMouseMove={onInteraction}
      onTouchMove={onInteraction}
      onMouseUp={onRelease}
      onTouchEnd={onRelease}
    >
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full object-contain pointer-events-none" />
    </div>
  );
};

export default GameContainer;
