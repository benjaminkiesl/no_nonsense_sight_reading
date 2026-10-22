import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { createTarget, getStaffStepOffset } from '../music/pitch';
import { KEY_SIGNATURES, KeySignatureId } from '../music/scales';
import { Clef, LetterName, Octave, StaffNoteTarget } from '../types/music';
import { ActiveKeyHighlight, PianoKeyboard } from './PianoKeyboard';
import { useAppStore } from '../store/useAppStore';

export interface AccelerandoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (selectedNotes: StaffNoteTarget[], startingBpm: number) => void;
  bestAccelerandoBpm: number | null;
  initialLevelNotes?: readonly StaffNoteTarget[];
  lastCustomNotes?: readonly StaffNoteTarget[] | null;
}

// Full Treble range from A3 below Middle C up to C6
const BASE_TREBLE_NOTES: { letter: LetterName; octave: Octave }[] = [
  { letter: 'A', octave: 3 },
  { letter: 'B', octave: 3 },
  { letter: 'C', octave: 4 },
  { letter: 'D', octave: 4 },
  { letter: 'E', octave: 4 },
  { letter: 'F', octave: 4 },
  { letter: 'G', octave: 4 },
  { letter: 'A', octave: 4 },
  { letter: 'B', octave: 4 },
  { letter: 'C', octave: 5 },
  { letter: 'D', octave: 5 },
  { letter: 'E', octave: 5 },
  { letter: 'F', octave: 5 },
  { letter: 'G', octave: 5 },
  { letter: 'A', octave: 5 },
  { letter: 'B', octave: 5 },
  { letter: 'C', octave: 6 },
];

// Full Bass range from C2 up to E4 above Middle C
const BASE_BASS_NOTES: { letter: LetterName; octave: Octave }[] = [
  { letter: 'C', octave: 2 },
  { letter: 'D', octave: 2 },
  { letter: 'E', octave: 2 },
  { letter: 'F', octave: 2 },
  { letter: 'G', octave: 2 },
  { letter: 'A', octave: 2 },
  { letter: 'B', octave: 2 },
  { letter: 'C', octave: 3 },
  { letter: 'D', octave: 3 },
  { letter: 'E', octave: 3 },
  { letter: 'F', octave: 3 },
  { letter: 'G', octave: 3 },
  { letter: 'A', octave: 3 },
  { letter: 'B', octave: 3 },
  { letter: 'C', octave: 4 },
  { letter: 'D', octave: 4 },
  { letter: 'E', octave: 4 },
];

const SHARP_SEMITONE_MAP: Record<number, { letter: LetterName; accStr: '' | '#' }> = {
  0: { letter: 'C', accStr: '' },
  1: { letter: 'C', accStr: '#' },
  2: { letter: 'D', accStr: '' },
  3: { letter: 'D', accStr: '#' },
  4: { letter: 'E', accStr: '' },
  5: { letter: 'F', accStr: '' },
  6: { letter: 'F', accStr: '#' },
  7: { letter: 'G', accStr: '' },
  8: { letter: 'G', accStr: '#' },
  9: { letter: 'A', accStr: '' },
  10: { letter: 'A', accStr: '#' },
  11: { letter: 'B', accStr: '' },
};

const FLAT_SEMITONE_MAP: Record<number, { letter: LetterName; accStr: '' | 'b' }> = {
  0: { letter: 'C', accStr: '' },
  1: { letter: 'D', accStr: 'b' },
  2: { letter: 'D', accStr: '' },
  3: { letter: 'E', accStr: 'b' },
  4: { letter: 'E', accStr: '' },
  5: { letter: 'F', accStr: '' },
  6: { letter: 'G', accStr: 'b' },
  7: { letter: 'G', accStr: '' },
  8: { letter: 'A', accStr: 'b' },
  9: { letter: 'A', accStr: '' },
  10: { letter: 'B', accStr: 'b' },
  11: { letter: 'B', accStr: '' },
};

function isSlotInClef(clef: Clef, letter: LetterName, octave: Octave): boolean {
  const list = clef === 'treble' ? BASE_TREBLE_NOTES : BASE_BASS_NOTES;
  return list.some((n) => n.letter === letter && n.octave === octave);
}

