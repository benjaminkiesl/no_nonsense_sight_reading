import React, { useState } from 'react';
import {
  RHYTHM_CONCEPTS,
  RhythmConceptId,
} from '../rhythm/generator';

export interface RhythmStreamModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onStart: (options: {
    concepts: readonly RhythmConceptId[];
    targetBpm: number;
    accelerandoOnPass: boolean;
  }) => void;
  readonly initialBpm?: number;
}

const PRESETS: {
  readonly name: string;
  readonly concepts: readonly RhythmConceptId[];
}[] = [
  {
    name: 'All Concepts',
    concepts: RHYTHM_CONCEPTS.map((c) => c.id),
  },
  {
    name: 'Beginner Duple',
    concepts: ['quarter_half', 'eighths', 'rests'],
  },
  {
    name: 'Syncopation Bootcamp',
    concepts: ['dotted_quarter', 'syncopation', 'ties'],
  },
  {
    name: 'Sixteenth-Note Groove',
    concepts: ['sixteenths', 'gallop', 'rev_gallop', 'dotted_sixteenth', 'ragtime'],
  },
  {
    name: 'Triplets & Swing',
    concepts: ['quarter_half', 'eighths', 'triplets'],
  },
];

export const RhythmStreamModal: React.FC<RhythmStreamModalProps> = ({
  isOpen,
  onClose,
  onStart,
  initialBpm = 80,
}) => {
  const [selectedConcepts, setSelectedConcepts] = useState<Set<RhythmConceptId>>(
    () => new Set<RhythmConceptId>(['quarter_half', 'eighths', 'rests', 'dotted_quarter'])
  );
  const [targetBpm, setTargetBpm] = useState<number>(initialBpm);
  const [accelerandoOnPass, setAccelerandoOnPass] = useState<boolean>(true);

  if (!isOpen) return null;

  const toggleConcept = (id: RhythmConceptId) => {
    setSelectedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyPreset = (concepts: readonly RhythmConceptId[]) => {
    setSelectedConcepts(new Set(concepts));
  };

  const handleStart = () => {
    if (selectedConcepts.size === 0) return;
    onStart({
      concepts: Array.from(selectedConcepts),
      targetBpm,
      accelerandoOnPass,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Infinite Rhythm Stream Configuration"
      data-testid="rhythm-stream-modal"
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
          width: '720px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          border: '1px solid #e0ded8',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
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
                letterSpacing: '-0.02em',
              }}
            >
              Infinite Rhythm Stream
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: 'var(--ink-subtle)',
              }}
            >
              Non-repeating procedurally generated 2-bar phrases to wire visual glyphs into motor macros.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            data-testid="rhythm-stream-close-btn"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--ink-subtle)',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Quick Presets */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--ink-subtle)',
                marginBottom: '8px',
              }}
            >
              Quick Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESETS.map((preset) => {
                const isActive =
                  preset.concepts.length === selectedConcepts.size &&
                  preset.concepts.every((c) => selectedConcepts.has(c));
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.concepts)}
                    data-testid={`rhythm-preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    style={{
                      border: isActive ? '1px solid var(--emerald)' : '1px solid #d4d0c7',
                      background: isActive ? '#e8f5ee' : '#faf9f6',
                      color: isActive ? 'var(--emerald)' : 'var(--ink-primary)',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concepts Grid */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-subtle)',
                }}
              >
                Rhythmic Concepts ({selectedConcepts.size} selected)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>
                Click to toggle individual cells
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}
            >
              {RHYTHM_CONCEPTS.map((concept) => {
                const isSelected = selectedConcepts.has(concept.id);
                return (
                  <div
                    key={concept.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    data-testid={`rhythm-concept-${concept.id}`}
                    onClick={() => toggleConcept(concept.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleConcept(concept.id);
                      }
                    }}
                    style={{
                      border: isSelected ? '1.5px solid var(--emerald)' : '1px solid #e0ded8',
                      backgroundColor: isSelected ? '#f2f9f5' : '#ffffff',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      userSelect: 'none',
                      transition: 'border-color 0.12s ease, background-color 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: isSelected ? 'var(--emerald)' : 'var(--ink-primary)',
                        }}
                      >
                        {concept.symbol}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#8c948f',
                          background: '#eeebe3',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        Tier {concept.tier}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink-primary)',
                      }}
                    >
                      {concept.label}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink-subtle)',
                        lineHeight: '1.25',
                      }}
                    >
                      {concept.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tempo & Accelerando Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              padding: '16px',
              backgroundColor: '#faf9f6',
              borderRadius: '8px',
              border: '1px solid #eeebe3',
              alignItems: 'center',
            }}
          >
            {/* BPM Slider */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--ink-primary)',
                }}
              >
                <span>Starting Tempo:</span>
                <span data-testid="stream-bpm-display" style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                  {targetBpm} BPM
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                step="2"
                value={targetBpm}
                onChange={(e) => setTargetBpm(Number(e.target.value))}
                data-testid="stream-bpm-slider"
                style={{
                  width: '100%',
                  accentColor: 'var(--emerald)',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Accelerando Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink-primary)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={accelerandoOnPass}
                onChange={(e) => setAccelerandoOnPass(e.target.checked)}
                data-testid="stream-accelerando-checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--emerald)',
                  cursor: 'pointer',
                }}
              />
              <span>Accelerando (+2 BPM per passed phrase)</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
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
            disabled={selectedConcepts.size === 0}
            data-testid="start-rhythm-stream-btn"
            style={{
              border: 'none',
              background: selectedConcepts.size === 0 ? '#b0aba2' : 'var(--emerald)',
              color: '#ffffff',
              padding: '8px 22px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: selectedConcepts.size === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(4, 114, 77, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            Start Rhythm Stream →
          </button>
        </div>
      </div>
    </div>
  );
};
