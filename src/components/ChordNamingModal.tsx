import React, { useState } from 'react';
import {
  ChordNamingAnswerMode,
  ChordNamingClefMode,
  ChordNamingConfig,
  ChordNamingKeyId,
  ChordNamingPoolId,
  DEFAULT_CHORD_NAMING_CONFIG,
} from '../chord/naming';

export interface ChordNamingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onStart: (config: ChordNamingConfig) => void;
  readonly bestSecPerChord?: number | null;
}

const KEY_OPTIONS: readonly { id: ChordNamingKeyId; label: string; detail: string }[] = [
  { id: 'C_MAJOR', label: 'C Major', detail: 'No sharps/flats' },
  { id: 'G_MAJOR', label: 'G Major', detail: '1 sharp (F♯)' },
  { id: 'F_MAJOR', label: 'F Major', detail: '1 flat (B♭)' },
  { id: 'D_MAJOR', label: 'D Major', detail: '2 sharps (F♯, C♯)' },
];

const POOL_OPTIONS: readonly { id: ChordNamingPoolId; label: string; detail: string }[] = [
  { id: 'core_triads', label: 'Core Triads', detail: 'C, F, G, D, A, Bb, Am, Dm, Em, Gm, Bm' },
  { id: 'triads_and_dom7', label: 'Triads + Dom 7ths', detail: 'Adds G7, D7, C7, A7, E7' },
  { id: 'all_chords', label: 'All Chords', detail: 'Adds Cmaj7, Fmaj7, Dm7, Am7, Em7' },
];

const CLEF_OPTIONS: readonly { id: ChordNamingClefMode; label: string }[] = [
  { id: 'both', label: 'Both Clefs' },
  { id: 'treble', label: 'Treble Only (𝄞)' },
  { id: 'bass', label: 'Bass Only (𝄢)' },
];

const LENGTH_OPTIONS: readonly number[] = [25, 50, 100];

export const ChordNamingModal: React.FC<ChordNamingModalProps> = ({
  isOpen,
  onClose,
  onStart,
  bestSecPerChord = null,
}) => {
  const [answerMode, setAnswerMode] = useState<ChordNamingAnswerMode>(
    DEFAULT_CHORD_NAMING_CONFIG.answerMode
  );
  const [clefMode, setClefMode] = useState<ChordNamingClefMode>(
    DEFAULT_CHORD_NAMING_CONFIG.clefMode
  );
  const [poolId, setPoolId] = useState<ChordNamingPoolId>(
    DEFAULT_CHORD_NAMING_CONFIG.poolId
  );
  const [fixedKey, setFixedKey] = useState<ChordNamingKeyId>(
    DEFAULT_CHORD_NAMING_CONFIG.fixedKey
  );
  const [totalChords, setTotalChords] = useState<number>(
    DEFAULT_CHORD_NAMING_CONFIG.totalChords
  );

  if (!isOpen) return null;

  const handleStart = () => {
    onStart({
      answerMode,
      clefMode,
      poolId,
      fixedKey,
      totalChords,
    });
    onClose();
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '1.5px solid var(--emerald)' : '1px solid #d4d0c7',
    background: active ? 'rgba(77, 144, 120, 0.12)' : '#ffffff',
    color: active ? 'var(--emerald)' : 'var(--ink-primary)',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    textAlign: 'left',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Name the Chord Configuration"
      data-testid="chord-naming-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(31, 36, 33, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '620px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          border: '1px solid #e0ded8',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid #eeebe3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Name the Chord
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: 'var(--ink-secondary)',
              }}
            >
              Read chords on the staff in any inversion and type their name or Roman numeral.
              {bestSecPerChord !== null && (
                <span style={{ marginLeft: '8px', fontWeight: 700, color: 'var(--emerald)' }}>
                  Best: {bestSecPerChord.toFixed(2)} s/chord
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="chord-naming-close-btn"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--ink-secondary)',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Answer Format */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--ink-secondary)',
                marginBottom: '8px',
              }}
            >
              Answer Format
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                data-testid="naming-mode-chord-name"
                onClick={() => setAnswerMode('chord_name')}
                style={pillStyle(answerMode === 'chord_name')}
              >
                <div>Chord Names</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-secondary)', marginTop: '2px' }}>
                  Type C, Am, G7… (inversions accepted as root)
                </div>
              </button>
              <button
                type="button"
                data-testid="naming-mode-roman"
                onClick={() => setAnswerMode('roman_numeral')}
                style={pillStyle(answerMode === 'roman_numeral')}
              >
                <div>Roman Numerals</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-secondary)', marginTop: '2px' }}>
                  Fixed key signature · Type I, ii, IV, V, V7, vi
                </div>
              </button>
            </div>
          </div>

          {/* Conditional: Chord Pool OR Fixed Key */}
          {answerMode === 'chord_name' ? (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-secondary)',
                  marginBottom: '8px',
                }}
              >
                Chord Vocabulary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {POOL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`naming-pool-${opt.id}`}
                    onClick={() => setPoolId(opt.id)}
                    style={{
                      ...pillStyle(poolId === opt.id),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span>{opt.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-secondary)' }}>
                      {opt.detail}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-secondary)',
                  marginBottom: '8px',
                }}
              >
                Fixed Scale / Key Signature
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {KEY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`naming-key-${opt.id}`}
                    onClick={() => setFixedKey(opt.id)}
                    style={pillStyle(fixedKey === opt.id)}
                  >
                    <div>{opt.label}</div>
                    <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-secondary)', marginTop: '2px' }}>
                      {opt.detail}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clef & Length */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-secondary)',
                  marginBottom: '8px',
                }}
              >
                Clef
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CLEF_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`naming-clef-${opt.id}`}
                    onClick={() => setClefMode(opt.id)}
                    style={pillStyle(clefMode === opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-secondary)',
                  marginBottom: '8px',
                }}
              >
                Drill Length
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {LENGTH_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    data-testid={`naming-length-${count}`}
                    onClick={() => setTotalChords(count)}
                    style={{
                      ...pillStyle(totalChords === count),
                      flex: 1,
                      textAlign: 'center',
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                No time limit. Your average speed (seconds per chord) is measured at the end.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eeebe3',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#faf9f6',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #d4d0c7',
              background: '#ffffff',
              color: 'var(--ink-primary)',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            data-testid="start-chord-naming-btn"
            style={{
              border: 'none',
              background: 'var(--emerald)',
              color: '#ffffff',
              padding: '8px 22px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start Drill →
          </button>
        </div>
      </div>
    </div>
  );
};
