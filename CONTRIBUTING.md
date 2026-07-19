# Contributing to ShadowChess

Thank you for your interest in contributing! This document outlines the process for contributing code, reporting issues, and proposing features.

---

## Code of Conduct

This project follows a **no-drama policy**. Be respectful, constructive, and inclusive. Harassment, trolling, and personal attacks will not be tolerated.

---

## How to Contribute

### 1. Reporting Bugs

Open a [GitHub issue](https://github.com/ShadowRahlM/shadowchess/issues) with:

- A clear, descriptive title
- Steps to reproduce (include browser, OS, engine mode)
- Expected vs actual behavior
- Screenshots or screen recordings if applicable
- Browser console errors (F12 → Console)

### 2. Suggesting Features

Open a [GitHub issue](https://github.com/ShadowRahlM/shadowchess/issues) with:

- A clear description of the feature
- Why it would be useful
- Reference to a Lichess/chess.com equivalent if applicable
- Any implementation notes or API endpoints you're aware of

### 3. Submitting Code

#### Getting Started

```bash
# Fork and clone your fork
git clone git@github.com:YOUR_USERNAME/shadowchess.git
cd shadowchess

# Add upstream remote
git remote add upstream git@github.com:ShadowRahlM/shadowchess.git

# Create a feature branch
git checkout -b feature/my-feature
```

#### Development Workflow

1. **Server** — `cd server && npm install && npm start`
2. **Client** — `cd client && npm install && npm run dev`
3. Open `http://localhost:5173`

The Vite dev server proxies `/api` requests to the server on port 3001.

#### Code Style

- **No semicolons** — Project uses ASI (automatic semicolon insertion)
- **`var` over `const`/`let`** — For consistency with the existing codebase
- **No JSX type annotations** — Plain `.jsx`, no TypeScript
- **No comments** in production code unless explaining a non-obvious edge case
- **2-space indentation**
- **Single quotes** for strings
- **JSX in `.jsx` files**, logic in `.js` files

Run the linter before committing:

```bash
cd client
npm run lint
```

Existing warnings are pre-existing. Ensure you don't introduce new ones.

#### Testing

```bash
cd client
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

All tests must pass before submitting a PR. Add tests for new functionality:

- **Pure logic** → `src/utils/chess-logic.test.js`
- **Component rendering** → `src/components/ComponentName.test.jsx`

The test suite uses **Vitest** + **React Testing Library** + **jsdom**. Global mocks are in `src/setupTests.js`.

#### Commit Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues/PRs in the body

```
Short (50-72 char) summary

More detailed explanatory text, if necessary. Wrap at 72 chars.

Closes #123
```

#### Pull Request Process

1. Update your branch: `git fetch upstream && git rebase upstream/master`
2. Run `npm test` — all tests must pass
3. Run `npm run lint` — no new warnings
4. Push your branch and open a PR against `master`
5. In the PR description, explain what you changed and why
6. A maintainer will review your PR

---

## Project Architecture Notes

### Component Hierarchy

```
<App>
  <Board>              # Main component (all state lives here)
    <PgnPanel />       # PGN import/export (modal)
    <GameDatabase />   # Famous games + Opening browser (modal)
    <PuzzleModal />    # Tactical puzzle training (modal)
    <SettingsModal />   # Preferences panel (modal)
    <EvalGraph />      # Canvas-based eval chart
```

`Board.jsx` is intentionally monolithic (~1700 lines). All game state is in one place, making it straightforward to reason about. Child components receive props and callbacks.

### Engine Integration

Two engine backends share the same `sendEngine()` interface:

- **WebSocket** — `sendEngine({ type: 'go', options: { depth, movetime } })` → JSON → Node.js server → Stockfish UCI
- **WASM Worker** — Same function calls, but the `case 'go'` handler posts to a Web Worker instead

The `useEngine.js` hook wraps the WebSocket connection. The WASM path is handled inline in `Board.jsx`.

### External APIs

All are fetched directly from the browser (no server proxy):

| API | Endpoint | Purpose |
|-----|----------|---------|
| Lichess Explorer | `explorer.lichess.ovh/lichess` | Opening statistics |
| Lichess Masters | `explorer.lichess.ovh/masters` | Master-level games |
| Lichess Player | `explorer.lichess.ovh/player` | Per-player stats |
| Tablebase | `tablebase.lichess.ovh/standard` | Syzygy endgame data |

---

## Feature Checklist

Before implementing a new feature, check [FEATURES.md](FEATURES.md) and [LICHESS_GAPS.md](LICHESS_GAPS.md) to see if it's already tracked.

When adding a new feature, update:
1. `FEATURES.md` — Mark the checkbox and add a brief description
2. The feature count in the stats section at the bottom

---

## Need Help?

Open a [discussion](https://github.com/ShadowRahlM/shadowchess/discussions) or ask in the issue tracker.
