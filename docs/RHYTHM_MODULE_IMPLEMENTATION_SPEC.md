# No-Nonsense Rhythm Training Module: Radical Simplicity Redesign Spec

## 1. Core Design Philosophy: Zero Jargon, Zero Controls, Unified Skill Tree

The Rhythm Module must follow the exact same minimalist, self-explanatory visual language as the Pitch Sight-Reading workspace:
1. **No separate "Rhythm" header button**: The top [`Header`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/Header.tsx) returns to its clean single navigation button (`Levels` when practicing, `← Practice` when viewing the Level Graph).
2. **Unified 4-Lane `LevelGraph` (`Treble | Both | Bass | Rhythm`)**:
   - In [`LevelGraph.tsx`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/LevelGraph.tsx), alongside `Treble`, `Both`, and `Bass`, there is a 4th vertical lane on the right: **`Rhythm`**.
   - Just like `Treble`, `Both`, and `Bass` have 12 tiers (`tier = 1..12`), the `Rhythm` column has **12 circular level nodes** (`rhythm-1` through `rhythm-12`) connected by upward vertical arrows from Tier 1 (bottom) to Tier 12 (top).
   - Inside each `rhythm-k` circle is a **Miniature Engraved Rhythm Icon (`MiniRhythmMotif`)** showing the signature rhythmic pattern introduced at that tier (e.g., `♩ ♩`, `♫ ♩`, `♩ 𝄽`, `♩. ♪`, `♬♬`, `♪ ♬`, `♬ ♪`, `♪. ♬`, `♪ ♩ ♪`, `♩. ♪ ‿ ♪`, `6/8 ♫♪`, `♬ ♪ ♬`).
   - Clicking any `rhythm-k` node in the `LevelGraph` selects that rhythm level and switches to the practice view (`activeView = 'practice'`), which automatically renders the minimalist [`RhythmArena`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/RhythmArena.tsx) whenever `currentLevelId.startsWith('rhythm-')`.
3. **Zero-Control Rhythm Practice Workspace**:
   - **Remove all dropdowns, tier buttons, phrase selectors, "Word Boxes", "Sandbox / Count-In / Perform" buttons, "Left-Hand Pulse (F)", "Pulse: Silent / Anchor" toggles, "2x Metric Zoom" buttons, and "LANDING" text badges.**
   - The Rhythm Practice screen contains ONLY:
     1. **The Rhythm Staff Card** (clean white canvas card matching `GrandStaffCanvas` dimensions and styling) displaying the single-line rhythm staff (`4/4`, `3/4`, `2/2`, or `6/8`) and the engraved 2-bar + 1-downbeat phrase.
     2. **A subtle, unmistakable active-target indicator on the first note** (a gentle pulsing highlight ring or arrow on Note 1 before you start, paired with a crystal-clear one-line prompt below the staff: **`Play the 1st note (Space or any piano key) to start at your own tempo`**).
     3. **The Progress Bar** (matching [`ProgressBar.tsx`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/ProgressBar.tsx) visually—e.g. advancing across 5 phrases in the level).
