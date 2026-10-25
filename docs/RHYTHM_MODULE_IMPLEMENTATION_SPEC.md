# No-Nonsense Rhythm Training Module: Optical Engraving + 4-Stage Count-In + Linear Feedback Timeline Spec

## 1. Core Architecture & Pedagogical Principles

1. **Preventing Shortcut Learning During Reading (Authentic Optical Engraving on the Staff)**:
   - In real published sheet music (Henle, Bärenreiter, Peters), horizontal note spacing is **not** strictly proportional to duration ($\Delta x \neq c \cdot \Delta t$). Instead, engravers use a **logarithmic/sub-linear optical spacing law** ($\text{width}(d) \propto d^{0.65}$), plus non-musical padding around barlines.
   - If the reading staff used strict linear spacing, the human visual system would learn a shortcut (estimating time from horizontal pixel gaps) that fails on real sheet music.
   - Therefore, the **Rhythm Staff** (`RhythmArena.tsx`) MUST space notes and cells using **authentic optical music engraving rules**:
     - Each beat cell's visual width is weighted by the optical complexity of its events ($\sum d_e^{0.65}$), and barlines include realistic left/right engraving margins (`14px` before and `18px` after each barline).
     - That way, a bar of half notes is optically more compact than a bar of sixteenth notes, and the user *must* decode the actual musical symbols (hollow vs. filled head, stems, beams, flags, dots, ties).

2. **The 4-Stage Self-Paced Count-In Workflow**:
   - **Stage 1 — `'STUDY'` (Total Silence — Internalize the Pattern)**:
     - The phrase appears on the optically-engraved staff in total silence.
     - All notes are drawn in plain dark ink (`var(--ink-primary)`). **Never color any upcoming or unplayed note green!**
     - Below the staff is a single clear action prompt/button (`data-testid="hear-tempo-button"`):
       **`Hear Tempo (4 Beats) [Enter]`**
       *(Clicking the button or pressing `Enter` or `Space` transitions to `'COUNT_IN'`).*
   - **Stage 2 — `'COUNT_IN'` (4 Metronome Beats, Then Stops)**:
     - Plays **1 bar of crisp metronome clicks** (`4` beats in `4/4`, `3` beats in `3/4`) at `phrase.targetBpm` using `playMetricCountInClick(beatIndex, beatsPerBar)`.
     - Displays visual beat dots in the prompt bar: `Tempo (76 BPM): ● ● ○ ○`.
     - After the final count-in beat completes, the metronome **stops completely** and the engine transitions to **`'READY_TO_PLAY'`**.
   - **Stage 3 — `'READY_TO_PLAY'` & `'PLAYING'` (Start at Any Point in Time; First Key Press = Note 1)**:
     - In `'READY_TO_PLAY'`, the metronome is silent. The user can start **at any point in time** (immediately or after several seconds).
     - A subtle dark-ink pointer (`▼ 1st note` in `#1f2421`, NOT green) points to Note 1 (`index = 0`), with the prompt:
       **`Play the 1st note (Space or any piano key) whenever you're ready`**
     - **The user's very first key press (`Space`, letter key, or MIDI piano key) IS Note 1 (`t_0`)** and transitions to **`'PLAYING'`**.
     - During `'PLAYING'`:
       - **Zero synthetic note audio** (silent so the user hears their own piano).
       - **Never color upcoming notes green!** Notes already tapped can show a subtle dark-grey/ink indicator or remain dark ink until the phrase finishes.
       - The phrase finishes and transitions to `'FEEDBACK'` as soon as EITHER:
         1. All $N$ written notes have been tapped and the final note is released (or `250 ms` has elapsed since the final note press), OR
         2. The user missed/skipped a note ($M < N$) and the phrase time window has elapsed (`nowMs - firstTapPressMs >= (totalPhraseBeats + 1.0) * beatPeriodMs`). This guarantees the exercise never hangs if a user misses a note!
   - **Stage 4 — `'FEEDBACK'` (Global 1-Parameter Least-Squares Shift + Linear Time-Proportion Comparison Bar)**:
     - Once the phrase finishes, we grade the performance using the **Known Tempo $T$ + Nearest-Note Matching + Global 1-Parameter Least-Squares Shift ($\hat{t}_0$)** (Section 2 below).
     - Directly below the optically-engraved staff, we reveal the **Linear Time-Proportion Comparison Bar** (`data-testid="rhythm-linear-comparison-bar"`), where **time is strictly linear ($1\text{ beat} = \text{exact equal width}$)** with faint quarter-beat (`16th-note`) subdivision lines (`|  ·  ·  ·  |`):
       - **Row 1 (`Expected`)**: Crisp dark reference blocks/ticks at the exact mathematical beat positions $b_i$ and durations $d_i$ (so an eighth note is visibly `2/4` of a beat box and a sixteenth note is visibly `1/4` of a beat box!).
       - **Row 2 (`You Played`)**: The user's actual globally-shifted tap markers (`b_user = (t_j - t0_hat) / T`) and held durations (`d_user = (r_j - t_j) / T`), colored **Green (`#04724d`)** if on time or **Coral Red (`#e05a47`)** if early/late/extra!
       - Because the comparison bar is strictly linear with 16th-note subdivision ticks, the user can immediately see: *"Oh! What I played landed on the 4th sixteenth tick (`3/4 + 1/4`) instead of the eighth-note midpoint (`2/4 + 2/4`)!"*

