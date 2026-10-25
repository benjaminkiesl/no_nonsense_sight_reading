# Implementation-Ready Specification: No-Nonsense Rhythm Training Module

## 1. Architectural Overview & Core Principles

This specification defines the implementation of the **No-Nonsense Rhythm Training Module** on branch `feature/rhythm-module`, grounded in our pedagogical and corpus research ([`docs/rhythm_reading_pedagogy_and_design.md`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/docs/rhythm_reading_pedagogy_and_design.md) and [`docs/piano_rhythm_corpus_analysis.md`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/docs/piano_rhythm_corpus_analysis.md)):

1. **Decoupled Data-Driven Curriculum (`src/rhythm/curriculum.ts`)**:
   - The rhythm engine and UI consume a clean, standalone `RhythmLevelSpec[]` dataset so the curriculum can be updated or expanded independently of the engine.
   - Ordered by **empirical Pareto/Zipf popularity** from our piano corpus (covering `P80` to `P95` of real piano music).
2. **The "Closed Gestalt (+1 Landing)" Rule**:
   - Every rhythmic exercise—whether a short 1-bar introductory word or a 4-bar repertoire phrase—ends on a **final downbeat Landing Note** (e.g., `♩` on Beat 1 of the following bar) so anacrustic patterns (`♩. ♪`, `♪. ♬`, `♪ ♬`, `𝄾 ♪`) are never amputated mid-air and the inter-onset interval of the penultimate note is acoustically closed.
