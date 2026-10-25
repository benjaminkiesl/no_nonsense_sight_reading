import { RhythmBeatCell } from '../types/rhythm';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Metric Count-In Click:
 * Plays a clean, uniform, professional metronome woodblock tick on every beat.
 */
export function playMetricCountInClick(_beatIndex?: number, _totalBeatsInBar?: number): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Defensively ignore in headless / blocked audio environments
  }
}

/**
 * Rhythm Note Voice:
 * Warm acoustic marimba/rhodes piano tone (C4 = 261.63 Hz, or G4 = 392.00 Hz on the final landing note)
 * sustaining for durationSec so the student hears note holds clearly.
 */
export function playRhythmNoteVoice(durationSec = 0.25, isLanding = false, delaySec = 0): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime + Math.max(0, delaySec);

    const freq = isLanding ? 392.0 : 261.63; // G4 for landing, C4 for phrase notes
    const holdSec = Math.max(0.08, durationSec);

    // Fundamental tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const peakGain = isLanding ? 0.32 : 0.25;
    gain1.gain.setValueAtTime(peakGain, now);
    // Sustain portion
    gain1.gain.setValueAtTime(peakGain * 0.8, now + holdSec * 0.6);
    // Release decay
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + holdSec + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + holdSec + 0.12);

    // Soft 2nd harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.setValueAtTime(peakGain * 0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + holdSec * 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + holdSec * 0.5);
  } catch {
    // Defensively ignore
  }
}

/**
 * Left-Hand Pulse Thump:
 * Deep, soft bass pulse (C2 = 65.41 Hz, 80 ms decay) when tapping Left-Hand Pulse key ('F').
 */
export function playLeftHandPulseThump(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65.41, now);
    osc.frequency.exponentialRampToValueAtTime(45.0, now + 0.08);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Defensively ignore
  }
}

/**
 * Plays the clicked 1-beat cell at bpm followed immediately by a soft downbeat
 * Landing Note on the next beat (obeying the "Closed Gestalt +1 Landing" rule!).
 */
export function playCellPreviewWithLanding(cell: RhythmBeatCell, bpm: number): void {
  try {
    const beatSec = 60 / Math.max(30, bpm);
    let offsetBeats = 0;

    for (const evt of cell.events) {
      if (evt.kind === 'attack') {
        const startSec = offsetBeats * beatSec;
        const durSec = evt.durationBeats * beatSec;
        playRhythmNoteVoice(durSec, false, startSec);
      }
      offsetBeats += evt.durationBeats;
    }

    // Schedule landing note at beat offset 1.0 (on the next downbeat)
    playRhythmNoteVoice(0.35, true, beatSec);
  } catch {
    // Defensively ignore
  }
}
