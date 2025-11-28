import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Point3D, Wind } from '../types';

interface GameCanvasProps {
  wind: Wind;
  onScoreUpdate: (score: number) => void;
  backgroundUrl: string | null;
}

// Game Constants
const GRAVITY = 0.5;
const AIR_RESISTANCE = 0.98; // Slows down velocity
const WIND_FACTOR = 0.05; // Influence of wind on x velocity
const THROW_SCALE = 0.15; // Power of the throw
const PERSPECTIVE = 800; // Focal length
const GROUND_Y = 600; // Virtual floor y-coordinate
const BIN_Z = 600; // Distance to bin
const BIN_RADIUS = 60; // Radius of bin opening
const BALL_RADIUS = 15;

const GameCanvas: React.FC<GameCanvasProps> = ({ wind, onScoreUpdate, backgroundUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);

  // Mutable game state for performance (avoiding React render loop for 60fps physics)
  const physicsState = useRef({
    ball: { x: 0, y: 0, z: 0 } as Point3D,
    velocity: { x: 0, y: 0, z: 0 } as Point3D,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    lastTime: 0,
  });

  const resetBall = useCallback((width: number, height: number) => {
    physicsState.current.ball = { x: 0, y: height / 2 - 100, z: 0 }; // Start near bottom center visually
    physicsState.current.velocity = { x: 0, y: 0, z: 0 };
    setGameState(GameState.IDLE);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== GameState.IDLE) return;
    setGameState(GameState.DRAGGING);
    physicsState.current.dragStart = { x: e.clientX, y: e.clientY };
    physicsState.current.dragCurrent = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState === GameState.DRAGGING) {
      physicsState.current.dragCurrent = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (gameState !== GameState.DRAGGING) return;
    
    const dx = physicsState.current.dragCurrent.x - physicsState.current.dragStart.x;
    const dy = physicsState.current.dragCurrent.y - physicsState.current.dragStart.y;
    
    // Simple throw logic: Upward drag (negative dy) throws forward (positive z)
    // Horizontal drag adds x velocity
    
    const throwPowerY = Math.min(dy, 0); // Only allow throwing "up" the screen
    
    if (Math.abs(throwPowerY) < 50) {
        // Too weak, cancel
        setGameState(GameState.IDLE);
        return;
    }

    const vz = Math.abs(throwPowerY) * THROW_SCALE * 1.5;
    const vy = throwPowerY * THROW_SCALE * 0.8; // Initial lift
    const vx = dx * THROW_SCALE * 0.5;

    physicsState.current.velocity = { x: vx, y: vy, z: vz };
    setGameState(GameState.THROWN);
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      // Resize canvas to window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Reset ball if resizing to avoid losing it
        if (gameState === GameState.IDLE) {
           resetBall(canvas.width, canvas.height);
        }
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 100; // Shift world center down a bit

      // --- PHYSICS ---
      if (gameState === GameState.THROWN) {
        const { ball, velocity } = physicsState.current;

        // Apply forces
        velocity.y += GRAVITY; // Gravity pulls down
        velocity.x += wind.speed * WIND_FACTOR; // Wind pushes X
        
        // Air resistance
        velocity.x *= AIR_RESISTANCE;
        velocity.z *= AIR_RESISTANCE;

        // Update Position
        ball.x += velocity.x;
        ball.y += velocity.y;
        ball.z += velocity.z;

        // Collision Check (Bin)
        // Bin location relative to world center
        // Let's say bin is at (0, 0, BIN_Z) relative to the throw start roughly
        // Ideally bin is on the "floor".
        
        // Check ground hit
        const floorY = 300; // Relative to center
        
        // Determine if inside bin
        // Bin is at Z=BIN_Z.
        if (ball.z >= BIN_Z && ball.z <= BIN_Z + 50) {
           // Check if within radius
           // Bin center is roughly x=0, y=floorY (visually). 
           // In our 3D space, let's say bin rim is at y = floorY - binHeight
           const binRimY = 150; 
           
           if (Math.abs(ball.y - binRimY) < 50) {
               // Height match, check X radius
               if (Math.abs(ball.x) < BIN_RADIUS) {
                   setGameState(GameState.LANDED);
                   setScore(s => {
                       const newScore = s + 1;
                       onScoreUpdate(newScore);
                       return newScore;
                   });
                   setTimeout(() => resetBall(canvas.width, canvas.height), 1000);
               }
           }
        }
        
        // Miss condition (hit ground or went too far)
        if (ball.y > floorY + 200 || ball.z > BIN_Z + 200) {
            setGameState(GameState.MISSED);
            setTimeout(() => resetBall(canvas.width, canvas.height), 1000);
        }
      } else if (gameState === GameState.IDLE || gameState === GameState.DRAGGING) {
          // Keep ball at starting position
          physicsState.current.ball = { x: 0, y: 300, z: 0 };
      }

      // --- RENDER ---
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      if (backgroundUrl) {
          const img = new Image();
          img.src = backgroundUrl;
          // Note: In a real app we'd cache this image object to avoid reloading per frame
          // For this demo, assuming browser cache handles it or we'd move it out of loop
          // But to be safe in React useEffect without flickering, we usually draw a pre-loaded ref.
          // For simplicity here, we'll draw a color if image not ready, but actually the browser handles img.src efficiently if same URL.
          // Better approach:
      } 
      
      // Draw Room/Floor helper if no background
      if (!backgroundUrl) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Floor
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fill();
      } else {
        // We need a way to draw the background image to fill screen
        // Accessing the DOM image element is better
        const bgImg = document.getElementById('bg-image-source') as HTMLImageElement;
        if (bgImg && bgImg.complete) {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        }
      }

      // Projection Helper
      const project = (p: Point3D) => {
        const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
        return {
          x: centerX + p.x * scale,
          y: centerY + p.y * scale,
          scale: scale
        };
      };

      // Draw Bin (Back)
      const binPos = { x: 0, y: 150, z: BIN_Z }; // Bin location
      const projBin = project(binPos);
      const binScale = projBin.scale;
      const scaledBinRadius = BIN_RADIUS * binScale;

      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.ellipse(projBin.x, projBin.y, scaledBinRadius, scaledBinRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Bin Body
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.moveTo(projBin.x - scaledBinRadius, projBin.y);
      ctx.lineTo(projBin.x - scaledBinRadius * 0.8, projBin.y + 100 * binScale);
      ctx.lineTo(projBin.x + scaledBinRadius * 0.8, projBin.y + 100 * binScale);
      ctx.lineTo(projBin.x + scaledBinRadius, projBin.y);
      ctx.fill();

      // Bin (Front Rim - draw after ball if ball is inside, but for simplicity draw back rim first, then ball, then front rim if z < bin z)
      // Actually, simple painter's algo:
      // If ball.z > bin.z, draw bin front over ball? 
      // Let's keep it simple: Draw back of bin, then ball, then front of bin.
      
      // Draw Ball
      const { ball } = physicsState.current;
      const projBall = project(ball);
      const scaledBallRadius = BALL_RADIUS * projBall.scale;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(projBall.x, centerY + (150 + 100*binScale) * projBall.scale, scaledBallRadius, scaledBallRadius * 0.3, 0, 0, Math.PI * 2);
      // Shadow logic is fake here, just placing it vaguely on floor
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(projBall.x, projBall.y, scaledBallRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Crinkle details on ball
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(projBall.x - scaledBallRadius*0.5, projBall.y);
      ctx.lineTo(projBall.x + scaledBallRadius*0.5, projBall.y);
      ctx.stroke();

      // Draw Bin (Front Rim) to create depth
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(projBin.x, projBin.y, scaledBinRadius, scaledBinRadius * 0.3, 0, 0, Math.PI); // Half ellipse
      ctx.stroke();

      // Debug / Drag Line
      if (gameState === GameState.DRAGGING) {
          ctx.beginPath();
          ctx.moveTo(physicsState.current.dragStart.x, physicsState.current.dragStart.y);
          ctx.lineTo(physicsState.current.dragCurrent.x, physicsState.current.dragCurrent.y);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 5;
          ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, wind, backgroundUrl, onScoreUpdate, resetBall]);

  return (
    <div className="relative w-full h-full touch-none">
       {/* Hidden image source for canvas to use */}
       {backgroundUrl && (
           <img 
             id="bg-image-source" 
             src={backgroundUrl} 
             alt="bg" 
             className="hidden" 
           />
       )}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white drop-shadow-md pointer-events-none select-none">
          <h1 className="text-4xl font-bold">Score: {score}</h1>
      </div>

       {/* Wind Indicator */}
       <div className="absolute top-20 left-4 bg-black/30 backdrop-blur-md p-3 rounded-lg text-white pointer-events-none select-none">
          <div className="flex items-center gap-2">
             <span className="font-semibold">Wind:</span>
             <span className="text-xl font-bold">{Math.abs(wind.speed).toFixed(1)}</span>
             <div 
               className="transform transition-transform duration-500"
               style={{ transform: `rotate(${wind.speed > 0 ? 0 : 180}deg)` }}
             >
               ➔
             </div>
          </div>
       </div>

      {gameState === GameState.IDLE && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/80 animate-bounce pointer-events-none select-none">
              Swipe up to toss!
          </div>
      )}
    </div>
  );
};

export default GameCanvas;