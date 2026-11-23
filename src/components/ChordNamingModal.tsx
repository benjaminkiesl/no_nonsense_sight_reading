import React, { useState } from 'react';
import {
  ADAPTIVE_CHORD_LADDER,
  ChordNamingAnswerMode,
  ChordNamingClefMode,
  ChordNamingConfig,
  ChordNamingKeyId,
  DEFAULT_CHORD_NAMING_CONFIG,
} from '../chord/naming';
import { useAppStore } from '../store/useAppStore';

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

const CLEF_OPTIONS: readonly { id: ChordNamingClefMode; label: string }[] = [
  { id: 'both', label: 'Both Clefs' },
  { id: 'treble', label: 'Treble (𝄞)' },
  { id: 'bass', label: 'Bass (𝄢)' },
];

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
  const [fixedKey, setFixedKey] = useState<ChordNamingKeyId>(
    DEFAULT_CHORD_NAMING_CONFIG.fixedKey
  );
  const adaptiveState = useAppStore((state) => state.chordNamingAdaptiveState);
  const resetAdaptiveState = useAppStore((state) => state.resetChordNamingAdaptiveState);

  if (!isOpen) return null;

  const handleStart = () => {
    onStart({
      answerMode,
      clefMode,
      poolId: 'adaptive',
      fixedKey,
      totalChords: DEFAULT_CHORD_NAMING_CONFIG.totalChords,
    });
    onClose();
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '1.5px solid var(--emerald)' : '1px solid #d4d0c7',
    background: active ? 'rgba(77, 144, 120, 0.12)' : '#ffffff',
    color: active ? 'var(--emerald)' : 'var(--ink-primary)',
    padding: '8px 12px',
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
      aria-label="Name the Chord Settings"
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
          width: '500px',
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
            padding: '18px 22px 14px 22px',
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
                fontSize: '19px',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Name the Chord — Settings
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ink-secondary)' }}>
              Unlocked: {adaptiveState.unlockedChordCount} / {ADAPTIVE_CHORD_LADDER.length} chords
              {bestSecPerChord !== null && ` · Best: ${bestSecPerChord.toFixed(2)} s/chord`}
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
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Mode Toggle */}
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
              Mode
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
                  C, F, G → Am → … (auto)
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
                  I, IV, V → vi → … in a fixed key
                </div>
              </button>
            </div>
          </div>

          {/* Key Picker (only in Roman Numerals mode) */}
          {answerMode === 'roman_numeral' && (
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
                Scale / Key Signature
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

          {/* Clef & Reset */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CLEF_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`naming-clef-${opt.id}`}
                  onClick={() => setClefMode(opt.id)}
                  style={{ ...pillStyle(clefMode === opt.id), textAlign: 'center' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(adaptiveState.unlockedChordCount > 3 || adaptiveState.unlockedRomanCount > 3) && (
              <button
                type="button"
                onClick={resetAdaptiveState}
                data-testid="reset-adaptive-btn"
                style={{
                  marginTop: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--vibrant-coral)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                Reset Adaptive Progress
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #eeebe3',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
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
              padding: '8px 16px',
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
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply & Start →
          </button>
        </div>
      </div>
    </div>
  );
};
