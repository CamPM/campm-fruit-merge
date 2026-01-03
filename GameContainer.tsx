
import React, { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CosmeticState, GameState, PhysicsProps } from '../types';
import { PHYSICS_HIERARCHY, GAME_WIDTH, GAME_HEIGHT, EMOJI_SETS, TIER_COLORS, THEMES } from '../constants';

interface GameContainerProps {
  cosmetics: CosmeticState;
  gameState: GameState;
  onScoreChange: (score: number, tier: number) => void;
  onGameOver: () => void;
  onNextTier: () => void;
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
  usePowerUp,
  onPowerUpEffected
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const requestRef = useRef<number>();
  const touchPosRef = useRef({ x: GAME_WIDTH / 2, y: 0 });
  const cooldownRef = useRef(false);

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

    const bodies = Matter.Composite.allBodies(engineRef.current.world) as SuikaBody[];
    const now = Date.now();
    const pulse = Math.sin(now / 150);
    const globalRainbow = getRainbowColor();

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

      if (!body.isStatic && body.position.y < 80 && now - body.birthTime > 1500) {
        onGameOver();
      }

      const radius = getRadius(body.tier) * body.sq;
      const emoji = EMOJI_SETS[cosmetics.skin]?.[body.tier] || '❓';
      const tierColor = TIER_COLORS[body.tier] || '#fff';

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      let isTargeted = false;
      if (gameState.activePowerUp === 'bomb') {
        const dist = Math.sqrt(Math.pow(body.position.x - touchPosRef.current.x, 2) + Math.pow(body.position.y - touchPosRef.current.y, 2));
        if (dist < 80 + getRadius(body.tier)) isTargeted = true;
      } else if (highlightTier !== null && body.tier === highlightTier) {
        isTargeted = true;
      }

      if (isTargeted) {
        ctx.shadowBlur = 15 + pulse * 5;
        const glowColor = gameState.activePowerUp === 'bomb' ? '#ef4444' : (gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7');
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 4 + pulse * 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
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

    if (!gameState.isGameOver) {
      ctx.save();
      if (gameState.activePowerUp) {
        const x = touchPosRef.current.x;
        const y = touchPosRef.current.y;
        if (gameState.activePowerUp === 'bomb') {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.beginPath();
          ctx.arc(x, y, 80, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = '24px Arial';
          ctx.fillText('💣', x, y - 40);
        } else {
          ctx.strokeStyle = gameState.activePowerUp === 'broom' ? '#f59e0b' : '#a855f7';
          ctx.lineWidth = 2;
          const sz = 20;
          ctx.beginPath();
          ctx.moveTo(x - sz, y); ctx.lineTo(x + sz, y);
          ctx.moveTo(x, y - sz); ctx.lineTo(x, y + sz);
          ctx.stroke();
          ctx.font = '24px Arial';
          ctx.fillText(gameState.activePowerUp === 'broom' ? '🧹' : '✨', x, y - 40);
        }
      } else {
        const dropX = touchPosRef.current.x;
        const radius = getRadius(gameState.currentTier);
        const emoji = EMOJI_SETS[cosmetics.skin]?.[gameState.currentTier] || '❓';
        ctx.fillStyle = 'rgba(120,120,120,0.15)';
        ctx.fillRect(dropX - 1, 80, 2, GAME_HEIGHT);
        ctx.globalAlpha = 1.0;
        ctx.font = `${radius * 1.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(emoji, dropX, 40);
      }
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(render);
  }, [cosmetics, gameState, onGameOver]);

  const isDarkThemeText = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return false;
    const bg = theme.bg;
    return bg.includes('black') || bg.includes('950') || bg.includes('900') || bg.includes('700') || bg.includes('600');
  };

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
      let used = false;
      
      if (gameState.activePowerUp === 'bomb') {
        const affected = bodies.filter(b => {
          if (b.label !== 'fruit') return false;
          const d = Math.sqrt(Math.pow(b.position.x - x, 2) + Math.pow(b.position.y - y, 2));
          return d < 80 + getRadius(b.tier);
        });
        if (affected.length > 0) {
          Matter.Composite.remove(engineRef.current.world, affected);
          onScoreChange(affected.length * 5, 0);
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
          
          if (gameState.activePowerUp === 'broom') {
            Matter.Composite.remove(engineRef.current.world, sameTier);
            onScoreChange(sameTier.length * 10, tierToProcess);
            used = true;
          } else if (gameState.activePowerUp === 'sparkle') {
            sameTier.forEach(b => {
              if (b.tier < 11) {
                Matter.Composite.remove(engineRef.current.world, b);
                Matter.Composite.add(engineRef.current.world, createFruit(b.position.x, b.position.y, b.tier + 1));
              }
            });
            onScoreChange(sameTier.length * 2, tierToProcess + 1);
            used = true;
          }
        }
      }
      
      if (used && onPowerUpEffected) {
        onPowerUpEffected(gameState.activePowerUp);
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
      className={`relative w-full h-full border-[8px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 bg-white/5 ${cosmetics.border} ${gameState.isGameOver ? 'scale-95 blur-sm' : ''}`}
      onMouseMove={onInteraction}
      onTouchMove={onInteraction}
      onMouseUp={onRelease}
      onTouchEnd={onRelease}
    >
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT} 
        className="w-full h-full object-contain pointer-events-none" 
      />
      <div className="absolute top-[80px] left-0 w-full h-[1px] bg-red-600/60 shadow-[0_0_15px_red] pointer-events-none" />
    </div>
  );
};

export default GameContainer;