---

## 2. Mathematical Model in `src/rhythm/engine.ts`

Let $T = \frac{60000}{\text{phrase.targetBpm}}$ be the known beat period in milliseconds established by the count-in.
Let the $N$ written notes have expected beat positions $b_0, b_1, \dots, b_{N-1}$ (where $b_0 = 0$) and durations $d_0, d_1, \dots, d_{N-1}$.
Let the $M$ recorded user taps have press timestamps $t_0, t_1, \dots, t_{M-1}$ and release timestamps $r_0, r_1, \dots, r_{M-1}$.

### Step 1: Chronological Nearest-Note Matching
Relative to the first tap $t_0$, each tap $j \in \{0, \dots, M-1\}$ has an initial approximate beat position:
$$\tilde{b}_j = \frac{t_j - t_0}{T}$$
- Match Tap $0$ ($t_0$) to Written Note $0$ ($b_0 = 0$).
- For each subsequent written note $i = 1, \dots, N-1$:
  - Among unassigned taps $j > j_{\text{lastMatched}}$, find the tap $j$ that minimizes $|\tilde{b}_j - b_i|$, subject to:
    1. $|\tilde{b}_j - b_i| \le 0.48$ beats, AND
    2. If $i + 1 < N$, $|\tilde{b}_j - b_i| \le |\tilde{b}_j - b_{i+1}|$ (so if the user skipped note $i$ and played note $i+1$ on time, that tap is saved for note $i+1$ rather than falsely consumed by note $i$!).
  - If a valid tap $j$ is found, pair $(i, j)$ and set $j_{\text{lastMatched}} = j$.
  - Otherwise, written note $i$ was **skipped/missed** (`matchedTapIndex[i] = null`).

### Step 2: Global 1-Parameter Least-Squares Shift ($\hat{t}_0$)
We want a **single global shift $\hat{t}_0$** applied identically to every tap so that the relative timing between all user taps is 100% preserved, while minimizing the squared error $\sum_{k} (t_{j_k} - (\hat{t}_0 + T \cdot b_{i_k}))^2$ across matched pairs $(i_k, j_k)$:
- For each matched pair $(i_k, j_k)$, define its raw origin estimate:
  $$u_k = t_{j_k} - T \cdot b_{i_k}$$
- To prevent a single huge mistake (outlier) from dragging the global shift $\hat{t}_0$ away from the user's true beat alignment, compute the median $u_{\text{med}} = \text{median}(\{u_k\})$, keep all inliers within $|u_k - u_{\text{med}}| \le 0.25 \cdot T$, and take their exact least-squares mean:
  $$\hat{t}_0 = \frac{1}{|I|} \sum_{k \in I} u_k$$
  *(If $I$ is empty, $\hat{t}_0 = t_0$).*

### Step 3: Compute Globally-Shifted User Taps (`ShiftedTap[]`) & Note Evaluations
Now, shift **every** tap $j \in \{0, \dots, M-1\}$ that the user played by the **exact same global constant $\hat{t}_0$**:
$$b_{\text{user}, j} = \frac{t_j - \hat{t}_0}{T}, \qquad d_{\text{user}, j} = \frac{\max(40, (r_j ?? (t_j + 200)) - t_j)}{T}$$
Store this array on `RhythmFeedbackSummary.shiftedTaps: readonly ShiftedTap[]`:
```ts
export interface ShiftedTap {
  readonly tapIndex: number;
  readonly matchedNoteIndex: number | null; // null if extra unintended tap
  readonly startBeat: number; // (t_j - t0_hat) / T
  readonly durationBeats: number; // (r_j - t_j) / T
  readonly status: 'perfect' | 'loose' | 'missed';
}
```
And for each written note $i \in \{0, \dots, N-1\}$:
- If `matchedTapIndex[i] === null`:
  - `status = 'missed'`, `errorHint = 'missed'`, `noteGrooveScore = 0`, `noteHoldScore = 0`, `userStartBeat = null`.