4. **Self-Paced Flow (First Press = Note 1)**:
   - There is **no count-in** and **no "start button"**.
   - The user looks at the engraved rhythm phrase for as long as they want.
   - **Their very first press (`Space`, any letter key, or any MIDI piano key) IS Note 1 (`index = 0`) of the phrase!**
   - While tapping through the notes from left to right:
     - Each tapped notehead immediately turns **active/played (`#04724d` / emerald-tinted or ink-active)** and plays the warm marimba/piano sustain voice for as long as the key is held.
     - A subtle visual playhead dot/ring advances to the next expected note so the user always knows which note they are on.
   - **The instant the user completes the final note of the phrase**:
     - The engine runs the **Ordinary Least-Squares Best-Fit Tempo Line** across all taps in the phrase (`slope` clamped to a reasonable human tempo range `[35 BPM, 200 BPM]`) plus hold-duration articulation checks.
     - **All notes in the phrase light up simultaneously with their evaluation color**:
       - **Green (`#04724d`)** for notes played in proportion to the user's chosen tempo and held appropriately.
       - **Coral/Red (`#e05a47`)** for notes played early, late, or clipped too short (with a tiny, clean label below only the missed note: e.g. `early`, `late`, or `short`).
     - **If the phrase passed (`overallScorePct >= 80` and zero `'missed'` notes)**:
       - The Progress Bar advances by 1 step!
       - After a brief `750 ms` green confirmation pause so the user can see their green phrase, the next phrase in the level smoothly appears (or, if all 5 phrases in the level are completed, the level is marked completed and transitions to the Celebration / `LevelGraph` view just like Pitch levels!).
     - **If a note was missed/out-of-proportion**:
       - The red/green note highlights remain visible on the staff so the user can inspect exactly which note was early/late/short.
       - The prompt below reads: **`Missed rhythm proportion — play the 1st note to try this phrase again`** (and pressing `Space` or any piano key immediately starts Note 1 of a fresh attempt on that same phrase!).

---

## 2. Detailed Component & File Specifications

### 2.1. `src/types/rhythm.ts`
Update [`src/types/rhythm.ts`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/types/rhythm.ts) so it supports the 12 Rhythm Levels (`rhythm-1` .. `rhythm-12`) and the streamlined self-paced state machine:

```ts
export type TimeSignatureStr = '4/4' | '3/4' | '2/4' | '2/2' | '6/8';

export type RhythmEventKind = 'attack' | 'rest' | 'hold';

export interface RhythmSubEvent {
  readonly kind: RhythmEventKind;
  readonly durationBeats: number;
  readonly tiedFromPrev?: boolean;
  readonly dotted?: boolean;
  readonly tuplet?: 3;
}

export interface RhythmBeatCell {
  readonly cellId: string;
  readonly events: readonly RhythmSubEvent[];
}

export interface RhythmPhrase {
  readonly id: string;
  readonly tier: number; // 1..12
  readonly timeSignature: TimeSignatureStr;
  readonly beatsPerBar: number;
  readonly beatUnit: 4 | 2 | 8;
  readonly targetBpm: number; // Nominal reference tempo (used to clamp 35..200 BPM range)
  readonly beatCells: readonly RhythmBeatCell[];
}

export type RhythmExercisePhase = 'READY' | 'PLAYING' | 'FEEDBACK' | 'LEVEL_COMPLETE';

export interface FlattenedRhythmNote {
  readonly noteIndex: number;
  readonly startBeat: number;
  readonly durationBeats: number;
  readonly isLandingNote: boolean;
  readonly cellIndex: number;
}

export interface RecordedTap {
  readonly pressTimeMs: number;
  releaseTimeMs: number | null;
}

export type NoteErrorHint = 'early' | 'late' | 'short' | 'long' | null;

export interface NoteEvaluation {
  readonly noteIndex: number;
  readonly expectedStartBeat: number;
  readonly expectedDurationBeats: number;
  readonly relativeOnsetError: number;
  readonly holdRatio: number;
  readonly status: 'perfect' | 'loose' | 'missed';
  readonly errorHint: NoteErrorHint;
}

export interface RhythmFeedbackSummary {
  readonly grooveScorePct: number;
  readonly holdScorePct: number;
  readonly overallScorePct: number;
  readonly estimatedUserBpm: number;
  readonly noteEvaluations: readonly NoteEvaluation[];
  readonly passed: boolean;
}

export type MiniRhythmMotifType =
  | 'q_q'           // Tier 1: ♩ ♩
  | 'e2_q'          // Tier 2: ♫ ♩
  | 'q_rest'        // Tier 3: ♩ 𝄽
  | 'dotq_e'        // Tier 4: ♩. ♪
  | 's4'            // Tier 5: ♬♬
  | 'gallop'        // Tier 6: ♪ ♬
  | 'rev_gallop'    // Tier 7: ♬ ♪
  | 'dot8_s'        // Tier 8: ♪. ♬
  | 'sync_e_q_e'    // Tier 9: ♪ ♩ ♪
  | 'tie_across'    // Tier 10: ♩ ‿ ♪ ♪
  | 'compound_6_8'  // Tier 11: 6/8 ♫♪
  | 'rag_sync';     // Tier 12: ♬ ♪ ♬

export interface RhythmLevelSpec {
  readonly id: string; // 'rhythm-1' .. 'rhythm-12'
  readonly tier: number; // 1 .. 12
  readonly title: string;
  readonly subtitle: string;
  readonly motif: MiniRhythmMotifType;
  readonly prerequisiteIds: readonly string[];
  readonly nextIds: readonly string[];
  readonly phrases: readonly RhythmPhrase[];
}

export interface RhythmEngineSnapshot {
  readonly levelId: string;
  readonly levelTitle: string;
  readonly phase: RhythmExercisePhase;
  readonly phrase: RhythmPhrase;
  readonly flattenedNotes: readonly FlattenedRhythmNote[];
  readonly currentNoteIndex: number;
  readonly activeHoldNoteIndex: number | null;
  readonly phrasesCompletedInLevel: number;
  readonly phrasesRequiredForLevel: number;
  readonly feedback: RhythmFeedbackSummary | null;
}
```

