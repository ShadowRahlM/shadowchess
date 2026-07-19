import React, { useRef, useEffect, useCallback } from 'react';
import './EvalGraph.css';

export default function EvalGraph({ analysis, currentMoveIndex, onMoveClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !analysis || analysis.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 100;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxScore = 800;
    const mid = height / 2;

    // Draw center line (equal position)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();

    // Draw the eval curve
    const points = analysis.map((a, i) => {
      const x = (i / Math.max(analysis.length - 1, 1)) * width;
      const clamped = Math.max(-maxScore, Math.min(maxScore, a.score));
      const y = mid - (clamped / maxScore) * (mid - 4);
      return { x, y, score: a.score, index: i };
    });

    // Fill white/black areas
    // White area (above center)
    ctx.beginPath();
    ctx.moveTo(0, mid);
    points.forEach(p => {
      if (p.score >= 0) {
        ctx.lineTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, mid);
      }
    });
    ctx.lineTo(width, mid);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    // Black area (below center)
    ctx.beginPath();
    ctx.moveTo(0, mid);
    points.forEach(p => {
      if (p.score <= 0) {
        ctx.lineTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, mid);
      }
    });
    ctx.lineTo(width, mid);
    ctx.closePath();
    ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
    ctx.fill();

    // Draw the line
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw move markers with classification colors
    points.forEach((p, i) => {
      const a = analysis[i];
      if (a.classification && a.classification.type !== 'ok') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = a.classification.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw current move indicator
    if (currentMoveIndex >= 0 && currentMoveIndex < points.length) {
      const p = points[currentMoveIndex];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#9333ea';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, height);
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [analysis, currentMoveIndex]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !analysis || analysis.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const index = Math.round((x / width) * (analysis.length - 1));

    if (index >= 0 && index < analysis.length && onMoveClick) {
      onMoveClick(index);
    }
  };

  return (
    <div className="eval-graph" ref={containerRef}>
      <canvas ref={canvasRef} onClick={handleClick} />
      <div className="eval-graph-labels">
        <span className="eval-top">+{analysis && analysis.length > 0 ? Math.max(...analysis.map(a => Math.abs(a.score))) > 500 ? 'M' : '+' + (Math.max(...analysis.map(a => a.score)) / 100).toFixed(1) : '0.0'}</span>
        <span className="eval-mid">0.0</span>
        <span className="eval-bot">-{analysis && analysis.length > 0 ? Math.max(...analysis.map(a => Math.abs(a.score))) > 500 ? 'M' : (Math.abs(Math.min(...analysis.map(a => a.score))) / 100).toFixed(1) : '0.0'}</span>
      </div>
    </div>
  );
}
