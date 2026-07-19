# Lichess Feature Gaps — ShadowChess

This file lists everything Lichess has that ShadowChess doesn't (yet).
Reference when planning next features or filling gaps.

---

## Engine & Analysis

### Auto-analyze on game load
- Status: **Fix in progress** (added `setTimeout(autoAnalyze, 300)` to handleLoadGame/handleLoadPgn)
- Lichess: When you open a game from the database, analysis starts immediately
- File: `Board.jsx` handleLoadGame, handleLoadPgn

### Move classification always shown
- Status: Missing
- Lichess: Every move in the list shows !! ! ? ?? etc. automatically based on eval diff
- ShadowChess: Only shows blunder arrow on big eval drops, no per-move classification
- File: `Board.jsx` move list rendering

### Eval graph on game load
- Status: Partial
- Lichess: Graph is rendered automatically when opening a game
- ShadowChess: Graph only shows after clicking "Analyze" and after engine provides scores
- File: `Board.jsx` EvalGraph component

### Engine line display update while analyzing
- Status: Partial
- Lichess: PV lines update smoothly as engine thinks (streaming multipv lines)
- ShadowChess: Lines update on each `info` line but can be janky
- File: `Board.jsx` handleEngineLine

### Local analysis without server
- Status: Working (WASM mode)
- Lichess: Stockfish WASM is default, server engine for stronger analysis
- ShadowChess: Toggle in settings, WASM needs worker path config

---

## Opening Explorer

### Drill-down tree navigation (not playing on board)
- Status: **Fix in progress**
- Lichess: Clicking a move in opening explorer **drills down** in the tree, keeping board position unchanged. Shows breadcrumb path. Back button goes up.
- ShadowChess (currently): Clicking a move calls `playSanMove(san)` which plays on board
- File: `Board.jsx` opening explorer section

### WDL stats per move
- Status: **Implemented** (uses live data from `explorer.lichess.ovh/lichess?fen=...`)
- Lichess: Shows win%/draw%/loss% for each move with colored bar
- ShadowChess: Green/yellow/red WDL bar replaces plain book bar when API data available; hover tooltip shows counts + avg rating
- File: `Board.jsx` opening explorer section, `Board.css` `.lc-opening-wdl-*`

### Average opponent rating per move
- Status: Missing
- Lichess: Shows avg rating of players who played each move
- File: Board.jsx

### Recent example games
- Status: Missing
- Lichess: Lists 15 recent master games for each position
- File: Board.jsx (new section needed)

### Time/rating/speed filters
- Status: Missing
- Lichess: Filter by time control, rating range, player name, date range
- File: Board.jsx (new controls)

### Popularity history graph
- Status: Missing
- Lichess: Chart showing how popularity of moves has changed over time
- File: New component needed

### ECO code display
- Status: Missing
- Lichess: Shows ECO code alongside opening name
- File: Board.jsx, GameDatabase.jsx

### Multiple sources (masters/lichess/player)
- Status: Missing
- Lichess: Can switch between master games, lichess games, or player games
- File: Board.jsx (new tabs/buttons)

---

## Endgame Tablebase

### Automatic show/hide based on piece count (≤7)
- Status: **Fix ready** (change `pieceCount > 6` to `pieceCount > 7`)
- Lichess: Tablebase panel auto-appears when ≤7 pieces, auto-hides when >7
- File: `Board.jsx` line ~499

### Category subtypes (cursed-win, blessed-loss)
- Status: Missing
- Lichess: Shows subtypes: cursed-win (win that takes >50 moves without capture), blessed-loss, draw
- File: `Board.jsx` tablebase rendering

### Mainline display (DTM best-play sequence)
- Status: Missing
- Lichess: Shows the best-play forcing sequence with DTM annotations
- Endpoint: `https://tablebase.lichess.ovh/standard/mainline?fen=...`
- File: `Board.jsx` tablebase section (new rendering)

### 8-piece tablebase (partial)
- Status: Missing (infrastructure)
- Lichess: Partial 8-piece coverage via cloud analysis
- Not practical for now

---

## Puzzle System

### Puzzle Storm
- Status: Missing
- Lichess: 3-minute timed puzzle rush, score = number solved minus mistakes
- File: New component needed

### Puzzle Streak
- Status: Missing
- Lichess: Solve as many as possible until first mistake
- File: New component needed

### Puzzle Racer
- Status: Missing
- Lichess: Real-time race against opponent
- File: New component needed

### Puzzle themes filtering
- Status: Missing
- Lichess: Filter by tactical theme (fork, pin, sacrifice, etc.)
- File: PuzzleModal.jsx

