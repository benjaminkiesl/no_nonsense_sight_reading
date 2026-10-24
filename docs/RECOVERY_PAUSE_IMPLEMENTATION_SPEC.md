# Implementation-Ready Specification: "Acoustic Sanctuary" Recovery Pause

## 1. Overview & Objective

Implement the **Acoustic Sanctuary Post-Correction Protocol** (Option 1 from [`docs/mistake_breaks_design.md`](file:///home/benjaminkiesl/code/no_nonsense_sight_reading/docs/mistake_breaks_design.md)):
- Error-free players are **never** interrupted by scheduled pauses.
- Isolated single slips in `SPEED_UP` do **not** trigger a recovery break; upon correction they immediately resume `NORMAL` scrolling with the standard 4-second recovery ramp from 15 BPM (`startRecoveryRamp()`).
- When a mistake indicates **accumulated Reactive Inhibition ($I_R$) / micro-fatigue**—specifically:
  1. **Error Cluster**: A failure occurs within $\le 6$ correct hits of the previous failure (`notesHitSinceLastFailure <= 6`), OR
  2. **HOLD Phase Failure**: Any failure occurs during the `HOLD` phase, OR
  3. **Correction Double-Fault**: The player hits $\ge 2$ wrong keys while trying to resolve a frozen failed note in `WAITING_FOR_CORRECTION`—
- Then **immediately after the player strikes the correct note** to resolve the error (`correction_complete`), the engine enters the **`RECOVERY_PAUSE`** substate for **6,500 ms**:
  - **Phase A — Eyes-Closed Acoustic Sanctuary (`6500 ms` down to `1000 ms`, duration `5.5 s`)**:
    - A warm Web Audio sanctuary chime ($C_4 = 261.63\text{ Hz}$ fundamental + gentle $C_5$ overtone) rings out and decays over 3.2 seconds.
    - The `GrandStaffCanvas` container smoothly dims to a dark charcoal slate overlay (`#181a19` at 90% opacity) with **no numeric countdown and no progress bar**, displaying only:
      - Primary prompt: `"Close your eyes. Drop your shoulders."`
      - Subtitle: `"A chime will wake the staff."`
    - Any key presses during this 5.5s window are ignored by the engine (`outcome: 'recovery_muted'`) and play a soft, non-punitive acoustic felt damper thud instead of flashing red errors.
  - **Phase B — Waking Chime & Static Lookahead Window (`1000 ms` down to `0 ms`, duration `1.0 s`)**:
    - Crossing the `1000 ms` mark triggers a crisp ascending two-tone wake-up chime ($C_5 \rightarrow G_5$, $523.25\text{ Hz} \rightarrow 783.99\text{ Hz}$).
    - The dark sanctuary overlay fades out, revealing the bright staff with the upcoming approaching notes **completely stationary** for 1.0 second so the player can rebuild their Eye-Hand Span (EHS) lookahead buffer.
  - **Resumption (`0 ms`)**:
    - When `recoveryRemainingMs` reaches `0`, the engine transitions `substate` to `'NORMAL'` and calls `this.speedController.startRecoveryRamp()`, smoothly ramping scroll speed from `15.0 BPM` back to `targetBpm` over 4.0 seconds.

---

## 2. Exact File-by-File Changes

### 2.1 `src/types/engine.ts`

1. Add `'RECOVERY_PAUSE'` to `EngineSubstate`:
   ```ts
   export type EngineSubstate = 'NORMAL' | 'WAITING_FOR_CORRECTION' | 'RECOVERY_PAUSE';
   ```
2. Add `recoveryRemainingMs: number` to `EngineSnapshot`:
   ```ts
   export interface EngineSnapshot {
     // ...existing fields...
     readonly substate: EngineSubstate;
     readonly recoveryRemainingMs: number; // 0 when not in RECOVERY_PAUSE; 6500..0 during RECOVERY_PAUSE
     // ...existing fields...
   }
   ```

---

### 2.2 `src/engine/speed.ts`

1. Expose a public getter or public read access for `notesHitSinceLastFailure` on `SpeedController`:
   ```ts
   public getNotesHitSinceLastFailure(): number {
     return this.notesHitSinceLastFailure;
   }
   ```
   *(Note: `notesHitSinceLastFailure` is initialized to `Infinity` in `SpeedController`, incremented on `onCorrectHit()`, and reset to `0` inside `onFailure()`. Therefore, the engine MUST inspect `getNotesHitSinceLastFailure()` **before** calling `onFailure()`.)*

---

### 2.3 `src/engine/engine.ts`

1. Define recovery pause timing constants in `ENGINE_GEOMETRY` or as exported constants:
   ```ts
   export const RECOVERY_PAUSE_TOTAL_MS = 6500;
   export const RECOVERY_LOOKAHEAD_MS = 1000; // Final 1.0s of the 6.5s pause is static lookahead
   export const ERROR_CLUSTER_THRESHOLD = 6;  // <= 6 correct hits since previous failure
   ```
2. Add private state fields to `SightReadingEngine`:
   ```ts
   private recoveryRemainingMs = 0;
   private pendingRecoveryPause = false;
   private wrongAttemptsDuringCorrection = 0;
   ```
3. **Recording Failure Trigger Conditions (Critical Order of Operations)**:
   Create a private helper `triggerNoteFailure(note: ActiveNote)` or update both failure sites (`tick()` late miss at `frontmost.x < ENGINE_GEOMETRY.HIT_ZONE_LEFT_X` and `handleNoteInput()` wrong hit inside hittable window):
   ```ts
   // MUST evaluate BEFORE calling speedController.onFailure() and BEFORE mutating this.phase:
   const hitsSinceLastFail = this.speedController.getNotesHitSinceLastFailure();
   const isClusterOrHoldFailure =
     hitsSinceLastFail <= ERROR_CLUSTER_THRESHOLD || this.phase === 'HOLD';

   this.pendingRecoveryPause = isClusterOrHoldFailure;
   this.wrongAttemptsDuringCorrection = 0;

   // Now execute existing failure state transitions:
   note.state = 'failed';
   this.failedNote = note;
   this.substate = 'WAITING_FOR_CORRECTION';
   this.distribution.recordFailure(note.target, this.lastPrecedingTarget);
   this.speedController.onFailure(this.phase as 'SPEED_UP' | 'HOLD');
   if (this.phase === 'HOLD') {
     this.phase = 'SPEED_UP';
   }
   ```
4. **Updating `WAITING_FOR_CORRECTION` inside `handleNoteInput(input)`**:
   - When `matchesTarget(input, this.failedNote.target)` is `true`:
     ```ts
     const target = this.failedNote.target;
     this.failedNote.state = 'hit';
     this.failedNote.stateTimeMs = 0;
     this.lastPrecedingTarget = target;
     this.failedNote = null;

     if (this.pendingRecoveryPause) {
       this.substate = 'RECOVERY_PAUSE';
       this.recoveryRemainingMs = RECOVERY_PAUSE_TOTAL_MS;
       this.pendingRecoveryPause = false;
       this.wrongAttemptsDuringCorrection = 0;
     } else {
       this.substate = 'NORMAL';
       this.speedController.startRecoveryRamp();
     }
     return { outcome: 'correction_complete', matchedTarget: target };
     ```
   - When `matchesTarget(input, this.failedNote.target)` is `false` (wrong key pressed during correction):
     ```ts
     this.wrongAttemptsDuringCorrection++;
     if (this.wrongAttemptsDuringCorrection >= 2) {
       this.pendingRecoveryPause = true;
     }
     return { outcome: 'wrong_hit', matchedTarget: this.failedNote.target };
     ```
5. **Handling Input During `RECOVERY_PAUSE` inside `handleNoteInput(input)`**:
   - Return type of `handleNoteInput` adds `'recovery_muted'` to the `outcome` union:
     ```ts
     outcome:
       | 'correct_hit'
       | 'wrong_hit'
       | 'correction_complete'
       | 'empty_zone'
       | 'level_advance'
       | 'recovery_muted'
       | 'ignored';
     ```
   - When `this.substate === 'RECOVERY_PAUSE'`:
     - Do **not** penalize the user, do **not** extend the timer, and do **not** mark any note as failed.
     - During the eyes-closed phase (`this.recoveryRemainingMs > RECOVERY_LOOKAHEAD_MS`), return `{ outcome: 'recovery_muted' }`.
     - During the final 1.0s lookahead phase (`this.recoveryRemainingMs <= RECOVERY_LOOKAHEAD_MS`), if the user strikes a note that is already inside the hittable window, or in general during `RECOVERY_PAUSE`, keep it simple and consistent: return `{ outcome: 'recovery_muted' }` until scrolling resumes at `0 ms`.
6. **Updating `tick(deltaMs)` for `RECOVERY_PAUSE`**:
   - Inside `if (this.phase === 'SPEED_UP' || this.phase === 'HOLD')`:
     - When `this.substate === 'RECOVERY_PAUSE'`:
       - Call `this.speedController.tick(deltaSec, true)` (paused).
       - Decrement `this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaMs)`.
       - Keep all `approaching` notes stationary.
       - When `this.recoveryRemainingMs <= 0`:
         - Set `this.recoveryRemainingMs = 0`.
         - Set `this.substate = 'NORMAL'`.
         - Call `this.speedController.startRecoveryRamp()`.
7. **Updating `getSnapshot()`**:
   - Include `recoveryRemainingMs: this.recoveryRemainingMs` in the returned `EngineSnapshot`.

---

### 2.4 `src/audio/recoveryAudio.ts` (New Zero-Dependency Web Audio Module)

Create `src/audio/recoveryAudio.ts` to synthesize the three subtle acoustic cues using the browser's `AudioContext` (with full defensive guards so tests in `jsdom` where `window.AudioContext` is undefined never throw):

1. `playSanctuaryRestChime(): void`
   - Triggered when entering `RECOVERY_PAUSE` (`6500 ms`).
   - Fundamental sine wave at `261.63 Hz` ($C_4$) with initial gain `0.28` decaying exponentially to `0.0001` over `3.2s`.
   - Soft harmonic triangle/sine overtone at `523.25 Hz` ($C_5$) with initial gain `0.06` decaying exponentially over `1.8s`.
2. `playSanctuaryWakeChime(): void`
   - Triggered when `recoveryRemainingMs` crosses `<= 1000 ms` (entering the 1.0s static lookahead window).
   - Ascending two-note fifth: `523.25 Hz` ($C_5$) at `t = 0` (`140 ms` decay, gain `0.18`) followed by `783.99 Hz` ($G_5$) at `t + 0.12s` (`450 ms` decay, gain `0.22`).
3. `playMutedFeltThud(): void`
   - Triggered when `handleNoteInput` returns `outcome === 'recovery_muted'`.
   - Short low-frequency sine/triangle thud (`110 Hz` dropping to `55 Hz` over `55 ms`, gain `0.10` decaying to `0.001`), mimicking an unvoiced felt keybed touch.

All functions in `src/audio/recoveryAudio.ts` MUST wrap `AudioContext` access in `try { ... } catch { /* ignore in headless/uninitialized environments */ }` and check `typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)`.

---

### 2.5 `src/components/GrandStaffCanvas.tsx` & `src/styles/app.css`

1. **Sanctuary Overlay in `GrandStaffCanvas.tsx`**:
   - Compute whether the sanctuary dark phase is active:
     ```ts
     const isSanctuaryDark =
       snapshot.substate === 'RECOVERY_PAUSE' && snapshot.recoveryRemainingMs > 1000;
     const isRecoveryLookahead =
       snapshot.substate === 'RECOVERY_PAUSE' &&
       snapshot.recoveryRemainingMs > 0 &&
       snapshot.recoveryRemainingMs <= 1000;
     ```
   - Inside `<div className="nnsr-staff-container">`, render an overlay element (always mounted or conditionally styled so CSS opacity transitions smoothly):
     ```tsx
     <div
       className={`nnsr-recovery-sanctuary ${isSanctuaryDark ? 'active' : ''} ${
         isRecoveryLookahead ? 'lookahead' : ''
       }`}
       aria-hidden={!isSanctuaryDark}
       data-testid="recovery-sanctuary-overlay"
     >
       <p className="nnsr-recovery-prompt-main">Close your eyes. Drop your shoulders.</p>
       <p className="nnsr-recovery-prompt-sub">A chime will wake the staff.</p>
     </div>
     ```
   - **Strict UI Constraint**: Do NOT render any countdown numbers, seconds remaining, or progress bars inside `.nnsr-recovery-sanctuary`.
2. **Styling in `src/styles/app.css`**:
   - `.nnsr-recovery-sanctuary`:
     - `position: absolute; inset: 0; z-index: 10;`
     - `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;`
     - `background-color: rgba(24, 26, 25, 0.90);`
     - `opacity: 0; pointer-events: none;`
     - `transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1);`
   - `.nnsr-recovery-sanctuary.active`:
     - `opacity: 1;`
   - `.nnsr-recovery-sanctuary.lookahead`:
     - `opacity: 0;` (fades out over 350ms as the 1.0s static lookahead begins)
   - `.nnsr-recovery-prompt-main`:
     - `font-family: var(--font-serif); font-size: 1.35rem; font-weight: 500; color: #f4f3ef; letter-spacing: 0.02em;`
   - `.nnsr-recovery-prompt-sub`:
     - `font-family: var(--font-sans); font-size: 0.78rem; font-weight: 500; color: rgba(244, 243, 239, 0.58); letter-spacing: 0.04em;`

---

### 2.6 `src/App.tsx`

1. Wire up the audio triggers cleanly:
   - In `handleNoteInput`:
     - If `result.outcome === 'recovery_muted'`, call `playMutedFeltThud()` and return early (do NOT flash red/green key highlights on the piano keyboard).
     - If `result.outcome === 'correction_complete'` and `engine.getSnapshot().substate === 'RECOVERY_PAUSE'`, call `playSanctuaryRestChime()`.
   - In the animation `loop` (or via a `useRef` tracking the previous `recoveryRemainingMs`):
     - When `prevRecoveryMs > 1000 && nextRecoveryMs <= 1000 && nextRecoveryMs > 0`, call `playSanctuaryWakeChime()`.

---

## 3. Unit & Integration Test Requirements

1. **Preserve All Existing 96 Tests**:
   - Single isolated mistakes in `SPEED_UP` (like the one in `tests/engine/engine.test.ts`) must still transition directly from `WAITING_FOR_CORRECTION` to `NORMAL` on correction.
2. **Add New Tests in `tests/engine/recoveryPause.test.ts` (and/or `tests/ui/workspace.test.tsx`)**:
   - **Test 1 (Isolated Slip Does Not Trigger Break)**: Make 1st mistake in `SPEED_UP` (or a mistake after $> 6$ correct hits), correct it $\rightarrow$ verify `substate === 'NORMAL'` and `recoveryRemainingMs === 0`.
   - **Test 2 (Clustered Mistake $\le 6$ Notes Triggers Break Post-Correction)**: Make a mistake, correct it, hit 3 notes ($\le 6$), make a 2nd mistake $\rightarrow$ verify `substate === 'WAITING_FOR_CORRECTION'`, then play the correct note $\rightarrow$ verify `substate === 'RECOVERY_PAUSE'` and `recoveryRemainingMs === 6500`.
   - **Test 3 (Correction Double-Fault Triggers Break)**: Make an isolated mistake after 10 hits, press wrong key twice while in `WAITING_FOR_CORRECTION`, then press the correct key $\rightarrow$ verify `substate === 'RECOVERY_PAUSE'` and `recoveryRemainingMs === 6500`.
   - **Test 4 (HOLD Phase Mistake Triggers Break Post-Correction)**: Reach `HOLD` phase, make a single mistake, then play the correct note $\rightarrow$ verify `substate === 'RECOVERY_PAUSE'` and `recoveryRemainingMs === 6500`.
   - **Test 5 (Impatient Key Presses During Break Are Muted & Non-Punitive)**: While in `RECOVERY_PAUSE`, send wrong and right note inputs $\rightarrow$ verify `outcome === 'recovery_muted'`, `recoveryRemainingMs` is not extended, and no notes are marked `failed`.
   - **Test 6 (6.5s Timeline & Resumption)**: Tick `5500 ms` $\rightarrow$ verify still in `RECOVERY_PAUSE` with `recoveryRemainingMs === 1000` and notes have not scrolled; tick remaining `1000 ms` $\rightarrow$ verify `substate === 'NORMAL'`, `recoveryRemainingMs === 0`, and `actualBpm === 15.0` (recovery ramp started).
   - **Test 7 (UI Overlay Verification)**: Render `GrandStaffCanvas` with a snapshot in `RECOVERY_PAUSE` (`recoveryRemainingMs: 5000`) $\rightarrow$ verify `.nnsr-recovery-sanctuary.active` is present with `"Close your eyes. Drop your shoulders."` and contains no numeric digits.
