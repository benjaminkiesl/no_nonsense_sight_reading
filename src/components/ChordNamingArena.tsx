import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playMutedFeltThud, playSanctuaryWakeChime } from '../audio/recoveryAudio';
import {
  ChordNamingConfig,
  ChordNamingPrompt,
  evaluateChordNamingAnswer,
  formatPromptCanonicalAnswer,
  generateChordNamingDrill,
} from '../chord/naming';
import { getLedgerLines } from '../music/notation';
import { KEY_SIGNATURES } from '../music/scales';
import { useAppStore } from '../store/useAppStore';

export interface ChordNamingArenaProps {
  readonly config: ChordNamingConfig;
  readonly onExit: () => void;
  readonly onReconfigure: () => void;
  readonly initialPrompts?: readonly ChordNamingPrompt[];
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) {
    return `${secs.toFixed(1)}s`;
  }
  return `${mins}m ${Math.floor(secs).toString().padStart(2, '0')}s`;
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
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastSolvedLabel, setLastSolvedLabel] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [hadMistakeOnCurrent, setHadMistakeOnCurrent] = useState<boolean>(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState<number>(0);
  const [startedAtMs, setStartedAtMs] = useState<number>(() => performance.now());
  const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset drill when config changes
  useEffect(() => {
    if (!initialPrompts) {
      setPrompts(generateChordNamingDrill(config));
    }
    setCurrentIndex(0);
    setInputValue('');
    setFeedback('idle');
    setLastSolvedLabel(null);
    setRevealedAnswer(null);
    setHadMistakeOnCurrent(false);
    setFirstTryCorrectCount(0);
    setStartedAtMs(performance.now());
    setFinishedAtMs(null);
  }, [config, initialPrompts]);

  // Keep textbox focused during active drill
  useEffect(() => {
    if (finishedAtMs === null) {
      inputRef.current?.focus();
    }
  }, [currentIndex, finishedAtMs]);

  const handleRestart = useCallback(() => {
    setPrompts(initialPrompts ? [...initialPrompts] : generateChordNamingDrill(config));
    setCurrentIndex(0);
    setInputValue('');
    setFeedback('idle');
    setLastSolvedLabel(null);
    setRevealedAnswer(null);
    setHadMistakeOnCurrent(false);
    setFirstTryCorrectCount(0);
    setStartedAtMs(performance.now());
    setFinishedAtMs(null);
  }, [config, initialPrompts]);

  const isFinished = finishedAtMs !== null || currentIndex >= prompts.length;
  const currentPrompt = !isFinished ? prompts[currentIndex]! : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPrompt || isFinished) return;

    const trimmed = inputValue.trim();
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
      setInputValue('');
      setRevealedAnswer(null);

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
      inputRef.current?.select();
    }
  };

  const handleReveal = () => {
    if (!currentPrompt) return;
    setHadMistakeOnCurrent(true);
    setRevealedAnswer(
      formatPromptCanonicalAnswer(currentPrompt, config.answerMode, chordNotationSystem)
    );
    inputRef.current?.focus();
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
          width: '840px',
          backgroundColor: 'var(--surface-paper)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '32px 28px',
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
            fontSize: '2.4rem',
            color: 'var(--ink-primary)',
            margin: '0 0 6px 0',
          }}
          data-testid="chord-naming-speed-result"
        >
          {secPerChord.toFixed(2)} s / chord
        </h2>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
          {config.answerMode === 'roman_numeral'
            ? `Roman Numerals in ${KEY_SIGNATURES[config.fixedKey].label}`
            : 'Chord Symbol Recognition'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            maxWidth: '540px',
            margin: '0 auto 28px auto',
          }}
        >
          <div
            style={{
              background: 'var(--surface-subtle)',
              padding: '14px',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Time
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink-primary)', marginTop: '4px' }}>
              {formatDuration(totalSeconds)}
            </div>
          </div>
          <div
            style={{
              background: 'var(--surface-subtle)',
              padding: '14px',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              First-Try Accuracy
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald)', marginTop: '4px' }}>
              {accuracyPct}%
            </div>
          </div>
          <div
            style={{
              background: 'var(--surface-subtle)',
              padding: '14px',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Personal Best
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink-primary)', marginTop: '4px' }}>
              {bestChordNamingSecPerChord !== null
                ? `${bestChordNamingSecPerChord.toFixed(2)} s`
                : `${secPerChord.toFixed(2)} s`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
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

  // Staff Geometry (bottom line y = 124, top line y = 76, 12px line spacing, 6px per diatonic step)
  const staffLines = [76, 88, 100, 112, 124];
  const chordX = 420;

  return (
    <div
      className="nnsr-chord-naming-arena"
      data-testid="chord-naming-arena"
      style={{ width: '840px', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink-primary)' }}>
            Name the Chord —{' '}
            {config.answerMode === 'roman_numeral'
              ? `Roman Numerals (${KEY_SIGNATURES[config.fixedKey].label})`
              : 'Chord Symbols'}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            {config.answerMode === 'roman_numeral'
              ? 'Type the scale-degree Roman numeral (I, ii, iii, IV, V, V7, vi) and press Enter.'
              : 'Type the chord name (e.g. C, Am, G7 — inversions accepted as root) and press Enter.'}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            data-testid="chord-naming-counter"
            style={{
              fontSize: '0.95rem',
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

      {/* Staff Card (840 x 200) */}
      <div
        className="nnsr-staff-container"
        style={{ position: 'relative', height: '200px' }}
      >
        <svg
          viewBox="0 0 840 200"
          width="840"
          height="200"
          style={{ display: 'block', backgroundColor: '#ffffff' }}
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
                    {/* Ledger lines */}
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

                    {/* Explicit Accidental */}
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

                    {/* Whole-note / Chord Notehead */}
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

        {/* Subtle Last-Solved Toast (top-right corner) */}
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

      {/* Answer Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '16px',
          backgroundColor: 'var(--surface-paper)',
          border: `2px solid ${
            feedback === 'wrong'
              ? 'var(--vibrant-coral)'
              : feedback === 'correct'
              ? 'var(--emerald)'
              : 'var(--border-subtle)'
          }`,
          borderRadius: '8px',
          transition: 'border-color 0.15s ease',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (feedback === 'wrong') setFeedback('idle');
          }}
          placeholder={
            config.answerMode === 'roman_numeral'
              ? 'Type Roman numeral (e.g. I, IV, V7, vi)…'
              : chordNotationSystem === 'german'
              ? 'Type chord (e.g. C, Am, G7, Hm, B)…'
              : 'Type chord (e.g. C, Am, G7, Bm, Bb)…'
          }
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-testid="chord-naming-input"
          style={{
            width: '320px',
            fontSize: '1.25rem',
            fontWeight: 700,
            padding: '10px 16px',
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
          }}
        >
          Reveal
        </button>
      </form>

      {/* Feedback / Revealed Answer Helper */}
      <div style={{ minHeight: '24px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
        {feedback === 'wrong' && !revealedAnswer && (
          <span data-testid="chord-naming-wrong-msg" style={{ color: 'var(--vibrant-coral)' }}>
            Not quite — try again!
          </span>
        )}
        {revealedAnswer && (
          <span data-testid="chord-naming-revealed-msg" style={{ color: 'var(--ink-secondary)' }}>
            Answer: <strong style={{ color: 'var(--ink-primary)' }}>{revealedAnswer}</strong> (type it to continue)
          </span>
        )}
      </div>
    </div>
  );
};