### Puzzle difficulty graph
- Status: Missing
- Lichess: Rating over time chart
- File: PuzzleModal.jsx

---

## Game Management

### Game history (saved games)
- Status: Missing
- Lichess: All games saved, accessible from profile
- ShadowChess: localStorage or IndexedDB could replace server DB
- File: New component + Board.jsx

### Download PGN file
- Status: Missing
- Lichess: Download button saves .pgn
- File: Board.jsx

### Share game URL (via Clipboard API)
- Status: Missing
- Lichess: Copy link to current position
- File: Board.jsx

### Import PGN with annotations/clocks/variations
- Status: Partial
- Lichess: Full PGN parser supports NAGs, annotations, clock times, variations
- ShadowChess: Basic PGN import strips all metadata
- File: PgnPanel.jsx

### Study (multi-chapter document)
- Status: Missing
- Lichess: Chapters, variations, comments, tags, contributors
- File: Multiple new components

---

## UI / UX

### Mobile responsive layout
- Status: Missing
- Lichess: Full responsive design, touch-optimized
- File: `Board.css` (media queries needed)

### PWA / Installable
- Status: Missing
- Lichess: Service worker, manifest, offline support
- File: `vite.config.js`, `index.html`, service worker

### Zen Mode
- Status: Missing
- Lichess: Hides eval bar, scores, move count during play
- File: Board.jsx (toggle state)

### Blindfold Mode
- Status: Missing
- Lichess: Hides piece images, shows dots
- File: Board.jsx (toggle state)

### Voice input (speak moves)
- Status: Missing
- Lichess: Web Speech API for move input
- File: Board.jsx

### Learn from Mistakes
- Status: Missing
- Lichess: Auto-generated lesson focusing on blunders/mistakes
- File: New component

### Practice positions
- Status: Missing
- Lichess: Endgame drills, checkmate patterns, rating-targeted practice
- File: New component + puzzles data

### Coordinate Trainer
- Status: Missing
- Lichess: Identify squares by name rapidly
- File: New component

### Chess Basics / Lessons
- Status: Missing
- Lichess: Interactive lessons on piece movement, rules, strategy
- File: New components

### Highlight toggles
- Status: Missing
- Lichess: Toggle last move highlight, legal moves, check indicator
- File: Board.jsx (state toggles)

### Move confirmation
- Status: Missing
- Lichess: Double-click on destination to confirm (optional)
- File: Board.jsx

---

## Settings

### Auto-queen (always promote to queen)
- Status: Missing
- Lichess: Setting to skip promotion dialog, always queen
- File: SettingsModal.jsx, Board.jsx

### Drag sensitivity / click preference
- Status: Missing
- Lichess: Choose between click-to-move and drag-to-move as primary
- File: SettingsModal.jsx

### Custom backgrounds
- Status: Missing
- Lichess: Upload custom board background image
- File: SettingsModal.jsx, Board.css

### Engine tuning (threads, hash, movetime)
- Status: Missing
- Lichess: Advanced engine settings sliders
- File: SettingsModal.jsx, Board.jsx

### Auto-flip board
- Status: Missing
- Lichess: Automatically flip board after each move
- File: Board.jsx

---

## Performance / Infrastructure

### Lazy loading
- Status: Missing
- Lichess: Code-split by route, lazy-load heavy components
- File: `router.jsx`

### Server-side rendering
- Status: Missing
- Lichess: lila is server-rendered Scala app
- Not needed (SPA)

### Database persistence
- Status: Missing
- Lichess: MongoDB for games, users, puzzles
- ShadowChess: No persistence yet

---

## Scoring & Stats

### Per-move eval diff scoring (CentiPawn Loss)
- Status: Missing
- Lichess: Shows CP loss per move, highlights best vs actual
- File: Board.jsx engine classification

### Opening explorer WDL as eval bar %
- Status: Missing
- Lichess: Explorer WDL can be shown as probability over eval bar
- File: Board.jsx

---

## Implementation Notes

### APIs available for integration
- `https://explorer.lichess.ovh/masters?fen=<FEN>` — Master games explorer
- `https://explorer.lichess.ovh/lichess?fen=<FEN>` — Lichess games explorer
- `https://explorer.lichess.ovh/player?fen=<FEN>&player=<name>` — Player explorer
- `https://tablebase.lichess.ovh/standard?fen=<FEN>` — Syzygy tablebase
- `https://tablebase.lichess.ovh/standard/mainline?fen=<FEN>` — Best-play line
- `https://explorer.lichess.ovh/master/pgn/<gameId>` — Download master PGN
- All endpoints use GET, CORS wildcard, no auth needed
