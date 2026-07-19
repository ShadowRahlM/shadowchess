import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from '../sounds';
import './Clock.css';

export default function Clock({ whiteTime, blackTime, activeColor, isPlayerWhite, onFlag, isRunning }) {
  const formatTime = (ms) => {
    if (ms === null || ms === undefined) return '--:--';
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isLowTime = (ms) => ms !== null && ms < 30000;
  const isCritical = (ms) => ms !== null && ms < 10000;

  const whiteActive = activeColor === 'w' && isRunning;
  const blackActive = activeColor === 'b' && isRunning;

  const playerWhite = isPlayerWhite;
  const topTime = playerWhite ? blackTime : whiteTime;
  const bottomTime = playerWhite ? whiteTime : blackTime;
  const topActive = playerWhite ? blackActive : whiteActive;
  const bottomActive = playerWhite ? whiteActive : blackActive;
  const topLow = playerWhite ? isLowTime(blackTime) : isLowTime(whiteTime);
  const bottomLow = playerWhite ? isLowTime(whiteTime) : isLowTime(blackTime);
  const topCritical = playerWhite ? isCritical(blackTime) : isCritical(whiteTime);
  const bottomCritical = playerWhite ? isCritical(whiteTime) : isCritical(blackTime);

  return (
    <>
      <div className={`clock-container top ${topActive ? 'active' : ''} ${topLow ? 'low' : ''} ${topCritical ? 'critical' : ''}`}>
        <span className="clock-time">{formatTime(topTime)}</span>
      </div>
      <div className={`clock-container bottom ${bottomActive ? 'active' : ''} ${bottomLow ? 'low' : ''} ${bottomCritical ? 'critical' : ''}`}>
        <span className="clock-time">{formatTime(bottomTime)}</span>
      </div>
    </>
  );
}

export function useClock(initialTime, increment) {
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [activeColor, setActiveColor] = useState('w');
  const timerRef = useRef(null);
  const lastTick = useRef(null);

  const start = useCallback((color) => {
    setActiveColor(color);
    setIsRunning(true);
    lastTick.current = Date.now();
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const switchTurn = useCallback((color, inc) => {
    // Add increment to the color that just moved
    if (color === 'w') {
      setWhiteTime(prev => prev + (inc || 0));
    } else {
      setBlackTime(prev => prev + (inc || 0));
    }
    setActiveColor(color === 'w' ? 'b' : 'w');
  }, []);

  const reset = useCallback((time) => {
    setWhiteTime(time || initialTime);
    setBlackTime(time || initialTime);
    setIsRunning(false);
    setActiveColor('w');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - (lastTick.current || now);
      lastTick.current = now;

      if (activeColor === 'w') {
        setWhiteTime(prev => {
          const next = prev - delta;
          if (next <= 0) {
            setIsRunning(false);
            return 0;
          }
          return next;
        });
      } else {
        setBlackTime(prev => {
          const next = prev - delta;
          if (next <= 0) {
            setIsRunning(false);
            return 0;
          }
          return next;
        });
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeColor]);

  return { whiteTime, blackTime, activeColor, isRunning, start, stop, switchTurn, reset };
}
