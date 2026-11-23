import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playMutedFeltThud } from '../audio/recoveryAudio';
import { formatChordLabel } from '../chord/chords';
import {
  AdaptiveNamingScheduler,
  ChordNamingConfig,
  ChordNamingPrompt,
  MAJOR_ROMAN_BUTTONS,
  MINOR_ROMAN_BUTTONS,
  ROMAN_SCALE_SPECS,
  evaluateChordNamingAnswer,
  formatPromptCanonicalAnswer,
  getPoolQualities,
} from '../chord/naming';
import { getLedgerLines } from '../music/notation';
import { KEY_SIGNATURES } from '../music/scales';
import { useAppStore } from '../store/useAppStore';
import { ChordNotationSystem, ChordQuality } from '../types/chord';

export interface ChordNamingArenaProps {
  readonly config: ChordNamingConfig;
  readonly onExit: () => void;
  readonly onReconfigure: () => void;
  readonly initialPrompts?: readonly ChordNamingPrompt[];
}

interface RootButtonSpec {
  readonly intlValue: string;
  readonly germanValue: string;
  readonly intlLabel: string;
  readonly germanLabel: string;
}

interface BlackKeySpec {
  readonly intlValue: string;
  readonly germanValue: string;
  readonly intlLines: readonly [string] | readonly [string, string];
  readonly germanLines: readonly [string] | readonly [string, string];
  /** Exact boundary index between white keys (1=C/D, 2=D/E, 4=F/G, 5=G/A, 6=A/B) */
  readonly boundaryIndex: number;
}

const ACCIDENTAL_ROOT_BUTTONS: readonly BlackKeySpec[] = [
  { intlValue: 'C#', germanValue: 'C#', intlLines: ['C♯', 'D♭'], germanLines: ['C♯', 'D♭'], boundaryIndex: 1 },
  { intlValue: 'Eb', germanValue: 'Eb', intlLines: ['D♯', 'E♭'], germanLines: ['D♯', 'E♭'], boundaryIndex: 2 },
  { intlValue: 'F#', germanValue: 'F#', intlLines: ['F♯', 'G♭'], germanLines: ['F♯', 'G♭'], boundaryIndex: 4 },
  { intlValue: 'Ab', germanValue: 'Ab', intlLines: ['G♯', 'A♭'], germanLines: ['G♯', 'A♭'], boundaryIndex: 5 },
  { intlValue: 'Bb', germanValue: 'B', intlLines: ['A♯', 'B♭'], germanLines: ['B'], boundaryIndex: 6 },
];

const NATURAL_ROOT_BUTTONS: readonly RootButtonSpec[] = [
  { intlValue: 'C', germanValue: 'C', intlLabel: 'C', germanLabel: 'C' },
  { intlValue: 'D', germanValue: 'D', intlLabel: 'D', germanLabel: 'D' },
  { intlValue: 'E', germanValue: 'E', intlLabel: 'E', germanLabel: 'E' },
  { intlValue: 'F', germanValue: 'F', intlLabel: 'F', germanLabel: 'F' },
  { intlValue: 'G', germanValue: 'G', intlLabel: 'G', germanLabel: 'G' },
  { intlValue: 'A', germanValue: 'A', intlLabel: 'A', germanLabel: 'A' },
  { intlValue: 'B', germanValue: 'H', intlLabel: 'B', germanLabel: 'H' },
];

const QUALITY_BUTTON_META: Record<
  Exclude<ChordQuality, 'augmented'>,
  { label: string; suffix: string }
> = {
  major: { label: 'Major', suffix: '' },
  minor: { label: 'm', suffix: 'm' },
  dominant7: { label: '7', suffix: '7' },
  major7: { label: 'maj7', suffix: 'maj7' },
  minor7: { label: 'm7', suffix: 'm7' },
  diminished: { label: 'dim', suffix: 'dim' },
  sus2: { label: 'sus2', suffix: 'sus2' },
  sus4: { label: 'sus4', suffix: 'sus4' },
};

const IDLE_CLAMP_MS = 30_000;
const ROLLING_WINDOW_SIZE = 20;

function getRootValue(
  btn: { readonly intlValue: string; readonly germanValue: string },
  notation: ChordNotationSystem
): string {
  return notation === 'german' ? btn.germanValue : btn.intlValue;
}

function getRootLabel(btn: RootButtonSpec, notation: ChordNotationSystem): string {
  return notation === 'german' ? btn.germanLabel : btn.intlLabel;
}

