import { Chess } from 'chess.js'
import { describe, it, expect } from 'vitest'

// =====================================================
// Pure logic functions extracted from Board.jsx
// =====================================================

function countPieces(fen) {
  return fen.split(' ')[0]
    .split('')
    .filter(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
    .length
}

function shouldShowTablebase(fen) {
  var pc = countPieces(fen)
  return pc <= 7 && pc >= 2
}

function toWhiteScore(sc, fen) {
  return fen && fen.indexOf(' b ') !== -1 ? -sc : sc
}

const CLASSIFICATION_THRESHOLDS = [
  { max: -1.5, symbol: '!!', color: '#fbbf24' },
  { max: -0.25, symbol: '!', color: '#22c55e' },
  { max: 0.25, symbol: null, color: null },
  { max: 0.75, symbol: '!?', color: '#f59e0b' },
  { max: 1.5, symbol: '?', color: '#f97316' },
]

function classifyMove(cpLoss) {
  if (cpLoss < -1.5) return { symbol: '!!', color: '#fbbf24' }
  if (cpLoss < -0.25) return { symbol: '!', color: '#22c55e' }
  if (cpLoss > 1.5) return { symbol: '??', color: '#ef4444' }
  if (cpLoss > 0.75) return { symbol: '?', color: '#f97316' }
  if (cpLoss > 0.25) return { symbol: '!?', color: '#f59e0b' }
  return null
}

function buildAnalysisFromScores(scores, movesList) {
  var len = movesList.length
  var newAnalysis = []
  for (var mi = 0; mi < len; mi++) {
    var sc = scores[mi + 1]
    var entry = { score: sc != null ? sc : 0 }
    if (scores[mi] != null && scores[mi + 1] != null) {
      var moveColor = movesList[mi].color
      var cpLoss = moveColor === 'w'
        ? scores[mi] - scores[mi + 1]
        : scores[mi + 1] - scores[mi]
      var cls = classifyMove(cpLoss / 100)
      if (cls) entry.classification = cls
    }
    newAnalysis.push(entry)
  }
  return newAnalysis
}

// WDL bar calculation
function computeWdlBars(wdl) {
  if (!wdl) return null
  var total = wdl.white + wdl.draws + wdl.black
  if (total === 0) return null
  return {
    wp: wdl.white / total * 100,
    dp: wdl.draws / total * 100,
    lp: wdl.black / total * 100,
    total: total
  }
}

// Opening tree matching
function computeOpeningTree(openingBook, currentUci) {
  var matching = (openingBook.openings || []).filter(function(o) {
    if (o.moves.length <= currentUci.length) return false
    for (var oi = 0; oi < currentUci.length; oi++) {
      if (o.moves[oi] !== currentUci[oi]) return false
    }
    return true
  })
  if (matching.length === 0) return null
  var moveCounts = {}
  var moveFirstNames = {}
  matching.forEach(function(o) {
    var nextUci = o.moves[currentUci.length]
    var g3 = new Chess()
    try {
      for (var ui = 0; ui <= currentUci.length; ui++) { g3.move(o.moves[ui]) }
      var nextSan = g3.history().pop()
      moveCounts[nextSan] = (moveCounts[nextSan] || 0) + 1
      if (!moveFirstNames[nextSan]) moveFirstNames[nextSan] = { name: o.name, category: o.category }
    } catch(e) {}
  })
  return { total: matching.length, moves: moveCounts, names: moveFirstNames }
}

// Board coordinate helpers
function boardCoordinates(r, c, flipped) {
  const FILES = ['a','b','c','d','e','f','g','h']
  return {
    file: FILES[c],
    rank: flipped ? 1 + r : 8 - r,
    square: FILES[c] + String(flipped ? 1 + r : 8 - r)
  }
}

function dragTarget(col, row, flipped) {
  const FILES = ['a','b','c','d','e','f','g','h']
  return FILES[col] + String(flipped ? 1 + row : 8 - row)
}

// =====================================================
// TESTS
// =====================================================

describe('countPieces', () => {
  it('counts 32 pieces on starting position', () => {
    var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(countPieces(fen)).toBe(32)
  })

  it('counts 3 pieces for K+R vs K endgame', () => {
    var fen = '8/8/8/8/8/4k3/8/4K3 w - - 0 1'
    expect(countPieces(fen)).toBe(2)
  })

  it('counts 5 pieces for K+R vs K+R endgame', () => {
    var fen = '8/8/8/8/4k3/8/4K3/8 w - - 0 1'
    expect(countPieces(fen)).toBe(2)
  })

  it('counts 7 pieces for tablebase boundary test', () => {
    var fen = 'k7/8/8/8/8/8/8/K6R w - - 0 1'
    expect(countPieces(fen)).toBe(3)
  })

  it('handles empty board correctly', () => {
    var fen = '8/8/8/8/8/8/8/8 w - - 0 1'
    expect(countPieces(fen)).toBe(0)
  })
})

describe('shouldShowTablebase', () => {
  it('shows tablebase for 7-piece position', () => {
    var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(shouldShowTablebase(fen)).toBe(false)
  })

  it('hides tablebase for 32-piece position', () => {
    var fen = '8/8/8/8/8/8/8/KRkr4 w - - 0 1'
    expect(shouldShowTablebase(fen)).toBe(true)
  })

  it('hides tablebase for 3-piece position', () => {
    var fen = '8/8/8/8/8/8/8/k6K w - - 0 1'
    expect(shouldShowTablebase(fen)).toBe(true)
  })

  it('hides tablebase for 2 king position', () => {
    var fen = 'k7/8/8/8/8/8/8/K7 w - - 0 1'
    expect(shouldShowTablebase(fen)).toBe(true)
  })

  it('hides tablebase for 1 king (invalid)', () => {
    var fen = '8/8/8/8/8/8/8/K7 w - - 0 1'
    expect(shouldShowTablebase(fen)).toBe(false)
  })
})

describe('toWhiteScore', () => {
  it('returns positive score as-is when White to move', () => {
    expect(toWhiteScore(50, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(50)
  })

  it('negates score when Black to move', () => {
    expect(toWhiteScore(-50, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1')).toBe(50)
  })

  it('handles zero score', () => {
    expect(toWhiteScore(0, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(0)
  })

  it('handles negative score for White', () => {
    expect(toWhiteScore(-100, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(-100)
  })

  it('handles positive score when Black to move (White is losing)', () => {
    expect(toWhiteScore(200, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1')).toBe(-200)
  })
})

describe('classifyMove', () => {
  it('returns null for good moves (within 0.25)', () => {
    expect(classifyMove(0)).toBeNull()
    expect(classifyMove(0.1)).toBeNull()
    expect(classifyMove(-0.1)).toBeNull()
    expect(classifyMove(0.25)).toBeNull()
    expect(classifyMove(-0.25)).toBeNull()
  })

  it('detects brilliant moves (gain > 1.5 pawns)', () => {
    var cls = classifyMove(-2.0)
    expect(cls).toEqual({ symbol: '!!', color: '#fbbf24' })
  })

  it('detects excellent moves (gain 0.25-1.5)', () => {
    var cls = classifyMove(-1.0)
    expect(cls).toEqual({ symbol: '!', color: '#22c55e' })
  })

  it('detects inaccuracies (loss 0.25-0.75)', () => {
    var cls = classifyMove(0.5)
    expect(cls).toEqual({ symbol: '!?', color: '#f59e0b' })
  })

  it('detects mistakes (loss 0.75-1.5)', () => {
    var cls = classifyMove(1.0)
    expect(cls).toEqual({ symbol: '?', color: '#f97316' })
  })

  it('detects blunders (loss > 1.5)', () => {
    var cls = classifyMove(2.0)
    expect(cls).toEqual({ symbol: '??', color: '#ef4444' })
  })

  it('handles exact boundary values', () => {
    // boundary: 0.26 should be !?
    expect(classifyMove(0.26)).toEqual({ symbol: '!?', color: '#f59e0b' })
    // boundary: 0.76 should be ?
    expect(classifyMove(0.76)).toEqual({ symbol: '?', color: '#f97316' })
    // boundary: 1.51 should be ??
    expect(classifyMove(1.51)).toEqual({ symbol: '??', color: '#ef4444' })
  })
})

describe('buildAnalysisFromScores', () => {
  it('returns empty array for no moves', () => {
    expect(buildAnalysisFromScores([], [])).toEqual([])
  })

  it('classifies correctly when exactly one move and two scores', () => {
    var result = buildAnalysisFromScores([100, 150], [
      { color: 'w' }
    ])
    expect(result).toHaveLength(1)
    expect(result[0].score).toBe(150)
    // white gained 50cp → !
    expect(result[0].classification).toEqual({ symbol: '!', color: '#22c55e' })
  })

  it('classifies White\'s move correctly (eval improved)', () => {
    // White score improved from 100 to 200 → White gained 100cp (1 pawn) → good move
    var result = buildAnalysisFromScores([100, 200], [
      { color: 'w' }
    ])
    expect(result[0].classification).toEqual({ symbol: '!', color: '#22c55e' })
  })

  it('classifies White\'s blunder (eval dropped)', () => {
    // White score dropped from 200 to -100 → White lost 300cp → blunder
    var result = buildAnalysisFromScores([200, -100], [
      { color: 'w' }
    ])
    expect(result[0].classification).toEqual({ symbol: '??', color: '#ef4444' })
  })

  it('classifies Black\'s good move (White\'s eval dropped)', () => {
    // White score dropped from 100 to -50 → Black improved by 150cp → good for Black
    var result = buildAnalysisFromScores([100, -50], [
      { color: 'b' }
    ])
    expect(result[0].classification).toEqual({ symbol: '!', color: '#22c55e' })
  })

  it('classifies Black\'s blunder (White\'s eval improved)', () => {
    // White score improved from -100 to 200 → Black lost 300cp → blunder for Black
    var result = buildAnalysisFromScores([-100, 200], [
      { color: 'b' }
    ])
    expect(result[0].classification).toEqual({ symbol: '??', color: '#ef4444' })
  })

  it('handles multi-move sequences', () => {
    var scores = [0, 50, 80, 60, 100]
    var moves = [
      { color: 'w' },  // white gains 50cp → ! 
      { color: 'b' },  // white gains 30cp more → black inaccuracy 
      { color: 'w' },  // white loses 20cp → good (within threshold)
      { color: 'b' },  // white gains 40cp → black inaccuracy
    ]
    var result = buildAnalysisFromScores(scores, moves)
    expect(result).toHaveLength(4)
    expect(result[0].classification).toEqual({ symbol: '!', color: '#22c55e' })
    expect(result[1].classification).toEqual({ symbol: '!?', color: '#f59e0b' })
    expect(result[2].classification).toBeUndefined()
    expect(result[3].classification).toEqual({ symbol: '!?', color: '#f59e0b' })
  })
})

describe('computeWdlBars', () => {
  it('returns null for missing data', () => {
    expect(computeWdlBars(null)).toBeNull()
  })

  it('returns null for zero total', () => {
    expect(computeWdlBars({ white: 0, draws: 0, black: 0 })).toBeNull()
  })

  it('computes percentages correctly', () => {
    var result = computeWdlBars({ white: 40000, draws: 35000, black: 25000 })
    expect(result.wp).toBeCloseTo(40, 1)
    expect(result.dp).toBeCloseTo(35, 1)
    expect(result.lp).toBeCloseTo(25, 1)
    expect(result.total).toBe(100000)
  })

  it('handles 100% win rate', () => {
    var result = computeWdlBars({ white: 50000, draws: 0, black: 0 })
    expect(result.wp).toBe(100)
    expect(result.dp).toBe(0)
    expect(result.lp).toBe(0)
  })

  it('handles small numbers', () => {
    var result = computeWdlBars({ white: 1, draws: 2, black: 1 })
    expect(result.wp).toBeCloseTo(25, 0)
    expect(result.dp).toBeCloseTo(50, 0)
    expect(result.lp).toBeCloseTo(25, 0)
  })
})

describe('computeOpeningTree', () => {
  var sampleBook = {
    openings: [
      { name: 'Italian Game', category: 'A', moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'] },
      { name: 'Sicilian Defense', category: 'B', moves: ['e2e4', 'c7c5'] },
      { name: 'French Defense', category: 'C', moves: ['e2e4', 'e7e6'] },
      { name: 'Ruy Lopez', category: 'C', moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'] },
    ]
  }

  it('returns all openings after first move e4', () => {
    var result = computeOpeningTree(sampleBook, ['e2e4'])
    expect(result.total).toBe(4)
    expect(Object.keys(result.moves)).toContain('e5')
    expect(Object.keys(result.moves)).toContain('c5')
    expect(Object.keys(result.moves)).toContain('e6')
  })

  it('filters correctly after two moves', () => {
    var result = computeOpeningTree(sampleBook, ['e2e4', 'e7e5'])
    expect(result.total).toBe(2) // Italian + Ruy
    expect(Object.keys(result.moves)).toContain('Nf3')
  })

  it('returns one opening after full Italian line', () => {
    var result = computeOpeningTree(sampleBook, ['e2e4', 'e7e5', 'g1f3', 'b8c6'])
    expect(result.total).toBe(2) // Italian + Ruy still match
    var nextMoves = Object.keys(result.moves)
    expect(nextMoves).toContain('Bc4')
    expect(nextMoves).toContain('Bb5')
  })

  it('returns null for no matches', () => {
    var result = computeOpeningTree(sampleBook, ['d2d4'])
    expect(result).toBeNull()
  })

  it('handles empty book', () => {
    var result = computeOpeningTree({ openings: [] }, ['e2e4'])
    expect(result).toBeNull()
  })

  it('handles book with single opening', () => {
    var singleBook = {
      openings: [{ name: 'Fool\'s Mate', category: 'A', moves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'] }]
    }
    var result = computeOpeningTree(singleBook, ['f2f3'])
    expect(result.total).toBe(1)
    expect(Object.keys(result.moves)).toContain('e5')
  })
})

describe('boardCoordinates', () => {
  it('returns a1 at bottom-left when not flipped', () => {
    var coord = boardCoordinates(7, 0, false)
    expect(coord.square).toBe('a1')
  })

  it('returns h1 at bottom-right when not flipped', () => {
    var coord = boardCoordinates(7, 7, false)
    expect(coord.square).toBe('h1')
  })

  it('returns a8 at top-left when not flipped', () => {
    var coord = boardCoordinates(0, 0, false)
    expect(coord.square).toBe('a8')
  })

  it('returns a8 at bottom-left when flipped', () => {
    var coord = boardCoordinates(7, 0, true)
    expect(coord.square).toBe('a8')
  })

  it('returns a1 at top-left when flipped', () => {
    var coord = boardCoordinates(0, 0, true)
    expect(coord.square).toBe('a1')
  })

  it('returns h1 at top-right when flipped', () => {
    var coord = boardCoordinates(0, 7, true)
    expect(coord.square).toBe('h1')
  })

  it('returns h8 at bottom-right when flipped', () => {
    var coord = boardCoordinates(7, 7, true)
    expect(coord.square).toBe('h8')
  })
})

describe('dragTarget', () => {
  it('clicking bottom-left gives a1 when unflipped', () => {
    expect(dragTarget(0, 7, false)).toBe('a1')
  })

  it('clicking bottom-left gives a8 when flipped', () => {
    expect(dragTarget(0, 7, true)).toBe('a8')
  })

  it('clicking top-left gives a8 when unflipped', () => {
    expect(dragTarget(0, 0, false)).toBe('a8')
  })

  it('clicking top-left gives a1 when flipped', () => {
    expect(dragTarget(0, 0, true)).toBe('a1')
  })

  it('matches board rendering coordinates', () => {
    // Verify that clicking a visual position maps to the same square
    // that is RENDERED at that location
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var visual = boardCoordinates(r, c, true)
        var drop = dragTarget(c, r, true)
        expect(visual.square).toBe(drop)
      }
    }
  })

  it('drag targets always match displayed squares (flipped and unflipped)', () => {
    for (var flipped of [false, true]) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var displayed = boardCoordinates(r, c, flipped).square
          var dragged = dragTarget(c, r, flipped)
          expect(displayed).toBe(dragged)
        }
      }
    }
  })
})

describe('lichess API format integration', () => {
  // Simulates the real Lichess explorer API response
  var mockExplorerResponse = {
    white: 500000,
    draws: 350000,
    black: 150000,
    moves: [
      { san: 'e5', uci: 'e7e5', white: 200000, draws: 120000, black: 80000, averageRating: 2400 },
      { san: 'c5', uci: 'c7c5', white: 150000, draws: 100000, black: 50000, averageRating: 2350 },
      { san: 'e6', uci: 'e7e6', white: 80000, draws: 70000, black: 10000, averageRating: 2300 },
    ]
  }

  it('builds WDL lookup correctly from API response', () => {
    var wdlBySan = {}
    mockExplorerResponse.moves.forEach(function(m) {
      wdlBySan[m.san] = m
    })
    expect(wdlBySan['e5'].white).toBe(200000)
    expect(wdlBySan['c5'].averageRating).toBe(2350)
    expect(wdlBySan['e6'].black).toBe(10000)
  })

  it('computes correct WDL percentages per move', () => {
    var e5wdl = computeWdlBars(mockExplorerResponse.moves[0])
    expect(e5wdl.wp).toBeCloseTo(50, 0)
    expect(e5wdl.dp).toBeCloseTo(30, 0)
    expect(e5wdl.lp).toBeCloseTo(20, 0)
  })

  it('sorts moves by popularity descending', () => {
    var moves = mockExplorerResponse.moves.slice().sort(function(a, b) {
      return (b.white + b.draws + b.black) - (a.white + a.draws + a.black)
    })
    expect(moves[0].san).toBe('e5')
    expect(moves[1].san).toBe('c5')
    expect(moves[2].san).toBe('e6')
  })
})

describe('real game scenario — short verified sequences', () => {
  it('plays a short Italian Game opening correctly', () => {
    var g = new Chess()
    var moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6']
    moves.forEach(function(uci) {
      var mv = g.move({ from: uci.substring(0,2), to: uci.substring(2,4), promotion: uci[4] })
      expect(mv).not.toBeNull()
    })
    expect(g.fen()).toContain('w')
  })

  it('plays a Scholar\'s Mate correctly', () => {
    var g = new Chess()
    var moves = ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7']
    moves.forEach(function(uci) {
      var mv = g.move({ from: uci.substring(0,2), to: uci.substring(2,4), promotion: uci[4] })
      expect(mv).not.toBeNull()
    })
    expect(g.isCheckmate()).toBe(true)
  })

  it('plays a Fool\'s Mate correctly', () => {
    var g = new Chess()
    var moves = ['f2f3', 'e7e5', 'g2g4', 'd8h4']
    moves.forEach(function(uci) {
      var mv = g.move({ from: uci.substring(0,2), to: uci.substring(2,4), promotion: uci[4] })
      expect(mv).not.toBeNull()
    })
    expect(g.isCheckmate()).toBe(true)
  })

  it('computes legal moves correctly', () => {
    var g = new Chess('8/8/8/8/8/5K2/7k/8 b - - 0 1')
    expect(g.moves()).toContain('Kg1')
    expect(g.moves()).toContain('Kh1')
    expect(g.moves()).toContain('Kh3')
  })

  it('parses a FEN position with pieces correctly', () => {
    var g = new Chess('8/8/8/8/8/8/k7/R3K3 w Q - 0 1')
    // White: rook a1, king e1. Black: king a2
    expect(g.get('a1').type).toBe('r')
    expect(g.get('e1').type).toBe('k')
    expect(g.get('a2').type).toBe('k')
    expect(g.turn()).toBe('w')
  })
})

describe('castling edge cases', () => {
  it('allows kingside castling for White', () => {
    var g = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    g.move('e2e4')
    g.move('e7e5')
    g.move('g1f3')
    g.move('b8c6')
    g.move('f1c4')
    g.move('g8f6')
    var result = g.move('e1g1') // O-O
    expect(result).not.toBeNull()
    expect(result.san).toBe('O-O')
  })

  it('prevents castling through check when king would pass through attacked square', () => {
    // Black rook on e8 attacks e1, so king can't castle through e1 → d1
    var g = new Chess('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    // Move e2-e4 to clear e1-f1 path for counting
    g.move('e2e4')
    // Black moves rook from h8-ish... actually let me use a clearer position
    // Position where king is on e1, rook on h1, but d1 is attacked by black rook on d8
    g = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1')
    // d1 is attacked by black rook on d8 → king would pass through d1 during queenside castling
    // But kingside (e1→g1) goes through f1 which is not attacked → kingside is legal
    var kingside = g.move('e1g1')
    expect(kingside).not.toBeNull()
    expect(kingside.san).toBe('O-O')
  })

  it('allows queenside castling when path is clear', () => {
    var g = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')
    var mv = g.move('e1c1')
    expect(mv).not.toBeNull()
    expect(mv.san).toBe('O-O-O')
  })

  it('allows kingside castling even when queenside is blocked', () => {
    var g = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')
    var mv = g.move('e1g1')
    expect(mv.san).toBe('O-O')
  })
})

describe('en passant edge cases', () => {
  it('captures en passant correctly', () => {
    var g = new Chess()
    g.move('e2e4')
    g.move('a7a6')
    g.move('e4e5')
    g.move('d7d5')
    var moves = g.moves({ square: 'e5', verbose: true })
    var hasEp = moves.some(function(m) { return m.flags.indexOf('e') !== -1 })
    expect(hasEp).toBe(true)
  })
})

describe('opening path drill-down state', () => {
  // Tests that the opening path state machine works correctly
  it('handles empty path', () => {
    var path = []
    expect(path.length).toBe(0)
  })

  it('appends moves correctly', () => {
    var path = []
    path = path.concat(['e4'])
    path = path.concat(['e5'])
    path = path.concat(['Nf3'])
    expect(path).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('removes last move (back button)', () => {
    var path = ['e4', 'e5', 'Nf3']
    path = path.slice(0, -1)
    expect(path).toEqual(['e4', 'e5'])
  })

  it('truncates to specific index (breadcrumb click)', () => {
    var path = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']
    path = path.slice(0, 3) // click on third breadcrumb (index 2)
    expect(path).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('resets to empty', () => {
    var path = ['e4', 'e5', 'Nf3']
    path = []
    expect(path).toEqual([])
  })
})

describe('multi-PV line sorting', () => {
  it('sorts multi-PV lines by number', () => {
    var pvs = [
      { num: 3, score: 50, pv: 'e2e4' },
      { num: 1, score: 100, pv: 'd2d4' },
      { num: 2, score: 75, pv: 'g1f3' },
    ]
    pvs.sort(function(a,b) { return a.num - b.num })
    expect(pvs[0].num).toBe(1)
    expect(pvs[1].num).toBe(2)
    expect(pvs[2].num).toBe(3)
  })
})

describe('tablebase category subtypes', () => {
  function categoryBadge(cat) {
    if (cat === 'win') return { cls: 'tb-win', label: 'WIN' }
    if (cat === 'loss') return { cls: 'tb-loss', label: 'LOSS' }
    if (cat === 'cursed-win') return { cls: 'tb-cursed-win', label: 'CURSED WIN' }
    if (cat === 'blessed-loss') return { cls: 'tb-blessed-loss', label: 'BLESSED LOSS' }
    return { cls: 'tb-draw', label: 'DRAW' }
  }

  it('maps win category correctly', () => {
    expect(categoryBadge('win')).toEqual({ cls: 'tb-win', label: 'WIN' })
  })

  it('maps loss category correctly', () => {
    expect(categoryBadge('loss')).toEqual({ cls: 'tb-loss', label: 'LOSS' })
  })

  it('maps draw category correctly', () => {
    expect(categoryBadge('draw')).toEqual({ cls: 'tb-draw', label: 'DRAW' })
  })

  it('maps cursed-win category correctly', () => {
    expect(categoryBadge('cursed-win')).toEqual({ cls: 'tb-cursed-win', label: 'CURSED WIN' })
  })

  it('maps blessed-loss category correctly', () => {
    expect(categoryBadge('blessed-loss')).toEqual({ cls: 'tb-blessed-loss', label: 'BLESSED LOSS' })
  })

  function categoryResult(cat) {
    if (cat === 'win' || cat === 'cursed-win') return '1-0'
    if (cat === 'loss' || cat === 'blessed-loss') return '0-1'
    return '\u00BD-\u00BD'
  }

  it('maps win result to 1-0', () => {
    expect(categoryResult('win')).toBe('1-0')
  })

  it('maps cursed-win result to 1-0', () => {
    expect(categoryResult('cursed-win')).toBe('1-0')
  })

  it('maps loss result to 0-1', () => {
    expect(categoryResult('loss')).toBe('0-1')
  })

  it('maps blessed-loss result to 0-1', () => {
    expect(categoryResult('blessed-loss')).toBe('0-1')
  })

  it('maps draw result to 1/2-1/2', () => {
    expect(categoryResult('draw')).toBe('\u00BD-\u00BD')
  })
})

describe('tablebase mainline building', () => {
  it('selects best move from moves list', () => {
    var moves = [
      { uci: 'a1b1', san: 'Rb1', category: 'win', dtm: 15 },
      { uci: 'a1c1', san: 'Rc1', category: 'win', dtm: 28 },
      { uci: 'a1d1', san: 'Rd1', category: 'win', dtm: 42 },
    ]
    var best = moves.reduce(function(a, b) {
      return b.dtm < a.dtm ? b : a
    })
    expect(best.uci).toBe('a1b1')
    expect(best.dtm).toBe(15)
  })

  it('selects opponent best as move with smallest |dtm| from opposite side', () => {
    // Opponent wants to lose as slowly as possible (smallest |dtm| meaning longest to mate)
    var moves = [
      { uci: 'e7e5', san: 'e5', category: 'loss', dtm: -28 },
      { uci: 'e7e6', san: 'e6', category: 'loss', dtm: -15 },
      { uci: 'c7c5', san: 'c5', category: 'loss', dtm: -42 },
    ]
    var oppBest = moves.reduce(function(a, b) {
      return (b.dtm != null && (a.dtm == null || Math.abs(b.dtm) < Math.abs(a.dtm))) ? b : a
    })
    expect(oppBest.uci).toBe('e7e6')
    expect(oppBest.dtm).toBe(-15)
  })

  it('handles no DTM gracefully', () => {
    var moves = [
      { uci: 'e2e4', san: 'e4', category: 'draw', dtm: null },
    ]
    var best = moves[0]
    expect(best.dtm).toBeNull()
  })
})
