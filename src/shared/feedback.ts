// all app sounds, synthesized via Web Audio, no audio files
// review them in dev mode: /timer/review-audio.html

import { onScopeDispose } from "vue"

let audioCtx: AudioContext | undefined

// at: start delay in s
export type Sound = (at?: number) => void

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

// oscillators of the sound being scheduled for the background, see scheduleUpcoming
let collect: OscillatorNode[] | undefined

// single tone with exponential decay
/* c8 ignore next 15 */
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
  collect?.push(osc)
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
  beep: (at = 0) => tone(880, 150, { at }),
  tick: (at = 0) => tone(1500, 40, { type: "square", at }),
  // boxing: round starts
  ding: (at = 0) => strike(RING, at),
  // alarm: timer ended
  bell: (at = 0) => strike(880, at),
  // end of workout: bell twice
  finish: (at = 0) => {
    strike(880, at)
    strike(880, at + 0.3)
  },
} satisfies Record<string, Sound>

export function playSound(sound: Sound = SOUNDS.bell, vibrate = true) {
  sound()
  if (vibrate && "vibrate" in navigator) navigator.vibrate([200, 100, 200])
}

export function vibrateShort() {
  if ("vibrate" in navigator) navigator.vibrate(30)
}

// Background: setInterval ticks get throttled / frozen, so on hide the upcoming sounds are
// scheduled on the audio clock. Android keeps it running; iOS suspends it -> silence.
// Events due while hidden are never rung late by the ticks on return.
// ponytail: audio clock drifts from wall clock (~ms/h), fine for timers up to hours

export interface Upcoming {
  ts: number // epoch ms
  sound: Sound
}

const providers = new Set<() => Upcoming[]>()
// wall clock span the page was hidden
let hidden: { from: number; to?: number } | undefined
let pending: Array<{ t0: number; nodes: OscillatorNode[] }> = []

export function useBackgroundSounds(upcoming: () => Upcoming[]) {
  providers.add(upcoming)
  onScopeDispose(() => providers.delete(upcoming))
}

function scheduleUpcoming(ctx: AudioContext, wall: number) {
  for (const upcoming of providers) {
    for (const { ts, sound } of upcoming()) {
      const at = (ts - wall) / 1000
      if (at <= 0) continue
      collect = []
      sound(at)
      pending.push({ t0: ctx.currentTime + at, nodes: collect })
    }
  }
  collect = undefined
}

// back in front: ticks take over; drop what did not play (iOS: audio clock was suspended)
function cancelUpcoming(ctx: AudioContext) {
  for (const { t0, nodes } of pending) {
    if (t0 > ctx.currentTime) for (const osc of nodes) osc.disconnect()
  }
  pending = []
}

// registered on visibilitychange in main.ts
export function onVisibilityChange() {
  if (document.hidden) {
    hidden = { from: Date.now() }
    if (audioCtx?.state === "running") scheduleUpcoming(audioCtx, hidden.from)
    return
  }
  if (hidden != null) hidden.to = Date.now()
  if (audioCtx != null) cancelUpcoming(audioCtx)
}

// event due at (epoch ms) fell into the hidden time: played by the schedule or missed, tick skips it
export function dueInBackground(due: number) {
  return hidden != null && due > hidden.from && due <= (hidden.to ?? Number.POSITIVE_INFINITY)
}
/* c8 ignore stop */
