// all app sounds, synthesized via Web Audio, no audio files
// review them in dev mode: /timer/review-audio.html

let audioCtx: AudioContext | undefined

// browsers (iOS) only allow audio after a user gesture: registered on pointerdown/keydown in main.ts
/* c8 ignore next 4 */
export function unlockAudio() {
  if (!("AudioContext" in globalThis)) return
  audioCtx ??= new AudioContext()
  audioCtx.resume().catch(() => undefined)
}

interface ToneOptions {
  type?: OscillatorType
  at?: number // start delay in s
  vol?: number // 0..1
}

// single tone with exponential decay
/* c8 ignore next 14 */
function tone(freq: number, ms: number, { type = "sine", at = 0, vol = 0.5 }: ToneOptions = {}) {
  if (audioCtx == null) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  const t0 = audioCtx.currentTime + at
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + ms / 1000)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start(t0)
  osc.stop(t0 + ms / 1000)
}

/* c8 ignore start */
// struck bell: sine partials of a real bell (inharmonic ratios), higher ones fade faster
// each partial doubled slightly detuned -> metallic shimmer; ratio 8.9 = short hammer click
function strike(freq: number, at = 0, vol = 1) {
  const partials = [
    [1, 0.15, 3000],
    [2, 0.08, 2200],
    [2.76, 0.06, 1800],
    [3.9, 0.04, 1200],
    [5.4, 0.03, 800],
    [8.9, 0.04, 120],
  ] as const
  for (const [ratio, v, ms] of partials) {
    for (const detune of [1, 1.002]) tone(freq * ratio * detune, ms, { at, vol: v * vol })
  }
}

// boxing ring bell pitch
const RING = 1000

export const SOUNDS = {
  beep: () => tone(880, 150),
  tick: () => tone(1500, 40, { type: "square" }),
  // boxing: round starts
  ding: () => strike(RING),
  // alarm: timer ended
  bell: () => strike(880),
  // end of workout: bell twice
  finish: () => {
    strike(880)
    strike(880, 0.3)
  },
}

export function playSound(sound = SOUNDS.bell) {
  sound()
  if ("vibrate" in navigator) navigator.vibrate([200, 100, 200])
}

export function vibrateShort() {
  if ("vibrate" in navigator) navigator.vibrate(30)
}
/* c8 ignore stop */
