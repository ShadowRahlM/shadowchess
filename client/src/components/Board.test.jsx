import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock child components
vi.mock('./PgnPanel', () => ({ default: function() { return React.createElement('div', { 'data-testid': 'pgn-panel' }, 'PGN Panel') } }))
vi.mock('./GameDatabase', () => ({ default: function() { return React.createElement('div', { 'data-testid': 'game-database' }, 'Game Database') } }))
vi.mock('./PuzzleModal', () => ({ default: function(props) { return React.createElement('div', { 'data-testid': 'puzzle-modal' }, 'Puzzle Modal') } }))
vi.mock('./SettingsModal', () => ({ default: function(props) { return React.createElement('div', { 'data-testid': 'settings-modal' }, 'Settings Modal') } }))
vi.mock('./EvalGraph', () => ({ default: function(props) { return React.createElement('div', { 'data-testid': 'eval-graph' }, 'Eval Graph') } }))
vi.mock('./Board.css', () => ({}))

var Board

describe('Board rendering', () => {
  beforeEach(async () => {
    Board = (await import('./Board')).default
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders without crashing', () => {
    var { container } = render(React.createElement(Board))
    expect(container.querySelector('.lc-board-wrapper')).toBeTruthy()
  })

  it('shows header with logo and engine status', () => {
    render(React.createElement(Board))
    expect(screen.getByText('ShadowChess')).toBeTruthy()
    expect(screen.getByText('Connecting...')).toBeTruthy()
  })

  it('shows player info panels', () => {
    render(React.createElement(Board))
    expect(screen.getByText('Shadow Engine')).toBeTruthy()
    expect(screen.getByText('Computer')).toBeTruthy()
  })

  it('shows control buttons', () => {
    render(React.createElement(Board))
    expect(screen.getByText('New Game')).toBeTruthy()
    expect(screen.getByText('Flip')).toBeTruthy()
    expect(screen.getByText('Puzzles')).toBeTruthy()
    expect(screen.getByText('PGN')).toBeTruthy()
    expect(screen.getByText('Games')).toBeTruthy()
    expect(screen.getByText('Resign')).toBeTruthy()
    expect(screen.getByText('Draw')).toBeTruthy()
    expect(screen.getByText('Undo')).toBeTruthy()
  })

  it('shows gear buttons', () => {
    render(React.createElement(Board))
    expect(screen.getByText('F')).toBeTruthy()    // Copy FEN
    expect(screen.getByText('+F')).toBeTruthy()   // Import FEN
    expect(screen.getByText('⚙')).toBeTruthy()    // Settings
  })

  it('shows empty move list', () => {
    render(React.createElement(Board))
    expect(screen.getByText('No moves yet')).toBeTruthy()
  })

  it('has clock dropdown', () => {
    render(React.createElement(Board))
    expect(screen.getByText('Bullet')).toBeTruthy()
    expect(screen.getByText('Blitz')).toBeTruthy()
    expect(screen.getByText(/ON|OFF/)).toBeTruthy()
  })

  it('shows Play {color} button', () => {
    render(React.createElement(Board))
    var playBtn = screen.getByText(/Play Black|Play White/)
    expect(playBtn).toBeTruthy()
  })

  it('shows Editor toggle button', () => {
    render(React.createElement(Board))
    expect(screen.getByText('Edit')).toBeTruthy()
  })
})

describe('Board modals', () => {
  beforeEach(async () => {
    Board = (await import('./Board')).default
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('opens puzzle modal on Puzzles click', async () => {
    render(React.createElement(Board))
    await userEvent.click(screen.getByText('Puzzles'))
    expect(screen.getByTestId('puzzle-modal')).toBeTruthy()
  })

  it('opens PGN modal on PGN click', async () => {
    render(React.createElement(Board))
    await userEvent.click(screen.getByText('PGN'))
    expect(screen.getByTestId('pgn-panel')).toBeTruthy()
  })

  it('opens Games database on Games click', async () => {
    render(React.createElement(Board))
    await userEvent.click(screen.getByText('Games'))
    expect(screen.getByTestId('game-database')).toBeTruthy()
  })
})

describe('Board conditional rendering', () => {
  beforeEach(async () => {
    Board = (await import('./Board')).default
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('does not render EvalGraph or nav buttons on empty game', () => {
    render(React.createElement(Board))
    expect(screen.queryByTestId('eval-graph')).toBeNull()
    var navBtns = document.querySelectorAll('.lc-nav-btn')
    expect(navBtns.length).toBe(0)
  })

  it('does not render opening explorer without data', () => {
    render(React.createElement(Board))
    expect(screen.queryByText('Opening Explorer')).toBeNull()
    expect(screen.queryByText('Lichess')).toBeNull()
    expect(screen.queryByText('Masters')).toBeNull()
    expect(screen.queryByText('Player')).toBeNull()
  })
})
