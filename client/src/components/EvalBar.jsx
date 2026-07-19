import React from 'react';
import './EvalBar.css';

export default function EvalBar({ score, playerColor }) {
  const evalScore = score !== null ? score : 0;

  const evalToPercent = (cp) => {
    if (cp === null || cp === undefined) return 50;
    const clamped = Math.max(-1000, Math.min(1000, cp));
    return 50 + (clamped / 2000) * 100;
  };

  const whitePercent = evalToPercent(evalScore);

  const formatEval = (cp) => {
    if (cp === null || cp === undefined) return '0.0';
    if (Math.abs(cp) > 9000) {
      return cp > 0
        ? `M${Math.ceil((10000 - cp) / 2)}`
        : `-M${Math.ceil((10000 + cp) / 2)}`;
    }
    return (cp / 100).toFixed(1);
  };

  const evalLabel =
    evalScore > 0 ? `+${formatEval(evalScore)}` : formatEval(evalScore);

  return (
    <div className="eval-gauge">
      <div
        className="eval-black-fill"
        style={{ height: `${100 - whitePercent}%` }}
      />
      <div className="eval-tick" />
      <div className="eval-label-box">
        <span className="eval-text">{evalLabel}</span>
      </div>
    </div>
  );
}
