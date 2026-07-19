import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { playMove, playCapture, playCheck, playGameOver, playError, playDraw, setPack, setVolume, setEnabled, getPacks, getPack, getVolume, isEnabled } from '../sounds';
import PgnPanel from './PgnPanel';
import GameDatabase from './GameDatabase';
import PuzzleModal from './PuzzleModal';
import SettingsModal from './SettingsModal';
import EvalGraph from './EvalGraph';
import './Board.css';

const FILES = ['a','b','c','d','e','f','g','h'];
var THEMES = {
  brown: { light:'#f0d9b5', dark:'#b58863', name:'Brown' },
  blue: { light:'#dee3e6', dark:'#8ca2ad', name:'Blue' },
  green: { light:'#ffffdd', dark:'#86a666', name:'Green' },
  purple: { light:'#e8d5f5', dark:'#9b72cf', name:'Purple' },
  red: { light:'#f5d5d5', dark:'#cf7272', name:'Red' },
  dark: { light:'#302e2b', dark:'#1b1a17', name:'Dark' }
};

export default function Board() {
  const [game] = useState(new Chess());
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);
  const [legalDests, setLegalDests] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('Connecting to engine...');
  const [flipped, setFlipped] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [engineScore, setEngineScore] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [moves, setMoves] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({x:0, y:0});
  const [depth, setDepth] = useState(15);
  const [soundOn, setSoundOnState] = useState(isEnabled());
  const [soundPack, setSoundPackState] = useState(getPack());
  const [soundVol, setSoundVol] = useState(getVolume());
  const [analyzing, setAnalyzing] = useState(false);
  const analyzingRef = useRef(false);
  const [analysis, setAnalysis] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const [openingName, setOpeningName] = useState('');
  const [engineDepth, setEngineDepth] = useState(0);
  const [engineNps, setEngineNps] = useState(0);
  const [enginePv, setEnginePv] = useState('');
  const [engineWdl, setEngineWdl] = useState(null);
  const [gameOverModal, setGameOverModal] = useState(null);
  const [moveAnim, setMoveAnim] = useState(null);
  const [resigned, setResigned] = useState(false);
  const playerColorRef = useRef(playerColor);
  // Clock
  const [clockEnabled, setClockEnabled] = useState(false);
  const [clockTime, setClockTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [clockInterval, setClockInterval] = useState(null);
  const whiteTimeRef = useRef(600);
  const blackTimeRef = useRef(600);
  const redoStackRef = useRef([]);
  const [showPgn, setShowPgn] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [boardTheme, setBoardTheme] = useState('brown');
  const [arrows, setArrows] = useState([]);
  const [arrowStart, setArrowStart] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [viewingIdx, setViewingIdx] = useState(null);
  const prevScoreRef = useRef(null);
  const [premove, setPremove] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [boardSize, setBoardSize] = useState(100);
  const [coordsMode, setCoordsMode] = useState('in');
  const [animDuration, setAnimDuration] = useState(300);
  const [bgTheme, setBgTheme] = useState('dark');
  const [pieceSet, setPieceSet] = useState('cburnett');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFenInput, setShowFenInput] = useState(false);
  const [showPuzzles, setShowPuzzles] = useState(false);
  const [useWasm, setUseWasm] = useState(false);
  const wasmRef = useRef(null);
  const [fenInput, setFenInput] = useState('');
  const [editorMode, setEditorMode] = useState(false);
  const [editPiece, setEditPiece] = useState(null);
  const [openingBook, setOpeningBook] = useState(null);
  const [tablebase, setTablebase] = useState(null);
  const [tbMainline, setTbMainline] = useState([]);
  const [multiPv, setMultiPv] = useState(1);
  const [multiPvs, setMultiPvs] = useState([]);
  const [openingPath, setOpeningPath] = useState([]);
  const [explorerData, setExplorerData] = useState(null);
  const [explorerSource, setExplorerSource] = useState('lichess');
  const [explorerPlayerName, setExplorerPlayerName] = useState('');
  const [recentGames, setRecentGames] = useState([]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOnState(next);
    setEnabled(next);
  }
  function changePack(pack) {
    setSoundPackState(pack);
    setPack(pack);
  }
  function changeVolume(v) {
    setSoundVol(v);
    setVolume(v);
  }

  const wsRef = useRef(null);
  const boardRef = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const moveScoresRef = useRef([]);
  const scoreVersionRef = useRef(0);

  function toWhiteScore(sc, fen) {
    return fen && fen.indexOf(' b ') !== -1 ? -sc : sc;
  }

  function rebuildAnalysis() {
    var scores = moveScoresRef.current;
    var movesList = gameRef.current.history({ verbose: true });
    var len = movesList.length;
    var newAnalysis = [];
    for (var mi = 0; mi < len; mi++) {
      var sc = scores[mi + 1];
      var entry = { score: sc != null ? sc : 0 };
      if (scores[mi] != null && scores[mi + 1] != null) {
        var moveColor = movesList[mi].color;
        var cpLoss = moveColor === 'w' ? scores[mi] - scores[mi + 1] : scores[mi + 1] - scores[mi];
        if (cpLoss < -1.5) {
          entry.classification = { symbol: '!!', color: '#fbbf24' };
        } else if (cpLoss < -0.25) {
          entry.classification = { symbol: '!', color: '#22c55e' };
        } else if (cpLoss > 1.5) {
          entry.classification = { symbol: '??', color: '#ef4444' };
        } else if (cpLoss > 0.75) {
          entry.classification = { symbol: '?', color: '#f97316' };
        } else if (cpLoss > 0.25) {
          entry.classification = { symbol: '!?', color: '#f59e0b' };
        }
      }
      newAnalysis.push(entry);
    }
    setAnalysis(newAnalysis);
  }

  function saveAnalysisScore(sc) {
    if (sc == null) return;
    var whiteSc = toWhiteScore(sc, gameRef.current.fen());
    var moveCount = gameRef.current.history().length;
    moveScoresRef.current[moveCount] = whiteSc;
    rebuildAnalysis();
  }

  function sendEngine(cmd) {
    if (wasmRef.current) {
      switch (cmd.type) {
        case 'stop': wasmRef.current.uci('stop'); break;
        case 'position': wasmRef.current.uci('position fen ' + cmd.fen); break;
        case 'go': wasmRef.current.uci('go depth ' + cmd.options.depth + ' movetime ' + cmd.options.movetime); break;
        case 'setoption': wasmRef.current.uci('setoption name ' + cmd.name + ' value ' + cmd.value); break;
        case 'newgame': wasmRef.current.uci('ucinewgame'); break;
      }
    } else if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }
  function engineGo(opts) {
    if (multiPv > 1) sendEngine({ type: 'setoption', name: 'MultiPV', value: multiPv });
    setMultiPvs([]);
    sendEngine({ type: 'go', options: opts });
  }

  const refreshBoard = useCallback((forceFlipped) => {
    const isFlipped = forceFlipped !== undefined ? forceFlipped : flipped;
    const b = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (let c = 0; c < 8; c++) {
        const f = FILES[c];
        const rk = String(isFlipped ? 1 + r : 8 - r);
        const sq = f + rk;
        const p = game.get(sq);
        row.push({ sq, piece: p ? p.color + p.type : null, dark: (r+c)%2===1 });
      }
      b.push(row);
    }
    setBoard(b);
  }, [game, flipped]);

  useEffect(() => { refreshBoard(); }, [refreshBoard]);

  // Keep analyzingRef in sync
  useEffect(function() { analyzingRef.current = analyzing; }, [analyzing]);

  // When navigating positions during infinite analysis, re-analyze
  useEffect(function() {
    if (!analyzingRef.current) return;
    var fen = game.fen();
    if (viewingIdx !== null && viewingIdx !== moves.length) {
      var dg = new Chess();
      for (var vi = 0; vi < viewingIdx; vi++) {
        try { dg.move(moves[vi].san); } catch(e) { break; }
      }
      fen = dg.fen();
    }
    sendEngine({ type: 'stop' });
    sendEngine({ type: 'position', fen: fen });
    engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
  }, [viewingIdx]);

  // Keyboard navigation
  useEffect(function() {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        setViewingIdx(function(v) { var cur = v != null ? v : moves.length; var nv = cur - 1; return nv < 0 ? 0 : nv; });
      } else if (e.key === 'ArrowRight') {
        setViewingIdx(function(v) { var cur = v != null ? v : moves.length; var nv = cur + 1; return nv > moves.length ? moves.length : nv; });
      } else if (e.key === 'Home') {
        setViewingIdx(0);
      } else if (e.key === 'End') {
        setViewingIdx(null);
      } else if (e.key === '?') {
        setShowShortcuts(function(s) { return !s; });
      }
    }
    window.addEventListener('keydown', onKey);
    return function() { window.removeEventListener('keydown', onKey); };
  }, [moves.length]);

  // Unified engine line handler (used by both WebSocket and WASM)
  function handleEngineLine(line) {
    var mpvMatch = line.match(/multipv (\d+)/);
    var multiPvNum = mpvMatch ? parseInt(mpvMatch[1]) : 1;
    if (line.indexOf('score cp') !== -1) {
      const m = line.match(/score cp (-?\d+)/);
      if (m) {
        var sc = parseInt(m[1]);
        if (multiPvNum === 1) { setEngineScore(sc); saveAnalysisScore(sc); }
        setMultiPvs(function(prev) {
          var pvMatch2 = line.match(/ pv (.+)$/);
          var pvStr = pvMatch2 ? pvMatch2[1] : '';
          var found = false;
          var next = prev.map(function(p) {
            if (p.num === multiPvNum) { found = true; return { num: multiPvNum, score: sc, pv: pvStr }; }
            return p;
          });
          if (!found) next.push({ num: multiPvNum, score: sc, pv: pvStr });
          return next.sort(function(a,b) { return a.num - b.num; });
        });
      }
    }
    if (line.indexOf('depth') !== -1 && multiPvNum === 1) {
      var dm = line.match(/depth (\d+)/);
      if (dm) setEngineDepth(parseInt(dm[1]));
      var nm = line.match(/nps (\d+)/);
      if (nm) setEngineNps(parseInt(nm[1]));
      var pm = line.match(/ pv (.+)$/);
      if (pm) setEnginePv(pm[1]);
      var mm = line.match(/score mate (-?\d+)/);
      if (mm) { var mateIn = parseInt(mm[1]); if (multiPvNum === 1) setEngineScore(mateIn > 0 ? 100000 : -100000); saveAnalysisScore(mateIn > 0 ? 100000 : -100000); }
      var wm = line.match(/wdl (-?\d+) (-?\d+) (-?\d+)/);
      if (wm) setEngineWdl({ win: parseInt(wm[1]), draw: parseInt(wm[2]), loss: parseInt(wm[3]) });
    }
    if (line.indexOf('bestmove') === 0) {
      const bm = line.split(' ')[1];
      setThinking(false);
      if (!bm || bm === 'none') return;
      if (gameRef.current.turn() === playerColorRef.current && prevScoreRef.current != null && engineScore != null) {
        var evalDrop = prevScoreRef.current - engineScore;
        if (evalDrop > 150 && enginePv) {
          var pvParts = enginePv.split(' ');
          if (pvParts.length >= 1 && pvParts[0].length >= 4) {
            setArrows(function(a) { return a.concat([{ from: pvParts[0].substring(0,2), to: pvParts[0].substring(2,4), color: 'rgba(255,80,80,0.9)' }]); });
          }
        }
      }
      if (gameRef.current.turn() !== playerColorRef.current) {
        try {
          const mv = gameRef.current.move({ from: bm.substring(0,2), to: bm.substring(2,4), promotion: bm.length > 4 ? bm[4] : undefined });
          if (mv) {
            setLastMove({ from: mv.from, to: mv.to });
            setMoveAnim({ sq: mv.to, t: Date.now() });
            setMoves(gameRef.current.history({ verbose: true }));
            refreshBoard();
            updateStatus();
            if (soundOn) {
              if (mv.captured) playCapture(); else playMove();
              if (gameRef.current.isCheck()) setTimeout(playCheck, 200);
              if (gameRef.current.isGameOver()) setTimeout(function() { playGameOver(false); }, 300);
            }
            if (gameRef.current.isGameOver()) setTimeout(autoAnalyze, 500);
          }
        } catch(e) {}
        if (premove && premove.to && gameRef.current.turn() === playerColorRef.current) {
          try {
            var pmv = gameRef.current.move({ from: premove.from, to: premove.to, promotion: 'q' });
            if (pmv) {
              prevScoreRef.current = engineScore;
              setLastMove({ from: pmv.from, to: pmv.to });
              setMoveAnim({ sq: pmv.to, t: Date.now() });
              setMoves(gameRef.current.history({ verbose: true }));
              setPremove(null);
              refreshBoard();
              setThinking(true);
              updateStatus();
              if (soundOn) {
                if (pmv.captured) playCapture(); else playMove();
                if (gameRef.current.isCheck()) setTimeout(playCheck, 200);
                if (gameRef.current.isGameOver()) setTimeout(function() { playGameOver(gameRef.current.isCheckmate()); }, 300);
              }
              sendEngine({ type: 'stop' });
              sendEngine({ type: 'position', fen: gameRef.current.fen() });
              engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
              setTimeout(function() { setThinking(function(t) { if (t) { sendEngine({ type: 'stop' }); return false; } return t; }); }, Math.min(depth * 1000, 15000));
            }
          } catch(e) { setPremove(null); }
        }
        if (analyzingRef.current) {
          setTimeout(function() {
            var fen = gameRef.current.fen();
            sendEngine({ type: 'position', fen: fen });
            engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
          }, 100);
        }
      }
    }
  }

  // Engine connection (WebSocket or WASM)
  useEffect(() => {
    let closed = false;
    var cancelled = false;

    function startWasm() {
      var sfModule = null;
      var sfQueue = [];
      var readyResolve = null;
      var readyPromise = new Promise(function(resolve) { readyResolve = resolve; });

      // Stockfish.js uses a Web Worker API
      var worker = new Worker(new URL('stockfish.js/stockfish.wasm.js', import.meta.url));
      worker.onmessage = function(e) {
        var line = e.data;
        if (line === 'readyok') {
          for (var i = 0; i < sfQueue.length; i++) worker.postMessage(sfQueue[i]);
          sfQueue = null;
          wasmRef.current = { uci: function(cmd) { worker.postMessage(cmd); }, quit: function() { worker.terminate(); } };
          setEngineReady(true);
          setStatus('Your turn');
          if (multiPv > 1) worker.postMessage('setoption name MultiPV value ' + multiPv);
          worker.postMessage('setoption name UCI_ShowWDL value true');
          if (readyResolve) readyResolve();
          return;
        }
        if (cancelled) return;
        handleEngineLine(line);
      };
      worker.onerror = function(err) {
        console.error('[wasm] worker error:', err);
        setStatus('WASM engine failed, falling back to server...');
        setUseWasm(false);
      };
      worker.postMessage('uci');
      worker.postMessage('setoption name Threads value 2');
      worker.postMessage('setoption name Hash value 128');
      worker.postMessage('isready');
      // Queue commands sent before ready
      wasmRef.current = {
        uci: function(cmd) {
          if (sfQueue) sfQueue.push(cmd);
          else worker.postMessage(cmd);
        },
        quit: function() { worker.terminate(); }
      };
    }

    function startWs() {
      if (closed) return;
      function connect() {
        if (closed) return;
        const ws = new WebSocket('ws://' + window.location.hostname + ':3001');
        wsRef.current = ws;
        ws.onopen = () => console.log('[ws] connected');
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'ready') {
              setEngineReady(true);
              setStatus('Your turn');
              if (multiPv > 1) sendEngine({ type: 'setoption', name: 'MultiPV', value: multiPv });
              sendEngine({ type: 'setoption', name: 'UCI_ShowWDL', value: true });
            }
            if (msg.type === 'engine') {
              handleEngineLine(msg.data);
            }
          } catch(e) {}
        };
        ws.onclose = () => {
          if (closed) return;
          setEngineReady(false);
          setThinking(false);
          setStatus('Disconnected...');
          setTimeout(connect, 2000);
        };
      }
      connect();
    }

    if (useWasm) {
      wasmRef.current = null;
      startWasm();
    } else {
      wsRef.current = null;
      startWs();
    }

    return () => {
      closed = true;
      cancelled = true;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (wasmRef.current) { try { wasmRef.current.uci('quit'); } catch(e) {} wasmRef.current = null; }
    };
  }, [useWasm]);

  useEffect(function() { playerColorRef.current = playerColor; }, [playerColor]);

  // Clock timer
  useEffect(function() {
    if (!clockEnabled || game.isGameOver() || resigned) { return; }
    var interval = setInterval(function() {
      var turn = game.turn();
      if (turn === 'w') {
        whiteTimeRef.current = Math.max(0, whiteTimeRef.current - 1);
        setWhiteTime(whiteTimeRef.current);
        if (whiteTimeRef.current <= 0) {
          setResigned(true);
          setStatus('Time out! Black wins.');
          setGameOverModal('Time out — Black wins');
          clearInterval(interval);
        }
      } else {
        blackTimeRef.current = Math.max(0, blackTimeRef.current - 1);
        setBlackTime(blackTimeRef.current);
        if (blackTimeRef.current <= 0) {
          setResigned(true);
          setStatus('Time out! White wins.');
          setGameOverModal('Time out — White wins');
          clearInterval(interval);
        }
      }
    }, 1000);
    return function() { clearInterval(interval); };
  }, [clockEnabled, game.turn(), game.isGameOver(), moves.length, resigned]);

  // Keyboard shortcuts
  useEffect(function() {
    function onKeyDown(e) {
      // Ctrl+Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoMove();
      }
      // Ctrl+Y or Ctrl+Shift+Z = redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoMove();
      }
      // Arrow keys for analysis navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        undoMove();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        redoMove();
      }
      // N = new game
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        // Only if not typing in an input
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
          newGame();
        }
      }
      // F = flip board
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
          setFlipped(function(f) { return !f; });
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return function() { window.removeEventListener('keydown', onKeyDown); };
  }, [moves.length, thinking]);

  // Fetch opening book data
  useEffect(function() {
    fetch('/api/openings')
      .then(function(r) { return r.json(); })
      .then(function(data) { setOpeningBook(data); })
      .catch(function() {});
  }, []);

  // Detect opening name from move history
  useEffect(function() {
    if (moves.length === 0) { setOpeningName(''); return; }
    if (!openingBook) return;
    var moveSans = game.history();
    var open = (openingBook.openings || []).find(function(o) {
      var oMoves = o.moves.map(function(uci) {
        var g2 = new Chess();
        try {
          for (var i = 0; i < o.moves.indexOf(uci) + 1; i++) {
            g2.move(o.moves[i]);
          }
          return g2.history().pop();
        } catch(e) { return ''; }
      });
      return oMoves.join(' ') === moveSans.slice(0, o.moves.length).join(' ');
    });
    setOpeningName(open ? open.name : '');
  }, [moves.length, openingBook]);

  // Reset opening explorer drill-down when position changes
  useEffect(function() {
    setOpeningPath([]);
  }, [moves.length, viewingIdx]);

  // Fetch opening explorer data from Lichess API
  useEffect(function() {
    var eg = new Chess();
    if (viewingIdx !== null && viewingIdx !== moves.length) {
      eg.reset();
      for (var vi = 0; vi < viewingIdx; vi++) {
        try { eg.move(moves[vi].san); } catch(e) { break; }
      }
    } else {
      eg.load(game.fen());
    }
    for (var pj = 0; pj < openingPath.length; pj++) {
      try { eg.move(openingPath[pj]); } catch(e) { break; }
    }
    var fen = eg.fen();
    if (!fen || editorMode) { setExplorerData(null); setRecentGames([]); return; }
    var baseUrl = explorerSource === 'masters' ? 'https://explorer.lichess.ovh/masters' :
      explorerSource === 'player' && explorerPlayerName ? 'https://explorer.lichess.ovh/player?player=' + encodeURIComponent(explorerPlayerName) :
      'https://explorer.lichess.ovh/lichess';
    var url = baseUrl + (baseUrl.indexOf('?') !== -1 ? '&' : '?') + 'fen=' + encodeURIComponent(fen);
    var controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!controller.signal.aborted) {
          setExplorerData(data);
          setRecentGames((data.recentGames || []) .slice(0, 10));
        }
      })
      .catch(function() { if (!controller.signal.aborted) { setExplorerData(null); setRecentGames([]); } });
    return function() { controller.abort(); };
  }, [moves.length, viewingIdx, openingPath, explorerSource, explorerPlayerName]);

  // Game over modal trigger
  useEffect(function() {
    if (resigned) return; // resign handles its own modal
    if (!game.isGameOver()) { setGameOverModal(null); return; }
    var result = '';
    if (game.isCheckmate()) {
      var winner = game.turn() === 'w' ? 'Black' : 'White';
      result = 'Checkmate! ' + winner + ' wins.';
    } else if (game.isStalemate()) {
      result = 'Stalemate — Draw';
    } else if (game.isDraw()) {
      result = 'Draw';
    } else {
      result = 'Game Over';
    }
    setGameOverModal(result);
  }, [moves.length]);

  var tbMainlineRef = useRef(null);

  // Query tablebase for positions with few pieces
  useEffect(function() {
    var fen = game.fen();
    var pieceCount = fen.split(' ')[0].split('').filter(function(c) { return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z'; }).length;
    if (pieceCount > 7 || pieceCount < 2) { setTablebase(null); setTbMainline([]); return; }
    var controller = new AbortController();
    var buildId = Date.now();
    tbMainlineRef.current = buildId;
    setTbMainline([]);
    fetch('https://tablebase.lichess.ovh/standard?fen=' + encodeURIComponent(fen), { signal: controller.signal })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setTablebase(data);
        // Build mainline from best move (1.5 moves: best reply + opponent's best)
        if (data && data.moves && data.moves.length > 0 && buildId === tbMainlineRef.current) {
          var best = data.moves[0];
          if (best.dtm == null) { setTbMainline([]); return; }
          var g2 = new Chess(fen);
          try { g2.move({ from: best.uci.substring(0,2), to: best.uci.substring(2,4), promotion: best.uci[4] }); } catch(e) { return; }
          var nf = g2.fen();
          var nc = nf.split(' ')[0].split('').filter(function(c) { return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z'; }).length;
          if (nc > 7 || nc < 2) { setTbMainline([{ san: best.san }]); return; }
          // Fetch opponent's best reply
          fetch('https://tablebase.lichess.ovh/standard?fen=' + encodeURIComponent(nf))
            .then(function(r2) { return r2.json(); })
            .then(function(nextData) {
              if (buildId !== tbMainlineRef.current) return;
              if (!nextData || !nextData.moves || nextData.moves.length === 0) {
                setTbMainline([{ san: best.san }]);
                return;
              }
              var oppBest = nextData.moves.reduce(function(a, b) {
                return (b.dtm != null && (a.dtm == null || Math.abs(b.dtm) < Math.abs(a.dtm))) ? b : a;
              });
              setTbMainline([{ san: best.san }, { san: oppBest.san }]);
            })
            .catch(function() { if (buildId === tbMainlineRef.current) setTbMainline([{ san: best.san }]); });
        }
      })
      .catch(function() { if (!controller.signal.aborted) { setTablebase(null); setTbMainline([]); } });
    return function() { controller.abort(); };
  }, [moves.length, flipped]);

  function updateStatus() {
    var g = gameRef.current;
    if (g.isCheckmate()) {
      var winner = g.turn() === 'w' ? 'Black' : 'White';
      setStatus('Checkmate! ' + winner + ' wins.');
    } else if (g.isDraw()) {
      setStatus('Draw!');
    } else if (g.isCheck()) {
      setStatus((g.turn() === playerColor ? 'Your turn' : 'Engine thinking...') + ' (Check!)');
    } else {
      setStatus(g.turn() === playerColor ? 'Your turn' : 'Engine thinking...');
    }
  }

  function tryMove(from, to) {
    if (game.isGameOver() || resigned || !engineReady || game.turn() !== playerColor) return false;
    try {
      const mv = game.move({ from, to, promotion: 'q' });
      if (mv) {
        prevScoreRef.current = engineScore;
        redoStackRef.current = [];
        setLastMove({ from: mv.from, to: mv.to });
        setMoveAnim({ sq: mv.to, t: Date.now() });
        setSelected(null);
        setLegalDests([]);
    setMoves(game.history({ verbose: true }));
    refreshBoard();
    updateStatus();
    setViewingIdx(null);
    setCurrentMoveIndex(-1);
        // Sound
        if (soundOn) {
          if (mv.captured) playCapture(); else playMove();
          if (game.isCheck()) setTimeout(playCheck, 200);
          if (game.isGameOver()) setTimeout(function() { playGameOver(game.isCheckmate()); }, 300);
        }
        // Auto-analyze on game over
        if (game.isGameOver()) setTimeout(autoAnalyze, 500);
        // Send position to engine, stop first if still thinking
        if (thinking) sendEngine({ type: 'stop' });
        sendEngine({ type: 'position', fen: game.fen() });
        engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
        // Safety timeout: reset thinking if engine doesn't respond in time
        setTimeout(function() {
          setThinking(function(t) { if (t) { sendEngine({ type: 'stop' }); return false; } return t; });
        }, Math.min(depth * 1000, 15000));
        return true;
      }
    } catch(e) {}
    return false;
  }

  function playSanMove(san) {
    if (game.isGameOver() || resigned || !engineReady) return;
    var isViewing = viewingIdx !== null && viewingIdx !== moves.length;
    if (isViewing) {
      game.reset();
      for (var ri = 0; ri < viewingIdx; ri++) {
        try { game.move(moves[ri].san); } catch(e) { break; }
      }
    }
    try {
      var mv = game.move(san);
      if (!mv) return;
      prevScoreRef.current = engineScore;
      redoStackRef.current = [];
      setLastMove({ from: mv.from, to: mv.to });
      setMoveAnim({ sq: mv.to, t: Date.now() });
      setSelected(null);
      setLegalDests([]);
      setMoves(game.history({ verbose: true }));
      refreshBoard();
      updateStatus();
      setViewingIdx(null);
      setCurrentMoveIndex(-1);
      if (soundOn) {
        if (mv.captured) playCapture(); else playMove();
        if (game.isCheck()) setTimeout(playCheck, 200);
        if (game.isGameOver()) setTimeout(function() { playGameOver(game.isCheckmate()); }, 300);
      }
      if (game.isGameOver()) setTimeout(autoAnalyze, 500);
      if (thinking) sendEngine({ type: 'stop' });
      sendEngine({ type: 'position', fen: game.fen() });
      if (analyzingRef.current) {
        engineGo({ depth: depth, infinite: true });
      } else {
        engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
      }
      setTimeout(function() {
        setThinking(function(t) { if (t) { sendEngine({ type: 'stop' }); return false; } return t; });
      }, Math.min(depth * 1000, 15000));
    } catch(e) {}
  }

  function handleSquare(sq) {
    if (dragging) return;
    if (game.isGameOver() || resigned || !engineReady) return;
    // Player's turn — normal move
    if (game.turn() === playerColor) {
      setPremove(null);
      if (selected) {
        if (tryMove(selected, sq)) return;
        if (soundOn) playError();
      }
      var piece = game.get(sq);
      if (piece && piece.color === playerColor) {
        if (soundOn) playSelect();
        setSelected(sq);
        setLegalDests(game.moves({ square: sq, verbose: true }).map(function(m) { return m.to; }));
      } else {
        setSelected(null);
        setLegalDests([]);
      }
      return;
    }
    // Engine's turn — premove
    var p = game.get(sq);
    if (selected) {
      // Had a selection, now clicking destination → set premove
      setPremove({ from: selected, to: sq });
      setSelected(null);
      setLegalDests([]);
    } else if (p && p.color === playerColor) {
      // No selection, clicking own piece → start premove selection
      if (soundOn) playSelect();
      setSelected(sq);
      setLegalDests(game.moves({ square: sq, verbose: true }).map(function(m) { return m.to; }));
    } else if (premove) {
      // Had a premove, clicking new own piece → clear premove, start new selection
      if (p && p.color === playerColor) {
        setPremove(null);
        if (soundOn) playSelect();
        setSelected(sq);
        setLegalDests(game.moves({ square: sq, verbose: true }).map(function(m) { return m.to; }));
      } else {
        setPremove(null);
      }
    }
  }

  function onPointerDown(e, sq, piece) {
    if (!piece || piece[0] !== playerColor || !engineReady || game.turn() !== playerColor || game.isGameOver()) return;
    e.preventDefault();
    e.stopPropagation();
    var rect = boardRef.current ? boardRef.current.getBoundingClientRect() : null;
    if (!rect) return;
    setDragging({ sq: sq, piece: piece });
    setDragPos({ x: e.clientX - rect.left - 26, y: e.clientY - rect.top - 26 });
    setSelected(sq);
    setLegalDests(game.moves({ square: sq, verbose: true }).map(function(m) { return m.to; }));

    function onMove(ev) {
      var r = boardRef.current ? boardRef.current.getBoundingClientRect() : null;
      if (!r) return;
      setDragPos({ x: ev.clientX - r.left - 26, y: ev.clientY - r.top - 26 });
    }
    function onUp(ev) {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      var r = boardRef.current ? boardRef.current.getBoundingClientRect() : null;
      if (!r) { setDragging(null); setSelected(null); setLegalDests([]); return; }
      var col = Math.floor((ev.clientX - r.left) / 64);
      var row = Math.floor((ev.clientY - r.top) / 64);
      setDragging(null);
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        var targetSq = FILES[col] + String(flipped ? 1 + row : 8 - row);
        if (targetSq !== sq) {
          if (!tryMove(sq, targetSq)) { setSelected(null); setLegalDests([]); }
          return;
        }
      }
      setSelected(null);
      setLegalDests([]);
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  function newGame(color) {
    var pc = color || playerColor;
    var shouldFlip = pc === 'b';
    setPlayerColor(pc);
    setFlipped(shouldFlip);
    game.reset();
    setSelected(null);
    setLegalDests([]);
    setLastMove(null);
    setEngineScore(null);
    setThinking(false);
    setMoves([]);
    setAnalysis(null);
    setResigned(false);
    setGameOverModal(null);
    setArrows([]);
    setArrowStart(null);
    setHighlights([]);
    whiteTimeRef.current = 600;
    blackTimeRef.current = 600;
    setWhiteTime(600);
    setBlackTime(600);
    moveScoresRef.current = [];
    setStatus(pc === 'w' ? 'Your turn' : 'Engine thinking...');
    refreshBoard(shouldFlip);
    sendEngine({ type: 'newgame' });
    if (pc === 'b') {
      setTimeout(function() {
        sendEngine({ type: 'position', fen: game.fen() });
        engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
        setThinking(true);
      }, 300);
    }
  }

  function undoMove() {
    if (game.isGameOver() || thinking || moves.length < 2) return;
    // Save moves for redo
    var lastMoves = game.history({ verbose: true }).slice(-2);
    redoStackRef.current.push(lastMoves);
    game.undo();
    game.undo();
    setSelected(null);
    setLegalDests([]);
    setEngineScore(null);
    setMoves(game.history({ verbose: true }));
    refreshBoard();
    updateStatus();
    sendEngine({ type: 'position', fen: game.fen() });
  }

  function redoMove() {
    if (redoStackRef.current.length === 0 || thinking) return;
    var lastMoves = redoStackRef.current.pop();
    if (lastMoves && lastMoves.length >= 2) {
      game.move(lastMoves[0].san);
      game.move(lastMoves[1].san);
    } else if (lastMoves && lastMoves.length === 1) {
      game.move(lastMoves[0].san);
    }
    setSelected(null);
    setLegalDests([]);
    setEngineScore(null);
    setMoves(game.history({ verbose: true }));
    refreshBoard();
    updateStatus();
    sendEngine({ type: 'position', fen: game.fen() });
  }

  function autoAnalyze() {
    if (analyzing) {
      // Stop infinite analysis
      sendEngine({ type: 'stop' });
      setAnalyzing(false);
      analyzingRef.current = false;
      setStatus(game.turn() === playerColor ? 'Your turn' : 'Engine thinking...');
      return;
    }
    var hist = game.history();
    if (hist.length === 0) return;
    setAnalyzing(true);
    analyzingRef.current = true;
    setStatus('Analyzing...');
    // Stop any ongoing engine thinking
    if (thinking) sendEngine({ type: 'stop' });
    sendEngine({ type: 'position', fen: game.fen() });
    engineGo({ depth: depth, movetime: Math.min(depth * 500, 8000) });
  }

  function resign() {
    if (game.isGameOver() || resigned) return;
    setResigned(true);
    setStatus('You resigned. Black wins.');
    setGameOverModal('You resigned — Black wins');
    if (soundOn) playGameOver(false);
    setTimeout(autoAnalyze, 500);
  }

  function handleLoadFen(fen) {
    try {
      game.load(fen);
      setSelected(null);
      setLegalDests([]);
      setLastMove(null);
      setEngineScore(null);
      setThinking(false);
      setMoves([]);
      setAnalysis(null);
      moveScoresRef.current = [];
      setResigned(false);
      setGameOverModal(null);
      setArrows([]);
      setHighlights([]);
      setViewingIdx(null);
      setCurrentMoveIndex(-1);
      setPremove(null);
      refreshBoard();
      setStatus('Position loaded');
      sendEngine({ type: 'newgame' });
      sendEngine({ type: 'position', fen: game.fen() });
    } catch(e) {
      setStatus('Invalid FEN');
    }
    setShowFenInput(false);
  }

  function exportPGN() {
    var pgn = game.pgn({ max_width: 80, newline: '\n' });
    if (!pgn) return;
    navigator.clipboard.writeText(pgn).then(function() {
      setStatus('PGN copied to clipboard!');
    }).catch(function() {
      setStatus('Failed to copy PGN.');
    });
  }

  function handleLoadPgn(history, chess) {
    game.reset();
    for (var i = 0; i < history.length; i++) {
      try { game.move(history[i]); } catch(e) { break; }
    }
    setSelected(null);
    setLegalDests([]);
    setLastMove(null);
    setMoves(chess.history({ verbose: true }));
    setAnalysis(null);
    moveScoresRef.current = [];
    setResigned(false);
    setGameOverModal(null);
    refreshBoard();
    setViewingIdx(0);
    setCurrentMoveIndex(-1);
    setStatus(game.isGameOver() ? (game.isCheckmate() ? 'Checkmate' : game.isDraw() ? 'Draw' : 'Game over') : 'Game loaded from PGN');
    setShowPgn(false);
    sendEngine({ type: 'newgame' });
    setTimeout(autoAnalyze, 300);
  }

  function handleLoadGame(movesArray) {
    game.reset();
    for (var i = 0; i < movesArray.length; i++) {
      try { game.move(movesArray[i]); } catch(e) { break; }
    }
    setSelected(null);
    setLegalDests([]);
    setLastMove(null);
    setMoves(game.history({ verbose: true }));
    setAnalysis(null);
    moveScoresRef.current = [];
    setResigned(false);
    setGameOverModal(null);
    refreshBoard();
    setViewingIdx(0);
    setCurrentMoveIndex(-1);
    setStatus('Game loaded — use navigation to browse moves');
    setShowGames(false);
    sendEngine({ type: 'newgame' });
    setTimeout(autoAnalyze, 300);
  }

  function offerDraw() {
    if (game.isGameOver() || resigned || moves.length < 6) return;
    if (engineScore != null && Math.abs(engineScore) < 30) {
      setResigned(true);
      setStatus('Draw accepted!');
      setGameOverModal('Draw — agreed');
      if (soundOn) { playDraw(); setTimeout(function() { playGameOver(false); }, 400); }
      setTimeout(autoAnalyze, 500);
    } else {
      if (soundOn) playError();
      setStatus('Draw offer declined.');
    }
  }

  function toggleClock() {
    if (clockEnabled) {
      setClockEnabled(false);
      setWhiteTime(600);
      setBlackTime(600);
      whiteTimeRef.current = 600;
      blackTimeRef.current = 600;
    } else {
      setWhiteTime(clockTime);
      setBlackTime(clockTime);
      whiteTimeRef.current = clockTime;
      blackTimeRef.current = clockTime;
      setClockEnabled(true);
    }
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function pieceImg(p) {
    if (!p) return null;
    return '/pieces/' + pieceSet + '/' + p[0] + p[1].toUpperCase() + '.svg';
  }

  var movePairs = [];
  for (var i = 0; i < moves.length; i += 2) {
    movePairs.push({ num: Math.floor(i/2)+1, white: moves[i], black: moves[i+1] || null });
  }

  var arrowSvg = null;
  if (arrows.length > 0) {
    var _FILES = ['a','b','c','d','e','f','g','h'];
    arrowSvg = (
      <svg style={{ position:'absolute', top:0, left:0, width:512, height:512, pointerEvents:'none', zIndex:50 }}>
        <defs>
          <marker id="arr-head" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        {arrows.map(function(a, i) {
          var fIdx = _FILES.indexOf(a.from[0]);
          var rIdx = parseInt(a.from[1]);
          var tIdx = _FILES.indexOf(a.to[0]);
          var trIdx = parseInt(a.to[1]);
          var fx, fy, tx, ty;
          if (flipped) { fx = fIdx*64+32; fy = (rIdx-1)*64+32; tx = tIdx*64+32; ty = (trIdx-1)*64+32; }
          else { fx = fIdx*64+32; fy = (8-rIdx)*64+32; tx = tIdx*64+32; ty = (8-trIdx)*64+32; }
          var c = a.color || 'rgba(255,80,80,0.85)';
          return <line key={i} x1={fx} y1={fy} x2={tx} y2={ty} stroke={c} strokeWidth="4" markerEnd="url(#arr-head)" />;
        })}
      </svg>
    );
  }

  // Analysis navigation: compute display game when viewing history
  var viewingHistory = viewingIdx !== null && viewingIdx !== moves.length;
  var displayGame = viewingHistory ? null : game;
  var displayLastMove = viewingHistory ? null : lastMove;
  var displayScore = viewingHistory ? null : engineScore;
  var displayTurn = viewingHistory ? null : game.turn();
  if (viewingHistory) {
    var dg = new Chess();
    for (var vi = 0; vi < viewingIdx; vi++) {
      try { dg.move(moves[vi].san); } catch(e) { break; }
    }
    displayGame = dg;
    displayTurn = dg.turn();
    if (viewingIdx > 0) {
      var prev = moves[viewingIdx - 1];
      displayLastMove = { from: prev.from, to: prev.to };
    }
  }
  var displayBoard = viewingHistory ? (function() {
    var db = [];
    for (var r = 0; r < 8; r++) {
      var row = [];
      for (var c = 0; c < 8; c++) {
        var f = FILES[c];
        var rk = String(flipped ? 1 + r : 8 - r);
        var sq = f + rk;
        var p = displayGame.get(sq);
        row.push({ sq: sq, piece: p ? p.color + p.type : null, dark: (r+c)%2===1 });
      }
      db.push(row);
    }
    return db;
  })() : null;

  // Opening explorer: compute tree of next moves from current position
  var openingTree = null;
  var source = viewingHistory ? displayGame : game;
  if (openingBook && source && !editorMode) {
    var explorerGame = new Chess(source.fen());
    for (var pi = 0; pi < openingPath.length; pi++) {
      try { explorerGame.move(openingPath[pi]); } catch(e) { break; }
    }
    var currentUci = explorerGame.history({ verbose: true }).map(function(m) { return m.from + m.to + (m.promotion || ''); });
    var matching = (openingBook.openings || []).filter(function(o) {
      if (o.moves.length <= currentUci.length) return false;
      for (var oi = 0; oi < currentUci.length; oi++) {
        if (o.moves[oi] !== currentUci[oi]) return false;
      }
      return true;
    });
    if (matching.length > 0) {
      var moveCounts = {};
      var moveFirstNames = {};
      matching.forEach(function(o) {
        var nextUci = o.moves[currentUci.length];
        var g3 = new Chess();
        try {
          for (var ui = 0; ui <= currentUci.length; ui++) { g3.move(o.moves[ui]); }
          var nextSan = g3.history().pop();
          moveCounts[nextSan] = (moveCounts[nextSan] || 0) + 1;
          if (!moveFirstNames[nextSan]) moveFirstNames[nextSan] = { name: o.name, category: o.category };
        } catch(e) {}
      });
      openingTree = { total: matching.length, moves: moveCounts, names: moveFirstNames };
    }
  }

  // Build WDL lookup from Lichess explorer API
  var wdlBySan = {};
  if (explorerData && explorerData.moves) {
    explorerData.moves.forEach(function(m) {
      wdlBySan[m.san] = m;
    });
  }

  return (
    <div className="lc-layout" data-theme={bgTheme}>
      <div className="lc-header">
        <div className="lc-header-left">
          <span className="lc-logo">ShadowChess</span>
          <span className="lc-engine-status">
            <span className="lc-dot" style={{ background: engineReady ? '#22c55e' : '#ef4444' }} />
            {engineReady ? 'Engine v1.0' : 'Connecting...'}
          </span>
        </div>
        <div className="lc-header-right">
          <span className="lc-move-count">{moves.length} moves</span>
          <button className="lc-gear-btn" onClick={function() { navigator.clipboard.writeText(game.fen()); }} title="Copy FEN">F</button>
          <button className="lc-gear-btn" onClick={function() { setShowFenInput(true); setFenInput(''); }} title="Import FEN">+F</button>
          <button className="lc-gear-btn" onClick={function() { setShowSettings(function(s) { return !s; }); }} title="Settings">⚙</button>
        </div>
      </div>

      {thinking && <div className="lc-thinking">Engine thinking...</div>}

      <div className="lc-main">
        <div className="lc-board-col">
          {/* Opponent info */}
          <div className="lc-player lc-player-top">
            <div className="lc-player-name">{(flipped === (playerColor === 'b')) ? 'Shadow Engine' : 'You'}</div>
            <div className="lc-player-title">Computer</div>
            <div className="lc-player-rating-bar" />
            <div className="lc-player-clock" style={{ color: (flipped ? whiteTime : blackTime) < 30 ? '#ef4444' : clockEnabled ? '#fff' : '#666' }}>
              {clockEnabled ? fmtTime(flipped ? whiteTime : blackTime) : '--:--'}
            </div>
          </div>

          {/* Board + Eval bar */}
          <div className="lc-board-row">
            <div ref={boardRef} className="lc-board-wrapper" style={{ transform: 'scale(' + (boardSize / 100) + ')', transformOrigin: 'top center' }}
              onContextMenu={function(e) { e.preventDefault(); setArrows([]); setArrowStart(null); setHighlights([]); }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,64px)', gridTemplateRows:'repeat(8,64px)', overflow:'hidden', position:'relative', borderRadius:3 }}>
                {(viewingHistory ? displayBoard : board).map(function(row, ri) { return row.map(function(cell, ci) {
                  var isSel = selected === cell.sq && !dragging;
                  var isDest = legalDests.indexOf(cell.sq) !== -1;
                  var isHighlight = highlights.indexOf(cell.sq) !== -1;
                  var isLast = (viewingHistory ? displayLastMove : lastMove) && cell.sq === ((viewingHistory ? displayLastMove : lastMove).from || (viewingHistory ? displayLastMove : lastMove).to);
                  var isPremove = premove && premove.to && (cell.sq === premove.from || cell.sq === premove.to);
                  var g = displayGame;
                  var isCheck = g.isCheck() && cell.piece && ((cell.piece === 'wk' && g.turn() !== 'w') || (cell.piece === 'bk' && g.turn() !== 'b'));
                  var bg = isSel ? 'rgba(255,255,0,0.5)' : isHighlight ? 'rgba(255,200,0,0.45)' : isPremove ? 'rgba(255,80,80,0.45)' : arrowStart === cell.sq ? 'rgba(100,200,255,0.35)' : isLast ? 'rgba(155,199,0,0.41)' : isCheck ? 'radial-gradient(circle,rgba(255,0,0,0.7),transparent 70%)' : cell.dark ? THEMES[boardTheme].dark : THEMES[boardTheme].light;
                  var showFileLabel = coordsMode !== 'off' && ri === 7;
                  var showRankLabel = coordsMode !== 'off' && ci === 0;
                  var coordColor = cell.dark ? THEMES[boardTheme].light : THEMES[boardTheme].dark;
                  return (
                    <div key={cell.sq}
                      onClick={function(e) {
                        if (editorMode) {
                          if (editPiece) {
                            game.remove(cell.sq);
                            game.put({ type: editPiece[1], color: editPiece[0] }, cell.sq);
                            refreshBoard();
                          } else {
                            var existing = game.get(cell.sq);
                            if (existing) { game.remove(cell.sq); refreshBoard(); }
                          }
                          return;
                        }
                        if (viewingHistory) { return; }
                        if (e.ctrlKey || e.metaKey) {
                          if (arrowStart) {
                            if (arrowStart !== cell.sq) {
                              setArrows(function(a) { return a.concat([{ from: arrowStart, to: cell.sq, color: 'rgba(100,200,255,0.85)' }]); });
                            }
                            setArrowStart(null);
                          } else {
                            setArrowStart(cell.sq);
                          }
                          return;
                        }
                        handleSquare(cell.sq);
                      }}
                      onContextMenu={function(e) { e.preventDefault(); e.stopPropagation();
                        if (editorMode) { game.remove(cell.sq); refreshBoard(); return; }
                        setHighlights(function(h) { var i = h.indexOf(cell.sq); return i === -1 ? h.concat([cell.sq]) : h.slice(0,i).concat(h.slice(i+1)); }); }}
                      style={{ width:64, height:64, display:'flex', alignItems:'center', justifyContent:'center',
                        background: bg,
                        cursor:'pointer', position:'relative' }}>
                      {showFileLabel && <span style={{ position:'absolute', bottom:1, right:2, fontSize:9, fontWeight:600, color:coordColor, opacity:0.7, pointerEvents:'none' }}>{cell.sq[0]}</span>}
                      {showRankLabel && <span style={{ position:'absolute', top:1, left:2, fontSize:9, fontWeight:600, color:coordColor, opacity:0.7, pointerEvents:'none' }}>{cell.sq[1]}</span>}
                      {cell.piece && !(dragging && dragging.sq === cell.sq) && <img src={pieceImg(cell.piece)} alt="" style={{ width:52, height:52, pointerEvents:'none', transition:'transform ' + (animDuration / 1000) + 's ease-out', transform: moveAnim && moveAnim.sq === cell.sq ? 'scale(1.08)' : 'scale(1)' }} draggable={false} />}
                      {cell.piece && !(dragging && dragging.sq === cell.sq) && <div onPointerDown={function(e) { onPointerDown(e, cell.sq, cell.piece); }} style={{ position:'absolute', width:52, height:52, cursor:'grab', zIndex:10 }} />}
                      {isDest && !cell.piece && <div style={{ width:16, height:16, background:'rgba(0,0,0,0.25)', borderRadius:'50%', position:'absolute' }} />}
                      {isDest && cell.piece && <div style={{ width:54, height:54, border:'6px solid rgba(0,0,0,0.25)', borderRadius:'50%', position:'absolute' }} />}
                    </div>
                  );});})}
                {dragging && <img src={pieceImg(dragging.piece)} alt="" style={{ position:'absolute', width:52, height:52, pointerEvents:'none', left:dragPos.x, top:dragPos.y, zIndex:100, opacity:0.9, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} draggable={false} />}
                {arrowSvg}
              </div>
              {coordsMode === 'out' && <div className="lc-flabels">
                {FILES.map(function(f) { return <span key={f} style={{ width:64, textAlign:'center', fontSize:10, color:'#888', display:'inline-block' }}>{f}</span>; })}
              </div>}
            </div>

            {/* Vertical eval bar */}
            <div className="lc-eval-bar">
              <div className="lc-eval-fill" style={{ height: tablebase ? '50%' : (viewingHistory ? displayScore : engineScore) != null ? Math.max(2, Math.min(98, 50 - (viewingHistory ? displayScore : engineScore) / 20)) + '%' : '50%' }} />
              {tablebase ? <div className="lc-eval-text lc-eval-tb">{tablebase.category.toUpperCase()}</div> : <div className="lc-eval-text">{(viewingHistory ? displayScore : engineScore) != null ? ((viewingHistory ? displayScore : engineScore) > 0 ? '+' : '') + ((viewingHistory ? displayScore : engineScore) / 100).toFixed(2) : ''}</div>}
              {engineWdl && !tablebase && (
                <div className="lc-eval-wdl">
                  <div className="lc-wdl-row">
                    <span className="lc-wdl-win">{Math.round(engineWdl.win / 10)}%</span>
                  </div>
                  <div className="lc-wdl-row">
                    <span className="lc-wdl-draw">{Math.round(engineWdl.draw / 10)}%</span>
                  </div>
                  <div className="lc-wdl-row">
                    <span className="lc-wdl-loss">{Math.round(engineWdl.loss / 10)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player info */}
          <div className="lc-player lc-player-bottom">
            <div className="lc-player-clock" style={{ color: (flipped ? blackTime : whiteTime) < 30 ? '#ef4444' : clockEnabled ? '#fff' : '#666' }}>
              {clockEnabled ? fmtTime(flipped ? blackTime : whiteTime) : '--:--'}
            </div>
            <div className="lc-player-rating-bar" />
            <div className="lc-player-title">{(flipped === (playerColor === 'b')) ? 'You' : 'Computer'}</div>
            <div className="lc-player-name">{(flipped === (playerColor === 'b')) ? 'You' : 'Shadow Engine'}</div>
          </div>

          {/* Controls */}
          <div className="lc-controls">
            <button className="lc-btn lc-btn-primary" onClick={newGame}>New Game</button>
            <button className="lc-btn" onClick={undoMove} disabled={thinking || moves.length < 2}>Undo</button>
            <button className="lc-btn" onClick={function() { setFlipped(function(f) { return !f; }); }}>Flip</button>
            <button className="lc-btn" onClick={function() { var nc = playerColor === 'w' ? 'b' : 'w'; newGame(nc); }}>Play {playerColor === 'w' ? 'Black' : 'White'}</button>
            <button className="lc-btn lc-btn-danger" onClick={resign} disabled={game.isGameOver() || moves.length === 0}>Resign</button>
            <button className="lc-btn lc-btn-blue" onClick={offerDraw} disabled={game.isGameOver() || moves.length < 6}>Draw</button>
            <button className="lc-btn" onClick={function() { setShowPgn(true); }}>PGN</button>
            <button className="lc-btn" onClick={function() { setShowGames(true); }}>Games</button>
            <button className="lc-btn lc-btn-blue" onClick={function() { setShowPuzzles(true); }}>Puzzles</button>
            <button className="lc-btn" onClick={function() {
              if (editorMode) { setEditorMode(false); setEditPiece(null); }
              else { setEditorMode(true); setViewingIdx(null); }
            }} style={{ background: editorMode ? '#a855f7' : '#333', color: editorMode ? '#fff' : '#888' }}>Edit</button>
            <select className="lc-select" value={clockTime} onChange={function(e) { setClockTime(parseInt(e.target.value)); }}>
              <option value={60}>Bullet</option>
              <option value={180}>Blitz</option>
              <option value={300}>5 min</option>
              <option value={600}>10 min</option>
              <option value={1200}>20 min</option>
            </select>
            <button className="lc-btn" onClick={toggleClock} style={{ background: clockEnabled ? '#1a4731' : '#2a2a2a', color: clockEnabled ? '#4ade80' : '#888' }}>{clockEnabled ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        {/* Right: Side panel */}
        <div className="lc-side">
          <div className="lc-move-panel">
            <div className="lc-move-header">
              <span>Moves</span>
              {analyzing && <span className="lc-analyzing">analyzing...</span>}
              {engineDepth > 0 && <span className="lc-engine-info">d{engineDepth} {engineNps > 0 ? Math.round(engineNps / 1000) + 'knps' : ''}</span>}
            </div>
            <div className="lc-move-list">
              {movePairs.length === 0 && <div className="lc-move-empty">No moves yet</div>}
              {movePairs.map(function(pair) {
                var wIdx = pair.num * 2 - 2;
                var bIdx = pair.num * 2 - 1;
                var wClass = analysis ? analysis[wIdx] : null;
                var bClass = analysis ? analysis[bIdx] : null;
                var isActiveW = viewingHistory && viewingIdx === wIdx + 1;
                var isActiveB = viewingHistory && viewingIdx === bIdx + 1;
                var isCurrent = !viewingHistory || viewingIdx === moves.length;
                return (
                  <div key={pair.num} className="lc-move-row" style={{ background: isActiveW || isActiveB ? 'rgba(168,85,247,0.25)' : isCurrent && ((pair.white && pair.white.to === (displayLastMove || lastMove).to) || (pair.black && pair.black.to === (displayLastMove || lastMove).to)) ? 'rgba(168,85,247,0.12)' : 'transparent' }}>
                    <span className="lc-move-num">{pair.num}.</span>
                    <span className={'lc-move-san' + (isActiveW ? ' active' : '')} onClick={function() { setViewingIdx(wIdx + 1); setCurrentMoveIndex(wIdx); }}>{pair.white ? pair.white.san : ''}</span>
                    {wClass && wClass.classification && <span className="lc-move-class" style={{ color: wClass.classification.color }}>{wClass.classification.symbol}</span>}
                    <span className={'lc-move-san' + (isActiveB ? ' active' : '')} onClick={function() { setViewingIdx(bIdx + 1); setCurrentMoveIndex(bIdx); }}>{pair.black ? pair.black.san : ''}</span>
                    {bClass && bClass.classification && <span className="lc-move-class" style={{ color: bClass.classification.color }}>{bClass.classification.symbol}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eval Graph */}
          {analysis && analysis.length > 1 && (
            <div className="lc-eval-graph-wrap">
              <EvalGraph analysis={analysis} currentMoveIndex={currentMoveIndex} onMoveClick={function(i) { setCurrentMoveIndex(i); setViewingIdx(i + 1); }} />
            </div>
          )}

          {/* Analysis navigation controls */}
          {moves.length > 0 && (
            <div className="lc-nav-controls">
              <button className="lc-nav-btn" onClick={function() { setViewingIdx(0); setCurrentMoveIndex(-1); }} title="Start">{'\u23EE'}</button>
              <button className="lc-nav-btn" onClick={function() { setViewingIdx(function(v) { var nv = (v || moves.length) - 1; return nv < 0 ? 0 : nv; }); }} title="Back" disabled={viewingHistory && viewingIdx <= 0}>{'\u23F4'}</button>
              <span className="lc-nav-label">{viewingHistory ? viewingIdx + '/' + moves.length : 'Live'}</span>
              <button className="lc-nav-btn" onClick={function() { setViewingIdx(function(v) { var nv = (v || moves.length) + 1; return nv > moves.length ? moves.length : nv; }); }} title="Forward" disabled={viewingHistory && viewingIdx >= moves.length}>{'\u23F5'}</button>
              <button className="lc-nav-btn" onClick={function() { setViewingIdx(null); setCurrentMoveIndex(-1); }} title="Current">{'\u23F8'}</button>
            </div>
          )}

          {viewingHistory && <div className="lc-viewing-banner">Viewing move {viewingIdx} / {moves.length}</div>}

          {editorMode && (
            <div className="lc-editor">
              <div className="lc-editor-label">Board Editor</div>
              <div className="lc-editor-pieces">
                {['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'].map(function(p) {
                  return <button key={p} className={'lc-editor-piece' + (editPiece === p ? ' active' : '')} onClick={function() { setEditPiece(editPiece === p ? null : p); }}>
                    <img src={pieceImg(p)} alt={p} style={{ width:28, height:28 }} />
                  </button>;
                })}
              </div>
              <div className="lc-editor-actions">
                <button className="lc-btn lc-btn-sm" onClick={function() { game.reset(); setMoves([]); setSelected(null); setLastMove(null); setEngineScore(null); refreshBoard(); }}>Start</button>
                <button className="lc-btn lc-btn-sm" onClick={function() { game.clear(); refreshBoard(); }}>Clear</button>
                <button className="lc-btn lc-btn-sm" onClick={function() { game.load(game.fen().split(' ').slice(0,2).concat(['KQkq','-','0','1']).join(' ')); refreshBoard(); }}>Reset Rights</button>
                <button className="lc-btn lc-btn-sm" onClick={function() { setFlipped(function(f) { return !f; }); }}>Flip</button>
              </div>
              <div className="lc-editor-fen">{game.fen()}</div>
              <button className="lc-btn lc-btn-primary lc-editor-play" onClick={function() {
                setEditorMode(false);
                setEditPiece(null);
                setMoves([]);
                setSelected(null);
                setLastMove(null);
                setEngineScore(null);
                setAnalysis(null);
                setResigned(false);
                setGameOverModal(null);
                setArrows([]);
                setHighlights([]);
                setViewingIdx(null);
                setPremove(null);
                setStatus('Custom position — click to move');
                sendEngine({ type: 'newgame' });
                sendEngine({ type: 'position', fen: game.fen() });
                refreshBoard();
              }}>Play from Here</button>
            </div>
          )}

          <div className="lc-settings">
            <div className="lc-settings-row">
              <label>Analysis</label>
              <button className="lc-btn lc-btn-sm" onClick={autoAnalyze}
                style={{ background: analyzing ? '#9333ea' : '#333', color: analyzing ? '#fff' : '#888' }}>
                {analyzing ? 'Stop' : 'Analyze'}
              </button>
            </div>
          </div>

          {openingTree && (
            <div className="lc-opening-explorer">
              <div className="lc-opening-header">Opening Explorer</div>

              {/* Source tabs */}
              <div className="lc-explorer-tabs">
                <button className={'lc-explorer-tab' + (explorerSource === 'lichess' ? ' active' : '')}
                  onClick={function() { setExplorerSource('lichess'); }}>Lichess</button>
                <button className={'lc-explorer-tab' + (explorerSource === 'masters' ? ' active' : '')}
                  onClick={function() { setExplorerSource('masters'); }}>Masters</button>
                <button className={'lc-explorer-tab' + (explorerSource === 'player' ? ' active' : '')}
                  onClick={function() { setExplorerSource('player'); }}>Player</button>
              </div>
              {explorerSource === 'player' && (
                <div className="lc-explorer-player-input">
                  <input type="text" value={explorerPlayerName} placeholder="Player name..."
                    onChange={function(e) { setExplorerPlayerName(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') e.target.blur(); }}
                    className="lc-explorer-input" />
                </div>
              )}

              {openingPath.length > 0 && (
                <div className="lc-opening-path">
                  {openingPath.map(function(san, idx) {
                    return (
                      <span key={idx} className="lc-opening-path-move" onClick={function() { setOpeningPath(function(prev) { return prev.slice(0, idx + 1); }); }}>
                        {san}
                      </span>
                    );
                  })}
                  <button className="lc-opening-path-back" onClick={function() { setOpeningPath(function(prev) { return prev.slice(0, -1); }); }}>{'\u25C0'}</button>
                  <button className="lc-opening-path-play" onClick={function() {
                    var path = openingPath.slice();
                    setOpeningPath([]);
                    path.forEach(function(san) { playSanMove(san); });
                  }}>Play</button>
                </div>
              )}
              {openingName && openingPath.length === 0 && <div className="lc-opening-name">{openingName || 'Unknown'}</div>}
              {openingTree.total > 0 && (
                <div className="lc-opening-moves">
                  {Object.keys(openingTree.moves).sort(function(a,b) { return (openingTree.moves[b] || 0) - (openingTree.moves[a] || 0); }).map(function(san) {
                    var cnt = openingTree.moves[san];
                    var info = openingTree.names[san];
                    var pct = Math.round(cnt / openingTree.total * 100);
                    var wdl = wdlBySan[san];
                    var wdlTotal = wdl ? wdl.white + wdl.draws + wdl.black : 0;
                    var wp = wdlTotal > 0 ? wdl.white / wdlTotal * 100 : 0;
                    var dp = wdlTotal > 0 ? wdl.draws / wdlTotal * 100 : 0;
                    var lp = wdlTotal > 0 ? wdl.black / wdlTotal * 100 : 0;
                    var wdlTitle = wdl ? 'W: ' + wdl.white + ' D: ' + wdl.draws + ' L: ' + wdl.black + (wdl.averageRating ? ' AvgR: ' + wdl.averageRating : '') : '';
                    return (
                      <div key={san} className="lc-opening-move" title={(info ? info.name + ' (' + info.category + ') ' : '') + wdlTitle}
                        onClick={function() { setOpeningPath(function(prev) { return prev.concat([san]); }); }}>
                        <span className="lc-opening-move-san">{san}</span>
                        <span className="lc-opening-move-bar">
                          {wdlTotal > 0 ? (
                            <>
                              <span className="lc-opening-wdl-win" style={{ width: wp + '%' }} />
                              <span className="lc-opening-wdl-draw" style={{ width: dp + '%' }} />
                              <span className="lc-opening-wdl-loss" style={{ width: lp + '%' }} />
                            </>
                          ) : (
                            <span className="lc-opening-move-fill" style={{ width: pct + '%' }} />
                          )}
                        </span>
                        <span className="lc-opening-move-pct">{pct}%</span>
                        <span className="lc-opening-move-cat">{info ? (info.category || '') : ''}</span>
                        {wdl && wdl.averageRating ? <span className="lc-opening-move-rating">{wdl.averageRating}</span> : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {openingTree.total === 0 && (
                <div className="lc-opening-empty">No book moves available</div>
              )}

              {/* Recent games */}
              {recentGames.length > 0 && (
                <div className="lc-recent-games">
                  <div className="lc-recent-games-header">Recent Games</div>
                  {recentGames.map(function(g, idx) {
                    var wP = g.white || g.w || {};
                    var bP = g.black || g.b || {};
                    var wName = wP.name || ''; var bName = bP.name || '';
                    var result = wName ? wName + ' vs ' + bName : (g.id || 'Game ' + (idx + 1));
                    var yr = g.year || ''; var mo = g.month || '';
                    var dateStr = yr + (mo ? '-' + mo : '');
                    return (
                      <div key={idx} className="lc-recent-game" title={result + (dateStr ? ' ' + dateStr : '')}>
                        <span className="lc-recent-game-players">{result}</span>
                        <span className="lc-recent-game-info">{dateStr}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {!openingTree && openingName && <div className="lc-opening">{openingName}</div>}

          {/* Tablebase */}
          {tablebase && (
            <div className="lc-tablebase">
              <div className="lc-tb-header">
                <span className="lc-tb-label">Tablebase</span>
                {tablebase.checkmate && <span className="lc-tb-badge tb-mate">MATE</span>}
                {tablebase.stalemate && <span className="lc-tb-badge tb-draw">DRAW</span>}
                {tablebase.insufficient_material && <span className="lc-tb-badge tb-draw">DRAW</span>}
                {!tablebase.checkmate && !tablebase.stalemate && !tablebase.insufficient_material && (
                  <span className={'lc-tb-badge ' + (
                    tablebase.category === 'win' ? 'tb-win' :
                    tablebase.category === 'loss' ? 'tb-loss' :
                    tablebase.category === 'cursed-win' ? 'tb-cursed-win' :
                    tablebase.category === 'blessed-loss' ? 'tb-blessed-loss' :
                    'tb-draw'
                  )}>
                    {tablebase.category === 'cursed-win' ? 'CURSED WIN' :
                     tablebase.category === 'blessed-loss' ? 'BLESSED LOSS' :
                     tablebase.category.toUpperCase()}
                  </span>
                )}
              </div>
              {tablebase.moves && tablebase.moves.length > 0 && (
                <div className="lc-tb-moves">
                  {tablebase.moves.slice(0, 10).map(function(m) {
                    var dtmStr = '';
                    if (m.dtm != null && m.dtm > 0) dtmStr = 'DTM ' + m.dtm;
                    else if (m.dtm != null && m.dtm < 0) dtmStr = 'DTM ' + (-m.dtm);
                    return (
                      <div key={m.uci} className={'lc-tb-move lc-tb-' + m.category}
                        onClick={function() { playSanMove(m.san); }}>
                        <span className="lc-tb-move-san">{m.san}</span>
                        <span className={'lc-tb-move-cat ' + (
                          m.category === 'win' ? 'tb-win-text' :
                          m.category === 'loss' ? 'tb-loss-text' :
                          m.category === 'cursed-win' ? 'tb-cursed-win-text' :
                          m.category === 'blessed-loss' ? 'tb-blessed-loss-text' :
                          'tb-draw-text'
                        )}>
                          {m.category === 'win' || m.category === 'cursed-win' ? '1-0' : m.category === 'loss' || m.category === 'blessed-loss' ? '0-1' : '\u00BD-\u00BD'}
                        </span>
                        {dtmStr && <span className="lc-tb-move-dtm">{dtmStr}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {(!tablebase.moves || tablebase.moves.length === 0) && (
                <div className="lc-tb-empty">
                  {tablebase.checkmate ? 'Checkmate' : tablebase.stalemate ? 'Stalemate' : tablebase.insufficient_material ? 'Insufficient material' : 'No moves'}
                </div>
              )}
              {tbMainline.length > 0 && (
                <div className="lc-tb-mainline">
                  <div className="lc-tb-mainline-label">Mainline</div>
                  <div className="lc-tb-mainline-moves">
                    {tbMainline.map(function(entry, idx) {
                      return React.createElement(React.Fragment, { key: idx },
                        idx > 0 && React.createElement('span', { className: 'lc-tb-mainline-sep' }, ' '),
                        React.createElement('span', {
                          className: 'lc-tb-mainline-san',
                          onClick: function() {
                            var g4 = new Chess(game.fen().split(' ').slice(0,4).concat(['0','1']).join(' '));
                            for (var mi = 0; mi <= idx; mi++) {
                              try { g4.move(tbMainline[mi].san); } catch(e) {}
                            }
                            setGame(g4);
                            setMoves(g4.history({ verbose: true }));
                            setSelected(null);
                            setLastMove(g4.history({ verbose: true }).pop() || null);
                            refreshBoard();
                          }
                        }, entry.san)
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Multi-PV */}
          {multiPv > 1 && multiPvs.length > 1 && (
            <div className="lc-multipv">
              <div className="lc-multipv-header">Multi-PV ({multiPv} lines)</div>
              {multiPvs.map(function(pv) {
                return (
                  <div key={pv.num} className="lc-multipv-line">
                    <span className="lc-multipv-idx">#{pv.num}</span>
                    <span className={'lc-multipv-score' + (pv.score > 0 ? ' positive' : pv.score < 0 ? ' negative' : '')}>
                      {pv.score > 0 ? '+' : ''}{pv.score != null ? (pv.score / 100).toFixed(2) : '?'}
                    </span>
                    <span className="lc-multipv-pv">{pv.pv || ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOverModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#1a1a1a', border:'2px solid #555', borderRadius:8, padding:24, textAlign:'center', minWidth:280 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#a855f7', marginBottom:8 }}>Game Over</div>
            <div style={{ fontSize:14, color:'#ccc', marginBottom:16 }}>{gameOverModal}</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={function() { setGameOverModal(null); autoAnalyze(); }} style={{ padding:'8px 20px', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:13, fontWeight:600 }}>Analyze</button>
              <button onClick={function() { setGameOverModal(null); newGame(); }} style={{ padding:'8px 20px', background:'#333', color:'#ccc', border:'1px solid #555', borderRadius:4, cursor:'pointer', fontSize:13 }}>New Game</button>
            </div>
          </div>
        </div>
      )}
      {/* PGN Modal */}
      {showPgn && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#1a1a1a', border:'2px solid #555', borderRadius:8, padding:20, minWidth:400, maxWidth:500 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#a855f7' }}>PGN</span>
              <button onClick={function() { setShowPgn(false); }} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:18 }}>x</button>
            </div>
            <PgnPanel game={game} moves={moves} onLoadPgn={handleLoadPgn} />
          </div>
        </div>
      )}
      {/* Games Database Modal */}
      {showGames && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#1a1a1a', border:'2px solid #555', borderRadius:8, padding:20, minWidth:460, maxWidth:540, maxHeight:'80vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#a855f7' }}>Famous Games & Openings</span>
              <button onClick={function() { setShowGames(false); }} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:18 }}>x</button>
            </div>
            <GameDatabase onLoadGame={handleLoadGame} />
          </div>
        </div>
      )}
      {showPuzzles && <PuzzleModal onClose={function() { setShowPuzzles(false); }} pieceSet={pieceSet} boardTheme={boardTheme} />}
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          boardTheme={boardTheme}
          setBoardTheme={setBoardTheme}
          boardSize={boardSize}
          setBoardSize={setBoardSize}
          coordsMode={coordsMode}
          setCoordsMode={setCoordsMode}
          animDuration={animDuration}
          setAnimDuration={setAnimDuration}
          bgTheme={bgTheme}
          setBgTheme={setBgTheme}
          pieceSet={pieceSet}
          setPieceSet={setPieceSet}
          depth={depth}
          setDepth={setDepth}
          multiPv={multiPv}
          setMultiPv={setMultiPv}
          useWasm={useWasm}
          setUseWasm={setUseWasm}
          soundOn={soundOn}
          toggleSound={toggleSound}
          soundPack={soundPack}
          soundVol={soundVol}
          changePack={changePack}
          changeVolume={changeVolume}
          clockTime={clockTime}
          setClockTime={setClockTime}
          clockEnabled={clockEnabled}
          toggleClock={toggleClock}
          onClose={function() { setShowSettings(false); }}
        />
      )}
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={function() { setShowShortcuts(false); }}>
          <div style={{ background:'#262421', border:'1px solid #444', borderRadius:8, padding:20, minWidth:380, maxWidth:440 }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:15, fontWeight:700, color:'#a855f7' }}>Keyboard Shortcuts</span>
              <button onClick={function() { setShowShortcuts(false); }} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:16 }}>x</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 16px', fontSize:12, color:'#ccc' }}>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>←</span><span>Previous move</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>→</span><span>Next move</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Home</span><span>Start of game</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>End</span><span>Current position</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>?</span><span>Toggle this panel</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Ctrl+Z</span><span>Undo move</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Ctrl+Y</span><span>Redo move</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Ctrl+Click</span><span>Draw arrow</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Right-Click</span><span>Highlight square / Clear arrows</span>
              <span style={{ color:'#a855f7', fontFamily:'monospace' }}>Click Move</span><span>View position at that move</span>
            </div>
          </div>
        </div>
      )}
      {/* FEN Import Modal */}
      {showFenInput && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={function() { setShowFenInput(false); }}>
          <div style={{ background:'#262421', border:'1px solid #444', borderRadius:8, padding:20, minWidth:380 }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:15, fontWeight:700, color:'#a855f7' }}>Import FEN</span>
              <button onClick={function() { setShowFenInput(false); }} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:16 }}>x</button>
            </div>
            <textarea value={fenInput} onChange={function(e) { setFenInput(e.target.value); }}
              placeholder="Paste FEN string here (e.g. rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1)"
              style={{ width:'100%', height:60, background:'#1a1a1a', color:'#ccc', border:'1px solid #444', borderRadius:4, padding:8, fontSize:12, fontFamily:'monospace', resize:'none' }} />
            <button onClick={function() { handleLoadFen(fenInput); }}
              style={{ marginTop:8, padding:'6px 16px', background:'#9333ea', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600, width:'100%' }}>
              Load Position
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
