# ShadowChess

A full-featured chess web application with Stockfish engine integration, opening explorer, endgame tablebase, puzzle training, and analysis tools. Designed as a Lichess-inspired client for casual play and deep analysis.

**67 / 91 features implemented (74%)** — see [FEATURES.md](FEATURES.md).

---

## Features

### Play & Analysis
- Chess board with click-to-move and drag-and-drop
- Stockfish engine (local WASM or server-side WebSocket)
- Unlimited analysis with engine WDL win/draw/loss percentages
- Multi-PV analysis (up to 5 lines)
- Eval bar and interactive eval graph
- Move classification: !! \! \!? ? ?? with color-coded symbols
- Game clock with preset time controls

### Opening Explorer
- Tree view with click-to-drill navigation (breadcrumb path, ◀ back, Play on board)
- Live win/draw/loss statistics from Lichess API (colored WDL bars, tooltips)
- Opening name detection from 94-entry opening database
- Three source tabs: **Lichess** (all games), **Masters** (~2M master-level games), **Player** (per-player stats)
- Average opponent rating per move

### Endgame Tablebase
- Syzygy ≤7 pieces via `tablebase.lichess.ovh`
- Category badges: WIN, LOSS, DRAW, CURSED WIN, BLESSED LOSS
- DTM (distance to mate) per move
- Best-play mainline sequence (1.5 moves: your reply + opponent's best)
- Eval bar overlay with category label

### Puzzles
- 22 tactical puzzles with rating tracking and streak counter
- Puzzle modal with feedback and solution display

### Board & UI
- 6 board themes, 4 piece sets, light/dark/system background
- Board zoom (60-120%), coordinates (inside/outside/hidden), animation speed
- PGN import/export, FEN copy/import, board editor
- Keyboard shortcuts (`?` to view), pre-move support
- Sound effects (3 packs: Standard, Piano, Synthetic)

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) ≥ 18
- [Stockfish](https://stockfishchess.org/) compiled binary at `~/Projects/Stockfish/src/stockfish` (or set `STOCKFISH_PATH`)

### 1. Start the server

```bash
cd server
npm install
npm start
```

The engine server listens on `ws://localhost:3001`.

### 2. Start the client

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` to port 3001.

### 3. Play

- **New Game** — Start a game against ShadowEngine
- **Flip** — Rotate the board
- **Analyze** — Run engine analysis on the current position
- **Puzzles** — Open tactical puzzle training

---

## Project Structure

```
shadowchess/
├── client/                        # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx          # Main game component (~1700 lines)
│   │   │   ├── SettingsModal.jsx  # Preferences panel
│   │   │   ├── PuzzleModal.jsx    # Puzzle training
│   │   │   ├── EvalGraph.jsx      # Canvas score chart
│   │   │   ├── GameDatabase.jsx   # Famous games + openings browser
│   │   │   ├── PgnPanel.jsx       # PGN import/export
│   │   │   └── Board.css          # All component styles
│   │   ├── data/puzzles.js        # 22 tactical puzzles
│   │   ├── utils/
│   │   │   └── chess-logic.test.js # 99 unit tests
│   │   ├── sounds.js              # Sound system (Web Audio API)
│   │   └── hooks/useEngine.js     # WebSocket engine client
│   ├── public/
│   │   ├── pieces/                # SVG piece sets (4 variants)
│   │   ├── sounds/                # Audio assets (3 packs)
│   │   └── stockfish.wasm         # WASM engine binary
│   ├── vitest.config.js
│   └── package.json
├── server/                        # Node.js + WebSocket backend
│   ├── index.js                   # Express + WebSocket server
│   ├── engine.js                  # Stockfish UCI wrapper
│   ├── openings.json              # 94 chess openings
│   └── games.json                 # 6 famous games
├── FEATURES.md                    # Feature parity checklist
├── LICHESS_GAPS.md                # Full Lichess feature audit
├── ecosystem.config.js            # PM2 process manager config
└── restart-server.sh              # Manual server restart script
```

---

## Architecture

```
Browser (React + WASM or WebSocket)
    │
    ├── Local WASM ──► stockfish.js (Web Worker, in-browser)
    │
    └── WebSocket ──► Node.js Server (:3001)
                         │
                         └── Stockfish UCI (child process)
```

The client connects to the engine in one of two modes:
- **Server mode** (default) — WebSocket to the Node.js backend, which spawns a Stockfish child process per connection. All UCI output is forwarded as JSON to the client.
- **Local WASM mode** — Stockfish runs in a Web Worker via `stockfish.js`. Toggle in Settings.

External APIs (no auth required):
- `explorer.lichess.ovh` — Opening statistics (Lichess, Masters, Player)
- `tablebase.lichess.ovh` — Syzygy ≤7 endgame tablebase

### Client → Server Protocol

All messages are JSON over WebSocket:

| Type | Payload | Description |
|------|---------|-------------|
| `position` | `{ fen, moves[] }` | Set board position |
| `go` | `{ options: { depth, movetime, infinite } }` | Start engine search |
| `stop` | — | Stop engine search |
| `setoption` | `{ name, value }` | Set UCI option (Threads, Hash, MultiPV, etc.) |
| `newgame` | — | Reset engine (`ucinewgame`) |

### Testing

```bash
cd client
npm test              # Run all tests once
npm run test:watch    # Watch mode
```

99 unit tests covering:
- Move classification thresholds (!! \! \!? ? ??)
- Opening tree computation and WDL bar percentages
- FEN piece counting and tablebase boundary detection
- Board coordinate mapping (flipped/unflipped)
- En passant, castling edge cases
- Tablebase category subtypes (cursed-win, blessed-loss)
- Board component rendering, modals, conditional display

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `STOCKFISH_PATH` | `../../Stockfish/src/stockfish` | Path to Stockfish binary |

### Settings Panel

Open via the ⚙ button in the top-right. All settings are in-memory (persistence planned).

- Board theme, size, piece set, coordinates, background
- Engine depth (1–25), Multi-PV (1–5)
- Engine type: Server vs Local WASM
- Sound on/off, pack, volume
- Clock on/off, time preset

---

## Server Management

The server is managed via PM2:

```bash
./restart-server.sh restart   # Restart the server
./restart-server.sh logs      # View last 50 log lines
./restart-server.sh status    # Check server status
./restart-server.sh stop      # Stop the server
./restart-server.sh start     # Start the server
```

Or directly:

```bash
pm2 restart shadowchess-server
pm2 logs shadowchess-server --lines 50
```

---

## Roadmap

- **High priority** — None remaining
- **Medium** — Mobile layout, PWA, game history, puzzle storm/streak, engine tuning UI, learn from mistakes, practice positions, zen mode, auto-flip, more
- **Future** — Chess variants, studies, tournaments, leaderboards, API, 8-piece tablebase

See [FEATURES.md](FEATURES.md) for the full checklist.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Quick summary:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm test` to verify tests pass
5. Run `npm run lint` to check for lint issues
6. Submit a pull request

---

## License

[MIT](LICENSE)
