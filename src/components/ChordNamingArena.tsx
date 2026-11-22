import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playMutedFeltThud, playSanctuaryWakeChime } from '../audio/recoveryAudio';
import { formatChordLabel } from '../chord/chords';
import {
  AdaptiveNamingScheduler,
  ChordNamingConfig,
  ChordNamingPrompt,
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

interface BlackKeySpec extends RootButtonSpec {
  /** Exact boundary index between white keys (1=C/D, 2=D/E, 4=F/G, 5=G/A, 6=A/B) */
  readonly boundaryIndex: number;
}

const ACCIDENTAL_ROOT_BUTTONS: readonly BlackKeySpec[] = [
  { intlValue: 'C#', germanValue: 'C#', intlLabel: 'C♯/D♭', germanLabel: 'C♯/D♭', boundaryIndex: 1 },
  { intlValue: 'Eb', germanValue: 'Eb', intlLabel: 'E♭', germanLabel: 'E♭', boundaryIndex: 2 },
  { intlValue: 'F#', germanValue: 'F#', intlLabel: 'F♯/G♭', germanLabel: 'F♯/G♭', boundaryIndex: 4 },
  { intlValue: 'Ab', germanValue: 'Ab', intlLabel: 'A♭', germanLabel: 'A♭', boundaryIndex: 5 },
  { intlValue: 'Bb', germanValue: 'B', intlLabel: 'B♭', germanLabel: 'B', boundaryIndex: 6 },
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

const ROMAN_BUTTONS: readonly string[] = ['I', 'ii', 'iii', 'IV', 'V', 'V7', 'vi'];

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) {
    return `${secs.toFixed(1)}s`;
  }
  return `${mins}m ${Math.floor(secs).toString().padStart(2, '0')}s`;
}

function getRootValue(btn: RootButtonSpec, notation: ChordNotationSystem): string {
  return notation === 'german' ? btn.germanValue : btn.intlValue;
}

function getRootLabel(btn: RootButtonSpec, notation: ChordNotationSystem): string {
  return notation === 'german' ? btn.germanLabel : btn.intlLabel;
}

