import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Snowflake, 
  Wind, 
  Play, 
  RefreshCw, 
  Settings, 
  Layers, 
  Circle, 
  Sparkles, 
  Clock, 
  Activity,
  Sliders,
  HelpCircle
} from "lucide-react";

// Interfaces for our custom canvas animations
interface SnowflakeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  driftSpeed: number;
  driftRange: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface BalloonParticle {
  id: number;
  x: number;
  y: number;
  sizeW: number;
  sizeH: number;
  speedY: number;
  speedX: number;
  color: string;
  stringLength: number;
  opacity: number;
  swayPhase: number;
  swaySpeed: number;
  swayRange: number;
}

export default function App() {
  // Simulation Active Expiry Timestamps
  const [snowActiveUntil, setSnowActiveUntil] = useState<number>(0);
  const [balloonActiveUntil, setBalloonActiveUntil] = useState<number>(0);

  // Remaining time in seconds (for high precision progress displays)
  const [snowTimeLeft, setSnowTimeLeft] = useState<number>(0);
  const [balloonTimeLeft, setBalloonTimeLeft] = useState<number>(0);

  // Configuration options (Formal dashboard controls)
  const [particleDensity, setParticleDensity] = useState<number>(50); // density controller
  const [particleSpeed, setParticleSpeed] = useState<string>("standard"); // slow, standard, fast

  // Canvas context elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Refs for tracking particles so we don't restart arrays on every render
  const snowflakesRef = useRef<SnowflakeParticle[]>([]);
  const balloonsRef = useRef<BalloonParticle[]>([]);
  const particleIdCounter = useRef<number>(0);

  // Track physical dimensions accurately per viewport/container
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle ResizeObserver as per Canvas Sizing constraints
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      // Debounce pattern or dynamic size mapping
      const { width, height } = entries[0].contentRect;
      setDimensions({ 
        width: Math.max(width, 300), 
        height: Math.max(height, 300) 
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update high-precision remaining timers every 100ms
  useEffect(() => {
    const checkTimers = () => {
      const now = Date.now();
      
      const resSnow = Math.max(0, (snowActiveUntil - now) / 1000);
      setSnowTimeLeft(parseFloat(resSnow.toFixed(1)));
      
      const resBall = Math.max(0, (balloonActiveUntil - now) / 1000);
      setBalloonTimeLeft(parseFloat(resBall.toFixed(1)));
    };

    const interval = setInterval(checkTimers, 50);
    return () => clearInterval(interval);
  }, [snowActiveUntil, balloonActiveUntil]);

  // Handle "Snowflakes" trigger
  const triggerSnowflakes = useCallback(() => {
    const now = Date.now();
    const duration = 5000; // 5 seconds
    setSnowActiveUntil(now + duration);

    // Seed initial batch of snowflakes across the height of the screen
    // so user gets immediate visual reward instead of waiting for them to drift down
    const newSnowflakes: SnowflakeParticle[] = [];
    const count = Math.floor(particleDensity * 0.8);
    
    for (let i = 0; i < count; i++) {
      particleIdCounter.current++;
      newSnowflakes.push({
        id: particleIdCounter.current,
        // distributed over full screen height
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height - 20,
        size: Math.random() * 16 + 22, // increased size: 22px to 38px
        speedY: (Math.random() * 1.2 + 0.8) * (particleSpeed === "slow" ? 0.5 : particleSpeed === "fast" ? 1.8 : 1.0),
        speedX: Math.random() * 0.6 - 0.3,
        driftSpeed: Math.random() * 0.02 + 0.01,
        driftRange: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.45 + 0.45,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.02 - 0.01)
      });
    }

    // append to existing or overwrite
    snowflakesRef.current = [...snowflakesRef.current, ...newSnowflakes];
  }, [dimensions, particleDensity, particleSpeed]);

  // Handle "Balloons" trigger
  const triggerBalloons = useCallback(() => {
    const now = Date.now();
    const duration = 5000; // 5 seconds
    setBalloonActiveUntil(now + duration);

    // Balloon colors (rich premium corporate palette with high contrast translucency)
    const presetColors = [
      "rgba(220, 38, 38, 0.82)",   // Slate Crimson Red
      "rgba(37, 99, 235, 0.82)",   // Deep Navy Blue
      "rgba(5, 150, 105, 0.82)",   // Emerald Green
      "rgba(217, 119, 6, 0.82)",   // Dark Amber
      "rgba(147, 51, 234, 0.82)",  // Royal Amethyst
      "rgba(13, 148, 136, 0.82)",  // Muted Teal
      "rgba(219, 39, 119, 0.82)"   // Rich Magenta
    ];

    // Seed immediate balloons rising from various levels starting around the bottom half
    const newBalloons: BalloonParticle[] = [];
    const count = Math.floor(particleDensity * 0.4); // slightly lower density for balloons since they are bigger
    
    for (let i = 0; i < count; i++) {
      particleIdCounter.current++;
      const baseWidth = Math.random() * 6 + 28; // medium sized width
      newBalloons.push({
        id: particleIdCounter.current,
        x: Math.random() * (dimensions.width - 80) + 40,
        // distribute starting height from below screen or bottom 40% of screen for immediate action
        y: dimensions.height + Math.random() * 150 - (i % 2 === 0 ? dimensions.height * 0.4 : 0),
        sizeW: baseWidth,
        sizeH: baseWidth * 1.3, // proportional elongated oval
        speedY: -(Math.random() * 1.4 + 1.2) * (particleSpeed === "slow" ? 0.5 : particleSpeed === "fast" ? 1.8 : 1.0),
        speedX: Math.random() * 0.4 - 0.2,
        color: presetColors[Math.floor(Math.random() * presetColors.length)],
        stringLength: Math.random() * 15 + 45,
        opacity: Math.random() * 0.15 + 0.8,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.015,
        swayRange: Math.random() * 1.2 + 0.8
      });
    }

    balloonsRef.current = [...balloonsRef.current, ...newBalloons];
  }, [dimensions, particleDensity, particleSpeed]);

  // Main Canvas animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastTime = Date.now();

    const render = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 16.66; // Normalized scale
      lastTime = now;

      // Clear the canvas cleanly
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const isSnowGenerating = snowTimeLeft > 0;
      const isBalloonGenerating = balloonTimeLeft > 0;

      // ------------------------------------------
      // 1. UPDATE AND DRAW SNOWFLAKES
      // ------------------------------------------
      // Continuous generation if snow is active
      if (isSnowGenerating && Math.random() < 0.25) {
        // Spawn standard top margin snowflake
        particleIdCounter.current++;
        snowflakesRef.current.push({
          id: particleIdCounter.current,
          x: Math.random() * dimensions.width,
          y: -20,
          size: Math.random() * 14 + 20, // increased range: 20px to 34px
          speedY: (Math.random() * 1.1 + 0.8) * (particleSpeed === "slow" ? 0.5 : particleSpeed === "fast" ? 1.8 : 1.0),
          speedX: Math.random() * 0.5 - 0.25,
          driftSpeed: Math.random() * 0.02 + 0.01,
          driftRange: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.5,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() * 0.02 - 0.01)
        });
      }

      // Filter and Update Snowflakes
      snowflakesRef.current = snowflakesRef.current.filter((s) => {
        // Move snowflake down
        s.y += s.speedY * delta;
        // Apply wind drift sinusoidal movement
        s.x += (s.speedX + Math.sin(now * s.driftSpeed) * s.driftRange * 0.4) * delta;
        s.rotation += s.rotationSpeed * delta;

        // If the 5-second timer ended, we fade out remaining snowflakes beautifully
        let currentOpacity = s.opacity;
        if (!isSnowGenerating) {
          // fade out past the timer limit quickly but smoothly
          currentOpacity -= 0.025 * delta;
        }

        // Keep inside bounds & has active opacity
        const inBounds = s.y < dimensions.height + 20 && s.x > -20 && s.x < dimensions.width + 20;
        
        if (inBounds && currentOpacity > 0) {
          s.opacity = currentOpacity;
          
          // Render gorgeous Snowflake Symbol
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rotation);
          ctx.font = `bold ${s.size}px sans-serif`;
          ctx.fillStyle = `rgba(26, 54, 110, ${s.opacity})`; // elegent premium deep dark blue
          ctx.shadowColor = `rgba(191, 219, 254, ${s.opacity * 0.5})`; // soft light-blue halo
          ctx.shadowBlur = 5;
          ctx.fillText("❄", -s.size / 2, s.size / 2 - 2);
          ctx.restore();
          
          return true;
        }
        return false;
      });

      // ------------------------------------------
      // 2. UPDATE AND DRAW BALLOONS
      // ------------------------------------------
      // Continuous generation if balloon is active
      if (isBalloonGenerating && Math.random() < 0.15) {
        const presetColors = [
          "rgba(220, 38, 38, 0.82)",   // Slate Crimson Red
          "rgba(37, 99, 235, 0.82)",   // Deep Navy Blue
          "rgba(5, 150, 105, 0.82)",   // Emerald Green
          "rgba(217, 119, 6, 0.82)",   // Dark Amber
          "rgba(147, 51, 234, 0.82)",  // Royal Amethyst
          "rgba(13, 148, 136, 0.82)",  // Muted Teal
          "rgba(219, 39, 119, 0.82)"   // Rich Magenta
        ];
        
        particleIdCounter.current++;
        const baseWidth = Math.random() * 6 + 28; // medium sized width
        balloonsRef.current.push({
          id: particleIdCounter.current,
          x: Math.random() * (dimensions.width - 80) + 40,
          y: dimensions.height + 40,
          sizeW: baseWidth,
          sizeH: baseWidth * 1.3,
          speedY: -(Math.random() * 1.4 + 1.2) * (particleSpeed === "slow" ? 0.5 : particleSpeed === "fast" ? 1.8 : 1.0),
          speedX: Math.random() * 0.3 - 0.15,
          color: presetColors[Math.floor(Math.random() * presetColors.length)],
          stringLength: Math.random() * 15 + 45,
          opacity: Math.random() * 0.12 + 0.83,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.025 + 0.015,
          swayRange: Math.random() * 1.1 + 0.7
        });
      }

      // Filter and Update Balloons
      balloonsRef.current = balloonsRef.current.filter((b) => {
        // Move balloon up (speedY is negative)
        b.y += b.speedY * delta;
        // Sway sideways gently
        b.swayPhase += b.swaySpeed * delta;
        const currentSway = Math.sin(b.swayPhase);
        b.x += (b.speedX + currentSway * b.swayRange * 0.5) * delta;

        // If balloon timer ended, fade out remaining balloons beautifully
        let currentOpacity = b.opacity;
        if (!isBalloonGenerating) {
          currentOpacity -= 0.03 * delta;
        }

        const inBounds = b.y > -b.sizeH - b.stringLength - 10 && b.x > -50 && b.x < dimensions.width + 50;

        if (inBounds && currentOpacity > 0) {
          b.opacity = currentOpacity;

          ctx.save();
          
          // Draw thin string first behind balloon
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 116, 139, ${b.opacity * 0.4})`; // Slate line
          ctx.lineWidth = 1.2;
          ctx.moveTo(b.x, b.y + b.sizeH);
          ctx.bezierCurveTo(
            b.x - 6 * currentSway, b.y + b.sizeH + 15,
            b.x + 6 * currentSway, b.y + b.sizeH + 30,
            b.x, b.y + b.sizeH + b.stringLength
          );
          ctx.stroke();

          // Draw small triangle knot at base
          ctx.beginPath();
          ctx.fillStyle = b.color.replace("0.82", `${b.opacity}`);
          ctx.moveTo(b.x, b.y + b.sizeH - 2);
          ctx.lineTo(b.x - 5, b.y + b.sizeH + 6);
          ctx.lineTo(b.x + 5, b.y + b.sizeH + 6);
          ctx.closePath();
          ctx.fill();

          // Draw balloon body
          ctx.beginPath();
          ctx.fillStyle = b.color.replace("0.82", `${b.opacity}`);
          // Fallback if ellipse path is unsupported is rare but we use direct arc/scale or standard ellipse
          ctx.ellipse(b.x, b.y, b.sizeW, b.sizeH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw high-fidelity gloss highlight to look polished and formal
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.35})`;
          ctx.ellipse(
            b.x - b.sizeW * 0.36, 
            b.y - b.sizeH * 0.36, 
            b.sizeW * 0.22, 
            b.sizeH * 0.22, 
            Math.PI / 4, 
            0, 
            Math.PI * 2
          );
          ctx.fill();

          ctx.restore();
          return true;
        }
        return false;
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions, snowTimeLeft, balloonTimeLeft, particleSpeed]);

  // Clean all simulations
  const clearAllSimulations = () => {
    setSnowActiveUntil(0);
    setBalloonActiveUntil(0);
    snowflakesRef.current = [];
    balloonsRef.current = [];
  };

  return (
    <div 
      id="app-workspace-root" 
      className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans select-none overflow-hidden"
    >
      {/* 1. Header Area (Static Premium Corporate Brand Accent) */}
      <header 
        id="app-header-component" 
        className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between z-20 shadow-xs"
      >
        <div id="brand-indicator" className="flex items-center space-x-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-medium text-lg tracking-tight text-slate-900">
              Atmospheric Simulator
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              VER. 1.0.4 // CONTROL PANEL
            </p>
          </div>
        </div>

        <div id="status-badge" className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              snowTimeLeft > 0 || balloonTimeLeft > 0 ? "bg-emerald-400" : "bg-sky-400"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              snowTimeLeft > 0 || balloonTimeLeft > 0 ? "bg-emerald-500" : "bg-sky-500"
            }`}></span>
          </span>
          <span className="text-xs font-mono font-medium text-slate-600">
            {snowTimeLeft > 0 || balloonTimeLeft > 0 ? "RENDERING ACTIVE" : "SYSTEM IDLE"}
          </span>
        </div>
      </header>

      {/* 2. Visual Layer Canvas (Absolute background render container) */}
      <div 
        id="simulation-canvas-container" 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      >
        <canvas 
          id="simulation-canvas"
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block w-full h-full"
        />
      </div>

      {/* 3. Main Operational Controls Panel */}
      <main 
        id="main-control-layout" 
        className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 flex flex-col justify-between relative z-20"
      >
        {/* Interactive Workspace Intro Card */}
        <section id="banner-description-panel" className="mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div id="simple-header-brand" className="flex items-start space-x-4 max-w-xl">
                <div className="p-3 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-2xl text-blue-950 tracking-tight leading-tight">
                    My First Simulation Application
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
                    Physical Simulation Lab • Phase 1 Core
                  </p>
                </div>
              </div>

              {/* Side-by-side Showcase of Snowflakes and Balloons */}
              <div id="simulation-preview-grid" className="flex items-center space-x-3 self-center md:self-auto">
                <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-xs w-[130px] transition-transform duration-300 hover:scale-102">
                  <img 
                    src="/src/assets/images/blue_snowflakes_1781574470237.jpg" 
                    alt="Blue Snowflakes" 
                    className="w-full h-auto object-cover aspect-[4/3]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase bg-slate-950/60 px-2 py-0.5 rounded">SNOW</span>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-xs w-[130px] transition-transform duration-300 hover:scale-102">
                  <img 
                    src="/src/assets/images/colourful_balloons_1781574489062.jpg" 
                    alt="Colourful Balloons" 
                    className="w-full h-auto object-cover aspect-[4/3]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase bg-slate-950/60 px-2 py-0.5 rounded">BALLOONS</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Micro Configuration Toggles */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 font-mono tracking-tight">
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  <span>INITIAL PARTICLE DENSITY</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setParticleDensity(35)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleDensity === 35 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    MIN
                  </button>
                  <button 
                    onClick={() => setParticleDensity(50)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleDensity === 50 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    STD
                  </button>
                  <button 
                    onClick={() => setParticleDensity(80)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleDensity === 80 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 font-mono tracking-tight">
                  <Wind className="h-3.5 w-3.5 text-slate-400" />
                  <span>VELOCITY BIAS</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setParticleSpeed("slow")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleSpeed === "slow" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    SLOW
                  </button>
                  <button 
                    onClick={() => setParticleSpeed("standard")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleSpeed === "standard" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    NORM
                  </button>
                  <button 
                    onClick={() => setParticleSpeed("fast")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                      particleSpeed === "fast" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    RAPID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Simulation Triggers - Beautifully designed and high-contrast */}
        <section id="dual-simulation-trigger-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* A. SNOWFLAKE CONTROLLER CARD */}
          <div 
            id="snowflake-control-card" 
            className={`rounded-2xl border bg-white p-6 md:p-8 flex flex-col justify-between transition-all duration-300 ${
              snowTimeLeft > 0 
                ? "border-sky-300 shadow-md ring-2 ring-sky-500/10" 
                : "border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest font-semibold text-sky-600 uppercase bg-sky-50 px-2.5 py-1 rounded">
                  Snowflakes simulation
                </span>
                <Snowflake className={`h-6 w-6 text-sky-500 ${snowTimeLeft > 0 ? "animate-spin" : ""}`} style={{ animationDuration: '4s' }} />
              </div>
              
              <h3 className="font-display font-medium text-lg text-slate-900 mb-1">
                Frictionless Snowfall
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Renders medium-sized winter crystal structures with horizontal wind drift and light-scattering parameters.
              </p>

              {/* Status Section */}
              <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-mono font-medium text-slate-700">RUNDOWN ACTIVE</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-sky-600">
                    {snowTimeLeft > 0 ? `${snowTimeLeft}s` : "0.0s"}
                  </span>
                </div>
              </div>

              {/* Progress Ticker Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${(snowTimeLeft / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* HIGH-CONTRAST PRIMARY ACTION BUTTON */}
            <button
              id="trigger-snowflakes-button"
              onClick={triggerSnowflakes}
              className="w-full py-4 px-6 rounded-xl font-medium tracking-tight flex items-center justify-center space-x-2 border transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 text-white border-slate-950 active:scale-98 shadow-md"
            >
              <Snowflake className="h-4 w-4 text-sky-300" />
              <span>{snowTimeLeft > 0 ? "Reinforce Snowflakes" : "Snowflakes"}</span>
            </button>
          </div>

          {/* B. BALLOONS CONTROLLER CARD */}
          <div 
            id="balloons-control-card" 
            className={`rounded-2xl border bg-white p-6 md:p-8 flex flex-col justify-between transition-all duration-300 ${
              balloonTimeLeft > 0 
                ? "border-rose-300 shadow-md ring-2 ring-rose-500/10" 
                : "border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest font-semibold text-rose-600 uppercase bg-rose-50 px-2.5 py-1 rounded">
                  Balloons Simulation
                </span>
                <Sparkles className={`h-6 w-6 text-rose-500 ${balloonTimeLeft > 0 ? "animate-pulse" : ""}`} />
              </div>
              
              <h3 className="font-display font-medium text-lg text-slate-900 mb-1">
                Helium Bouyancy Rise
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Renders pressurized rubber balloons with translucent shading, speculative highlights, and procedural string sway.
              </p>

              {/* Status Section */}
              <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-mono font-medium text-slate-700">RUNDOWN ACTIVE</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-rose-600">
                    {balloonTimeLeft > 0 ? `${balloonTimeLeft}s` : "0.0s"}
                  </span>
                </div>
              </div>

              {/* Progress Ticker Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${(balloonTimeLeft / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* HIGH-CONTRAST PRIMARY ACTION BUTTON */}
            <button
              id="trigger-balloons-button"
              onClick={triggerBalloons}
              className="w-full py-4 px-6 rounded-xl font-medium tracking-tight flex items-center justify-center space-x-2 border transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 text-white border-slate-950 active:scale-98 shadow-md"
            >
              <Circle className="h-3.5 w-3.5 fill-rose-400 stroke-none" />
              <span>{balloonTimeLeft > 0 ? "Reinforce Balloons" : "Balloons"}</span>
            </button>
          </div>
        </section>

        {/* Global Reset and Status Console Bar */}
        <section id="auxiliary-controls-panel" className="mt-2 text-center">
          <div className="inline-flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-mono">
              Total Particles Loaded: <strong className="font-semibold text-slate-800 font-mono">{snowflakesRef.current.length + balloonsRef.current.length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <button
              id="clear-all-simulations-button"
              onClick={clearAllSimulations}
              disabled={snowflakesRef.current.length === 0 && balloonsRef.current.length === 0}
              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Canvas</span>
            </button>
          </div>
        </section>
      </main>

      {/* 4. Footer Console Info */}
      <footer 
        id="app-footer-component" 
        className="w-full bg-white border-t border-slate-200 py-3.5 px-6 md:px-12 z-20 text-center flex flex-col sm:flex-row items-center justify-between"
      >
        <span className="text-[10px] font-mono text-slate-400">
          DESIGN STANDARD // COMPLIANT PHYSICAL PARADOX
        </span>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0 text-[10px] font-mono text-slate-400">
          <span>COORDINATES: AUTOMATIC</span>
          <span>|</span>
          <span>CYCLE CAP: 5.0S</span>
        </div>
      </footer>
    </div>
  );
}
