import React, { useState } from 'react';
import { Chess } from 'chess.js';

export default function PgnPanel({ game, moves, onLoadPgn }) {
  const [pgnText, setPgnText] = useState('');
  const [mode, setMode] = useState('buttons');

  const generatePgn = () => {
    if (!game) return '';
    var header = '';
    header += '[Event "ShadowChess Game"]\n';
    header += '[Site "ShadowChess"]\n';
    header += '[Date "' + new Date().toISOString().split('T')[0] + '"]\n';
    header += '[Round "1"]\n';
    header += '[White "Player"]\n';
    header += '[Black "ShadowEngine"]\n';
    header += '[Result "' + (game.isCheckmate() ? (game.turn() === 'w' ? '0-1' : '1-0') : game.isDraw() ? '1/2-1/2' : '*') + '"]\n\n';
    var moveText = '';
    for (var i = 0; i < moves.length; i++) {
      if (i % 2 === 0) moveText += (Math.floor(i / 2) + 1) + '. ';
      var san = typeof moves[i] === 'string' ? moves[i] : moves[i].san;
      moveText += san + ' ';
    }
    moveText = moveText.trim();
    var result = game.isCheckmate() ? (game.turn() === 'w' ? ' 0-1' : ' 1-0') : game.isDraw() ? ' 1/2-1/2' : ' *';
    return header + moveText + result;
  };

  function handleExport() {
    var pgn = generatePgn();
    navigator.clipboard.writeText(pgn).then(function() {
      alert('PGN copied to clipboard!');
    }).catch(function() {
      setPgnText(pgn);
      setMode('export');
    });
  }

  function handleImport() {
    try {
      var chess = new Chess();
      chess.loadPgn(pgnText);
      var history = chess.history();
      if (onLoadPgn) onLoadPgn(history, chess);
      setPgnText('');
      setMode('buttons');
    } catch (e) {
      alert('Invalid PGN format');
    }
  }

  if (mode === 'buttons') {
    return (
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={handleExport} style={{ flex:1, padding:'8px 0', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600 }}>Export to Clipboard</button>
        <button onClick={function() { setPgnText(''); setMode('import'); }} style={{ flex:1, padding:'8px 0', background:'#333', color:'#ccc', border:'1px solid #555', borderRadius:4, cursor:'pointer', fontSize:12 }}>Import PGN</button>
      </div>
    );
  }

  if (mode === 'export') {
    return (
      <div>
        <textarea value={pgnText} readOnly style={{ width:'100%', height:160, background:'#111', color:'#ccc', border:'1px solid #555', borderRadius:4, padding:8, fontSize:11, fontFamily:'monospace', resize:'vertical' }} />
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={function() { setMode('buttons'); }} style={{ flex:1, padding:'6px 0', background:'#333', color:'#ccc', border:'1px solid #555', borderRadius:4, cursor:'pointer', fontSize:12 }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <textarea value={pgnText} onChange={function(e) { setPgnText(e.target.value); }} placeholder="Paste PGN here to import..." style={{ width:'100%', height:160, background:'#111', color:'#ccc', border:'1px solid #555', borderRadius:4, padding:8, fontSize:11, fontFamily:'monospace', resize:'vertical', boxSizing:'border-box' }} />
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={handleImport} style={{ flex:1, padding:'6px 0', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600 }}>Import</button>
        <button onClick={function() { setMode('buttons'); }} style={{ flex:1, padding:'6px 0', background:'#333', color:'#ccc', border:'1px solid #555', borderRadius:4, cursor:'pointer', fontSize:12 }}>Cancel</button>
      </div>
    </div>
  );
}
