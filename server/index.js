const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const Engine = require('./engine');

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

// Load opening book and game database
const openings = JSON.parse(fs.readFileSync(path.join(__dirname, 'openings.json'), 'utf8'));
const games = JSON.parse(fs.readFileSync(path.join(__dirname, 'games.json'), 'utf8'));

// API endpoints
app.use(express.json());

app.get('/api/openings', (req, res) => {
  res.json(openings);
});

app.get('/api/games', (req, res) => {
  res.json(games);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.games.find(g => g.id === parseInt(req.params.id));
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Analysis endpoint — POST /api/analyze { moves: ["e2e4", "e7e5", ...], depth: 15 }
app.post('/api/analyze', async (req, res) => {
  const { moves = [], depth = 15 } = req.body;

  if (!moves.length) {
    return res.status(400).json({ error: 'No moves provided' });
  }

  console.log(`[analyze] Starting analysis of ${moves.length} moves at depth ${depth}`);

  const engine = new Engine();
  const analysis = [];

  try {
    await engine.start();
    engine.setOption('Threads', 2);
    engine.setOption('Hash', 64);

    // Analyze starting position
    engine.send('ucinewgame');
    await engine.waitForReady();

    let prevScore = 0;

    for (let i = 0; i <= moves.length; i++) {
      const posMoves = moves.slice(0, i);

      // Set position
      if (posMoves.length === 0) {
        engine.send('position startpos');
      } else {
        engine.send(`position startpos moves ${posMoves.join(' ')}`);
      }

      // Analyze
      const result = await analyzePosition(engine, depth);

      // Get actual move played (if any)
      const actualMove = i < moves.length ? moves[i] : null;

      // Classify the move
      const classification = actualMove
        ? classifyMove(prevScore, result.score, actualMove, result.bestMove, i % 2 === 0)
        : null;

      analysis.push({
        moveNumber: Math.floor(i / 2) + 1,
        isWhite: i % 2 === 0,
        fen: result.fen,
        score: result.score,
        bestMove: result.bestMove,
        actualMove,
        classification,
        depth: result.depth,
        nodes: result.nodes,
        pv: result.pv,
      });

      prevScore = result.score;

      // Send progress
      console.log(`[analyze] Position ${i + 1}/${moves.length + 1} done (score: ${result.score})`);
    }

    engine.quit();
    res.json({ analysis, totalMoves: moves.length });
  } catch (e) {
    console.error('[analyze] Error:', e);
    engine.quit();
    res.status(500).json({ error: e.message });
  }
});

function analyzePosition(engine, depth) {
  return new Promise((resolve, reject) => {
    let bestMove = null;
    let score = 0;
    let nodes = 0;
    let pv = '';
    let fen = '';
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ score: score || 0, bestMove: '0000', depth: 0, nodes: 0, pv: '', fen: '' });
      }
    }, 30000);

    const onLine = (line) => {
      if (line.startsWith('info') && line.includes('depth')) {
        const parts = line.split(' ');
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'score' && parts[i + 1] === 'cp') {
            score = parseInt(parts[i + 2]);
          }
          if (parts[i] === 'score' && parts[i + 1] === 'mate') {
            const mateVal = parseInt(parts[i + 2]);
            score = mateVal > 0 ? 10000 - mateVal : -10000 - mateVal;
          }
          if (parts[i] === 'nodes') {
            nodes = parseInt(parts[i + 1]);
          }
          if (parts[i] === 'pv') {
            pv = parts.slice(i + 1).join(' ');
          }
        }
      }

      if (line.startsWith('bestmove')) {
        bestMove = line.split(' ')[1];
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          engine.removeListener('line', onLine);

          // Get current FEN
          engine.send('d');
          const fenHandler = (fenLine) => {
            if (fenLine.startsWith('Fen:')) {
              fen = fenLine.substring(5).trim();
              engine.removeListener('line', fenHandler);
            }
          };
          engine.on('line', fenHandler);

          // Small delay to get fen
          setTimeout(() => {
            resolve({ score, bestMove, depth, nodes, pv, fen });
          }, 50);
        }
      }
    };

    engine.on('line', onLine);
    engine.go({ depth });
  });
}