function getTargetsForMidi(midi: number, scale: KeySignatureId): StaffNoteTarget[] {
  // First check if the active scale already defines targets for this MIDI pitch
  const scaleTargets = getScaleTargets(scale).filter((t) => t.pitch.midi === midi);
  if (scaleTargets.length > 0) {
    return scaleTargets;
  }

  // Otherwise spell the chromatic pitch according to the scale's sharp/flat orientation
  const octave = (Math.floor(midi / 12) - 1) as Octave;
  const semitone = ((midi % 12) + 12) % 12;
  const useFlats = KEY_SIGNATURES[scale].accidentalType === 'flat';
  const { letter, accStr } = useFlats
    ? FLAT_SEMITONE_MAP[semitone]!
    : SHARP_SEMITONE_MAP[semitone]!;
  const pitchId = `${letter}${accStr}${octave}`;

  const result: StaffNoteTarget[] = [];
  if (isSlotInClef('bass', letter, octave)) {
    result.push(createTarget('bass', pitchId));
  }
  if (isSlotInClef('treble', letter, octave)) {
    result.push(createTarget('treble', pitchId));
  }
  if (result.length === 0) {
    result.push(createTarget(midi >= 60 ? 'treble' : 'bass', pitchId));
  }
  return result;
}

function getScaleTargets(keySigId: KeySignatureId): StaffNoteTarget[] {
  const altered = KEY_SIGNATURES[keySigId].alteredLetters;
  const trebleTargets = BASE_TREBLE_NOTES.map(({ letter, octave }) => {
    const acc = altered[letter] ?? 0;
    const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
    return createTarget('treble', `${letter}${accStr}${octave}`);
  });
  const bassTargets = BASE_BASS_NOTES.map(({ letter, octave }) => {
    const acc = altered[letter] ?? 0;
    const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
    return createTarget('bass', `${letter}${accStr}${octave}`);
  });
  return [...bassTargets, ...trebleTargets];
}

