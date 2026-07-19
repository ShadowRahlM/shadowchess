import '@testing-library/jest-dom'

class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen({ target: this })
    }, 0)
  }
  send(data) { /* noop */ }
  close() {
    this.readyState = 3
    if (this.onclose) this.onclose({ target: this })
  }
  addEventListener(e, cb) { this['on' + e] = cb }
}

class MockAudioContext {
  constructor() { this.state = 'running' }
  createGain() { return { connect: () => {}, gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } } }
  createBufferSource() { return { connect: () => {}, start: () => {}, stop: () => {}, buffer: null } }
  decodeAudioData(d, cb) { if (cb) cb(null); return Promise.resolve(null) }
  close() {}
  resume() { return Promise.resolve() }
}

class MockAudio {
  constructor() { this.volume = 1; this.loop = false }
  play() { return Promise.resolve() }
  pause() {}
  load() {}
  addEventListener() {}
  removeEventListener() {}
}

globalThis.WebSocket = MockWebSocket
globalThis.AudioContext = MockAudioContext
globalThis.webkitAudioContext = MockAudioContext
globalThis.Audio = MockAudio

Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost' },
  writable: true
})
