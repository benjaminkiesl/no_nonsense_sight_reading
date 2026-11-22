import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playMutedFeltThud, playSanctuaryWakeChime } from '../audio/recoveryAudio';
import {
  ChordNamingConfig,
  ChordNamingPrompt,
  evaluateChordNamingAnswer,
  formatPromptCanonicalAnswer,
  generateChordNamingDrill,
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

const ACCIDENTAL_ROOT_BUTTONS: readonly RootButtonSpec[] = [
  { intlValue: 'C#', germanValue: 'C#', intlLabel: 'C♯/D♭', germanLabel: 'C♯/D♭' },
  { intlValue: 'Eb', germanValue: 'Eb', intlLabel: 'E♭/D♯', germanLabel: 'E♭/D♯' },
  { intlValue: 'F#', germanValue: 'F#', intlLabel: 'F♯/G♭', germanLabel: 'F♯/G♭' },
  { intlValue: 'Ab', germanValue: 'Ab', intlLabel: 'A♭/G♯', germanLabel: 'A♭/G♯' },
  { intlValue: 'Bb', germanValue: 'B', intlLabel: 'B♭', germanLabel: 'B' },
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

  const [prompts, setPrompts] = useState<readonly ChordNamingPrompt[]>(() =>
    initialPrompts ? [...initialPrompts] : generateChordNamingDrill(config)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<Exclude<ChordQuality, 'augmented'>>('major');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastSolvedLabel, setLastSolvedLabel] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [hadMistakeOnCurrent, setHadMistakeOnCurrent] = useState<boolean>(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState<number>(0);
  const [startedAtMs, setStartedAtMs] = useState<number>(() => performance.now());
  const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedRootRef = useRef<string | null>(null);
  const selectedQualityRef = useRef<Exclude<ChordQuality, 'augmented'>>('major');

  const activeQualities = useMemo(() => getPoolQualities(config.poolId), [config.poolId]);

  const resetForNextPrompt = useCallback(() => {
    setInputValue('');
    selectedRootRef.current = null;
    selectedQualityRef.current = 'major';
    setSelectedRoot(null);
    setSelectedQuality('major');
    setRevealedAnswer(null);
  }, []);

  // Reset drill when config changes
  useEffect(() => {
    if (!initialPrompts) {
      setPrompts(generateChordNamingDrill(config));
    }
    setCurrentIndex(0);
    resetForNextPrompt();
    setFeedback('idle');
    setLastSolvedLabel(null);
    setHadMistakeOnCurrent(false);
    setFirstTryCorrectCount(0);
    setStartedAtMs(performance.now());
    setFinishedAtMs(null);
  }, [config, initialPrompts, resetForNextPrompt]);

  const handleRestart = useCallback(() => {
    setPrompts(initialPrompts ? [...initialPrompts] : generateChordNamingDrill(config));
    setCurrentIndex(0);
    resetForNextPrompt();
    setFeedback('idle');
    setLastSolvedLabel(null);
    setHadMistakeOnCurrent(false);
    setFirstTryCorrectCount(0);
    setStartedAtMs(performance.now());
    setFinishedAtMs(null);
  }, [config, initialPrompts, resetForNextPrompt]);

  const isFinished = finishedAtMs !== null || currentIndex >= prompts.length;
  const currentPrompt = !isFinished ? prompts[currentIndex]! : null;

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
        const solvedLabel = formatPromptCanonicalAnswer(
          currentPrompt,
          config.answerMode,
          chordNotationSystem
        );
        setLastSolvedLabel(solvedLabel);
        setFeedback('correct');
        resetForNextPrompt();

        if (!hadMistakeOnCurrent) {
          setFirstTryCorrectCount((c) => c + 1);
        }
        setHadMistakeOnCurrent(false);

        const nextIndex = currentIndex + 1;
        if (nextIndex >= prompts.length) {
          const now = performance.now();
          setFinishedAtMs(now);
          setCurrentIndex(nextIndex);
          const totalSec = Math.max(0.1, (now - startedAtMs) / 1000);
          const secPerChord = totalSec / prompts.length;
          updateBestChordNamingSecPerChord(secPerChord);
        } else {
          setCurrentIndex(nextIndex);
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
      resetForNextPrompt,
      hadMistakeOnCurrent,
      currentIndex,
      prompts.length,
      startedAtMs,
      updateBestChordNamingSecPerChord,
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

  const progressFraction = prompts.length > 0 ? Math.min(1, currentIndex / prompts.length) : 0;

  // Completion summary view
  if (isFinished) {
    const totalSeconds = Math.max(0.1, ((finishedAtMs ?? performance.now()) - startedAtMs) / 1000);
    const secPerChord = totalSeconds / Math.max(1, prompts.length);
    const accuracyPct = Math.round((firstTryCorrectCount / Math.max(1, prompts.length)) * 100);

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
          Drill Complete · {prompts.length} Chords
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
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '22px' }}>
          {config.answerMode === 'roman_numeral'
            ? `Roman Numerals in ${KEY_SIGNATURES[config.fixedKey].label}`
            : 'Chord Symbol Recognition'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            maxWidth: '540px',
            margin: '0 auto 24px auto',
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

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={handleRestart}
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

  const staffLines = [76, 88, 100, 112, 124];
  const chordX = 420;

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
              : 'Chord Symbols'}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
            {config.answerMode === 'roman_numeral'
              ? 'Tap a Roman numeral below or type it and press Enter.'
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
            {currentIndex + 1} / {prompts.length}
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

      {/* Responsive Staff Card */}
      <div
        className="nnsr-staff-container"
        style={{
          position: 'relative',
          width: '100%',
          height: 'auto',
        }}
      >
        <svg
          viewBox="0 0 840 200"
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#ffffff' }}
        >
          {/* 5 Staff Lines */}
          {staffLines.map((y) => (
            <line
              key={`naming-staff-line-${y}`}
              x1={24}
              y1={y}
              x2={816}
              y2={y}
              stroke="#2c332f"
              strokeWidth={1.2}
            />
          ))}

          {/* Left & Right Barlines */}
          <line x1={24} y1={76} x2={24} y2={124} stroke="#2c332f" strokeWidth={2.0} />
          <line x1={816} y1={76} x2={816} y2={124} stroke="#2c332f" strokeWidth={2.0} />

          {/* Clef */}
          {currentPrompt && currentPrompt.clef === 'treble' ? (
            <text
              x={54}
              y={109}
              fontFamily="serif"
              fontSize={52}
              fill="#1f2421"
              textAnchor="middle"
              dominantBaseline="middle"
              data-testid="chord-naming-clef-treble"
            >
              𝄞
            </text>
          ) : (
            <text
              x={54}
              y={107}
              fontFamily="serif"
              fontSize={52}
              fill="#1f2421"
              textAnchor="middle"
              dominantBaseline="middle"
              data-testid="chord-naming-clef-bass"
            >
              𝄢
            </text>
          )}

          {/* Key Signature Accidentals */}
          {currentPrompt && keySigSpec.accidentalType !== 'none' && (
            <g fontFamily="serif" fontSize={22} fill="#1f2421" textAnchor="middle">
              {(currentPrompt.clef === 'treble'
                ? keySigSpec.trebleStepOffsets
                : keySigSpec.bassStepOffsets
              ).map((offset, idx) => (
                <text
                  key={`naming-ks-${idx}`}
                  x={88 + idx * 14}
                  y={124 - offset * 6 + 7}
                >
                  {keySigSpec.accidentalType === 'sharp' ? '♯' : '♭'}
                </text>
              ))}
            </g>
          )}

          {/* Stacked Chord Notes */}
          {currentPrompt &&
            (() => {
              let prevStepOffset: number | null = null;
              let accSlot = 0;

              return currentPrompt.notes.map((note) => {
                const y = 124 - note.stepOffset * 6;
                const isSecond = prevStepOffset !== null && note.stepOffset - prevStepOffset <= 1;
                prevStepOffset = note.stepOffset;

                const noteheadX = isSecond ? chordX + 14 : chordX;
                const ledgerLines = getLedgerLines(note.stepOffset);

                let accX = chordX - 18;
                if (note.displayAccidental) {
                  accX = chordX - 18 - accSlot * 12;
                  accSlot = (accSlot + 1) % 2;
                }

                return (
                  <g key={`naming-note-${note.midi}`}>
                    {ledgerLines.map((lOffset) => {
                      const ly = 124 - lOffset * 6;
                      return (
                        <line
                          key={`naming-ledger-${note.midi}-${lOffset}`}
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
                      rx={8}
                      ry={5.6}
                      fill="#1f2421"
                      transform={`rotate(-20 ${noteheadX} ${y})`}
                    />
                  </g>
                );
              });
            })()}
        </svg>

        {lastSolvedLabel && feedback === 'correct' && (
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
          /* Single-Row 1-Tap Roman Numeral Selector */
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
          /* Two-Part Touch Selector: 12 Direct Roots (2 piano-style rows) + Quality Row */
          <div
            data-testid="chord-tap-pad"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {/* Row 1A: 5 Accidental Roots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '6px',
                maxWidth: '520px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {ACCIDENTAL_ROOT_BUTTONS.map((btn) => {
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
                      padding: '10px 4px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      borderRadius: '7px',
                      border: isSelected ? '2px solid var(--emerald)' : '1px solid #2c332f',
                      backgroundColor: isSelected ? 'var(--emerald)' : '#2c332f',
                      color: '#ffffff',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Row 1B: 7 Natural Roots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: '6px',
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
                      padding: '12px 4px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      borderRadius: '7px',
                      border: isSelected ? '2px solid var(--emerald)' : '1.5px solid var(--border-strong)',
                      backgroundColor: isSelected ? 'rgba(77, 144, 120, 0.16)' : '#ffffff',
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
