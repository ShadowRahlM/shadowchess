import { Chess } from 'chess.js';

var PUZZLES = [
  { id: 1, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4', moves: ['d2d4', 'e5d4', 'e4e5'], rating: 1200, theme: 'fork', description: 'Win a knight with a pawn fork' },
  { id: 2, fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 2 4', moves: ['f3e5'], rating: 1300, theme: 'capture', description: 'Take the hanging knight' },
  { id: 3, fen: 'r1bqkb1r/pppp1ppp/2n5/4P3/2B5/2N2n2/PPPP1PPP/R1BQK2R b KQkq - 0 5', moves: ['f3g1'], rating: 1400, theme: 'fork', description: 'Fork the queen and rook' },
  { id: 4, fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 4', moves: ['f3e5', 'd8e7', 'e5c6'], rating: 1500, theme: 'fork', description: 'Knight fork wins a pawn' },
  { id: 5, fen: 'r1b1kb1r/pppp1ppp/2n2q2/4N3/2B1n3/8/PPPP1PPP/RNBQK2R w KQkq - 3 6', moves: ['e5f7'], rating: 1500, theme: 'fork', description: 'Fork the king and queen' },
  { id: 6, fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6', moves: ['c4f7', 'f8f7', 'f3g5'], rating: 1600, theme: 'sacrifice', description: 'Bishop sacrifice on f7' },
  { id: 7, fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 b - - 0 6', moves: ['c5f2', 'f1f2', 'f6e4'], rating: 1500, theme: 'fork', description: 'Fork the king and bishop' },
  { id: 8, fen: 'r1bqk2r/pppp1ppp/2n5/2b1P3/2B5/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 6', moves: ['c5f2', 'e1f2', 'd8h4'], rating: 1700, theme: 'attack', description: 'Sacrifice the bishop for a deadly attack' },
  { id: 9, fen: 'r2qkbnr/ppp2ppp/2np4/4N3/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 6', moves: ['e5f7', 'e8f7', 'd1h5'], rating: 1600, theme: 'sacrifice', description: 'Knight sacrifice on f7' },
  { id: 10, fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4', moves: ['e4e5', 'f6d5', 'c4d5'], rating: 1200, theme: 'fork', description: 'Pawn fork wins a piece' },
  { id: 11, fen: 'rnbq1rk1/pppp1ppp/4pn2/2b1N3/2B1P3/8/PPPP1PPP/RNBQ1RK1 b - - 3 5', moves: ['c5f2', 'f1f2', 'f6e4'], rating: 1600, theme: 'fork', description: 'Fork the king and bishop' },
  { id: 12, fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 w - - 0 7', moves: ['d3d5', 'e4d5', 'd1d5'], rating: 1400, theme: 'attack', description: 'Central breakthrough' },
  { id: 13, fen: 'r1bq1rk1/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7', moves: ['c4f7', 'f8f7', 'f3g5'], rating: 1800, theme: 'sacrifice', description: 'Bishop sacrifice to open the king' },
  { id: 14, fen: 'r1bq1rk1/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 0 7', moves: ['f6e4', 'd3e4', 'd8h4'], rating: 1700, theme: 'counterattack', description: 'Counterattack in the center' },
  { id: 15, fen: 'r4rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P3/2NP1N2/PPP2PPP/R2Q1RK1 w - - 3 8', moves: ['g5f6', 'd8f6', 'd1d6'], rating: 1600, theme: 'tactic', description: 'Exchange sacrifice to win a pawn' },
  { id: 16, fen: 'r4rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 8', moves: ['c4f7', 'f8f7', 'f3g5', 'f7f8', 'd1h5'], rating: 2000, theme: 'sacrifice', description: 'Classical attacking sequence' },
  { id: 17, fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1', moves: ['g1f2', 'g8f8', 'f2e3', 'f8e8', 'e3d4', 'e8d8', 'd4c5', 'd8c8', 'c5b6', 'c8b8', 'b6a6'], rating: 1000, theme: 'endgame', description: 'King and pawn endgame' },
  { id: 18, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N5/PPPP1PPP/R1BQK2R w KQkq - 0 4', moves: ['d2d4', 'e5d4', 'e4e5'], rating: 1300, theme: 'trap', description: 'Center pawn push traps the knight' },
  { id: 19, fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/R1BQ1RK1 b kq - 2 4', moves: ['f8c5'], rating: 1100, theme: 'development', description: 'Develop the bishop' },
  { id: 20, fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', moves: ['d3d5'], rating: 1400, theme: 'attack', description: 'Push d5 to attack the center' },
  { id: 21, fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6', moves: ['c1g5'], rating: 1300, theme: 'pin', description: 'Pin the knight to the queen' },
  { id: 22, fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6', moves: ['d3d5', 'e4d5', 'e4e5'], rating: 1500, theme: 'attack', description: 'Central pawn break' }
];

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function getPuzzles() {
  return shuffle([].concat(PUZZLES));
}

export function validatePuzzleMove(puzzle, moveHistory, attemptedMoveUci) {
  var expected = puzzle.moves[moveHistory.length];
  if (!expected) return { status: 'done', message: 'All moves complete!' };
  if (attemptedMoveUci === expected) {
    var newHistory = moveHistory.concat([expected]);
    var complete = newHistory.length >= puzzle.moves.length;
    return { status: 'correct', moveHistory: newHistory, complete: complete };
  }
  return { status: 'incorrect', expected: expected, moveHistory: moveHistory };
}
