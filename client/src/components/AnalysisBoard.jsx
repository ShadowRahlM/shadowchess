import React from 'react';
import './AnalysisBoard.css';

const PIECE_SETS = {
  cburnett: { name: 'CBurnett', path: '/pieces/cburnett' },
};

export default function AnalysisBoard({
  analysis,
  currentMoveIndex,
  onMoveClick,
  onBack,
  onForward,
  onFirst,
  onLast,
  isAnalyzing,
  onAnalyze,
  gameMoves,
  analysisProgress,
}) {
  const getPieceUrl = (piece) => {
    if (!piece) return null;
    const filePiece = piece[0] + piece[1].toUpperCase();
    return `/pieces/cburnett/${filePiece}.svg`;
  };

  const current = analysis && currentMoveIndex >= 0 ? analysis[currentMoveIndex] : null;

  const getClassificationSummary = () => {
    if (!analysis) return null;
    const counts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    analysis.forEach(a => {
      if (a.classification) {
        const type = a.classification.type;
        if (counts[type] !== undefined) counts[type]++;
      }
    });
    return counts;
  };

  const summary = getClassificationSummary();

  return (
    <div className="analysis-board">
      <div className="analysis-header">
        <h3>Game Analysis</h3>
        {!analysis && !isAnalyzing && (
          <button className="analyze-btn" onClick={onAnalyze}>
            Analyze Game
          </button>
        )}
        {isAnalyzing && (
          <div className="analysis-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${analysisProgress || 0}%` }}
              />
            </div>
            <span className="progress-text">
              Analyzing... {Math.round(analysisProgress || 0)}%
            </span>
          </div>
        )}
      </div>

      {/* Classification summary */}
      {summary && (
        <div className="classification-summary">
          <div className="class-item best">
            <span className="class-count">{summary.best}</span>
            <span className="class-symbol">★</span>
          </div>
          <div className="class-item good">
            <span className="class-count">{summary.good}</span>
            <span className="class-symbol">✓</span>
          </div>
          <div className="class-item inaccuracy">
            <span className="class-count">{summary.inaccuracy}</span>
            <span className="class-symbol">?!</span>
          </div>
          <div className="class-item mistake">
            <span className="class-count">{summary.mistake}</span>
            <span className="class-symbol">?</span>
          </div>
          <div className="class-item blunder">
            <span className="class-count">{summary.blunder}</span>
            <span className="class-symbol">??</span>
          </div>
        </div>
      )}

      {/* Analysis move list */}
      {analysis && (
        <div className="analysis-moves">
          {analysis.map((a, i) => {
            if (!a.actualMove) return null;

            const isActive = i === currentMoveIndex;
            const classType = a.classification ? a.classification.type : 'ok';

            return (
              <div
                key={i}
                className={`analysis-move ${isActive ? 'active' : ''} ${classType}`}
                onClick={() => onMoveClick(i)}
              >
                <span className="move-number">
                  {a.isWhite ? `${Math.floor(i / 2) + 1}.` : ''}
                </span>
                <span className="move-san">{a.actualMove}</span>
                {a.classification && (
                  <span
                    className="move-class-badge"
                    style={{ color: a.classification.color }}
                  >
                    {a.classification.symbol}
                  </span>
                )}
                {isActive && a.bestMove && a.actualMove !== a.bestMove && (
                  <span className="best-move-hint">
                    Best: {a.bestMove}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      {analysis && (
        <div className="analysis-nav">
          <button className="nav-btn" onClick={onFirst} title="First move">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button className="nav-btn" onClick={onBack} title="Previous move">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button className="nav-btn" onClick={onForward} title="Next move">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
          <button className="nav-btn" onClick={onLast} title="Last move">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Current position details */}
      {current && (
        <div className="position-details">
          <div className="detail-row">
            <span className="detail-label">Eval</span>
            <span className="detail-value">
              {current.score > 0 ? '+' : ''}{(current.score / 100).toFixed(2)}
            </span>
          </div>
          {current.bestMove && (
            <div className="detail-row">
              <span className="detail-label">Best</span>
              <span className="detail-value best-move">{current.bestMove}</span>
            </div>
          )}
          {current.classification && (
            <div className="detail-row">
              <span className="detail-label">Move</span>
              <span
                className="detail-value"
                style={{ color: current.classification.color }}
              >
                {current.classification.label}
              </span>
            </div>
          )}
          {current.pv && (
            <div className="detail-row pv-row">
              <span className="detail-label">PV</span>
              <span className="detail-value pv">{current.pv}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