---

### 2.2. `src/rhythm/curriculum.ts` (12 Rhythm Levels: `rhythm-1` through `rhythm-12`)
Provide 12 progressive Rhythm Levels (`rhythm-1` .. `rhythm-12`), each with **5 authentic 2-bar + 1-downbeat phrases**:
- `rhythm-1` (`motif: 'q_q'`, Title: `Quarter & Half Pulse`): Steady quarters (`♩`), half notes (`𝅗𝅥`), and +1 downbeat landing in `4/4`.
- `rhythm-2` (`motif: 'e2_q'`, Title: `Eighth-Note Flow`): Paired eighth notes (`♫`) mixed with quarters and halves in `4/4` and `3/4`.
- `rhythm-3` (`motif: 'q_rest'`, Title: `Rests & Silence`): Quarter rests (`𝄽`) and upbeat eighth rests (`𝄾 ♪`) requiring clean note releases.
- `rhythm-4` (`motif: 'dotq_e'`, Title: `Dotted Quarter & Eighth`): The classic `♩. ♪` anacrusis resolving onto the next beat (`4/4` and `3/4`).
- `rhythm-5` (`motif: 's4'`, Title: `Sixteenth-Note Grid`): 4 sixteenth notes (`♬♬`) mixed with eighths and quarters.
- `rhythm-6` (`motif: 'gallop'`, Title: `Forward Gallop`): Eighth + two sixteenths (`♪ ♬`) driving into the downbeat.
- `rhythm-7` (`motif: 'rev_gallop'`, Title: `Reverse Gallop`): Two sixteenths + eighth (`♬ ♪`) mixed with forward gallops.
- `rhythm-8` (`motif: 'dot8_s'`, Title: `Dotted Eighth & Sixteenth`): Crisp `♪. ♬` figures and Scotch snaps (`♬ ♪.`).
- `rhythm-9` (`motif: 'sync_e_q_e'`, Title: `Off-Beat Syncopation`): `♪ ♩ ♪` (`e + q + e`) and upbeat eighths across the bar.
- `rhythm-10` (`motif: 'tie_across'`, Title: `Ties Across the Beat`): Notes tied across beats (`♩. ♪ ‿ ♪ ♪` and `♪ ‿ ♪`).
- `rhythm-11` (`motif: 'compound_6_8'`, Title: `Compound 6/8 & Triplets`): Rolling triplet cells (`triplet_e`) and `6/8` compound feel.
- `rhythm-12` (`motif: 'rag_sync'`, Title: `Pop & Ragtime Groove`): Intra-beat syncopation (`♬ ♪ ♬` = `sync_16_8_16`), tresillo, and tied anticipations.

