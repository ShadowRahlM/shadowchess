import React from 'react';

export default function MoveList({ moves, currentMoveIndex }) {
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      moveNum: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  return (
    <div className="move-list">
      <div className="move-list-header">
        <span className="move-col move-num">#</span>
        <span className="move-col">White</span>
        <span className="move-col">Black</span>
      </div>
      <div className="move-list-body">
        {rows.map((row) => (
          <div key={row.moveNum} className="move-row">
            <span className="move-col move-num">{row.moveNum}.</span>
            <span
              className={`move-col move ${row.whiteIndex === currentMoveIndex ? 'current' : ''}`}
            >
              {row.white}
            </span>
            <span
              className={`move-col move ${row.blackIndex === currentMoveIndex ? 'current' : ''}`}
            >
              {row.black || ''}
            </span>
          </div>
        ))}
        {moves.length === 0 && (
          <div className="move-list-empty">No moves yet. Make a move to start!</div>
        )}
      </div>
    </div>
  );
}
