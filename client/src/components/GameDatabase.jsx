import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

function buildOpeningTree(openings) {
  var root = { children: {}, names: [] };

  for (var oi = 0; oi < openings.length; oi++) {
    var op = openings[oi];
    var node = root;
    for (var mi = 0; mi < op.moves.length; mi++) {
      var uci = op.moves[mi];
      if (!node.children[uci]) {
        node.children[uci] = { children: {}, uci: uci, san: '', names: [] };
      }
      node = node.children[uci];
    }
    node.names.push({ name: op.name, category: op.category });
  }

  function assignSans(node, pathUcis) {
    var g = new Chess();
    for (var pi = 0; pi < pathUcis.length; pi++) {
      try { g.move(pathUcis[pi]); } catch(e) { break; }
    }
    var ucis = Object.keys(node.children);
    for (var ci = 0; ci < ucis.length; ci++) {
      var child = node.children[ucis[ci]];
      try {
        var result = g.move(child.uci);
        child.san = result.san;
        g.undo();
      } catch(e) {
        child.san = child.uci;
      }
    }
    for (var cj = 0; cj < ucis.length; cj++) {
      assignSans(node.children[ucis[cj]], pathUcis.concat([node.children[ucis[cj]].uci]));
    }
  }
  assignSans(root, []);

  return root;
}

function sortTreeChildren(childrenObj) {
  var arr = [];
  var keys = Object.keys(childrenObj);
  for (var i = 0; i < keys.length; i++) {
    arr.push(childrenObj[keys[i]]);
  }
  arr.sort(function(a, b) {
    if (a.san < b.san) return -1;
    if (a.san > b.san) return 1;
    return 0;
  });
  return arr;
}

function OpeningTreeView(props) {
  var node = props.node;
  var depth = props.depth;
  var pathUcis = props.pathUcis;
  var onLoad = props.onLoad;
  var expandedDefault = props.expandedDefault;

  var expandState = useState(depth < (expandedDefault || 2) && node.names.length === 0);
  var expanded = expandState[0];
  var setExpanded = expandState[1];

  var children = sortTreeChildren(node.children);

  if (node.names.length === 0 && children.length === 0 && depth > 0) return null;

  var moveNumber = Math.floor(depth / 2) + 1;
  var isWhite = depth % 2 === 0;

  function toggle() { setExpanded(!expanded); }

  function handleLoad() {
    onLoad(pathUcis);
  }

  return (
    <div className="otn" style={{ paddingLeft: depth > 0 ? 18 : 0 }}>
      {depth > 0 && (
        <div className="otn-row">
          {children.length > 0 && (
            <span className="otn-toggle" onClick={toggle}>
              {expanded ? '\u25BC' : '\u25B6'}
            </span>
          )}
          {children.length === 0 && <span className="otn-spacer" />}
          <span className={'otn-move ' + (isWhite ? 'otn-w' : 'otn-b')}>
            {isWhite ? moveNumber + '. ' : moveNumber + '... '}
            <span className="otn-san">{node.san}</span>
          </span>
          {node.names.length > 0 && (
            <span className="otn-names" onClick={handleLoad}>
              {node.names.map(function(n, i) {
                return (
                  <span key={i} className="otn-name">
                    {n.name}
                    <span className="otn-cat"> ({n.category})</span>
                  </span>
                );
              })}
            </span>
          )}
        </div>
      )}
      {depth === 0 && (
        <div className="otn-row otn-root">
          <span className="otn-label">Opening Explorer</span>
        </div>
      )}
      {expanded && children.length > 0 && (
        <div className="otn-children">
          {children.map(function(child) {
            return (
              <OpeningTreeView
                key={child.uci}
                node={child}
                depth={depth + 1}
                pathUcis={pathUcis.concat([child.uci])}
                onLoad={onLoad}
                expandedDefault={expandedDefault}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GameDatabase(props) {
  var onLoadGame = props.onLoadGame;
  var [games, setGames] = useState([]);
  var [activeTab, setActiveTab] = useState('games');
  var [tree, setTree] = useState(null);

  useEffect(function() {
    fetch('/api/games')
      .then(function(res) { return res.json(); })
      .then(function(data) { setGames(data.games || []); })
      .catch(function(err) { console.error('Failed to load games:', err); });

    fetch('/api/openings')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var ops = data.openings || [];
        setTree(buildOpeningTree(ops));
      })
      .catch(function(err) { console.error('Failed to load openings:', err); });
  }, []);

  function handleLoadOpening(moves) {
    var g = new Chess();
    var sanMoves = [];
    for (var i = 0; i < moves.length; i++) {
      try {
        var result = g.move(moves[i]);
        sanMoves.push(result.san);
      } catch(e) { break; }
    }
    if (onLoadGame && sanMoves.length > 0) {
      onLoadGame(sanMoves);
    }
  }

  function handleLoadGame(game) {
    var moveSection = game.pgn.split('\n\n')[1] || '';
    var moves = moveSection
      .replace(/\d+\./g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .split(/\s+/)
      .filter(function(m) { return m && !['1-0', '0-1', '1/2-1/2', '*', ''].includes(m); });

    if (onLoadGame) {
      onLoadGame(moves, game);
    }
  }

  return (
    <div className="game-database">
      <div className="db-tabs">
        <button
          className={'db-tab' + (activeTab === 'games' ? ' active' : '')}
          onClick={function() { setActiveTab('games'); }}
        >Famous Games</button>
        <button
          className={'db-tab' + (activeTab === 'openings' ? ' active' : '')}
          onClick={function() { setActiveTab('openings'); }}
        >Opening Book</button>
      </div>

      {activeTab === 'games' && (
        <div className="games-list">
          {games.map(function(game) {
            return (
              <div key={game.id} className="game-card" onClick={function() { handleLoadGame(game); }}>
                <div className="game-header">
                  <span className="game-name">{game.name}</span>
                  <span className="game-result">{game.result}</span>
                </div>
                <div className="game-players">
                  {game.players[0]} vs {game.players[1]}
                </div>
                <div className="game-meta">
                  <span>{game.year}</span>
                  <span>{game.opening}</span>
                </div>
              </div>
            );
          })}
          {games.length === 0 && (
            <div className="empty-state">Loading games...</div>
          )}
        </div>
      )}

      {activeTab === 'openings' && (
        <div className="openings-tree">
          {tree ? (
            <OpeningTreeView
              node={tree}
              depth={0}
              pathUcis={[]}
              onLoad={handleLoadOpening}
              expandedDefault={1}
            />
          ) : (
            <div className="empty-state">Loading openings...</div>
          )}
        </div>
      )}
    </div>
  );
}