export const ChordNamingArena: React.FC<ChordNamingArenaProps> = ({
  config,
  onReconfigure,
  initialPrompts,
}) => {
  const chordNotationSystem = useAppStore((state) => state.chordNotationSystem);
  const persistedAdaptiveState = useAppStore((state) => state.chordNamingAdaptiveState);
  const setChordNamingAdaptiveState = useAppStore((state) => state.setChordNamingAdaptiveState);

  const schedulerRef = useRef<AdaptiveNamingScheduler>(
    new AdaptiveNamingScheduler(config, persistedAdaptiveState)
  );

  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [currentPrompt, setCurrentPrompt] = useState<ChordNamingPrompt>(() =>
    initialPrompts?.[0] ?? schedulerRef.current.sampleNextPrompt()
  );
  const [unlockedCount, setUnlockedCount] = useState<number>(() =>
    schedulerRef.current.getUnlockedCount()
  );
  const [newlyUnlockedBanner, setNewlyUnlockedBanner] = useState<string | null>(null);
  const [recentDurationsMs, setRecentDurationsMs] = useState<number[]>([]);

  const [inputValue, setInputValue] = useState<string>('');
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<Exclude<ChordQuality, 'augmented'>>('major');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastSolvedLabel, setLastSolvedLabel] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [hadMistakeOnCurrent, setHadMistakeOnCurrent] = useState<boolean>(false);
  const [promptStartedAtMs, setPromptStartedAtMs] = useState<number>(() => performance.now());

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedRootRef = useRef<string | null>(null);
  const selectedQualityRef = useRef<Exclude<ChordQuality, 'augmented'>>('major');

  const activeQualities = useMemo(
    () => getPoolQualities(config.poolId, unlockedCount),
    [config.poolId, unlockedCount]
  );

  const resetForNextPrompt = useCallback(() => {
    setInputValue('');
    selectedRootRef.current = null;
    selectedQualityRef.current = 'major';
    setSelectedRoot(null);
    setSelectedQuality('major');
    setRevealedAnswer(null);
  }, []);

  // Re-initialize scheduler when config changes
  useEffect(() => {
    const latestAdaptive = useAppStore.getState().chordNamingAdaptiveState;
    const nextScheduler = new AdaptiveNamingScheduler(config, latestAdaptive);
    schedulerRef.current = nextScheduler;

    setSolvedCount(0);
    setCurrentPrompt(initialPrompts?.[0] ?? nextScheduler.sampleNextPrompt());
    setUnlockedCount(nextScheduler.getUnlockedCount());
    setNewlyUnlockedBanner(null);
    setRecentDurationsMs([]);
    resetForNextPrompt();
    setFeedback('idle');
    setLastSolvedLabel(null);
    setHadMistakeOnCurrent(false);
    setPromptStartedAtMs(performance.now());
  }, [config, initialPrompts, resetForNextPrompt]);

  const submitAnswerString = useCallback(
    (rawAnswer: string) => {
      const trimmed = rawAnswer.trim();
      if (!trimmed) return;

      const isCorrect = evaluateChordNamingAnswer(
        trimmed,
        currentPrompt,
        config.answerMode,
        chordNotationSystem
      );

      if (isCorrect) {
        const now = performance.now();
        const rawElapsed = Math.max(100, now - promptStartedAtMs);
        const clampedElapsed = Math.min(IDLE_CLAMP_MS, rawElapsed);
        const wasFirstTry = !hadMistakeOnCurrent;

        const solvedLabel = formatPromptCanonicalAnswer(
          currentPrompt,
          config.answerMode,
          chordNotationSystem
        );
        setLastSolvedLabel(solvedLabel);
        setFeedback('correct');
        resetForNextPrompt();
        setHadMistakeOnCurrent(false);

        // Update rolling speed window (ignore long phone-idle gaps)
        if (rawElapsed <= IDLE_CLAMP_MS) {
          setRecentDurationsMs((prev) => [...prev.slice(-(ROLLING_WINDOW_SIZE - 1)), clampedElapsed]);
        }

        // Update adaptive scheduler & persist progress immediately
        const { newlyUnlockedId } = schedulerRef.current.recordResult(currentPrompt, {
          firstTry: wasFirstTry,
          elapsedMs: clampedElapsed,
        });
        setUnlockedCount(schedulerRef.current.getUnlockedCount());

        if (newlyUnlockedId) {
          const displayUnlocked =
            config.answerMode === 'roman_numeral'
              ? newlyUnlockedId
              : formatChordLabel(newlyUnlockedId, chordNotationSystem);
          setNewlyUnlockedBanner(
            `★ Unlocked: ${displayUnlocked} (${schedulerRef.current.getUnlockedCount()} / ${schedulerRef.current.getTotalPoolSize()})`
          );
        } else {
          setNewlyUnlockedBanner(null);
        }

        const prevPersisted = useAppStore.getState().chordNamingAdaptiveState;
        setChordNamingAdaptiveState(schedulerRef.current.toPersistedState(prevPersisted));

        const nextCount = solvedCount + 1;
        setSolvedCount(nextCount);
        setPromptStartedAtMs(now);
        setCurrentPrompt(
          initialPrompts && nextCount < initialPrompts.length
            ? initialPrompts[nextCount]!
            : schedulerRef.current.sampleNextPrompt()
        );
      } else {
        playMutedFeltThud();
        setFeedback('wrong');
        setHadMistakeOnCurrent(true);
      }
    },
    [
      currentPrompt,
      config.answerMode,
      chordNotationSystem,
      promptStartedAtMs,
      hadMistakeOnCurrent,
      resetForNextPrompt,
      setChordNamingAdaptiveState,
      solvedCount,
      initialPrompts,
    ]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswerString(inputValue);
  };

  const handleSelectRoot = (rootVal: string) => {
    selectedRootRef.current = rootVal;
    setSelectedRoot(rootVal);
    if (feedback === 'wrong') setFeedback('idle');
    const suffix = QUALITY_BUTTON_META[selectedQualityRef.current].suffix;
    setInputValue(`${rootVal}${suffix}`);
  };

  const handleSelectQuality = (q: Exclude<ChordQuality, 'augmented'>) => {
    selectedQualityRef.current = q;
    setSelectedQuality(q);
    if (feedback === 'wrong') setFeedback('idle');
    if (selectedRootRef.current) {
      setInputValue(`${selectedRootRef.current}${QUALITY_BUTTON_META[q].suffix}`);
    }
  };

  const handleRomanTap = (roman: string) => {
    setInputValue(roman);
    submitAnswerString(roman);
  };

  const handleReveal = () => {
    setHadMistakeOnCurrent(true);
    setRevealedAnswer(
      formatPromptCanonicalAnswer(currentPrompt, config.answerMode, chordNotationSystem)
    );
  };

  const keySigSpec = KEY_SIGNATURES[currentPrompt.keySignature] ?? KEY_SIGNATURES.C_MAJOR;
  const romanScaleSpec = ROMAN_SCALE_SPECS[config.fixedKey];
  const romanButtons =
    romanScaleSpec.mode === 'minor' ? MINOR_ROMAN_BUTTONS : MAJOR_ROMAN_BUTTONS;
  const rollingSecPerChord =
    recentDurationsMs.length > 0
      ? recentDurationsMs.reduce((a, b) => a + b, 0) / recentDurationsMs.length / 1000
      : null;

  const trebleLines = [42, 54, 66, 78, 90];
  const bassLines = [132, 144, 156, 168, 180];
  const keyAccCount = keySigSpec.trebleStepOffsets.length;
  const keyAccSpacing = keyAccCount >= 4 ? 11 : 14;
  const maxSlot = currentPrompt.notes.reduce((m, n) => Math.max(m, n.slot ?? 0), 0);
  const leftNoteStartX =
    keyAccCount === 0 ? 104 : 78 + (keyAccCount - 1) * keyAccSpacing + 30;
  const rightNoteEndX = 278;

  const getSlotX = (slot: number): number => {
    if (maxSlot === 0) {
      return Math.max(leftNoteStartX + 18, keyAccCount >= 4 ? 210 : 194);
    }
    if (maxSlot === 1) {
      const center = (leftNoteStartX + rightNoteEndX) / 2;
      const gap = Math.min(58, (rightNoteEndX - leftNoteStartX) * 0.44);
      return slot === 0 ? center - gap / 2 : center + gap / 2;
    }
    const usableLeft = leftNoteStartX + 8;
    const usableRight = rightNoteEndX - 8;
    return usableLeft + (slot / maxSlot) * (usableRight - usableLeft);
  };

  return (
    <div
      className="nnsr-chord-naming-arena"
      data-testid="chord-naming-arena"
      style={{
        width: '100%',
        maxWidth: '840px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Minimal Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--ink-primary)' }}>
          {config.answerMode === 'roman_numeral'
            ? `Roman Numerals · ${romanScaleSpec.label}`
            : 'Name the Chord'}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            data-testid="chord-naming-unlocked"
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--emerald)',
              background: 'rgba(77, 144, 120, 0.12)',
              padding: '4px 10px',
              borderRadius: '9999px',
            }}
          >
            Unlocked: {unlockedCount} / {schedulerRef.current.getTotalPoolSize()}
          </span>

          {rollingSecPerChord !== null && (
            <span
              data-testid="chord-naming-speed"
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                background: 'var(--surface-subtle)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {rollingSecPerChord.toFixed(1)} s/chord
            </span>
          )}

          <button
            type="button"
            onClick={onReconfigure}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
            }}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Compact Portrait-Friendly Grand Staff Card (320 x 220 viewBox, always showing Treble & Bass clefs) */}
      <div
        className="nnsr-staff-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: 'auto',
          margin: '0 auto',
        }}
      >
        <svg
          viewBox="0 0 320 220"
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#ffffff' }}
        >
          {trebleLines.map((y) => (
            <line
              key={`naming-treble-line-${y}`}
              x1={22}
              y1={y}
              x2={300}
              y2={y}
              stroke="#2c332f"
              strokeWidth={1.25}
            />
          ))}

          {bassLines.map((y) => (
            <line
              key={`naming-bass-line-${y}`}
              x1={22}
              y1={y}
              x2={300}
              y2={y}
              stroke="#2c332f"
              strokeWidth={1.25}
            />
          ))}

          <line x1={22} y1={42} x2={22} y2={180} stroke="#2c332f" strokeWidth={2.0} />
          <line x1={300} y1={42} x2={300} y2={180} stroke="#2c332f" strokeWidth={2.0} />
          <path
            d="M 20 42 C 8 58, 19 94, 7 111 C 19 128, 8 164, 20 180 C 12 162, 22 129, 9.5 111 C 22 93, 12 60, 20 42 Z"
            fill="#1f2421"
          />

          <text
            x={48}
            y={75}
            fontFamily="serif"
            fontSize={52}
            fill="#1f2421"
            textAnchor="middle"
            dominantBaseline="middle"
            data-testid="chord-naming-clef-treble"
          >
            𝄞
          </text>
          <text
            x={48}
            y={163}
            fontFamily="serif"
            fontSize={52}
            fill="#1f2421"
            textAnchor="middle"
            dominantBaseline="middle"
            data-testid="chord-naming-clef-bass"
          >
            𝄢
          </text>

          {keySigSpec.accidentalType !== 'none' && (
            <g fontFamily="serif" fontSize={22} fill="#1f2421" textAnchor="middle">
              {keySigSpec.trebleStepOffsets.map((offset, idx) => (
                <text
                  key={`naming-ks-treble-${idx}`}
                  x={78 + idx * keyAccSpacing}
                  y={90 - offset * 6 + 7}
                >
                  {keySigSpec.accidentalType === 'sharp' ? '♯' : '♭'}
                </text>
              ))}
              {keySigSpec.bassStepOffsets.map((offset, idx) => (
                <text
                  key={`naming-ks-bass-${idx}`}
                  x={78 + idx * keyAccSpacing}
                  y={180 - offset * 6 + 7}
                >
                  {keySigSpec.accidentalType === 'sharp' ? '♯' : '♭'}
                </text>
              ))}
            </g>
          )}

          {(() => {
            // Group notes by (clef, slot) so seconds, accidentals, and stems align per vertical column
            const groups = new Map<
              string,
              {
                clef: 'treble' | 'bass';
                slot: number;
                items: { note: (typeof currentPrompt.notes)[number]; idx: number }[];
              }
            >();

            currentPrompt.notes.forEach((note, idx) => {
              const noteClef = note.clef ?? currentPrompt.clef;
              const slot = note.slot ?? 0;
              const groupKey = `${noteClef}:${slot}`;
              const existing = groups.get(groupKey);
              if (existing) {
                existing.items.push({ note, idx });
              } else {
                groups.set(groupKey, { clef: noteClef, slot, items: [{ note, idx }] });
              }
            });

            const showStems = maxSlot > 0;

            return Array.from(groups.values()).map((group) => {
              const staffBottomY = group.clef === 'treble' ? 90 : 180;
              const baseX = getSlotX(group.slot);
              const sorted = [...group.items].sort(
                (a, b) => a.note.stepOffset - b.note.stepOffset
              );

              let prevStepOffset: number | null = null;
              let accSlot = 0;

              const avgStep =
                sorted.reduce((sum, item) => sum + item.note.stepOffset, 0) / sorted.length;
              const stemUp = avgStep < 4;
              const lowestY = staffBottomY - sorted[0]!.note.stepOffset * 6;
              const highestY = staffBottomY - sorted[sorted.length - 1]!.note.stepOffset * 6;
              const stemX = stemUp ? baseX + 7.5 : baseX - 7.5;
              const stemY1 = stemUp ? lowestY - 1 : highestY + 1;
              const stemY2 = stemUp ? highestY - 30 : lowestY + 30;

              return (
                <g key={`naming-group-${group.clef}-${group.slot}`}>
                  {showStems && (
                    <line
                      x1={stemX}
                      y1={stemY1}
                      x2={stemX}
                      y2={stemY2}
                      stroke="#1f2421"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  )}
                  {sorted.map(({ note, idx }) => {
                    const y = staffBottomY - note.stepOffset * 6;
                    const isSecond =
                      prevStepOffset !== null && note.stepOffset - prevStepOffset <= 1;
                    prevStepOffset = note.stepOffset;

                    const noteheadX = isSecond ? baseX + 14.5 : baseX;
                    const ledgerLines = getLedgerLines(note.stepOffset);

                    let accX = baseX - 18;
                    if (note.displayAccidental) {
                      accX = baseX - 18 - accSlot * 11;
                      accSlot = (accSlot + 1) % 2;
                    }

                    return (
                      <g key={`naming-note-${idx}-${note.midi}-${group.slot}`}>
                        {ledgerLines.map((lOffset) => {
                          const ly = staffBottomY - lOffset * 6;
                          return (
                            <line
                              key={`naming-ledger-${idx}-${note.midi}-${lOffset}`}
                              x1={noteheadX - 14}
                              y1={ly}
                              x2={noteheadX + 14}
                              y2={ly}
                              stroke="#1f2421"
                              strokeWidth={1.8}
                            />
                          );
                        })}

                        {note.displayAccidental && (
                          <text
                            x={accX}
                            y={y + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontFamily="serif"
                            fontSize={21}
                            fill="#1f2421"
                          >
                            {note.displayAccidental === 'sharp'
                              ? '♯'
                              : note.displayAccidental === 'flat'
                              ? '♭'
                              : '♮'}
                          </text>
                        )}

                        <ellipse
                          data-testid={`naming-notehead-${note.midi}`}
                          cx={noteheadX}
                          cy={y}
                          rx={8.2}
                          ry={5.6}
                          fill="#1f2421"
                          transform={`rotate(-20 ${noteheadX} ${y})`}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            });
          })()}
        </svg>

        {newlyUnlockedBanner ? (
          <div
            data-testid="chord-naming-unlock-banner"
            style={{
              position: 'absolute',
              top: '8px',
              right: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'var(--moss-green)',
              padding: '3px 10px',
              borderRadius: '9999px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            {newlyUnlockedBanner}
          </div>
        ) : (
          lastSolvedLabel &&
          feedback === 'correct' && (
            <div
              data-testid="chord-naming-last-solved"
              style={{
                position: 'absolute',
                top: '8px',
                right: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--emerald)',
                background: 'rgba(77, 144, 120, 0.12)',
                padding: '3px 10px',
                borderRadius: '9999px',
              }}
            >
              ✓ {lastSolvedLabel}
            </div>
          )
        )}
      </div>

      {/* Touch-Friendly Tap Selector + Keyboard Form */}
      <div
        style={{
          backgroundColor: 'var(--surface-paper)',
          border: `2px solid ${
            feedback === 'wrong'
              ? 'var(--vibrant-coral)'
              : feedback === 'correct'
              ? 'var(--emerald)'
              : 'var(--border-subtle)'
          }`,
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'border-color 0.15s ease',
        }}
      >
        {config.answerMode === 'roman_numeral' ? (
          <div
            data-testid="roman-tap-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '6px',
            }}
          >
            {romanButtons.map((roman) => (
              <button
                key={roman}
                type="button"
                data-testid={`roman-btn-${roman}`}
                onClick={() => handleRomanTap(roman)}
                style={{
                  padding: '14px 4px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                  background: '#faf9f6',
                  color: 'var(--ink-primary)',
                  border: '1.5px solid var(--border-strong)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {roman}
              </button>
            ))}
          </div>
        ) : (
          <div
            data-testid="chord-tap-pad"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {/* True 1-Octave Piano Keyboard Root Selector */}
            <div
              data-testid="piano-root-selector"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
                height: '116px',
                margin: '0 auto',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  height: '100%',
                  gap: '2px',
                }}
              >
                {NATURAL_ROOT_BUTTONS.map((btn) => {
                  const val = getRootValue(btn, chordNotationSystem);
                  const label = getRootLabel(btn, chordNotationSystem);
                  const isSelected = selectedRoot === val;
                  return (
                    <button
                      key={btn.intlValue}
                      type="button"
                      data-testid={`root-btn-${btn.intlValue}`}
                      onClick={() => handleSelectRoot(val)}
                      style={{
                        height: '100%',
                        padding: '0 2px 10px 2px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        borderRadius: '0 0 7px 7px',
                        border: isSelected ? '2px solid var(--emerald)' : '1.5px solid #2c332f',
                        backgroundColor: isSelected ? 'rgba(77, 144, 120, 0.22)' : '#ffffff',
                        color: isSelected ? 'var(--emerald)' : 'var(--ink-primary)',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {ACCIDENTAL_ROOT_BUTTONS.map((btn) => {
                const val = getRootValue(btn, chordNotationSystem);
                const lines = chordNotationSystem === 'german' ? btn.germanLines : btn.intlLines;
                const isSelected = selectedRoot === val;
                const leftPct = (btn.boundaryIndex / 7) * 100;
                return (
                  <button
                    key={btn.intlValue}
                    type="button"
                    data-testid={`root-btn-${btn.intlValue}`}
                    onClick={() => handleSelectRoot(val)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${leftPct}%`,
                      transform: 'translateX(-50%)',
                      width: '11.4%',
                      height: '62%',
                      zIndex: 2,
                      padding: '0 2px 6px 2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '1px',
                      fontSize: lines.length > 1 ? '0.72rem' : '0.88rem',
                      fontWeight: 700,
                      lineHeight: 1.05,
                      borderRadius: '0 0 5px 5px',
                      border: isSelected ? '2px solid var(--tuscan-sun)' : '1px solid #141816',
                      backgroundColor: isSelected ? 'var(--emerald)' : '#1f2421',
                      color: '#ffffff',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    {lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </button>
                );
              })}
            </div>

            {/* Quality Row */}
            <div
              data-testid="quality-tap-row"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {activeQualities.map((q) => {
                const meta = QUALITY_BUTTON_META[q];
                const isSelected = selectedQuality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    data-testid={`quality-btn-${q}`}
                    onClick={() => handleSelectQuality(q)}
                    style={{
                      padding: '9px 14px',
                      minWidth: '58px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      border: isSelected ? '2px solid var(--emerald)' : '1px solid var(--border-strong)',
                      backgroundColor: isSelected ? 'var(--emerald)' : 'var(--surface-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--ink-primary)',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Textbox + Submit + Reveal Row */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '4px',
            borderTop: '1px solid var(--surface-subtle)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              selectedRootRef.current = null;
              setSelectedRoot(null);
              if (feedback === 'wrong') setFeedback('idle');
            }}
            placeholder={
              config.answerMode === 'roman_numeral'
                ? 'Or type Roman numeral…'
                : chordNotationSystem === 'german'
                ? 'Or type (C, Am, G7, Hm, B)…'
                : 'Or type (C, Am, G7, Bm, Bb)…'
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-testid="chord-naming-input"
            style={{
              flex: '1 1 180px',
              maxWidth: '260px',
              fontSize: '1.1rem',
              fontWeight: 700,
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              color: 'var(--ink-primary)',
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            data-testid="chord-naming-submit-btn"
            style={{
              backgroundColor: 'var(--emerald)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '11px 22px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            Check ↵
          </button>
          <button
            type="button"
            onClick={handleReveal}
            data-testid="chord-naming-reveal-btn"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              color: 'var(--ink-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '11px 14px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            Reveal
          </button>
        </form>
      </div>

      {/* Feedback / Revealed Answer Helper */}
      <div style={{ minHeight: '22px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 600 }}>
        {feedback === 'wrong' && !revealedAnswer && (
          <span data-testid="chord-naming-wrong-msg" style={{ color: 'var(--vibrant-coral)' }}>
            Not quite — try again!
          </span>
        )}
        {revealedAnswer && (
          <span data-testid="chord-naming-revealed-msg" style={{ color: 'var(--ink-secondary)' }}>
            Answer: <strong style={{ color: 'var(--ink-primary)' }}>{revealedAnswer}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
