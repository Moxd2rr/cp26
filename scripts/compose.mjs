#!/usr/bin/env node
// Compose et rend une musique de fond originale (libre de droits) : piano feutré + nappe douce, sans percussions.
//   node scripts/compose.mjs content/music/douceur.mp3
// Synthèse additive en JavaScript, réverbération « Freeverb », encodage MP3 via ffmpeg.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'

const OUT = process.argv[2] ?? 'content/music/douceur.mp3'
const SR = 44100
const BPM = 64
const BEAT = 60 / BPM
const BAR = BEAT * 4
const T = 3 // transposition : mi bémol majeur, plus chaud
const hz = (m) => 440 * 2 ** ((m + T - 69) / 12)

// Grille d'accords (MIDI, basse + voix)
const CHORDS = [
  { bass: 41, v: [57, 60, 64, 67] }, // Fmaj9
  { bass: 40, v: [55, 59, 62, 64] }, // Em7
  { bass: 38, v: [53, 57, 60, 64] }, // Dm9
  { bass: 36, v: [52, 55, 62, 64] }, // Cadd9
  { bass: 33, v: [55, 59, 60, 64] }, // Am9
  { bass: 41, v: [57, 60, 64, 69] }, // Fmaj7
  { bass: 43, v: [53, 60, 62, 67] }, // Gsus4
  { bass: 36, v: [52, 59, 62, 67] }, // Cmaj9
]
// Mélodie (temps de départ en temps, durée en temps, note) — une phrase par accord
const MELODY = [
  [[0, 2, 76], [2, 2, 72]],
  [[0, 3, 74], [3, 1, 71]],
  [[0, 2, 72], [2, 1, 69], [3, 1, 72]],
  [[0, 4, 67]],
  [[0, 2, 76], [2, 1, 74], [3, 1, 72]],
  [[0, 2, 69], [2, 2, 72]],
  [[0, 3, 74], [3, 1, 72]],
  [[0, 4, 71]],
]

const SECTIONS = ['intro', 'arpeges', 'melodie', 'melodie2', 'calme']
const totalBars = SECTIONS.length * 8 + 2
const N = Math.ceil((totalBars * BAR + 8) * SR)
const L = new Float32Array(N)
const R = new Float32Array(N)

let seed = 26
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

/** Note de piano feutré : partiels légèrement inharmoniques, aigus qui s'éteignent plus vite. */
function piano(t0, m, vel, dur, pan = 0) {
  const f = hz(m)
  const amps = [1, 0.38, 0.14, 0.07, 0.035, 0.018]
  const base = Math.min(4.5, Math.max(1.4, 3.4 * (261 / f) ** 0.45))
  const len = Math.min(dur + 0.6, base * 2.2)
  const start = Math.floor(t0 * SR)
  const n = Math.floor(len * SR)
  const gl = Math.cos(((pan + 1) * Math.PI) / 4)
  const gr = Math.sin(((pan + 1) * Math.PI) / 4)
  for (const det of [-1.2, 1.2]) {
    for (let k = 1; k <= amps.length; k++) {
      const fk = k * f * Math.sqrt(1 + 0.00018 * k * k) * 2 ** (det / 1200)
      if (fk > 9000) break
      const a = amps[k - 1] * vel ** (1 + (k - 1) * 0.6) * 0.5
      const tau = base / (1 + 0.75 * (k - 1))
      const w = (2 * Math.PI * fk) / SR
      const ph = rnd() * 6.28
      for (let i = 0; i < n; i++) {
        const t = i / SR
        let env = Math.exp(-t / tau) * Math.min(1, t / 0.006)
        if (t > dur) env *= Math.exp(-(t - dur) / 0.35)
        const s = a * env * Math.sin(w * i + ph)
        const j = start + i
        if (j >= N) break
        L[j] += s * gl * (det < 0 ? 1.1 : 0.9)
        R[j] += s * gr * (det < 0 ? 0.9 : 1.1)
      }
    }
  }
}

/** Nappe : sinus désaccordés, attaque et relâchement très lents. */
function pad(t0, m, dur, amp) {
  const f = hz(m)
  const start = Math.floor(t0 * SR)
  const att = 1.8
  const rel = 2.6
  const n = Math.floor((dur + rel) * SR)
  for (const [mul, det, a, side] of [
    [1, -5, 1, -0.6],
    [1, 5, 1, 0.6],
    [1, 0, 0.8, 0],
    [2, 3, 0.12, 0.3],
  ]) {
    const w = (2 * Math.PI * f * mul * 2 ** (det / 1200)) / SR
    const ph = rnd() * 6.28
    const gl = Math.cos(((side + 1) * Math.PI) / 4)
    const gr = Math.sin(((side + 1) * Math.PI) / 4)
    for (let i = 0; i < n; i++) {
      const t = i / SR
      let env = t < att ? 0.5 - 0.5 * Math.cos((Math.PI * t) / att) : 1
      if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel) ** 2
      const s = amp * a * env * Math.sin(w * i + ph) * (1 + 0.04 * Math.sin((2 * Math.PI * 0.11 * t)))
      const j = start + i
      if (j >= N) break
      L[j] += s * gl
      R[j] += s * gr
    }
  }
}