3. **The 3-Phase "Internalize → Verify" Loop (`SANDBOX` $\rightarrow$ `COUNT_IN` $\rightarrow$ `PERFORM` $\rightarrow$ `FEEDBACK`)**:
   - **Phase 1 (`SANDBOX`)**: Zero metronome click. The user inspects the notation (grouped into 1-beat visual "words"), freely taps/plays the rhythm at their own pace (`Space`/`J` or any MIDI key, plus optional Left-Hand Pulse key `F`), or clicks any 1-beat cell to hear its acoustic gesture + landing.
   - **Phase 2A (`COUNT_IN`)**: Triggered by pressing `Enter` or clicking `"Count-In & Play"`. Plays 1 bar of metrically weighted count-in clicks (*Beat 1 Schwer* downbeat gravity $\rightarrow$ *Final Beat Auftakt* lift).
   - **Phase 2B (`PERFORM`)**: The external metronome **drops out** (or optionally ticks only on Bar downbeats in beginner anchor mode) while the user performs the internalized phrase from their own internal clock. Both **note onset (`keydown`)** and **note hold duration (`keyup`)** are recorded.
   - **Phase 3 (`FEEDBACK`)**: Evaluates **Local Groove Accuracy (%)** (relative IOI proportions against the user's local pulse), **Hold/Articulation Accuracy (%)** (distinguishing held quarter/half/syncopated notes from rests), and **Internal Pulse Drift (%)**.
4. **Interactive `2× Metric Zoom` (Scale Invariance Bridge)**:
   - Pairs 1-beat sixteenth patterns (`♪. ♬ → ♩`, `♪ ♬ → ♩`, `♬ ♪ ♬ → ♩` at $1\times$ tempo) with their acoustically identical 2-beat eighth-level twins (`♩. ♪ → 𝅗𝅥`, `♩ ♫ → 𝅗𝅥`, `♪ ♩ ♪ → 𝅗𝅥` at $2\times$ tempo) so the user can toggle between them and see/hear that they are the exact same physical groove at two metric zoom levels.

---

## 2. File-by-File Implementation Plan

### 2.1 `src/types/rhythm.ts` (New File)

Define clean, strongly typed interfaces for the rhythm domain:

```ts
export type TimeSignatureStr = '4/4' | '3/4' | '2/4' | '2/2' | '6/8';

export type RhythmEventKind = 'note' | 'rest';

export interface RhythmSubEvent {
  /** Offset from the start of the beat cell, in beats (e.g. 0, 0.25, 0.5, 0.75) */
  readonly offsetBeats: number;
  /** Duration in beats (e.g. 1.0 = quarter, 0.5 = eighth, 0.25 = sixteenth, 1.5 = dotted quarter) */
  readonly durationBeats: number;
  readonly kind: RhythmEventKind;
  /** Whether this note is tied from the previous event */
  readonly tiedFromPrev?: boolean;
}

export interface RhythmBeatCell {
  readonly cellId: string;       // e.g. 'q', 'e2', 's4', 'dot8_s', 'gallop', 'upbeat_e', 'rest_q', 'sync_16_8_16', 'triplet_e'
  readonly label: string;        // e.g. 'Quarter (♩)', 'Dotted 8th + 16th (♪. ♬)'
  readonly symbol: string;       // Compact visual symbol e.g. '♩', '♫', '♬♬', '♪. ♬', '♪ ♬', '𝄾 ♪'
  readonly events: readonly RhythmSubEvent[];
}

export interface RhythmPhrase {
  readonly id: string;
  readonly title: string;
  readonly sourceComposer?: string; // e.g. 'W.A. Mozart — Sonata K. 279'
  readonly timeSignature: TimeSignatureStr;
  readonly beatsPerBar: number;     // e.g. 4 for 4/4, 3 for 3/4, 2 for 2/4
  readonly targetBpm: number;       // Default tempo e.g. 76
  /** Sequence of 1-beat cells across the bars, PLUS the final landing beat cell */
  readonly beatCells: readonly RhythmBeatCell[];
  /** Optional ID of the 2x Metric Zoom twin phrase (same physical timing, 2x note durations & 2x BPM) */
  readonly zoomTwinPhraseId?: string;
  readonly zoomScaleLabel?: '1x (Sixteenth Level)' | '2x (Eighth Level)';
}

export type RhythmExercisePhase = 'SANDBOX' | 'COUNT_IN' | 'PERFORM' | 'FEEDBACK';

export type PulseAutonomyMode = 'SILENT_CONTINUATION' | 'BAR_DOWNBEAT_ANCHOR';

export interface FlattenedRhythmNote {
  readonly index: number;
  readonly beatIndex: number;
  readonly startBeat: number;     // Global beat offset from phrase start (0.0, 0.5, 1.0, ...)
  readonly durationBeats: number; // Written duration including any tied continuations
  readonly isLandingNote: boolean;
}

export interface RecordedTap {
  readonly pressTimeMs: number;
  releaseTimeMs: number | null;
}

export interface NoteEvaluation {
  readonly noteIndex: number;
  readonly expectedStartBeat: number;
  readonly expectedDurationBeats: number;
  /** Relative onset error as a fraction of local beat period (-0.05 = 5% early) */
  readonly relativeOnsetError: number;
  /** Ratio of actual hold duration to expected duration (1.0 = full hold) */
  readonly holdRatio: number;
  readonly status: 'perfect' | 'loose' | 'missed';
}

export interface RhythmFeedbackSummary {
  readonly grooveScorePct: number;       // 0..100 based on relative IOI accuracy
  readonly holdScorePct: number;         // 0..100 based on holding sustained/syncopated notes vs rests
  readonly overallScorePct: number;      // Weighted 80% groove + 20% hold
  readonly pulseDriftPct: number;        // e.g. +3.2% (rushed) or -2.1% (dragged)
  readonly estimatedUserBpm: number;
  readonly noteEvaluations: readonly NoteEvaluation[];
  readonly passed: boolean;              // true if overallScorePct >= 80
}

export interface RhythmLevelSpec {
  readonly id: string;
  readonly tier: number;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly featuredCellSymbols: readonly string[];
  readonly phrases: readonly RhythmPhrase[];
}

export interface RhythmEngineSnapshot {
  readonly levelId: string;
  readonly phrase: RhythmPhrase;
  readonly phase: RhythmExercisePhase;
  readonly pulseMode: PulseAutonomyMode;
  readonly countInBeatIndex: number;     // 0..beatsPerBar-1 during COUNT_IN
  readonly flattenedNotes: readonly FlattenedRhythmNote[];
  readonly sandboxMatchedCount: number;  // Progress in SANDBOX self-paced tapping
  readonly performTapCount: number;      // Number of notes tapped so far in PERFORM
  readonly activeHoldNoteIndex: number | null;
  readonly leftHandPulseCount: number;   // Count of self-generated LH pulse taps ('F' key)
  readonly showWordBoxes: boolean;
  readonly feedback: RhythmFeedbackSummary | null;
}
```

---

### 2.2 `src/rhythm/curriculum.ts` (New File)

Build the initial corpus-backed **6-Tier Rhythm Curriculum** containing the core 1-beat cells (`CELL_LIBRARY`) and a rich set of **Gesture + Landing capsules** and **4-Bar Authentic Repertoire Sentences** (from Bach, Mozart, Beethoven, Chopin, Joplin):

1. **`CELL_LIBRARY`**:
   - `q`: Quarter note `♩` (`[{ offsetBeats: 0, durationBeats: 1, kind: 'note' }]`)
   - `rest_q`: Quarter rest `𝄽` (`[{ offsetBeats: 0, durationBeats: 1, kind: 'rest' }]`)
   - `hold_q`: Tied quarter hold (`[{ offsetBeats: 0, durationBeats: 1, kind: 'note', tiedFromPrev: true }]`)
   - `e2`: Two eighths `♫` (`0.5 + 0.5`)
   - `upbeat_e`: Eighth rest + eighth `𝄾 ♪` (`0.5 rest + 0.5 note`)
   - `tie_e_note_e`: Tied eighth + new eighth (`0.5 tiedFromPrev + 0.5 note` — forms `♩. ♪` when placed after `q`, or `♪ ♩ ♪` syncopation when placed after `e2`!)
   - `s4`: Four sixteenths `♬♬` (`0.25 × 4`)
   - `gallop`: Eighth + two sixteenths `♪ ♬` (`0.5, 0.25, 0.25`)
   - `rev_gallop`: Two sixteenths + eighth `♬ ♪` (`0.25, 0.25, 0.5`)
   - `dot8_s`: Dotted eighth + sixteenth `♪. ♬` (`0.75, 0.25`)
   - `scotch_snap`: Sixteenth + dotted eighth `♬ ♪.` (`0.25, 0.75`)
   - `sync_16_8_16`: Intra-beat syncopation `♬ ♪ ♬` (`0.25, 0.5, 0.25`)
   - `pickup_3s`: Sixteenth rest + three sixteenths `𝄿 ♬♪` (`0.25 rest, 0.25, 0.25, 0.25`)
   - `rest8_2s`: Eighth rest + two sixteenths `𝄾 ♬` (`0.5 rest, 0.25, 0.25`)
   - `triplet_e`: Eighth triplet `3♫♪` (`0, 1/3, 2/3`)
2. **Helper `flattenPhraseToNotes(phrase: RhythmPhrase): FlattenedRhythmNote[]`**:
   - Iterates through `phrase.beatCells`, merging any `tiedFromPrev: true` event onto the preceding note's `durationBeats` so that `♩. ♪` (`q` + `tie_e_note_e`) produces a single note of duration `1.5` beats followed by an eighth note of duration `0.5` beats at `startBeat: 1.5`!
   - Marks the final note of the phrase with `isLandingNote: true`.
3. **6 Tiers in `RHYTHM_LEVELS`** (covering `P50` $\rightarrow$ `P95` of the piano corpus):
   - **Tier 1 (`rhythm-1`): Pulse, Stride & Space (`♩`, `♫`, `𝅗𝅥`, `𝄽`)** — Covers 62% of corpus beats. Includes 1-bar+landing capsules and 4-bar Mozart/Beethoven phrases.
   - **Tier 2 (`rhythm-2`): The Upbeat & Dotted Walk (`♩. ♪ → ♩`, `𝄾 ♪ → ♫`)** — Teaches anacrusis $\rightarrow$ crusis landing across beats, including Mozart Sonata K. 279 (mm. 26–29) and Bach Fugue in D♯ minor.
   - **Tier 3 (`rhythm-3`): Classic Syncopation & Ties (`♪ ♩ ♪ → ♩`)** — Holding across the silent downbeat while feeling the pulse in your body/left hand.
   - **Tier 4 (`rhythm-4`): Sixteenth Words & 2× Metric Zoom (`♬♬`, `♪ ♬`, `♬ ♪`, `𝄿 ♬♪`)** — Pairs `♩ ♫ → 𝅗𝅥` (at 136 BPM) with its `2× Metric Zoom` twin `♪ ♬ → ♩` (at 68 BPM), plus Bach C-minor Fugue (BWV 847) and Mozart K. 279 (mm. 4–7).
   - **Tier 5 (`rhythm-5`): Dotted Sixteenth Snaps & Funk Cells (`♪. ♬ → ♩`, `♬ ♪ ♬`)** — Pairs `♩. ♪ → 𝅗𝅥` (at 132 BPM) with `♪. ♬ → ♩` (at 66 BPM), Chopin "Raindrop" Prelude Op. 28 No. 15 (mm. 5–8), and Joplin *The Easy Winners*.
   - **Tier 6 (`rhythm-6`): Triplet Flow & Two-Hand Groove (`3♫♪`, Beethoven/Chopin Triplets)**.

---

### 2.3 `src/rhythm/engine.ts` (New File)

Implement `RhythmEngine` managing the state machine and the **Two-Layer Relative-IOI ("Groove") + Hold Duration + Drift** grading algorithm:

1. **State Machine**:
   - Starts in `phase = 'SANDBOX'`.
   - **In `SANDBOX`**:
     - `handleNotePress(nowMs)` & `handleNoteRelease(nowMs)` allow self-paced tapping. Each press advances `sandboxMatchedCount` (wrapping around to `0` after reaching `flattenedNotes.length`, so the user can freely play the phrase as many times as they like!).
     - `handleLeftHandPulse(nowMs)` increments `leftHandPulseCount` so the user can practice tapping a steady Left-Hand pulse (`F` key) against Right-Hand rhythm (`J` / `Space` key).
   - **Transition to `COUNT_IN`**:
     - `startCountIn(nowMs)` sets `phase = 'COUNT_IN'`, records `countInStartMs = nowMs`, and schedules `beatsPerBar` count-in beats at `beatPeriodMs = 60000 / phrase.targetBpm`.
   - **Transition to `PERFORM`**:
     - When `nowMs - countInStartMs >= beatsPerBar * beatPeriodMs`, transitions to `phase = 'PERFORM'`, with `performStartMs = countInStartMs + beatsPerBar * beatPeriodMs` (exact Beat 1 downbeat timestamp!).
     - As the user presses and releases keys in `PERFORM`, records `RecordedTap { pressTimeMs, releaseTimeMs }`.
     - Automatically completes `PERFORM` and transitions to `FEEDBACK` either:
       - Shortly after the final note is released (or `350 ms` after the final note is pressed if `flattenedNotes.length` taps have been recorded), OR
       - If the user's time exceeds `(totalPhraseBeats + 2.0) * beatPeriodMs` (timeout completion).
2. **Relative-IOI ("Groove") + Hold Duration Grading (`evaluatePerformance()`)**:
   - Let $N$ be `flattenedNotes.length`.
   - **Local Beat Period Estimation**:
     - If the user tapped at least 2 notes, estimate the user's mean beat period $\hat{T}_{\text{user}}$ via linear regression (or total span $\frac{t_{\text{press}}(N-1) - t_{\text{press}}(0)}{b_{N-1} - b_0}$), clamped within $[0.5 \cdot T_{\text{target}}, 2.0 \cdot T_{\text{target}}]$.
   - **Relative Inter-Onset Interval (IOI) Accuracy**:
     - For each note $i$, compute its expected onset time on the user's best-fit local grid (or pairwise inter-onset ratio $\frac{\Delta t_i}{\hat{T}_{\text{local}}} - \Delta b_i$).
     - `relativeOnsetError`:
       - Within $\pm 0.085$ ($\pm 8.5\%$ of a beat): `'perfect'` ($100\%$ note groove score).
       - Within $\pm 0.16$ ($\pm 16\%$ of a beat): `'loose'` ($60\%$–$90\%$ linear interpolation).
       - Beyond $\pm 0.16$ or missing tap: `'missed'` ($0\%$–$30\%$).
   - **Hold / Gate Articulation Score (`holdRatio`)**:
     - For each note $i$ (except the final landing note, which only needs a clean attack):
       - Expected hold duration in ms is $D_i = d_i \cdot \hat{T}_{\text{user}}$.
       - Actual hold duration is $H_i = t_{\text{release}}(i) - t_{\text{press}}(i)$.
       - If the note is followed by a rest (or is a long note $d_i \ge 1.0$, such as the quarter in `♪ ♩ ♪`), check whether the user held it for a reasonable duty cycle ($H_i / D_i \in [0.40, 1.35]$) rather than playing a tiny $<80\text{ ms}$ staccato poke on a sustained syncopation or holding straight through a rest!
   - **Macro-Pulse Drift (%)**:
     - $\text{PulseDriftPct} = \frac{\text{EstimatedUserBpm} - \text{TargetBpm}}{\text{TargetBpm}} \times 100\%$.

---

### 2.4 `src/audio/rhythmAudio.ts` (New File)

Zero-dependency Web Audio synthesizer for the Rhythm Module (defensively guarded for `jsdom`):
1. `playMetricCountInClick(beatIndex: number, totalBeatsInBar: number): void`
   - **Beat 0 (Beat 1 — *Schwer* / Downbeat Gravity)**: Warm woody rim/block at `320 Hz` + body resonance at `160 Hz` (`90 ms` decay, gain `0.28`).
   - **Middle Beats (*Leicht*)**: Crisp light clave tick at `640 Hz` (`45 ms` decay, gain `0.14`).
   - **Final Beat (*Auftakt* / Lift)**: Slightly brighter upward-inflected tick at `760 Hz` (`55 ms` decay, gain `0.18`).
2. `playRhythmNoteVoice(durationSec?: number, isLanding?: boolean): void`
   - Warm acoustic marimba/rhodes piano tone (`C4 = 261.63 Hz`, or `G4 = 392.00 Hz` on the final landing note) that sustains for `durationSec` so the user *hears* the difference between a short eighth and a held syncopated quarter!
3. `playLeftHandPulseThump(): void`
   - Deep, soft bass pulse (`C2 = 65.41 Hz`, `80 ms` decay) when the user taps the Left-Hand Pulse key (`F`).
4. `playCellPreviewWithLanding(cell: RhythmBeatCell, bpm: number): void`
   - Plays the clicked 1-beat cell at `bpm` **followed immediately by a soft downbeat Landing Note on the next beat** (obeying the "Closed Gestalt +1 Landing" rule!).

---

### 2.5 `src/components/RhythmArena.tsx` (New File) & `src/styles/app.css`

Create a clean, minimalist Rhythm Practice Arena that matches our warm ivory & emerald aesthetic:
1. **Top Toolbar**:
   - **Tier / Level Selector** dropdown (`Tier 1` .. `Tier 6`) + **Phrase Selector** (`Phrase 1 of N`, with composer attribution badge e.g. `"W.A. Mozart — Sonata K. 279"`).
   - **`[2× Metric Zoom]` Button** (rendered whenever `phrase.zoomTwinPhraseId` is defined, e.g., morphing `♩. ♪ → 𝅗𝅥 @ 132 BPM` $\leftrightarrow$ `♪. ♬ → ♩ @ 66 BPM` with one click!).
   - **`[Word Boxes: On/Off]`** toggle & **`[Pulse: Silent / Bar-1 Anchor]`** toggle.
2. **SVG Rhythm Notation Score (`viewBox="0 0 840 220"`)**:
   - Renders clean standard rhythmic engraving: time signature (`4/4`, `3/4`, `2/4`, `2/2`), barlines, double barline after the **"+1 Landing Beat"**, noteheads, stems, **authentic beat-grouped primary and secondary beams** (`♫`, `♬♬`, `♪ ♬`, `♬ ♪`, `♪. ♬` with stub beam, `♬ ♪ ♬`), augmentation dots, ties across beat boundaries, and rests (`𝄽`, `𝄾`, `𝄿`).
   - **1-Beat Word Boxes**: Subtle rounded pill boxes underneath each beat cell (`Click any beat box in Sandbox to hear its groove + landing`).
   - **No Chasing Cursor during `PERFORM`**: During performance, the score remains calm and static so the user's Eye-Hand Span reads ahead naturally.
   - **Feedback Overlay on Notes**: In `FEEDBACK` phase, colors each notehead (`emerald` = locked-in groove, `amber` = slightly loose, `coral` = missed/wrong hold) and shows subtle onset tick marks.
3. **Interactive Control & Status Bar**:
   - In **`SANDBOX`**:
     - Displays: *"Sandbox (No Metronome) — Internalize the pattern at your own pace (`Space`/`J` or MIDI to play, `F` for Left-Hand Pulse, or click any beat word to hear it)."*
     - Primary CTA button (`data-testid="rhythm-start-perform-btn"`): **`"Count-In & Play (Enter) →"`**.
   - In **`COUNT_IN`**:
     - Displays visual metric gravity indicator (`Beat 1 [Heavy] • Beat 2 • Beat 3 • Beat 4 [Lift]`).
   - In **`PERFORM`**:
     - Displays calm prompt: *"Internal Pulse Active — Play the phrase (`Space` / `J` / MIDI)"*.
   - In **`FEEDBACK`**:
     - Displays three concise metrics:
       - **Groove Shape**: `{grooveScorePct}%`
       - **Note Hold / Articulation**: `{holdScorePct}%`
       - **Internal Clock**: `{estimatedUserBpm} BPM` (`{pulseDriftPct >= 0 ? '+' : ''}{pulseDriftPct}% drift`)
     - Action buttons: **`"← Sandbox (R)"`** and **`"Next Phrase (Enter) →"`**.

---

### 2.6 `src/components/Header.tsx` & `src/App.tsx`

1. In `src/components/Header.tsx`:
   - Add optional `onToggleRhythm?: () => void` prop and expand `activeView?: 'practice' | 'levels' | 'rhythm'`.
   - Keep the existing `data-testid="view-toggle-button"` button rendering `'Levels'` when `activeView === 'practice'` and `'← Practice'` otherwise so **all existing integration tests pass unchanged**.
   - Add a clean button `data-testid="rhythm-mode-button"` labeled `'Rhythm'` (or `'← Pitch'` when `activeView === 'rhythm'`).
2. In `src/App.tsx`:
   - Support `activeView: 'practice' | 'levels' | 'rhythm'`.
   - When `activeView === 'rhythm'`, render `<RhythmArena />` inside `<main className="nnsr-workspace nnsr-practice-workspace">`.

---

## 3. Test Suite Requirements (`tests/rhythm/rhythmEngine.test.ts` & `tests/ui/rhythmArena.test.tsx`)

1. **Unit Tests (`tests/rhythm/rhythmEngine.test.ts`)**:
   - **Test 1 (Phrase Flattening & "+1 Landing" Rule)**: Verify `flattenPhraseToNotes` merges tied cells (`♩. ♪ → ♩`) into `[1.5 beats, 0.5 beats, 1.0 landing beat]` and marks the last note `isLandingNote: true`.
   - **Test 2 (Sandbox Self-Paced Rehearsal)**: Verify tapping in `SANDBOX` advances `sandboxMatchedCount` without any metronome or timeout penalties, and `handleLeftHandPulse` tracks left-hand pulse taps.
   - **Test 3 (Count-In to Disappearing-Pulse Perform Transition)**: Verify `startCountIn` ticks through 1 bar of count-in and transitions to `PERFORM`.
   - **Test 4 (Relative-IOI Groove Grading & Tempo Drift Tolerance)**: Simulate a user playing a rhythm in `PERFORM` at a steady $+5\%$ faster internal tempo (e.g. `80 BPM` vs `76 BPM` target) with accurate relative sub-beat ratios $\rightarrow$ verify `grooveScorePct >= 95%` and `passed === true` (proving the user is NOT penalized with false-positive late/early errors when their internal clock breathes slightly!).
   - **Test 5 (Hold Duration / Articulation Evaluation)**: Verify holding a sustained/syncopated note across the beat yields a high `holdScorePct`, whereas an ultra-short staccato poke on a sustained note reduces `holdScorePct`.
2. **UI Tests (`tests/ui/rhythmArena.test.tsx`)**:
   - Render `<RhythmArena />`, verify Sandbox mode is active by default, test clicking the `[2× Metric Zoom]` toggle on a Tier 4/5 phrase, and test transitioning from `SANDBOX` $\rightarrow$ `COUNT_IN`.
   - Render `<App />`, click `data-testid="rhythm-mode-button"`, and verify switching to Rhythm view and back to Pitch Practice view.
