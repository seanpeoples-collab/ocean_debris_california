import React, { useRef, useEffect } from 'react';
import { DebrisLevel } from '../types';

interface SonicVisualizerProps {
  level: DebrisLevel;
  isPlaying: boolean;
}

const SonicVisualizer: React.FC<SonicVisualizerProps> = ({ level, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let time = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with transparency (no background, parent handles it)
      ctx.clearRect(0, 0, width, height);
      
      if (!isPlaying) {
          // Draw a flat line if paused
          ctx.beginPath();
          ctx.moveTo(0, height/2);
          ctx.lineTo(width, height/2);
          ctx.strokeStyle = '#94a3b8'; // ink-400
          ctx.lineWidth = 1;
          ctx.stroke();
          // animationId = requestAnimationFrame(render); // Optional: keep animating empty? No, save frames.
          return;
      }

      // Parameters based on level
      let amplitude = 20;
      let frequency = 0.01;
      let color = '#334155'; // ink-600 default
      let chaos = 0;
      let speed = 0.02;

      if (level === DebrisLevel.MODERATE) {
        amplitude = 40;
        frequency = 0.02;
        color = '#f59e0b'; // amber
        chaos = 5;
        speed = 0.04;
      } else if (level === DebrisLevel.HIGH) {
        amplitude = 60;
        frequency = 0.05;
        color = '#ef4444'; // red
        chaos = 15;
        speed = 0.08;
      } else if (level === DebrisLevel.CRITICAL) {
        amplitude = 80;
        frequency = 0.1;
        color = '#7f1d1d'; // dark red
        chaos = 30;
        speed = 0.15;
      } else {
        color = '#10b981'; // emerald for low
      }

      time += speed;

      // Primary Wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x < width; x++) {
        // Base sine wave
        let y = height / 2 + Math.sin(x * frequency + time) * amplitude;
        
        // Add "debris" noise/chaos
        if (chaos > 0) {
            y += (Math.random() - 0.5) * chaos;
        }
        
        // Add secondary wave for texture
        y += Math.cos(x * (frequency * 2.5) - time) * (amplitude * 0.5);

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = level === DebrisLevel.CRITICAL ? 3 : 2;
      ctx.stroke();

      // Draw floating particles for high debris
      if (level === DebrisLevel.HIGH || level === DebrisLevel.CRITICAL) {
          const particleCount = level === DebrisLevel.CRITICAL ? 10 : 5;
          for(let i=0; i<particleCount; i++) {
              const px = (Math.sin(time * (i+1) * 0.5) * 0.5 + 0.5) * width;
              const py = (Math.cos(time * (i+1) * 0.3) * 0.5 + 0.5) * height;
              ctx.beginPath();
              ctx.arc(px, py, Math.random() * 3, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.fill();
          }
      }

      animationId = requestAnimationFrame(render);
    };

    // Resize canvas to parent
    const resize = () => {
        if(canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [level, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default SonicVisualizer;
