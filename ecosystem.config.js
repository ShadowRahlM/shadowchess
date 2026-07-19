module.exports = {
  apps: [{
    name: 'shadowchess-server',
    script: './server/index.js',
    cwd: '/home/shadowm/Projects/shadowchess',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      STOCKFISH_PATH: '/home/shadowm/Projects/Stockfish/src/stockfish'
    },
    watch: false,
    max_memory_restart: '500M',
    error_file: '/home/shadowm/Projects/shadowchess/server/error.log',
    out_file: '/home/shadowm/Projects/shadowchess/server/output.log',
    merge_logs: true,
    autorestart: true
  }]
}
