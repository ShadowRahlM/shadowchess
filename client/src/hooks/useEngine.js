import { useState, useEffect, useRef, useCallback } from 'react';

export function useEngine(wsUrl) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [engineInfo, setEngineInfo] = useState('');
  const [bestMove, setBestMove] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [depth, setDepth] = useState(0);
  const [nodes, setNodes] = useState(0);
  const [nps, setNps] = useState(0);
  const [score, setScore] = useState(null);
  const [pv, setPv] = useState('');
  const [engineReady, setEngineReady] = useState(false);

  const onMessageRef = useRef([]);
  onMessageRef.current = [];

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[ws] Connected to engine server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'engine_id') {
          setEngineInfo(msg.data);
        }

        if (msg.type === 'ready') {
          setEngineReady(true);
        }

        if (msg.type === 'engine') {
          const line = msg.data;

          if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            setBestMove(parts[1]);
            return;
          }

          if (line.startsWith('info')) {
            const info = parseInfoLine(line);
            if (info.depth) setDepth(info.depth);
            if (info.nodes) setNodes(info.nodes);
            if (info.nps) setNps(info.nps);
            if (info.score !== undefined) setScore(info.score);
            if (info.pv) setPv(info.pv);
            if (info.seldepth) {
              setAnalysis({
                depth: info.depth,
                seldepth: info.seldepth,
                score: info.score,
                pv: info.pv,
                nodes: info.nodes,
                nps: info.nps,
                time: info.time,
              });
            }
          }
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[ws] Disconnected');
      setConnected(false);
      setEngineReady(false);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const setPosition = useCallback((fen, moves) => {
    send({ type: 'position', fen, moves });
  }, [send]);

  const go = useCallback((options) => {
    setBestMove(null);
    setAnalysis(null);
    setDepth(0);
    setNodes(0);
    setNps(0);
    setScore(null);
    setPv('');
    send({ type: 'go', options });
  }, [send]);

  const stop = useCallback(() => {
    send({ type: 'stop' });
  }, [send]);

  const newGame = useCallback(() => {
    send({ type: 'newgame' });
    setBestMove(null);
    setAnalysis(null);
    setDepth(0);
    setNodes(0);
    setNps(0);
    setScore(null);
    setPv('');
  }, [send]);

  const setOption = useCallback((name, value) => {
    send({ type: 'setoption', name, value });
  }, [send]);

  return {
    connected,
    engineInfo,
    engineReady,
    bestMove,
    analysis,
    depth,
    nodes,
    nps,
    score,
    pv,
    setPosition,
    go,
    stop,
    newGame,
    setOption,
  };
}

function parseInfoLine(line) {
  const info = {};
  const parts = line.split(' ');

  for (let i = 0; i < parts.length; i++) {
    switch (parts[i]) {
      case 'depth':
        info.depth = parseInt(parts[++i]);
        break;
      case 'seldepth':
        info.seldepth = parseInt(parts[++i]);
        break;
      case 'nodes':
        info.nodes = parseInt(parts[++i]);
        break;
      case 'nps':
        info.nps = parseInt(parts[++i]);
        break;
      case 'time':
        info.time = parseInt(parts[++i]);
        break;
      case 'score': {
        const type = parts[++i];
        const val = parseInt(parts[++i]);
        if (type === 'cp') {
          info.score = val;
        } else if (type === 'mate') {
          info.score = val > 0 ? 10000 - val : -10000 - val;
        }
        break;
      }
      case 'pv': {
        const moveParts = [];
        for (let j = i + 1; j < parts.length; j++) {
          if (!['score', 'depth', 'nodes', 'nps', 'time', 'hashfull', 'tbhits'].includes(parts[j])) {
            moveParts.push(parts[j]);
          } else break;
        }
        info.pv = moveParts.join(' ');
        break;
      }
    }
  }

  return info;
}