function classifyMove(prevScore, currentScore, actualMove, bestMove, isWhite) {
  const scoreDiff = isWhite
    ? currentScore - prevScore
    : prevScore - currentScore;

  const isBest = actualMove === bestMove;
  const isBlunder = scoreDiff < -200;
  const isMistake = scoreDiff < -80 && scoreDiff >= -200;
  const isInaccuracy = scoreDiff < -30 && scoreDiff >= -80;
  const isGood = !isBest && scoreDiff >= -30 && scoreDiff <= 30;

  if (isBest) return { type: 'best', label: 'Best', symbol: '★', color: '#238636' };
  if (scoreDiff < -300) return { type: 'blunder', label: 'Blunder', symbol: '??', color: '#e74c3c' };
  if (isBlunder) return { type: 'blunder', label: 'Blunder', symbol: '??', color: '#e74c3c' };
  if (isMistake) return { type: 'mistake', label: 'Mistake', symbol: '?', color: '#e67e22' };
  if (isInaccuracy) return { type: 'inaccuracy', label: 'Inaccuracy', symbol: '?!', color: '#f1c40f' };
  if (isGood) return { type: 'good', label: 'Good', symbol: '✓', color: '#2ecc71' };
  return { type: 'ok', label: 'OK', symbol: '', color: '#999' };
}

// Serve static React build in production
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[ws] Client connected');

  const engine = new Engine();
  let moveHistory = [];

  engine.start().then((idLine) => {
    console.log(`[engine] ${idLine}`);
    ws.send(JSON.stringify({ type: 'engine_id', data: idLine }));

    // Set good defaults for the engine
    engine.setOption('Threads', 2);
    engine.setOption('Hash', 128);
    engine.setOption('UCI_ShowWDL', true);

    ws.send(JSON.stringify({ type: 'ready' }));
  });

  engine.on('line', (line) => {
    // Forward all engine output to client
    ws.send(JSON.stringify({ type: 'engine', data: line }));
  });

  engine.on('exit', (code) => {
    console.log(`[engine] Exited with code ${code}`);
    ws.send(JSON.stringify({ type: 'engine_exit', code }));
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      switch (msg.type) {
        case 'position':
          engine.setPosition(msg.fen, msg.moves);
          if (msg.moves) {
            moveHistory = msg.moves;
          }
          break;

        case 'go':
          engine.go(msg.options || {});
          break;

        case 'stop':
          engine.stop();
          break;

        case 'newgame':
          engine.newGame();
          moveHistory = [];
          break;

        case 'setoption':
          engine.setOption(msg.name, msg.value);
          break;

        case 'getopening':
          const opening = getRandomOpening(moveHistory);
          ws.send(JSON.stringify({ type: 'opening', data: opening }));
          break;

        case 'quit':
          engine.quit();
          break;

        default:
          console.log(`[ws] Unknown message type: ${msg.type}`);
      }
    } catch (e) {
      console.error(`[ws] Error parsing message: ${e}`);
    }
  });

  ws.on('close', () => {
    console.log('[ws] Client disconnected');
    engine.quit();
  });
});

function getRandomOpening(currentMoves) {
  if (!currentMoves || currentMoves.length === 0) {
    const firstMoveOpenings = openings.openings.filter(o => o.moves.length > 0);
    return firstMoveOpenings[Math.floor(Math.random() * firstMoveOpenings.length)];
  }

  const matching = openings.openings.filter(o => {
    const movesStr = currentMoves.join(' ');
    const openingStr = o.moves.slice(0, currentMoves.length).join(' ');
    return movesStr.startsWith(openingStr) || openingStr.startsWith(movesStr);
  });

  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)];
  }

  return openings.openings[Math.floor(Math.random() * openings.openings.length)];
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`ShadowChess server running on http://localhost:${PORT}`);
  console.log('WebSocket endpoint: ws://localhost:' + PORT);
  console.log(`Loaded ${openings.openings.length} openings and ${games.games.length} games`);
});
