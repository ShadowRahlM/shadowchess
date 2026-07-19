import React from 'react';

export default function EnginePanel({ engine }) {
  const formatScore = (score) => {
    if (score === null || score === undefined) return '--';
    if (Math.abs(score) > 9000) {
      return score > 0 ? `M${Math.ceil((10000 - score) / 2)}` : `-M${Math.ceil((10000 + score) / 2)}`;
    }
    return (score / 100).toFixed(2);
  };

  const formatNps = (nps) => {
    if (nps === 0) return '--';
    if (nps >= 1000000) return `${(nps / 1000000).toFixed(1)}M`;
    if (nps >= 1000) return `${(nps / 1000).toFixed(0)}K`;
    return nps.toString();
  };

  return (
    <div className="engine-panel">
      <div className="engine-header">
        <div className="engine-status">
          <span className={`status-dot ${engine.connected ? 'connected' : 'disconnected'}`} />
          <span className="engine-name">{engine.engineInfo || 'Connecting...'}</span>
        </div>
      </div>

      {engine.analysis && (
        <div className="engine-analysis">
          <div className="analysis-row">
            <span className="analysis-label">Depth</span>
            <span className="analysis-value">{engine.analysis.depth}/{engine.analysis.seldepth}</span>
          </div>
          <div className="analysis-row">
            <span className="analysis-label">Score</span>
            <span className="analysis-value">{formatScore(engine.score)}</span>
          </div>
          <div className="analysis-row">
            <span className="analysis-label">Nodes</span>
            <span className="analysis-value">{engine.nodes.toLocaleString()}</span>
          </div>
          <div className="analysis-row">
            <span className="analysis-label">NPS</span>
            <span className="analysis-value">{formatNps(engine.nps)}</span>
          </div>
          {engine.pv && (
            <div className="analysis-pv">
              <span className="analysis-label">PV</span>
              <span className="pv-line">{engine.pv}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
