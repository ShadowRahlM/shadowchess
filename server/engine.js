const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

const STOCKFISH_PATH = process.env.STOCKFISH_PATH || path.join(__dirname, '..', '..', '..', 'Stockfish', 'src', 'stockfish');

class Engine extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.ready = false;
    this.buffer = '';
    this.going = false;
  }

  start() {
    this.process = spawn(STOCKFISH_PATH, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          this.emit('line', trimmed);
        }
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error(`[engine stderr] ${data}`);
    });

    this.process.on('exit', (code) => {
      this.ready = false;
      this.emit('exit', code);
    });

    return new Promise((resolve) => {
      const onLine = (line) => {
        if (line.startsWith('id name')) {
          this.removeListener('line', onLine);
          this.ready = true;
          resolve(line);
        }
      };
      this.on('line', onLine);
      this.send('uci');
    });
  }

  send(cmd) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(cmd + '\n');
    }
  }

  async newGame() {
    this.send('ucinewgame');
    return this.waitForReady();
  }

  async setPosition(fen, moves) {
    if (fen === 'startpos') {
      let cmd = 'position startpos';
      if (moves && moves.length > 0) {
        cmd += ' moves ' + moves.join(' ');
      }
      this.send(cmd);
    } else {
      let cmd = `position fen ${fen}`;
      if (moves && moves.length > 0) {
        cmd += ' moves ' + moves.join(' ');
      }
      this.send(cmd);
    }
  }

  go(options = {}) {
    this.going = true;
    let cmd = 'go';
    if (options.depth) cmd += ` depth ${options.depth}`;
    if (options.movetime) cmd += ` movetime ${options.movetime}`;
    if (options.wtime !== undefined) cmd += ` wtime ${options.wtime}`;
    if (options.btime !== undefined) cmd += ` btime ${options.btime}`;
    if (options.winc !== undefined) cmd += ` winc ${options.winc}`;
    if (options.binc !== undefined) cmd += ` binc ${options.binc}`;
    if (options.infinite) cmd += ' infinite';
    this.send(cmd);
  }

  stop() {
    this.going = false;
    this.send('stop');
  }

  setOption(name, value) {
    this.send(`setoption name ${name} value ${value}`);
  }

  waitForReady() {
    return new Promise((resolve) => {
      const onLine = (line) => {
        if (line === 'readyok') {
          this.removeListener('line', onLine);
          resolve();
        }
      };
      this.on('line', onLine);
      this.send('isready');
    });
  }

  quit() {
    if (this.process) {
      this.send('quit');
      this.process.kill();
      this.process = null;
    }
  }
}

module.exports = Engine;