export const AccelerandoModal: React.FC<AccelerandoModalProps> = ({
  isOpen,
  onClose,
  onStart,
  bestAccelerandoBpm,
  initialLevelNotes,
  lastCustomNotes,
}) => {
  const storedLastCustomNotes = useAppStore((state) => state.lastCustomAccelerandoNotes);
  const setLastCustomAccelerandoNotes = useAppStore((state) => state.setLastCustomAccelerandoNotes);
  const effectiveLastCustomNotes =
    lastCustomNotes !== undefined ? lastCustomNotes : storedLastCustomNotes;

  // Default starting tempo: 10% below previous best BPM, or 20 BPM if no best recorded
  const computedDefaultBpm = useMemo(() => {
    if (bestAccelerandoBpm && bestAccelerandoBpm > 0) {
      return Math.max(15, Math.min(240, Math.round(bestAccelerandoBpm * 0.9)));
    }
    return 20;
  }, [bestAccelerandoBpm]);

  const [startingBpm, setStartingBpm] = useState<number>(computedDefaultBpm);
  const [selectedScale, setSelectedScale] = useState<KeySignatureId>('C_MAJOR');
  const [selectedTargets, setSelectedTargets] = useState<StaffNoteTarget[]>(() => {
    if (effectiveLastCustomNotes && effectiveLastCustomNotes.length > 0) {
      return [...effectiveLastCustomNotes];
    }
    if (initialLevelNotes && initialLevelNotes.length > 0) {
      return [...initialLevelNotes];
    }
    return getScaleTargets('C_MAJOR');
  });

  const isStaffDraggingRef = useRef(false);
  const activeStaffSlotRef = useRef<string | null>(null);
  const handledByPointerRef = useRef(false);

  useEffect(() => {
    const handlePointerUp = () => {
      isStaffDraggingRef.current = false;
      activeStaffSlotRef.current = null;
    };
    const handlePointerCancel = () => {
      isStaffDraggingRef.current = false;
      activeStaffSlotRef.current = null;
    };
    const handlePointerLeave = (e: PointerEvent) => {
      if (e.buttons === 0) {
        isStaffDraggingRef.current = false;
        activeStaffSlotRef.current = null;
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  // Re-sync startingBpm and notes whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStartingBpm(computedDefaultBpm);
      if (effectiveLastCustomNotes && effectiveLastCustomNotes.length > 0) {
        setSelectedTargets([...effectiveLastCustomNotes]);
      } else if (initialLevelNotes && initialLevelNotes.length > 0) {
        setSelectedTargets([...initialLevelNotes]);
      } else {
        setSelectedTargets(getScaleTargets(selectedScale));
      }
    }
  }, [isOpen, computedDefaultBpm, effectiveLastCustomNotes, initialLevelNotes]);

  const handleScaleChange = useCallback((scale: KeySignatureId) => {
    setSelectedScale(scale);
    setSelectedTargets(getScaleTargets(scale));
  }, []);

  // Toggle a staff note slot
  const toggleStaffSlot = useCallback((target: StaffNoteTarget) => {
    setSelectedTargets((prev) => {
      const exists = prev.some(
        (t) =>
          t.clef === target.clef &&
          t.pitch.letter === target.pitch.letter &&
          t.pitch.octave === target.pitch.octave
      );
      if (exists) {
        return prev.filter(
          (t) =>
            !(
              t.clef === target.clef &&
              t.pitch.letter === target.pitch.letter &&
              t.pitch.octave === target.pitch.octave
            )
        );
      } else {
        return [...prev, target];
      }
    });
  }, []);

  // Keyboard note toggle: keeps staff slots and keyboard keys derived from the exact same state
  const handlePianoKeyPress = useCallback(
    (midi: number) => {
      setSelectedTargets((prev) => {
        const hasTargetWithMidi = prev.some((t) => t.pitch.midi === midi);
        if (hasTargetWithMidi) {
          return prev.filter((t) => t.pitch.midi !== midi);
        } else {
          const newTargets = getTargetsForMidi(midi, selectedScale);
          const filtered = prev.filter(
            (existing) =>
              !newTargets.some(
                (nt) =>
                  nt.clef === existing.clef &&
                  nt.pitch.letter === existing.pitch.letter &&
                  nt.pitch.octave === existing.pitch.octave
              )
          );
          return [...filtered, ...newTargets];
        }
      });
    },
    [selectedScale]
  );

  // Build displayed staff slots directly from selectedTargets + selectedScale fallback
  const trebleStaffSlots = useMemo(() => {
    const altered = KEY_SIGNATURES[selectedScale].alteredLetters;
    return BASE_TREBLE_NOTES.map(({ letter, octave }) => {
      const activeTarget = selectedTargets.find(
        (t) => t.clef === 'treble' && t.pitch.letter === letter && t.pitch.octave === octave
      );
      if (activeTarget) {
        return { target: activeTarget, isSelected: true };
      }
      const acc = altered[letter] ?? 0;
      const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
      return {
        target: createTarget('treble', `${letter}${accStr}${octave}`),
        isSelected: false,
      };
    });
  }, [selectedTargets, selectedScale]);

  const bassStaffSlots = useMemo(() => {
    const altered = KEY_SIGNATURES[selectedScale].alteredLetters;
    return BASE_BASS_NOTES.map(({ letter, octave }) => {
      const activeTarget = selectedTargets.find(
        (t) => t.clef === 'bass' && t.pitch.letter === letter && t.pitch.octave === octave
      );
      if (activeTarget) {
        return { target: activeTarget, isSelected: true };
      }
      const acc = altered[letter] ?? 0;
      const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
      return {
        target: createTarget('bass', `${letter}${accStr}${octave}`),
        isSelected: false,
      };
    });
  }, [selectedTargets, selectedScale]);

  // Highlights for PianoKeyboard derived from the exact same selectedTargets
  const activeHighlights: ActiveKeyHighlight[] = useMemo(
    () =>
      selectedTargets.map((t) => ({
        midi: t.pitch.midi,
        status: 'correct',
      })),
    [selectedTargets]
  );

  const handleStart = () => {
    if (selectedTargets.length === 0) return;
    setLastCustomAccelerandoNotes([...selectedTargets]);
    onStart(selectedTargets, startingBpm);
  };

  const keySigSpec = KEY_SIGNATURES[selectedScale];
  const accSymbol = keySigSpec.accidentalType === 'sharp' ? '♯' : '♭';

  if (!isOpen) return null;

  return (
    <div
      className="nnsr-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accelerando-modal-title"
    >
      <div className="nnsr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Minimal Header */}
        <div className="nnsr-modal-header">
          <h2 id="accelerando-modal-title" className="nnsr-modal-title">
            Infinite Speed-Up
          </h2>
          <button
            className="nnsr-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Minimal Scale Picker Toolbar */}
        <div className="nnsr-modal-toolbar">
          <div className="nnsr-scale-picker">
            <label htmlFor="nnsr-scale-select" className="nnsr-scale-label">
              Scale:
            </label>
            <select
              id="nnsr-scale-select"
              value={selectedScale}
              onChange={(e) => handleScaleChange(e.target.value as KeySignatureId)}
              className="nnsr-scale-select"
              aria-label="Scale Selector"
            >
              <option value="C_MAJOR">C Major</option>
              <option value="G_MAJOR">G Major (1♯)</option>
              <option value="D_MAJOR">D Major (2♯)</option>
              <option value="F_MAJOR">F Major (1♭)</option>
              <option value="BB_MAJOR">B♭ Major (2♭)</option>
            </select>
          </div>
          <div className="nnsr-modal-note-count">
            {selectedTargets.length} selected
          </div>
        </div>

        {/* Interactive Grand Staff SVG */}
        <div
          className="nnsr-modal-staff-container"
          onPointerDown={() => {
            isStaffDraggingRef.current = true;
            activeStaffSlotRef.current = null;
          }}
          onPointerUp={() => {
            isStaffDraggingRef.current = false;
            activeStaffSlotRef.current = null;
          }}
          onPointerLeave={(e) => {
            if (e.buttons === 0) {
              isStaffDraggingRef.current = false;
              activeStaffSlotRef.current = null;
            }
          }}
        >
          <svg
            viewBox="0 0 780 250"
            width="100%"
            height="250"
            style={{ display: 'block', userSelect: 'none' }}
            onPointerDown={() => {
              isStaffDraggingRef.current = true;
              activeStaffSlotRef.current = null;
            }}
          >
            {/* Grand Staff Lines */}
            {[55, 65, 75, 85, 95].map((y) => (
              <line key={`t-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#2c332f" strokeWidth={1} />
            ))}
            {[165, 175, 185, 195, 205].map((y) => (
              <line key={`b-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#2c332f" strokeWidth={1} />
            ))}

            {/* Vertical connector bar */}
            <line x1={30} y1={55} x2={30} y2={205} stroke="#2c332f" strokeWidth={1.5} />

            {/* Clef symbols accurately centered on their defining lines */}
            <text
              x={45}
              y={87}
              fontSize="44px"
              fontFamily="serif"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#1f2421"
            >
              𝄞
            </text>
            <text
              x={45}
              y={175}
              fontSize="32px"
              fontFamily="serif"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#1f2421"
            >
              𝄢
            </text>

            {/* Key Signature Accidentals */}
            {keySigSpec.accidentalType !== 'none' && (
              <>
                {keySigSpec.trebleStepOffsets.map((offset, idx) => {
                  const x = 58 + idx * 10;
                  const ny = 95 - offset * 5;
                  return (
                    <text
                      key={`t-ks-${idx}`}
                      x={x}
                      y={ny + 4}
                      fontSize="14px"
                      fontFamily="serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#1f2421"
                    >
                      {accSymbol}
                    </text>
                  );
                })}
                {keySigSpec.bassStepOffsets.map((offset, idx) => {
                  const x = 58 + idx * 10;
                  const ny = 205 - offset * 5;
                  return (
                    <text
                      key={`b-ks-${idx}`}
                      x={x}
                      y={ny + 4}
                      fontSize="14px"
                      fontFamily="serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#1f2421"
                    >
                      {accSymbol}
                    </text>
                  );
                })}
              </>
            )}

            {/* Treble Staff Notes (A3 to C6 across top staff) */}
            {trebleStaffSlots.map(({ target, isSelected }, i) => {
              const stepOffset = getStaffStepOffset(target.pitch, 'treble');
              const bottomY = 95;
              const stepScale = 5;
              const ny = bottomY - stepOffset * stepScale;
              const nx = 88 + i * 38;
              const ledgers = getLedgerLines(stepOffset);
              const stemDir = getStemDirection(stepOffset);
              const displayLetter =
                target.pitch.letter +
                (target.pitch.accidental === 1 ? '♯' : target.pitch.accidental === -1 ? '♭' : '');

              const noteColor = isSelected ? 'var(--emerald)' : '#8c948f';

              return (
                <g
                  key={`treble-slot-${target.pitch.letter}-${target.pitch.octave}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle ${target.targetId}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isStaffDraggingRef.current = true;
                    activeStaffSlotRef.current = target.targetId;
                    handledByPointerRef.current = true;
                    toggleStaffSlot(target);
                  }}
                  onPointerEnter={(e) => {
                    const isPointerActive =
                      isStaffDraggingRef.current ||
                      (e.buttons !== undefined && (e.buttons & 1) === 1);
                    if (isPointerActive && activeStaffSlotRef.current !== target.targetId) {
                      activeStaffSlotRef.current = target.targetId;
                      toggleStaffSlot(target);
                    }
                  }}
                  onPointerLeave={() => {
                    if (activeStaffSlotRef.current === target.targetId) {
                      activeStaffSlotRef.current = null;
                    }
                  }}
                  onClick={() => {
                    if (handledByPointerRef.current) {
                      handledByPointerRef.current = false;
                      return;
                    }
                    toggleStaffSlot(target);
                  }}
                  style={{ cursor: 'pointer' }}
                  className="nnsr-staff-clickable-note"
                >
                  <rect
                    x={nx - 14}
                    y={ny - 36}
                    width={28}
                    height={72}
                    fill="transparent"
                  />
                  {ledgers.map((lOffset) => {
                    const ly = bottomY - lOffset * stepScale;
                    return (
                      <line
                        key={`l-${lOffset}`}
                        x1={nx - 9}
                        y1={ly}
                        x2={nx + 9}
                        y2={ly}
                        stroke={noteColor}
                        strokeWidth={1.2}
                      />
                    );
                  })}
                  <ellipse
                    cx={nx}
                    cy={ny}
                    rx={5.5}
                    ry={3.8}
                    transform={`rotate(-20 ${nx} ${ny})`}
                    fill={isSelected ? 'var(--emerald)' : 'rgba(44, 51, 47, 0.12)'}
                    stroke={noteColor}
                    strokeWidth={1.5}
                  />
                  <line
                    x1={stemDir === 'up' ? nx + 4.8 : nx - 4.8}
                    y1={stemDir === 'up' ? ny - 1 : ny + 1}
                    x2={stemDir === 'up' ? nx + 4.8 : nx - 4.8}
                    y2={stemDir === 'up' ? ny - 35 : ny + 35}
                    stroke={noteColor}
                    strokeWidth={1.2}
                  />
                  <text
                    x={nx}
                    y={ny + (stemDir === 'up' ? 14 : -12)}
                    textAnchor="middle"
                    fontSize="9.5px"
                    fontWeight={isSelected ? '700' : '500'}
                    fill={noteColor}
                  >
                    {displayLetter}
                  </text>
                </g>
              );
            })}

            {/* Bass Staff Notes (C2 to E4 across bottom staff) */}
            {bassStaffSlots.map(({ target, isSelected }, i) => {
              const stepOffset = getStaffStepOffset(target.pitch, 'bass');
              const bottomY = 205;
              const stepScale = 5;
              const ny = bottomY - stepOffset * stepScale;
              const nx = 88 + i * 38;
              const ledgers = getLedgerLines(stepOffset);
              const stemDir = getStemDirection(stepOffset);
              const displayLetter =
                target.pitch.letter +
                (target.pitch.accidental === 1 ? '♯' : target.pitch.accidental === -1 ? '♭' : '');

              const noteColor = isSelected ? 'var(--emerald)' : '#8c948f';

              return (
                <g
                  key={`bass-slot-${target.pitch.letter}-${target.pitch.octave}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle ${target.targetId}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isStaffDraggingRef.current = true;
                    activeStaffSlotRef.current = target.targetId;
                    handledByPointerRef.current = true;
                    toggleStaffSlot(target);
                  }}
                  onPointerEnter={(e) => {
                    const isPointerActive =
                      isStaffDraggingRef.current ||
                      (e.buttons !== undefined && (e.buttons & 1) === 1);
                    if (isPointerActive && activeStaffSlotRef.current !== target.targetId) {
                      activeStaffSlotRef.current = target.targetId;
                      toggleStaffSlot(target);
                    }
                  }}
                  onPointerLeave={() => {
                    if (activeStaffSlotRef.current === target.targetId) {
                      activeStaffSlotRef.current = null;
                    }
                  }}
                  onClick={() => {
                    if (handledByPointerRef.current) {
                      handledByPointerRef.current = false;
                      return;
                    }
                    toggleStaffSlot(target);
                  }}
                  style={{ cursor: 'pointer' }}
                  className="nnsr-staff-clickable-note"
                >
                  <rect
                    x={nx - 14}
                    y={ny - 36}
                    width={28}
                    height={72}
                    fill="transparent"
                  />
                  {ledgers.map((lOffset) => {
                    const ly = bottomY - lOffset * stepScale;
                    return (
                      <line
                        key={`b-l-${lOffset}`}
                        x1={nx - 9}
                        y1={ly}
                        x2={nx + 9}
                        y2={ly}
                        stroke={noteColor}
                        strokeWidth={1.2}
                      />
                    );
                  })}
                  <ellipse
                    cx={nx}
                    cy={ny}
                    rx={5.5}
                    ry={3.8}
                    transform={`rotate(-20 ${nx} ${ny})`}
                    fill={isSelected ? 'var(--emerald)' : 'rgba(44, 51, 47, 0.12)'}
                    stroke={noteColor}
                    strokeWidth={1.5}
                  />
                  <line
                    x1={stemDir === 'up' ? nx + 4.8 : nx - 4.8}
                    y1={stemDir === 'up' ? ny - 1 : ny + 1}
                    x2={stemDir === 'up' ? nx + 4.8 : nx - 4.8}
                    y2={stemDir === 'up' ? ny - 35 : ny + 35}
                    stroke={noteColor}
                    strokeWidth={1.2}
                  />
                  <text
                    x={nx}
                    y={ny + (stemDir === 'up' ? 14 : -12)}
                    textAnchor="middle"
                    fontSize="9.5px"
                    fontWeight={isSelected ? '700' : '500'}
                    fill={noteColor}
                  >
                    {displayLetter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interactive Piano Keyboard */}
        <div className="nnsr-modal-piano-wrap">
          <PianoKeyboard
            onKeyPress={handlePianoKeyPress}
            onKeyToggle={handlePianoKeyPress}
            activeHighlights={activeHighlights}
          />
        </div>

        {/* Start Tempo Control & Start Button */}
        <div className="nnsr-tempo-controls">
          <label htmlFor="nnsr-start-bpm-slider" className="nnsr-tempo-label">
            Start Tempo
          </label>
          <div className="nnsr-tempo-slider-wrap">
            <input
              id="nnsr-start-bpm-slider"
              type="range"
              min={15}
              max={240}
              step={1}
              value={startingBpm}
              onChange={(e) => setStartingBpm(Number(e.target.value))}
              className="nnsr-tempo-range"
              aria-label="Starting BPM Slider"
            />
          </div>
          <div className="nnsr-tempo-input-wrap">
            <input
              type="number"
              min={15}
              max={240}
              value={startingBpm}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  setStartingBpm(Math.max(15, Math.min(240, val)));
                }
              }}
              className="nnsr-tempo-number-input"
              aria-label="Starting BPM Input"
            />
            <span className="nnsr-tempo-unit">BPM</span>
          </div>
          <button
            className="nnsr-modal-start-btn"
            onClick={handleStart}
            disabled={selectedTargets.length === 0}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};