Export helpers:
- `RHYTHM_LEVELS: readonly RhythmLevelSpec[]` (12 levels)
- `RHYTHM_LEVELS_BY_ID: ReadonlyMap<string, RhythmLevelSpec>`
- `getRhythmLevelById(id: string): RhythmLevelSpec`
- `isRhythmLevelId(id: string): boolean` (`id.startsWith('rhythm-')`)

Ensure `getTransitiveCompletedLevels` and `getNextRecommendedLevel` in [`src/curriculum/graph.ts`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/curriculum/graph.ts) also support `rhythm-1` .. `rhythm-12` seamlessly without breaking any existing tests in `tests/curriculum/levels.test.ts` or `tests/curriculum/graph.test.ts`!
- Specifically:
  - Keep `getAllLevels()` in `src/curriculum/graph.ts` returning the 36 pitch levels (`ALL_LEVELS.length === 36`) so existing tests in `tests/curriculum/levels.test.ts` and `tests/curriculum/graph.test.ts` continue to pass 100% unchanged!
  - In `getTransitiveCompletedLevels(directlyCompletedIds)`: if an ID is `rhythm-k` (where `k` is `1..12`), transitively add `rhythm-1` through `rhythm-k` to the returned `Set<string>`!
  - In `getNextRecommendedLevel(completedLevelId, finishedSet)`: if `completedLevelId` starts with `'rhythm-'`, extract `tier = Number(completedLevelId.split('-')[1])` and return `tier < 12 ? 'rhythm-' + (tier + 1) : 'rhythm-12'`.

---

