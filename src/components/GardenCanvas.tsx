import React, { useEffect, useRef } from 'react';
import { GardenPlot } from '../types/game';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  text?: string;
}

interface GardenCanvasProps {
  plots: GardenPlot[];
  selectedPlotId: number | null;
  onSelectPlot: (plotId: number) => void;
  onPlotAction: (plotId: number) => void;
  activeTool: 'trowel' | 'water' | 'seed' | 'inspect';
}

export const GardenCanvas: React.FC<GardenCanvasProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  onPlotAction,
  activeTool,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest plots and callbacks in refs so the 60fps loop doesn't rebind or re-render
  const plotsRef = useRef<GardenPlot[]>(plots);
  plotsRef.current = plots;

  const selectedPlotRef = useRef<number | null>(selectedPlotId);
  selectedPlotRef.current = selectedPlotId;

  const onSelectPlotRef = useRef(onSelectPlot);
  onSelectPlotRef.current = onSelectPlot;

  const onPlotActionRef = useRef(onPlotAction);
  onPlotActionRef.current = onPlotAction;

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  // Particle pool ref
  const particlesRef = useRef<Particle[]>([]);

  // Farmer state
  const farmerRef = useRef({
    x: 400,
    y: 300,
    targetX: 400,
    targetY: 300,
    speed: 280,
    moving: false,
    facing: 'down' as 'up' | 'down' | 'left' | 'right',
    animFrame: 0,
    actionTimer: 0,
  });

  // Keys held state
  const keysHeld = useRef<Record<string, boolean>>({});

  // Trigger floating burst
  const addParticles = (x: number, y: number, color: string, count = 12, text?: string) => {
    if (text) {
      particlesRef.current.push({
        x,
        y: y - 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -55 - Math.random() * 25,
        color,
        size: 16,
        alpha: 1,
        life: 0,
        maxLife: 1.2,
        text,
      });
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 70;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        // Interact with nearest plot
        const farmer = farmerRef.current;
        let nearestDist = Infinity;
        let nearestPlot: GardenPlot | null = null;
        const currentPlots = plotsRef.current;

        for (const p of currentPlots) {
          const dx = p.x - farmer.x;
          const dy = p.y - farmer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90 && dist < nearestDist) {
            nearestDist = dist;
            nearestPlot = p;
          }
        }

        if (nearestPlot) {
          onSelectPlotRef.current(nearestPlot.id);
          onPlotActionRef.current(nearestPlot.id);
          addParticles(nearestPlot.x, nearestPlot.y, '#f59e0b', 8);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current[e.key.toLowerCase()] = false;
    };

    const onBlur = () => {
      keysHeld.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Click on canvas to move farmer or select plot
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if clicked a plot
      const currentPlots = plotsRef.current;
      let clickedPlot: GardenPlot | null = null;

      for (const plot of currentPlots) {
        // Plot width ~100, height ~70
        const dx = Math.abs(clickX - plot.x);
        const dy = Math.abs(clickY - plot.y);
        if (dx < 60 && dy < 45) {
          clickedPlot = plot;
          break;
        }
      }

      if (clickedPlot) {
        farmerRef.current.targetX = clickedPlot.x;
        farmerRef.current.targetY = clickedPlot.y + 40;
        farmerRef.current.moving = true;
        onSelectPlotRef.current(clickedPlot.id);
        onPlotActionRef.current(clickedPlot.id);
        addParticles(clickedPlot.x, clickedPlot.y, '#38bdf8', 6);
      } else {
        // Move farmer to location
        farmerRef.current.targetX = clickX;
        farmerRef.current.targetY = clickY;
        farmerRef.current.moving = true;
        addParticles(clickX, clickY, '#86efac', 4);
      }
    };

    canvas.addEventListener('click', onClick);

    // 60FPS Render & Sim Loop
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp frame dt per instructions

      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 600;

      // 1. UPDATE SIMULATION
      const farmer = farmerRef.current;
      const keys = keysHeld.current;

      let moveX = 0;
      let moveY = 0;

      if (keys['w'] || keys['arrowup']) moveY -= 1;
      if (keys['s'] || keys['arrowdown']) moveY += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        farmer.x += (moveX / len) * farmer.speed * dt;
        farmer.y += (moveY / len) * farmer.speed * dt;
        farmer.moving = true;
        farmer.targetX = farmer.x;
        farmer.targetY = farmer.y;

        if (Math.abs(moveX) > Math.abs(moveY)) {
          farmer.facing = moveX > 0 ? 'right' : 'left';
        } else {
          farmer.facing = moveY > 0 ? 'down' : 'up';
        }
      } else if (farmer.moving) {
        // Move towards target
        const dx = farmer.targetX - farmer.x;
        const dy = farmer.targetY - farmer.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          farmer.x += (dx / dist) * farmer.speed * dt;
          farmer.y += (dy / dist) * farmer.speed * dt;
          if (Math.abs(dx) > Math.abs(dy)) {
            farmer.facing = dx > 0 ? 'right' : 'left';
          } else {
            farmer.facing = dy > 0 ? 'down' : 'up';
          }
        } else {
          farmer.x = farmer.targetX;
          farmer.y = farmer.targetY;
          farmer.moving = false;
        }
      }

      // Clamp farmer bounds
      farmer.x = Math.max(50, Math.min(width - 50, farmer.x));
      farmer.y = Math.max(60, Math.min(height - 50, farmer.y));

      // Walk cycle
      if (farmer.moving) {
        farmer.animFrame += dt * 10;
      } else {
        farmer.animFrame = 0;
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = 1 - p.life / p.maxLife;
      }

      // 2. RENDER SCENE
      ctx.clearRect(0, 0, width, height);

      // A. Lush Farm Soil & Garden Meadow Base
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.7);
      gradient.addColorStop(0, '#1a3321');
      gradient.addColorStop(0.5, '#14291a');
      gradient.addColorStop(1, '#0c1a11');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle grass texture dots
      ctx.fillStyle = 'rgba(74, 222, 128, 0.06)';
      for (let gx = 30; gx < width; gx += 40) {
        for (let gy = 30; gy < height; gy += 40) {
          ctx.beginPath();
          ctx.arc(gx + ((gy * 17) % 20), gy + ((gx * 11) % 20), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Garden pathway (cobblestone paths connecting sections)
      ctx.strokeStyle = 'rgba(168, 162, 158, 0.2)';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(width / 2, 40);
      ctx.lineTo(width / 2, height - 40);
      ctx.moveTo(60, height / 2);
      ctx.lineTo(width - 60, height / 2);
      ctx.stroke();

      // Stone path stepping pavers
      ctx.fillStyle = 'rgba(120, 113, 108, 0.35)';
      for (let px = 80; px < width - 60; px += 55) {
        ctx.beginPath();
        ctx.ellipse(px, height / 2, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let py = 60; py < height - 40; py += 55) {
        ctx.beginPath();
        ctx.ellipse(width / 2, py, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wooden garden perimeter fence
      ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(25, 25, width - 50, height - 50);

      // B. Render Garden Plots
      const currentPlots = plotsRef.current;
      const selectedId = selectedPlotRef.current;

      currentPlots.forEach((plot) => {
        const isSelected = selectedId === plot.id;
        const pw = 100;
        const ph = 64;
        const px = plot.x - pw / 2;
        const py = plot.y - ph / 2;

        // Plot shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(plot.x, plot.y + 4, pw / 2 + 6, ph / 2 + 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Raised wooden garden bed border
        ctx.fillStyle = '#5c3a21'; // rich timber
        ctx.beginPath();
        ctx.roundRect(px - 4, py - 4, pw + 8, ph + 8, 8);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#784d28';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Dark fertile loam (wetter if recently watered)
        const isWatered = plot.stage !== 'empty' && plot.needsAction !== 'water';
        ctx.fillStyle = isWatered ? '#261b11' : '#3d2b1d';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 6);
        ctx.fill();

        // Soil furrow lines
        ctx.strokeStyle = isWatered ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        for (let row = 1; row <= 3; row++) {
          ctx.beginPath();
          ctx.moveTo(px + 8, py + (ph / 4) * row);
          ctx.lineTo(px + pw - 8, py + (ph / 4) * row);
          ctx.stroke();
        }

        // Draw Crop
        if (plot.crop && plot.stage !== 'empty') {
          const crop = plot.crop;
          const cx = plot.x;
          const cy = plot.y;

          if (plot.stage === 'seedling') {
            // Little green sprout
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 2, 4, 0, Math.PI * 2);
            ctx.arc(cx + 4, cy - 2, 4, 0, Math.PI * 2);
            ctx.fill();
            // Tiny stem
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy + 5);
            ctx.lineTo(cx, cy - 2);
            ctx.stroke();
          } else if (plot.stage === 'sprout') {
            // Growing plant with leafy foliage
            ctx.strokeStyle = crop.stemColor || '#16a34a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy + 8);
            ctx.lineTo(cx, cy - 14);
            ctx.stroke();

            // Leaves
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(cx - 10, cy - 8, 8, 4, -0.4, 0, Math.PI * 2);
            ctx.ellipse(cx + 10, cy - 8, 8, 4, 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else if (plot.stage === 'flowering') {
            // Blooming plant with buds
            ctx.strokeStyle = crop.stemColor || '#16a34a';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy + 10);
            ctx.lineTo(cx, cy - 18);
            ctx.stroke();

            // Full foliage
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(cx - 12, cy - 6, 10, 5, -0.3, 0, Math.PI * 2);
            ctx.ellipse(cx + 12, cy - 6, 10, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Flower Bud
            ctx.fillStyle = crop.bloomColor;
            ctx.beginPath();
            ctx.arc(cx, cy - 18, 9, 0, Math.PI * 2);
            ctx.fill();
          } else if (plot.stage === 'ripe') {
            // Radiant Golden / Full Crop ready for harvest
            const pulse = 1 + Math.sin(currentTime * 0.006) * 0.08;

            // Harvest glow
            ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
            ctx.beginPath();
            ctx.arc(cx, cy - 14, 26 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = crop.stemColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy + 8);
            ctx.lineTo(cx, cy - 14);
            ctx.stroke();

            // Ripe bloom / fruit
            ctx.save();
            ctx.translate(cx, cy - 16);
            ctx.scale(pulse, pulse);

            ctx.fillStyle = crop.bloomColor;
            for (let petal = 0; petal < 6; petal++) {
              const angle = (petal * Math.PI) / 3;
              const pxOff = Math.cos(angle) * 11;
              const pyOff = Math.sin(angle) * 11;
              ctx.beginPath();
              ctx.arc(pxOff, pyOff, 6, 0, Math.PI * 2);
              ctx.fill();
            }

            // Center blossom
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Plot Status Pill Overlay (Floating above plot)
        let statusBadge = '';
        let badgeColor = '';
        let badgeBg = '';

        if (plot.stage === 'empty') {
          statusBadge = 'Ready to Seed';
          badgeColor = '#94a3b8';
          badgeBg = 'rgba(15, 23, 42, 0.75)';
        } else if (plot.stage === 'ripe') {
          statusBadge = '✨ Harvest!';
          badgeColor = '#fef08a';
          badgeBg = 'rgba(161, 98, 7, 0.85)';
        } else if (plot.needsAction === 'water') {
          statusBadge = '💧 Needs Quiz';
          badgeColor = '#38bdf8';
          badgeBg = 'rgba(3, 105, 161, 0.85)';
        } else {
          statusBadge = `${plot.crop?.name.split(' ')[0]} (${plot.stage})`;
          badgeColor = '#86efac';
          badgeBg = 'rgba(20, 83, 45, 0.85)';
        }

        // Draw badge
        ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(statusBadge).width;
        const bPadding = 8;
        const bX = plot.x - (textWidth + bPadding * 2) / 2;
        const bY = plot.y - 44;

        ctx.fillStyle = badgeBg;
        ctx.beginPath();
        ctx.roundRect(bX, bY, textWidth + bPadding * 2, 18, 9);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = badgeColor;
        ctx.fillText(statusBadge, bX + bPadding, bY + 12);
      });

      // C. Render Farmer Character (Walking or Idle with Straw Hat and Overalls)
      const fx = farmer.x;
      const fy = farmer.y;
      const bob = farmer.moving ? Math.sin(farmer.animFrame) * 3 : 0;

      // Character Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(fx, fy + 16, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body / Overalls
      ctx.fillStyle = '#2563eb'; // blue denim overalls
      ctx.beginPath();
      ctx.roundRect(fx - 10, fy - 6 + bob, 20, 18, 4);
      ctx.fill();

      // Shirt sleeves
      ctx.fillStyle = '#ef4444'; // red flannel shirt
      ctx.beginPath();
      ctx.roundRect(fx - 14, fy - 14 + bob, 28, 12, 3);
      ctx.fill();

      // Head
      ctx.fillStyle = '#fed7aa'; // warm skin tone
      ctx.beginPath();
      ctx.arc(fx, fy - 20 + bob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Straw Hat Brim & Dome
      ctx.fillStyle = '#ca8a04'; // straw yellow brim
      ctx.beginPath();
      ctx.ellipse(fx, fy - 26 + bob, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eab308'; // dome
      ctx.beginPath();
      ctx.arc(fx, fy - 28 + bob, 8, Math.PI, 0);
      ctx.fill();

      // Hat ribbon
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fx, fy - 28 + bob, 8, Math.PI * 0.9, Math.PI * 0.1);
      ctx.stroke();

      // Farmer Tool in Hand (Watering can or Trowel)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(fx + 10, fy - 6 + bob, 8, 8, 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(fx + 16, fy - 2 + bob, 3, 0, Math.PI * 2);
      ctx.fill();

      // D. Render Floating Particles & Text
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.text) {
          ctx.font = '700 13px "Outfit", sans-serif';
          ctx.fillStyle = p.color;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 3;
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
    </div>
  );
};