- If matched to tap $j$:
  - `onsetErrorBeats = b_user_j - b_i`
  - `absErr = Math.abs(onsetErrorBeats)`
  - `absErr <= 0.12` -> `'perfect'` (`100`)
  - `0.12 < absErr <= 0.22` -> `'loose'` (`100 -> 65`)
  - `absErr > 0.22` -> `'missed'` (`0`)
  - Hold score: for sustained notes (`expectedDurationBeats >= 1.5` and not landing note), require `holdRatio = d_user_j / d_i >= 0.40` (otherwise `errorHint = 'short'`).
- Pass criteria:
  - `overallScorePct >= 80`, zero written notes with `status === 'missed'`, and zero extra unmatched taps.

---

## 3. UI & Visual Specification in `src/components/RhythmArena.tsx`

1. **Top Card: Optically-Engraved Rhythm Staff**:
   - Uses sub-linear optical cell widths ($w_b \propto \sum_{e \in \text{cell}_b} d_e^{0.65}$) plus barline padding (`16px` around each barline) so horizontal distance on the staff matches real sheet music engraving rather than linear time.
   - Properly renders half notes (`h_start` without phantom `hold_q`), dotted quarters (`♩. ♪`), eighth flags (`♪`), sixteenth beams, ties, and rests.
   - In `'FEEDBACK'`, each written notehead is colored Green (`#04724d`) or Coral Red (`#e05a47`).

2. **Bottom Section of Card in `'FEEDBACK'`: Linear Time-Proportion Comparison Bar (`data-testid="rhythm-linear-comparison-bar"`)**:
   - Appears inside the card right below the staff when `snapshot.phase === 'FEEDBACK'`.
   - Draws a clean horizontal timeline SVG (`viewBox="0 0 840 96"`) where **every beat $b \in [0, \text{totalBeats}]$ has strictly equal pixel width $W_{\text{beat}}$**:
     - Vertical solid lines at each barline (`b = 0, 4, 8`), dashed vertical lines at each beat (`b = 1, 2, 3, 5, 6, 7`), and subtle tick marks at each quarter-beat (`16th-note` subdivisions `0.25, 0.50, 0.75` inside every beat)!
     - **Row 1 (`Expected`, `y = 28`)**: Draws a crisp slate-charcoal pill/marker at each written note's exact linear beat `[b_i, b_i + d_i]` with a distinct attack head at `x(b_i)`.
     - **Row 2 (`You Played`, `y = 58`)**: Draws each `shiftedTap` at its exact linear beat `[b_user_j, b_user_j + d_user_j]` with an attack head at `x(b_user_j)` and a thin vertical connector line up to its matched expected note `x(b_i)`!
       - Colored **Green (`#04724d`)** if `perfect`/`loose`, or **Coral Red (`#e05a47`)** if `missed`/early/late.
       - This makes it immediately obvious visually whether you played a sixteenth (`0.25` beat) vs. an eighth (`0.50` beat) or rushed/dragged a beat!

3. **Clear Action Controls Across the 4 Stages**:
   - In `'STUDY'`:
     - Button (`data-testid="hear-tempo-button"`): **`Hear Tempo (4 Beats) [Enter / Space]`**
   - In `'COUNT_IN'`:
     - Status indicator: **`Tempo (${phrase.targetBpm} BPM): Beat ${countInBeatIndex + 1} of ${phrase.beatsPerBar}...`**
   - In `'READY_TO_PLAY'`:
     - Prompt: **`Play the 1st note (Space or any piano key) whenever you're ready`**
   - In `'PLAYING'`:
     - Prompt: **`Playing... keep the tempo steady through the final note`**
   - In `'FEEDBACK'`:
     - If `feedback.passed`:
       - Green banner + button (`data-testid="next-phrase-button"`):
         **`✓ Phrase ${phrasesCompletedInLevel} of ${phrasesRequiredForLevel} Passed (${feedback.overallScorePct}%) — Next Phrase [Enter / Space]`** (or **`Complete Level →`** on Phrase 5).
     - If `!feedback.passed`:
       - Coral banner:
         **`✗ Compare your timing on the linear grid below — Play 1st note to try again, or`** + button **`Hear Tempo Again [Enter]`**.

4. **Celebration Overlay & White-Screen Prevention (`src/App.tsx`, `src/curriculum/graph.ts`)**:
   - In `src/curriculum/graph.ts`, make `getLevelById(id: string)` safe if called with `'rhythm-*'` ( only throw if neither `LEVELS_BY_ID.has(id)` nor `id.startsWith('rhythm-')`, or return `LEVELS_BY_ID.get('treble-1')!` as fallback if `id.startsWith('rhythm-')`).
   - In `src/App.tsx`, when `onLevelComplete` fires from `RhythmArena`, mark the rhythm level completed, set `isRhythmLevelCelebrating = true`, switch to `activeView = 'levels'`, and render `<CelebrationOverlay>` with the completed rhythm level's title and a working **`Next Level →`** button that advances to `rhythm-(k+1)`.