function bass(t0, m, dur) {
  const f = hz(m)
  const start = Math.floor(t0 * SR)
  const n = Math.floor((dur + 1.2) * SR)
  const w = (2 * Math.PI * f) / SR
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let env = Math.min(1, t / 0.04) * Math.exp(-t / 3.2)
    if (t > dur) env *= Math.exp(-(t - dur) / 0.4)
    const s = 0.055 * env * (Math.sin(w * i) + 0.25 * Math.sin(2 * w * i))
    const j = start + i
    if (j >= N) break
    L[j] += s
    R[j] += s
  }
}

const human = () => (rnd() - 0.5) * 0.03

// ───── Écriture ─────
let bar = 0
for (const section of SECTIONS) {
  for (let b = 0; b < 8; b++, bar++) {
    const t = 1 + bar * BAR
    const ch = CHORDS[b]
    const soft = section === 'intro' || section === 'calme'
    for (const m of ch.v) pad(t, m, BAR, soft ? 0.03 : 0.026)
    if (section !== 'intro' || b >= 2) bass(t, ch.bass, BAR * 0.95)
    if (section === 'intro') {
      // quelques notes isolées, très haut et très doux
      if (b % 2 === 1) piano(t + BEAT * 2 + human(), ch.v[3] + 12, 0.32, BEAT * 2, 0.4)
    } else {
      // arpège brisé, aéré
      const pattern = section === 'calme' ? [[0, 0], [2.5, 2]] : [[0, 0], [1.5, 2], [2.5, 3], [3.5, 1]]
      for (const [beat, vi] of pattern) {
        const m = ch.v[vi] + (vi >= 2 ? 0 : 12)
        piano(t + beat * BEAT + human(), m, 0.34 + rnd() * 0.08, BEAT * 1.5, vi % 2 ? 0.35 : -0.35)
      }
      if (section === 'melodie' || section === 'melodie2') {
        for (const [st, d, m] of MELODY[b]) {
          const lift = section === 'melodie2' && d >= 2 ? 0.05 : 0
          piano(t + st * BEAT + human(), m, 0.5 + lift + rnd() * 0.06, d * BEAT * 0.95, 0.05)
        }
      }
    }
  }
}
// Accord final, laissé sonner
const tEnd = 1 + bar * BAR
for (const m of [36, 52, 59, 62, 67]) piano(tEnd + human() * 3, m + (m < 50 ? 12 : 0), 0.4, BAR * 2, (m % 3) * 0.2 - 0.2)
for (const m of [52, 59, 62, 67]) pad(tEnd, m, BAR * 1.5, 0.026)
bass(tEnd, 36, BAR * 1.5)

// ───── Réverbération (Freeverb) ─────
function freeverb(input, spread) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => ({ buf: new Float32Array(n + spread), i: 0, store: 0 }))
  const aps = [556, 441, 341, 225].map((n) => ({ buf: new Float32Array(n + spread), i: 0 }))
  const fb = 0.86 * 0.28 + 0.7
  const damp = 0.5 * 0.4
  const out = new Float32Array(input.length)
  for (let n = 0; n < input.length; n++) {
    const x = input[n] * 0.015
    let acc = 0
    for (const c of combs) {
      const y = c.buf[c.i]
      c.store = y * (1 - damp) + c.store * damp
      c.buf[c.i] = x + c.store * fb
      if (++c.i >= c.buf.length) c.i = 0
      acc += y
    }
    for (const a of aps) {
      const b = a.buf[a.i]
      a.buf[a.i] = acc + b * 0.5
      acc = b - acc
      if (++a.i >= a.buf.length) a.i = 0
    }
    out[n] = acc
  }
  return out
}
const wetL = freeverb(L, 0)
const wetR = freeverb(R, 23)

// ───── Mixage, fondus, normalisation douce ─────
let peak = 0
const mixL = new Float32Array(N)
const mixR = new Float32Array(N)
for (let i = 0; i < N; i++) {
  mixL[i] = L[i] * 0.8 + wetL[i] * 2.2
  mixR[i] = R[i] * 0.8 + wetR[i] * 2.2
  peak = Math.max(peak, Math.abs(mixL[i]), Math.abs(mixR[i]))
}
const gain = 0.7 / peak
const fadeIn = 2.5 * SR
const fadeOut = 6 * SR
const pcm = Buffer.alloc(N * 4)
for (let i = 0; i < N; i++) {
  let g = gain
  if (i < fadeIn) g *= i / fadeIn
  if (i > N - fadeOut) g *= (N - i) / fadeOut
  const l = Math.tanh(mixL[i] * g * 1.1) / 1.1
  const r = Math.tanh(mixR[i] * g * 1.1) / 1.1
  pcm.writeInt16LE(Math.round(l * 32767), i * 4)
  pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2)
}

const wav = path.join(os.tmpdir(), `cp26-${process.pid}.wav`)
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(SR, 24)
header.writeUInt32LE(SR * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)
fs.writeFileSync(wav, Buffer.concat([header, pcm]))
fs.mkdirSync(path.dirname(OUT), { recursive: true })
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=50,lowpass=f=9500,loudnorm=I=-20:TP=-3', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', OUT])
fs.rmSync(wav)
console.log(`✦ ${OUT} — ${(N / SR).toFixed(0)} s`)