export const ChordNamingArena: React.FC<ChordNamingArenaProps> = ({
  config,
  onExit,
  onReconfigure,
  initialPrompts,
}) => {
  const chordNotationSystem = useAppStore((state) => state.chordNotationSystem);
  const bestChordNamingSecPerChord = useAppStore((state) => state.bestChordNamingSecPerChord);
  const updateBestChordNamingSecPerChord = useAppStore(
    (state) => state.updateBestChordNamingSecPerChord
  );
  const persistedAdaptiveState = useAppStore((state) => state.chordNamingAdaptiveState);
  const setChordNamingAdaptiveState = useAppStore((state) => state.setChordNamingAdaptiveState);

  const totalCount = initialPrompts ? initialPrompts.length : config.totalChords;

  const schedulerRef = useRef<AdaptiveNamingScheduler>(
    new AdaptiveNamingScheduler(config, persistedAdaptiveState)
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentPrompt, setCurrentPrompt] = useState<ChordNamingPrompt | null>(() =>
    initialPrompts ? initialPrompts[0] ?? null : schedulerRef.current.sampleNextPrompt()
  );
  const [unlockedCount, setUnlockedCount] = useState<number>(() =>
    schedulerRef.current.getUnlockedCount()
  );
  const [unlockedThisSession, setUnlockedThisSession] = useState<string[]>([]);
  const [newlyUnlockedBanner, setNewlyUnlockedBanner] = useState<string | null>(null);
  const [weakSpots, setWeakSpots] = useState<{ key: string; misses: number; avgSec: number }[]>([]);

  const [inputValue, setInputValue] = useState<string>('');
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<Exclude<ChordQuality, 'augmented'>>('major');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastSolvedLabel, setLastSolvedLabel] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [hadMistakeOnCurrent, setHadMistakeOnCurrent] = useState<boolean>(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState<number>(0);
  const [startedAtMs, setStartedAtMs] = useState<number>(() => performance.now());
  const [promptStartedAtMs, setPromptStartedAtMs] = useState<number>(() => performance.now());
  const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);

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

  const initSession = useCallback(() => {
    const latestAdaptive = useAppStore.getState().chordNamingAdaptiveState;
    const nextScheduler = new AdaptiveNamingScheduler(config, latestAdaptive);
    schedulerRef.current = nextScheduler;

    const now = performance.now();
    setCurrentIndex(0);
    setCurrentPrompt(initialPrompts ? initialPrompts[0] ?? null : nextScheduler.sampleNextPrompt());
    setUnlockedCount(nextScheduler.getUnlockedCount());
    setUnlockedThisSession([]);
    setNewlyUnlockedBanner(null);
    setWeakSpots([]);
    resetForNextPrompt();
    setFeedback('idle');
    setLastSolvedLabel(null);
    setHadMistakeOnCurrent(false);
    setFirstTryCorrectCount(0);
    setStartedAtMs(now);
    setPromptStartedAtMs(now);
    setFinishedAtMs(null);
  }, [config, initialPrompts, resetForNextPrompt]);

  // Reset drill when config changes
  useEffect(() => {
    initSession();
  }, [initSession]);

  const isFinished = finishedAtMs !== null || currentIndex >= totalCount || currentPrompt === null;

  const submitAnswerString = useCallback(
    (rawAnswer: string) => {
      if (!currentPrompt || isFinished) return;
      const trimmed = rawAnswer.trim();
      if (!trimmed) return;

      const isCorrect = evaluateChordNamingAnswer(
        trimmed,
        currentPrompt,
        config.answerMode,
        chordNotationSystem
      );

      if (isCorrect) {
        playSanctuaryWakeChime();
        const now = performance.now();
        const elapsedMs = Math.max(100, now - promptStartedAtMs);
        const wasFirstTry = !hadMistakeOnCurrent;

        const solvedLabel = formatPromptCanonicalAnswer(
          currentPrompt,
          config.answerMode,
          chordNotationSystem
        );
        setLastSolvedLabel(solvedLabel);
        setFeedback('correct');
        resetForNextPrompt();

        if (wasFirstTry) {
          setFirstTryCorrectCount((c) => c + 1);
        }
        setHadMistakeOnCurrent(false);

        // Update adaptive scheduler & persist progress
        const { newlyUnlockedId } = schedulerRef.current.recordResult(currentPrompt, {
          firstTry: wasFirstTry,
          elapsedMs,
        });
        setUnlockedCount(schedulerRef.current.getUnlockedCount());

        if (newlyUnlockedId) {
          const displayUnlocked =
            config.answerMode === 'roman_numeral'
              ? newlyUnlockedId
              : formatChordLabel(newlyUnlockedId, chordNotationSystem);
          setUnlockedThisSession((prev) => [...prev, displayUnlocked]);
          setNewlyUnlockedBanner(
            `★ Unlocked: ${displayUnlocked} (${schedulerRef.current.getUnlockedCount()} / ${schedulerRef.current.getTotalPoolSize()})`
          );
        } else {
          setNewlyUnlockedBanner(null);
        }

        const prevPersisted = useAppStore.getState().chordNamingAdaptiveState;
        setChordNamingAdaptiveState(schedulerRef.current.toPersistedState(prevPersisted));

        const nextIndex = currentIndex + 1;
        if (nextIndex >= totalCount) {
          setFinishedAtMs(now);
          setCurrentIndex(nextIndex);
          setCurrentPrompt(null);
          setWeakSpots(schedulerRef.current.getWeakSpots(3));
          const totalSec = Math.max(0.1, (now - startedAtMs) / 1000);
          const secPerChord = totalSec / totalCount;
          updateBestChordNamingSecPerChord(secPerChord);
        } else {
          setCurrentIndex(nextIndex);
          setPromptStartedAtMs(now);
          setCurrentPrompt(
            initialPrompts
              ? initialPrompts[nextIndex] ?? null
              : schedulerRef.current.sampleNextPrompt()
          );
        }
      } else {
        playMutedFeltThud();
        setFeedback('wrong');
        setHadMistakeOnCurrent(true);
      }
    },
    [
      currentPrompt,
      isFinished,
      config.answerMode,
      chordNotationSystem,
      promptStartedAtMs,
      hadMistakeOnCurrent,
      resetForNextPrompt,
      setChordNamingAdaptiveState,
      currentIndex,
      totalCount,
      startedAtMs,
      updateBestChordNamingSecPerChord,
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
    if (!currentPrompt) return;
    setHadMistakeOnCurrent(true);
    setRevealedAnswer(
      formatPromptCanonicalAnswer(currentPrompt, config.answerMode, chordNotationSystem)
    );
  };

  const keySigSpec =
    currentPrompt && currentPrompt.keySignature
      ? KEY_SIGNATURES[currentPrompt.keySignature]
      : KEY_SIGNATURES.C_MAJOR;

  const progressFraction = totalCount > 0 ? Math.min(1, currentIndex / totalCount) : 0;
  const isAdaptiveMode = config.answerMode === 'roman_numeral' || config.poolId === 'adaptive';

  // Completion summary view
  if (isFinished) {
    const totalSeconds = Math.max(0.1, ((finishedAtMs ?? performance.now()) - startedAtMs) / 1000);
    const secPerChord = totalSeconds / Math.max(1, totalCount);
    const accuracyPct = Math.round((firstTryCorrectCount / Math.max(1, totalCount)) * 100);

    return (
      <div
        className="nnsr-chord-naming-summary"
        data-testid="chord-naming-summary"
        style={{
          width: '100%',
          maxWidth: '840px',
          backgroundColor: 'var(--surface-paper)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(31, 36, 33, 0.06)',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--emerald)',
            marginBottom: '6px',
          }}
        >
          Drill Complete · {totalCount} Chords
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            color: 'var(--ink-primary)',
            margin: '0 0 6px 0',
          }}
          data-testid="chord-naming-speed-result"
        >
          {secPerChord.toFixed(2)} s / chord
        </h2>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
          {config.answerMode === 'roman_numeral'
            ? `Roman Numerals in ${KEY_SIGNATURES[config.fixedKey].label}`
            : config.poolId === 'adaptive'
            ? `Adaptive Ladder · ${unlockedCount} / ${schedulerRef.current.getTotalPoolSize()} Chords Unlocked`
            : 'Chord Symbol Recognition'}
        </p>

        {unlockedThisSession.length > 0 && (
          <div
            data-testid="chord-naming-unlocked-summary"
            style={{
              display: 'inline-block',
              marginBottom: '18px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(95, 173, 86, 0.14)',
              color: 'var(--emerald)',
              fontWeight: 700,
              fontSize: '0.88rem',
            }}
          >
            ★ Unlocked this session: {unlockedThisSession.join(', ')}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            maxWidth: '540px',
            margin: '0 auto 20px auto',
          }}
        >
          <div style={{ background: 'var(--surface-subtle)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Time
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink-primary)', marginTop: '4px' }}>
              {formatDuration(totalSeconds)}
            </div>
          </div>
          <div style={{ background: 'var(--surface-subtle)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              First-Try Accuracy
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--emerald)', marginTop: '4px' }}>
              {accuracyPct}%
            </div>
          </div>
          <div style={{ background: 'var(--surface-subtle)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Personal Best
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink-primary)', marginTop: '4px' }}>
              {bestChordNamingSecPerChord !== null
                ? `${bestChordNamingSecPerChord.toFixed(2)} s`
                : `${secPerChord.toFixed(2)} s`}
            </div>
          </div>
        </div>

        {weakSpots.length > 0 && (
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--ink-secondary)',
              marginBottom: '22px',
            }}
          >
            <strong>Practice focus next run:</strong>{' '}
            {weakSpots
              .map((w) => {
                const label =
                  config.answerMode === 'roman_numeral'
                    ? w.key
                    : formatChordLabel(w.key, chordNotationSystem);
                return `${label} (${w.avgSec.toFixed(1)}s${w.misses > 0 ? `, ${w.misses} miss${w.misses > 1 ? 'es' : ''}` : ''})`;
              })
              .join(' · ')}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={initSession}
            data-testid="chord-naming-restart-btn"
            style={{
              background: 'var(--emerald)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Run Again
          </button>
          <button
            type="button"
            onClick={onReconfigure}
            style={{
              background: 'var(--surface-subtle)',
              color: 'var(--ink-primary)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Change Settings
          </button>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: '#ffffff',
              color: 'var(--ink-primary)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  const staffLines = [66, 78, 90, 102, 114];
  const staffBottomY = 114;
  const chordX = 192;

  return (
    <div
      className="nnsr-chord-naming-arena"
      data-testid="chord-naming-arena"
      style={{
        width: '100%',
        maxWidth: '840px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--ink-primary)' }}>
            Name the Chord —{' '}
            {config.answerMode === 'roman_numeral'
              ? `Roman Numerals (${KEY_SIGNATURES[config.fixedKey].label})`
              : config.poolId === 'adaptive'
              ? 'Adaptive Ladder'
              : 'Chord Symbols'}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
            {config.answerMode === 'roman_numeral'
              ? `Unlocked: ${unlockedCount} / ${schedulerRef.current.getTotalPoolSize()} functions · Tap a Roman numeral below.`
              : isAdaptiveMode
              ? `Unlocked: ${unlockedCount} / ${schedulerRef.current.getTotalPoolSize()} chords · Missed chords return sooner; master them to unlock more.`
              : 'Tap Root + Quality below (or type in the box) — inversions accepted as root.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            data-testid="chord-naming-counter"
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              background: 'var(--surface-subtle)',
              padding: '5px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            type="button"
            onClick={onReconfigure}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '5px 10px',
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

      {/* Compact Portrait-Friendly Staff Card (320 x 180 viewBox so notes are large & crisp on phones) */}
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
          viewBox="0 0 320 180"
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#ffffff' }}
        >
          {staffLines.map((y) => (
            <line
              key={`naming-staff-line-${y}`}
              x1={20}
              y1={y}
              x2={300}
              y2={y}
              stroke="#2c332f"
              strokeWidth={1.3}
            />
          ))}

          <line x1={20} y1={66} x2={20} y2={114} stroke="#2c332f" strokeWidth={2.0} />
          <line x1={300} y1={66} x2={300} y2={114} stroke="#2c332f" strokeWidth={2.0} />

          {currentPrompt && currentPrompt.clef === 'treble' ? (
            <text
              x={50}
              y={99}
              fontFamily="serif"
              fontSize={54}
              fill="#1f2421"
              textAnchor="middle"
              dominantBaseline="middle"
              data-testid="chord-naming-clef-treble"
            >
              𝄞
            </text>
          ) : (
            <text
              x={50}
              y={97}
              fontFamily="serif"
              fontSize={54}
              fill="#1f2421"
              textAnchor="middle"
              dominantBaseline="middle"
              data-testid="chord-naming-clef-bass"
            >
              𝄢
            </text>
          )}

          {currentPrompt && keySigSpec.accidentalType !== 'none' && (
            <g fontFamily="serif" fontSize={22} fill="#1f2421" textAnchor="middle">
              {(currentPrompt.clef === 'treble'
                ? keySigSpec.trebleStepOffsets
                : keySigSpec.bassStepOffsets
              ).map((offset, idx) => (
                <text
                  key={`naming-ks-${idx}`}
                  x={84 + idx * 14}
                  y={staffBottomY - offset * 6 + 7}
                >
                  {keySigSpec.accidentalType === 'sharp' ? '♯' : '♭'}
                </text>
              ))}
            </g>
          )}

          {currentPrompt &&
            (() => {
              let prevStepOffset: number | null = null;
              let accSlot = 0;

              return currentPrompt.notes.map((note) => {
                const y = staffBottomY - note.stepOffset * 6;
                const isSecond = prevStepOffset !== null && note.stepOffset - prevStepOffset <= 1;
                prevStepOffset = note.stepOffset;

                const noteheadX = isSecond ? chordX + 15 : chordX;
                const ledgerLines = getLedgerLines(note.stepOffset);

                let accX = chordX - 19;
                if (note.displayAccidental) {
                  accX = chordX - 19 - accSlot * 12;
                  accSlot = (accSlot + 1) % 2;
                }

                return (
                  <g key={`naming-note-${note.midi}`}>
                    {ledgerLines.map((lOffset) => {
                      const ly = staffBottomY - lOffset * 6;
                      return (
                        <line
                          key={`naming-ledger-${note.midi}-${lOffset}`}
                          x1={noteheadX - 15}
                          y1={ly}
                          x2={noteheadX + 15}
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
                        fontSize={22}
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
                      rx={8.5}
                      ry={5.8}
                      fill="#1f2421"
                      transform={`rotate(-20 ${noteheadX} ${y})`}
                    />
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
              top: '10px',
              right: '14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'var(--moss-green)',
              padding: '4px 12px',
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
              style={{
                position: 'absolute',
                top: '10px',
                right: '14px',
                fontSize: '0.8rem',
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

      {/* Slim Progress Bar */}
      <div
        style={{
          height: '6px',
          width: '100%',
          backgroundColor: 'var(--surface-subtle)',
          borderRadius: '9999px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressFraction * 100}%`,
            backgroundColor: 'var(--emerald)',
            transition: 'width 0.15s ease',
          }}
        />
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
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'border-color 0.15s ease',
        }}
      >
        {config.answerMode === 'roman_numeral' ? (
          <div
            data-testid="roman-tap-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '8px',
            }}
          >
            {ROMAN_BUTTONS.map((roman) => (
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
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {/* True 1-Octave Piano Keyboard Root Selector (7 white keys + 5 black keys at exact positions) */}
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
              {/* 7 White Keys */}
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

              {/* 5 Black Keys positioned at exact piano key boundaries (2-then-3 grouping with E-F gap) */}
              {ACCIDENTAL_ROOT_BUTTONS.map((btn) => {
                const val = getRootValue(btn, chordNotationSystem);
                const label = getRootLabel(btn, chordNotationSystem);
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
                      width: '11.2%',
                      height: '60%',
                      zIndex: 2,
                      padding: '0 2px 6px 2px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      fontSize: label.length > 3 ? '0.68rem' : '0.82rem',
                      fontWeight: 700,
                      lineHeight: 1.1,
                      borderRadius: '0 0 5px 5px',
                      border: isSelected ? '2px solid var(--tuscan-sun)' : '1px solid #141816',
                      backgroundColor: isSelected ? 'var(--emerald)' : '#1f2421',
                      color: '#ffffff',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Active Pool Quality Buttons */}
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
              flex: '1 1 200px',
              maxWidth: '280px',
              fontSize: '1.15rem',
              fontWeight: 700,
              padding: '10px 14px',
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
      <div style={{ minHeight: '24px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
        {feedback === 'wrong' && !revealedAnswer && (
          <span data-testid="chord-naming-wrong-msg" style={{ color: 'var(--vibrant-coral)' }}>
            Not quite — try again!
          </span>
        )}
        {revealedAnswer && (
          <span data-testid="chord-naming-revealed-msg" style={{ color: 'var(--ink-secondary)' }}>
            Answer: <strong style={{ color: 'var(--ink-primary)' }}>{revealedAnswer}</strong> (select or type it to continue)
          </span>
        )}
      </div>
    </div>
  );
};
