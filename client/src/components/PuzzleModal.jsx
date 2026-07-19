import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { getPuzzles, validatePuzzleMove } from '../data/puzzles';

var FILES = ['a','b','c','d','e','f','g','h'];
var THEMES = {
  brown: { light:'#f0d9b5', dark:'#b58863' },
  blue: { light:'#dee3e6', dark:'#8ca2ad' },
  green: { light:'#ffffdd', dark:'#86a666' },
  purple: { light:'#e8d5f5', dark:'#9b72cf' },
  red: { light:'#f5d5d5', dark:'#c87272' },
  dark: { light:'#4a4a4a', dark:'#2a2a2a' }
};

function getTheme(t) { return THEMES[t] || THEMES.brown; }
function pieceImg(p) { return '/pieces/' + (window._pieceSet || 'cburnett') + '/' + p.substring(1) + p.substring(0,1) + '.svg'; }

export default function PuzzleModal({ onClose, pieceSet, boardTheme }) {
  var [puzzle, setPuzzle] = useState(null);
  var [game, setGame] = useState(new Chess());
  var [moveIdx, setMoveIdx] = useState(0);
  var [message, setMessage] = useState('');
  var [rating, setRating] = useState(1500);
  var [streak, setStreak] = useState(0);
  var [solved, setSolved] = useState(false);
  var [selected, setSelected] = useState(null);
  var [legalDests, setLegalDests] = useState([]);
  var gameRef = useRef(game);
  gameRef.current = game;
  var puzzleRef = useRef(puzzle);
  puzzleRef.current = puzzle;
  var moveIdxRef = useRef(moveIdx);
  moveIdxRef.current = moveIdx;

  function nextPuzzle() {
    var puzzles = getPuzzles();
    if (puzzles.length === 0) return;
    var p = puzzles[0];
    setPuzzle(p);
    var g = new Chess(p.fen);
    // Make the first move to show the position after the initial tactic move
    if (p.moves.length > 0) {
      try { g.move(p.moves[0]); } catch(e) {}
    }
    setGame(g);
    setMoveIdx(g.history().length);
    setMessage('Solve the puzzle!');
    setSolved(false);
    setSelected(null);
    setLegalDests([]);
  }

  function handleSquareClick(sq) {
    if (solved || !puzzle) return;
    var g = gameRef.current;
    if (selected) {
      var legal = g.moves({ square: selected, verbose: true });
      var match = legal.find(function(m) { return m.to === sq; });
      if (match) {
        var uci = match.from + match.to + (match.promotion || '');
        var result = validatePuzzleMove(puzzle, moveHistory(), uci);
        if (result.status === 'correct') {
          var ng = new Chess(g.fen());
          ng.move(uci);
          setGame(ng);
          setMoveIdx(moveIdxRef.current + 1);
          setSelected(null);
          setLegalDests([]);
          if (result.complete) {
            setSolved(true);
            var oldR = rating;
            var newR = Math.round(rating + 20 * (1 - (rating - 1200) / 1000));
            setRating(newR);
            setStreak(streak + 1);
            setMessage('Correct! Rating: ' + oldR + ' → ' + newR + ' (' + (newR - oldR > 0 ? '+' : '') + (newR - oldR) + ')');
          } else {
            setMessage('Good! Continue...');
          }
        } else {
          setMessage('Wrong! Expected: ' + result.expected + '. Try again.');
          setSelected(null);
          setLegalDests([]);
        }
        return;
      }
      setSelected(null);
      setLegalDests([]);
      return;
    }
    var piece = g.get(sq);
    if (piece && piece.color === g.turn()) {
      setSelected(sq);
      setLegalDests(g.moves({ square: sq, verbose: true }).map(function(m) { return m.to; }));
    }
  }

  function moveHistory() {
    var g = gameRef.current;
    return g.history({ verbose: true }).map(function(m) { return m.from + m.to + (m.promotion || ''); });
  }

  var th = getTheme(boardTheme || 'brown');
  var ps = pieceSet || 'cburnett';

  return (
    <div className="puzzle-overlay" style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div className="puzzle-modal" style={{ background:'#1a1a1a', border:'1px solid #444', borderRadius:8, padding:20, maxWidth:420, width:'90%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#a855f7' }}>Tactical Puzzles</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:18 }}>x</button>
        </div>

        {!puzzle && (
          <div style={{ textAlign:'center', padding:20 }}>
            <button onClick={nextPuzzle} style={{ padding:'10px 24px', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:14, fontWeight:600 }}>
              Start Puzzles
            </button>
          </div>
        )}

        {puzzle && (
          <>
            <div className="puzzle-info" style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, color:'#aaa' }}>
              <span>Rating: <strong style={{ color:'#fbbf24' }}>{rating}</strong></span>
              <span>Streak: <strong style={{ color:'#81c784' }}>{streak}</strong></span>
              <span>Theme: <strong style={{ color:'#64b5f6' }}>{puzzle.theme}</strong></span>
            </div>

            <div style={{ width:280, height:280, margin:'0 auto', position:'relative' }}>
              {[...Array(8)].map(function(_, ri) {
                return [...Array(8)].map(function(_, ci) {
                  var sq = FILES[ci] + (8 - ri);
                  var dark = (ri + ci) % 2 === 1;
                  var piece = game.get(sq);
                  var isSelected = selected === sq;
                  var isLegal = legalDests.indexOf(sq) !== -1;
                  return (
                    <div key={sq}
                      onClick={function() { handleSquareClick(sq); }}
                      style={{
                        position:'absolute',
                        left: ci * 35, top: ri * 35,
                        width:35, height:35,
                        background: isSelected ? '#aadc' : dark ? th.dark : th.light,
                        cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                      {piece && <img src={pieceImg(piece.color + piece.type)} alt="" style={{ width:30, height:30, pointerEvents:'none' }} draggable={false} />}
                      {isLegal && !piece && <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(0,0,0,0.25)' }} />}
                      {isLegal && piece && <div style={{ width:32, height:32, border:'3px solid rgba(0,0,0,0.25)', borderRadius:'50%', position:'absolute' }} />}
                    </div>
                  );
                });
              })}
            </div>

            {puzzle.description && (
              <div style={{ textAlign:'center', fontSize:11, color:'#888', marginTop:8 }}>{puzzle.description}</div>
            )}

            <div style={{ textAlign:'center', fontSize:12, color: message.indexOf('Correct') === 0 ? '#81c784' : message.indexOf('Wrong') === 0 ? '#e57373' : '#aaa', margin:'8px 0', minHeight:18 }}>
              {message}
            </div>

            <div className="puzzle-solution" style={{ fontSize:11, color:'#666', textAlign:'center', marginBottom:8 }}>
              Solution: {puzzle.moves.map(function(m, i) {
                var g2 = new Chess(puzzle.fen);
                for (var j = 0; j <= i; j++) { try { g2.move(puzzle.moves[j]); } catch(e) {} }
                return <span key={i} style={{ color: i < moveIdxRef.current ? '#81c784' : '#555', margin:'0 2px' }}>{i > 0 && i % 2 === 0 ? '...' : ''}{g2.history().pop() || m} </span>;
              })}
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {solved && <button onClick={nextPuzzle} style={{ padding:'8px 20px', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:13, fontWeight:600 }}>Next Puzzle</button>}
              <button onClick={nextPuzzle} style={{ padding:'8px 20px', background:'#333', color:'#ccc', border:'1px solid #555', borderRadius:4, cursor:'pointer', fontSize:13 }}>{solved ? 'Skip' : 'New Puzzle'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
