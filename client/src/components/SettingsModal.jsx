import React from 'react';
import './SettingsModal.css';

var THEMES = {
  brown: { light:'#f0d9b5', dark:'#b58863', name:'Brown' },
  blue: { light:'#dee3e6', dark:'#8ca2ad', name:'Blue' },
  green: { light:'#ffffdd', dark:'#86a666', name:'Green' },
  purple: { light:'#e8d5f5', dark:'#9b72cf', name:'Purple' },
  red: { light:'#f5d5d5', dark:'#cf7272', name:'Red' },
  dark: { light:'#302e2b', dark:'#1b1a17', name:'Dark' }
};

export default function SettingsModal({
  boardTheme, setBoardTheme,
  boardSize, setBoardSize,
  coordsMode, setCoordsMode,
  animDuration, setAnimDuration,
  bgTheme, setBgTheme,
  pieceSet, setPieceSet,
  depth, setDepth,
  multiPv, setMultiPv,
  soundOn, toggleSound,
  soundPack, soundVol, changePack, changeVolume,
  clockTime, setClockTime,
  clockEnabled, toggleClock,
  useWasm, setUseWasm,
  onClose
}) {
  return (
    <div className="dasher-overlay" onClick={onClose}>
      <div className="dasher-dropdown" onClick={function(e) { e.stopPropagation(); }}>
        <div className="dasher-header">
          <span className="dasher-title">Preferences</span>
          <button className="dasher-close" onClick={onClose}>x</button>
        </div>

        <div className="dasher-scroll">
          {/* Board Theme */}
          <div className="dasher-group">
            <div className="dasher-label">Board Theme</div>
            <div className="dasher-board-themes">
              {Object.keys(THEMES).map(function(key) {
                return <button key={key} onClick={function() { setBoardTheme(key); }}
                  className={'dasher-theme-dot' + (boardTheme === key ? ' active' : '')}
                  title={THEMES[key].name}
                  style={{ background: 'linear-gradient(135deg,' + THEMES[key].light + ' 50%,' + THEMES[key].dark + ' 50%)' }} />;
              })}
            </div>
          </div>

          {/* Board Size */}
          <div className="dasher-group">
            <div className="dasher-label">Board Size</div>
            <div className="dasher-slider-row">
              <input type="range" min="60" max="120" value={boardSize}
                onChange={function(e) { setBoardSize(parseInt(e.target.value)); }}
                className="dasher-slider" />
              <span className="dasher-value">{boardSize}%</span>
            </div>
          </div>

          {/* Piece Set */}
          <div className="dasher-group">
            <div className="dasher-label">Piece Set</div>
            <div className="dasher-btn-group">
              <button className={'dasher-btn' + (pieceSet === 'cburnett' ? ' active' : '')} onClick={function() { setPieceSet('cburnett'); }}>CBurnett</button>
              <button className={'dasher-btn' + (pieceSet === 'merida' ? ' active' : '')} onClick={function() { setPieceSet('merida'); }}>Merida</button>
              <button className={'dasher-btn' + (pieceSet === 'alpha' ? ' active' : '')} onClick={function() { setPieceSet('alpha'); }}>Alpha</button>
              <button className={'dasher-btn' + (pieceSet === 'chess7' ? ' active' : '')} onClick={function() { setPieceSet('chess7'); }}>Chess7</button>
            </div>
          </div>

          {/* Coordinates */}
          <div className="dasher-group">
            <div className="dasher-label">Coordinates</div>
            <div className="dasher-btn-group">
              <button className={'dasher-btn' + (coordsMode === 'in' ? ' active' : '')} onClick={function() { setCoordsMode('in'); }}>Inside</button>
              <button className={'dasher-btn' + (coordsMode === 'out' ? ' active' : '')} onClick={function() { setCoordsMode('out'); }}>Outside</button>
              <button className={'dasher-btn' + (coordsMode === 'off' ? ' active' : '')} onClick={function() { setCoordsMode('off'); }}>Hidden</button>
            </div>
          </div>

          {/* Animation Duration */}
          <div className="dasher-group">
            <div className="dasher-label">Piece Animation</div>
            <div className="dasher-slider-row">
              <input type="range" min="0" max="500" step="50" value={animDuration}
                onChange={function(e) { setAnimDuration(parseInt(e.target.value)); }}
                className="dasher-slider" />
              <span className="dasher-value">{animDuration}ms</span>
            </div>
          </div>

          {/* Background Theme */}
          <div className="dasher-group">
            <div className="dasher-label">Background</div>
            <div className="dasher-btn-group">
              <button className={'dasher-btn' + (bgTheme === 'light' ? ' active' : '')} onClick={function() { setBgTheme('light'); }}>Light</button>
              <button className={'dasher-btn' + (bgTheme === 'dark' ? ' active' : '')} onClick={function() { setBgTheme('dark'); }}>Dark</button>
              <button className={'dasher-btn' + (bgTheme === 'system' ? ' active' : '')} onClick={function() { setBgTheme('system'); }}>System</button>
            </div>
          </div>

          {/* Engine Depth */}
          <div className="dasher-group">
            <div className="dasher-label">Engine Depth</div>
            <div className="dasher-slider-row">
              <input type="range" min="1" max="25" value={depth}
                onChange={function(e) { setDepth(parseInt(e.target.value)); }}
                className="dasher-slider" />
              <span className="dasher-value">{depth}</span>
            </div>
          </div>

          {/* Multi-PV */}
          <div className="dasher-group">
            <div className="dasher-label">Multi-PV (lines)</div>
            <div className="dasher-slider-row">
              <input type="range" min="1" max="5" value={multiPv}
                onChange={function(e) { setMultiPv(parseInt(e.target.value)); }}
                className="dasher-slider" />
              <span className="dasher-value">{multiPv}</span>
            </div>
          </div>

          {/* Engine Type */}
          <div className="dasher-group">
            <div className="dasher-label">Engine</div>
            <div className="dasher-row">
              <button className={'dasher-btn' + (useWasm ? '' : ' active')} onClick={function() { setUseWasm(false); }} style={{ flex:1 }}>Server</button>
              <button className={'dasher-btn' + (useWasm ? ' active' : '')} onClick={function() { setUseWasm(true); }} style={{ flex:1 }}>Local WASM</button>
            </div>
          </div>

          {/* Sound */}
          <div className="dasher-group">
            <div className="dasher-label">Sound</div>
            <div className="dasher-row">
              <button className={'dasher-btn' + (soundOn ? ' active' : '')} onClick={toggleSound} style={{ width:60 }}>{soundOn ? 'On' : 'Off'}</button>
              {soundOn && (
                <select value={soundPack} onChange={function(e) { changePack(e.target.value); }}
                  className="dasher-select">
                  <option value="standard">Standard</option>
                  <option value="piano">Piano</option>
                  <option value="synthetic">Synthetic</option>
                </select>
              )}
            </div>
            {soundOn && (
              <div className="dasher-slider-row" style={{ marginTop:4 }}>
                <input type="range" min="0" max="1" step="0.1" value={soundVol}
                  onChange={function(e) { changeVolume(parseFloat(e.target.value)); }}
                  className="dasher-slider" />
                <span className="dasher-value">{Math.round(soundVol * 100)}%</span>
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="dasher-group">
            <div className="dasher-label">Clock / Timer</div>
            <div className="dasher-row">
              <button className={'dasher-btn' + (clockEnabled ? ' active' : '')} onClick={toggleClock} style={{ width:60 }}>{clockEnabled ? 'On' : 'Off'}</button>
              {clockEnabled && (
                <select value={clockTime} onChange={function(e) { setClockTime(parseInt(e.target.value)); }}
                  className="dasher-select">
                  <option value={60}>1 min</option>
                  <option value={180}>3 min</option>
                  <option value={300}>5 min</option>
                  <option value={600}>10 min</option>
                  <option value={1200}>20 min</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