### 2.3. `src/rhythm/engine.ts` (Self-Paced First-Press Engine)
Simplify `RhythmEngine` to a clean, rock-solid self-paced flow:
1. **Phases**:
   - `'READY'`: Waiting for the user to tap Note 1 (`currentNoteIndex = 0`).
   - `'PLAYING'`: The user has pressed Note 1 (`index = 0`), and is tapping through `index = 1 .. N - 1`.
   - `'FEEDBACK'`: All $N$ notes have been tapped and the last note has been released (or `300 ms` has elapsed since the final landing note was pressed). The evaluation is displayed.
     - **If `feedback.passed === true`**:
       - Increment `phrasesCompletedInLevel`.
       - After `750 ms` in `'FEEDBACK'` (checked inside `tick(nowMs)`), automatically advance to the next phrase in the level and reset `phase = 'READY'`! If `phrasesCompletedInLevel >= phrasesRequiredForLevel` (5 phrases), transition `phase = 'LEVEL_COMPLETE'`.
       - Also if the user presses a key during a passed `'FEEDBACK'` after at least `250 ms`, advance immediately to the next phrase.
     - **If `feedback.passed === false`**:
       - Stay in `'FEEDBACK'` showing the red/green note evaluations so the user can see what went wrong.
       - **As soon as the user presses `Space` or any piano key again (after a `350 ms` debounce from the last note press so an accidental double-tap doesn't trigger it)**, that press immediately starts a fresh retry of the same phrase (`phase = 'PLAYING'`, recording that press as Note 1 `index = 0`!).
2. **Evaluating Performance (`evaluatePerformance`)**:
   - Fit the Ordinary Least-Squares regression line $\hat{t}(b_i) = \hat{t}_0 + \hat{T} \cdot b_i$ across all $M = N$ recorded taps.
   - Clamp $\hat{T}$ (`estimatedUserBeatPeriodMs`) to `[300 ms, 1714 ms]` (i.e. **35 BPM to 200 BPM**), so the user truly can play at any comfortable human tempo they choose, while preventing absurd 10-second pauses from fitting a fake 5-BPM tempo.
   - For each note $i \in \{0, \dots, N-1\}$:
     - `onsetErrorMs = tap.pressTimeMs - (t0 + estimatedUserBeatPeriodMs * note.startBeat)`
     - `relativeOnsetError = onsetErrorMs / estimatedUserBeatPeriodMs`
     - `absErr = Math.abs(relativeOnsetError)`
     - Thresholds:
       - `absErr <= 0.10`: `'perfect'` (`100` groove score)
       - `0.10 < absErr <= 0.18`: `'loose'` (`60..100` groove score)
       - `absErr > 0.18`: `'missed'` (`0..30` groove score)
     - Hold Articulation (for non-landing notes, i.e., `i < N - 1`):
       - Check how long the note was held (`actualHoldMs / expectedDurationMs`) and also check if a rest follows the note (if a rest follows immediately in the beat cell or next beat cell, holding across the entire rest > `1.45 * expectedDurationMs` is `'long'`; if held `< 0.30 * expectedDurationMs` on a note >= 1 beat, mark `'short'`).
       - Keep hold grading forgiving on normal keyboard taps (`holdRatio >= 0.25 && holdRatio <= 1.50` -> `100` hold score; if `holdRatio < 0.25` on a sustained note `expectedDurationBeats >= 1.5` -> penalize as `'short'`) so computer-keyboard tappers aren't frustrated on short eighth/sixteenth notes, while half notes (`𝅗𝅥`) and dotted quarters (`♩.`) still require a genuine hold (`>= 0.40`).
     - Set `errorHint`:
       - If `status === 'missed'` or `status === 'loose'`: `relativeOnsetError < -0.10 ? 'early' : relativeOnsetError > 0.10 ? 'late' : null`.
       - Else if `noteHoldScore < 60`: `holdRatio < 0.40 ? 'short' : 'long'`.
   - Pass criteria: `overallScorePct >= 80` and zero notes with `status === 'missed'`.

---

### 2.4. `src/components/LevelGraph.tsx` (Unified 4-Lane Tree: `Treble | Both | Bass | Rhythm`)
Update [`src/components/LevelGraph.tsx`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/LevelGraph.tsx):
1. **Header**:
   - Render 4 column labels in `.nnsr-level-graph-header`:
     - `Treble` | `Both` | `Bass` | `Rhythm` (each `width: '25%'`, `textAlign: 'center'`).
2. **SVG Coordinates**:
   - Widen `SVG_WIDTH` from `300` to `400` (`viewBox="0 0 400 1298"`).
   - Keep `Treble` at `x = 55`, `Both` at `x = 150`, `Bass` at `x = 245`, and place **`Rhythm` at `x = 345`**!
   - Widen `.nnsr-level-graph-container` max-width in `src/styles/app.css` from `360px` to `460px` so all 4 columns have generous breathing room.
3. **Rhythm Lane Nodes & Arrows (`rhythm-1` .. `rhythm-12`)**:
   - For `tier = 1 .. 12`:
     - `yRhythmCur = PADDING_TOP + (12 - tier) * TIER_HEIGHT + BOTH_Y_OFFSET` (aligned horizontally with `Treble` and `Bass` at the same tier!).
     - Draw upward arrow from `(345, yRhythmCur - NODE_RADIUS)` to `(345, yRhythmNext + NODE_RADIUS + 4)` for `tier < 12`, colored `var(--emerald)` if `completedLevelIds.has('rhythm-' + (tier + 1))` else `#b0aba2`.
     - Render each `rhythm-${tier}` circular node (`r = NODE_RADIUS = 25`) with `className="nnsr-graph-node nnsr-rhythm-graph-node ..."`, `aria-label={"Level Rhythm - Tier " + tier + ": " + rhythmLevel.title}`, `data-testid={"rhythm-node-" + tier}`, and `onClick={() => onSelectLevel(rhythmLevel.id)}`.
     - **Important**: In `tests/ui/levelGraph.test.tsx`, Test 2 checks `container.querySelectorAll('.nnsr-graph-node')`. Check whether `tests/ui/levelGraph.test.tsx` expects `36` or `48` nodes, and update `tests/ui/levelGraph.test.tsx` to verify the 4 lane headers (`Treble`, `Both`, `Bass`, `Rhythm`) and `48` total nodes (36 pitch + 12 rhythm)!
4. **`MiniRhythmMotif` SVG Component inside each Rhythm Node**:
   - Draw a crisp miniature rhythm engraving centered at `(cx, cy)` inside the circle (`r = 25`):
     - Faint horizontal percussion staff line (`x1 = cx - 16`, `x2 = cx + 16`, `y = cy`, `stroke="#b0aba2"`, `strokeWidth={0.7}`).
     - Tiny stylized noteheads (`ellipse rx=2.2 ry=1.5 transform="rotate(-20)"`), stems (`strokeWidth=1.0`), beams, dots, or rests representing `rhythmLevel.motif` so every node in the `Rhythm` column is visually distinct and immediately recognizable as rhythm notation without a single word of text!

---

### 2.5. `src/components/RhythmArena.tsx` (Minimalist, Self-Explanatory Rhythm Practice View)
Completely replace the cluttered `RhythmArena.tsx` with a clean, self-explanatory component:
1. **Props**:
   ```ts
   export interface RhythmArenaProps {
     levelId: string;
     onLevelComplete?: () => void;
   }
   ```
2. **Layout (Matches Pitch Practice View)**:
   - Renders inside `<section className="nnsr-main-column">`:
     1. **Rhythm Staff Card (`.nnsr-rhythm-canvas-card`)**:
        - Clean white card (`background: var(--card-bg)`, `border-radius: 12px`, `border: 1px solid var(--border-subtle)`).
        - Contains ONLY the SVG rhythm staff (`viewBox="0 0 840 200"`):
          - Percussion clef (`𝄥` or two vertical bars) + Time Signature (`4/4`, `3/4`, `6/8`) on the left.
          - Single horizontal staff line (`y = 110`).
          - Engraved notes, stems, beams (properly grouped by beat), augmentation dots, ties, rests, barlines, and final double barline.
          - **Visual Guidance on the First / Current Note**:
            - When `phase === 'READY'`, draw a gentle emerald target ring + downward pointer (`▼ 1st note`) above Note 0 (`index = 0`) so the user's eye is immediately drawn to the starting note.
            - During `phase === 'PLAYING'`, each already-tapped note (`i < currentNoteIndex`) is colored active emerald (`#04724d`), and the next expected note (`i === currentNoteIndex`) has a subtle target ring.
            - During `phase === 'FEEDBACK'`, each note is colored **Green (`#04724d`)** (`perfect` / `loose`) or **Coral Red (`#e05a47`)** (`missed` or failed hold). If a note has an `errorHint` (`'early' | 'late' | 'short' | 'long'`), display that single word cleanly in `11px` below that specific notehead.
        - **Bottom Status Prompt inside the Card**:
          - When `phase === 'READY'`:
            `Play the 1st note (Space or any piano key) to start at your own tempo`
          - When `phase === 'PLAYING'`:
            `Keep your steady beat through the final note...`
          - When `phase === 'FEEDBACK'` and `feedback.passed === true`:
            `✓ Steady rhythm (~${feedback.estimatedUserBpm} BPM)`
          - When `phase === 'FEEDBACK'` and `feedback.passed === false`:
            `Timing off on highlighted notes — play the 1st note to try again`
     2. **Progress Bar (`.nnsr-progress-container`)**:
        - Reuse the exact same `.nnsr-progress-container` / `.nnsr-progress-track` / `.nnsr-progress-fill` CSS classes as [`ProgressBar.tsx`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/src/components/ProgressBar.tsx) so the progress bar looks identical to Pitch mode (`width: ${(phrasesCompletedInLevel / phrasesRequiredForLevel) * 100}%`).
3. **Input Handling**:
   - Pressing `Space` or any letter/note key (except `Tab`/`Escape`/modifiers) or any MIDI note triggers `handleNotePress` and plays `playRhythmNoteVoice`.
   - Releasing the key triggers `handleNoteRelease` and stops the sustain voice.

---

### 2.6. `src/components/Header.tsx` & `src/App.tsx`
1. **`src/components/Header.tsx`**:
   - Remove the extra `Rhythm` button from the header. Restore `Header` to its clean single button (`data-testid="view-toggle-button"` showing `'Levels'` when `activeView === 'practice'` and `'← Practice'` when `activeView === 'levels'`).
2. **`src/App.tsx`**:
   - `activeView` is simply `'practice' | 'levels'`.
   - Check `const isRhythmMode = isRhythmLevelId(currentLevelId);`
   - When `activeView === 'practice'` and `isRhythmMode` is `true`, render:
     ```tsx
     <main className="nnsr-workspace nnsr-practice-workspace">
       <section className="nnsr-main-column">
         <RhythmArena
           levelId={currentLevelId}
           onLevelComplete={() => {
             markLevelCompleted(currentLevelId);
             setActiveView('levels');
           }}
         />
       </section>
     </main>
     ```
   - When `activeView === 'practice'` and `isRhythmMode` is `false`, render the existing Pitch workspace (`GrandStaffCanvas`, `ProgressBar`, `PianoKeyboard`).
   - Guard `getLevelById(currentLevelId)` in `App.tsx` so when `currentLevelId` is `'rhythm-k'`, `currentLevel` falls back to `'treble-1'` for the dormant `SightReadingEngine` ref while `RhythmArena` runs the active rhythm level.

---

## 3. Verification & Test Suite Requirements

1. **`tests/rhythm/rhythmEngine.test.ts`**:
   - Test that `RHYTHM_LEVELS` contains all 12 levels (`rhythm-1` .. `rhythm-12`) and `flattenPhraseToNotes` merges tied subdivisions and sets `isLandingNote: true` on the final note.
   - Test that `RhythmEngine` starts in `'READY'`, transitions to `'PLAYING'` on the very first key press (recording Note 0 at that timestamp), and transitions to `'FEEDBACK'` when the final note is completed.
   - Test that tapping a phrase proportionally at *any* human tempo (e.g. `65 BPM` or `115 BPM`) passes with `grooveScorePct === 100` regardless of the nominal `targetBpm`.
   - Test that rushing/dragging a specific note in the middle of a phrase marks that note `'missed'` with `errorHint: 'early'` or `'late'`, and that the next key press after the debounce starts Note 0 of a fresh retry.
   - Test that completing 5 phrases advances `phrasesCompletedInLevel` from `0` to `5` and transitions to `'LEVEL_COMPLETE'`.
2. **`tests/ui/rhythmArena.test.tsx`**:
   - Test that `RhythmArena` renders the SVG staff, the clear prompt `Play the 1st note (Space or any piano key) to start at your own tempo`, the progress bar, and **zero** dropdowns or mode buttons.
   - Test that pressing `Space` immediately plays Note 0 and transitions the prompt to `Keep your steady beat through the final note...`.
   - Test that selecting a Rhythm node (`rhythm-1`) in `LevelGraph` opens `RhythmArena` in `App.tsx`.
3. **`tests/ui/levelGraph.test.tsx`**:
   - Verify all 4 lane headers (`Treble`, `Both`, `Bass`, `Rhythm`) and all 48 nodes (36 pitch + 12 rhythm).
4. Run `npm test` and `npm run build` and ensure 100% pass rate with zero TypeScript or build errors.
   - **NEVER start any dev or preview server.**
