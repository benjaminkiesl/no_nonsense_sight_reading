import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playMutedFeltThud, playSanctuaryRestChime, playSanctuaryWakeChime } from '../audio/recoveryAudio';
import { ChordEngine, midiToBassDiatonicStep, midiToBassStaffY } from '../chord/engine';
import { formatChordLabel, toPitchClass } from '../chord/chords';
import { getChordLevelById } from '../chord/curriculum';
import { mapKeyboardEventToInput } from '../input/keyboardMapper';
import { MidiManager } from '../input/midiManager';
import { getLedgerLines } from '../music/notation';
import { KEY_SIGNATURES } from '../music/scales';
import { useAppStore } from '../store/useAppStore';
import { ChordDefinition, ChordEngineSnapshot, ChordLevelSpec } from '../types/chord';
import { ActiveKeyHighlight, PianoKeyboard } from './PianoKeyboard';
import { ProgressBar } from './ProgressBar';

export interface ChordArenaProps {
  levelId: string;
  onLevelComplete?: () => void;
  isPaused?: boolean;
  onMidiRegister?: (handlers: { onNoteOn: (midi: number) => void; onNoteOff: (midi: number) => void }) => void;
}

export function isHeldMidiValid(
  midi: number,
  targetChord: ChordDefinition,
  allHeldMidis: readonly number[] | Set<number>
): boolean {
  const pc = toPitchClass(midi);
  if (!targetChord.allowedPitchClasses.includes(pc)) {
    return false;
  }

  // If slash chord, check if this is the lowest note and if it matches slash bass
  if (targetChord.isSlashChord && targetChord.bassPitchClass !== undefined) {
    const heldArray = Array.from(allHeldMidis);
    const minMidi = Math.min(...heldArray);
    if (midi === minMidi) {
      return pc === targetChord.bassPitchClass;
    }
  }

  return true;
}

export const ChordArena: React.FC<ChordArenaProps> = ({
  levelId,
  onLevelComplete,
  isPaused = false,
  onMidiRegister,
}) => {
  const chordNotationSystem = useAppStore((state) => state.chordNotationSystem);

  const chordLevel: ChordLevelSpec = getChordLevelById(levelId);
  const engineRef = useRef<ChordEngine>(new ChordEngine(chordLevel, chordNotationSystem));
  const [snapshot, setSnapshot] = useState<ChordEngineSnapshot>(() => engineRef.current.getSnapshot());

  // Update notation system in engine if changed from header
  useEffect(() => {
    engineRef.current.setNotationSystem(chordNotationSystem);
    setSnapshot(engineRef.current.getSnapshot());
  }, [chordNotationSystem]);

  // Re-create engine when levelId changes
  useEffect(() => {
    engineRef.current = new ChordEngine(chordLevel, chordNotationSystem);
    setSnapshot(engineRef.current.getSnapshot());
  }, [levelId]);

  // Main animation / tick loop for scrolling chords and countdown
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;

      if (!isPaused) {
        const snap = engineRef.current.getSnapshot();
        if (snap.phase !== 'LEARN' && snap.phase !== 'LEVEL_COMPLETE') {
          engineRef.current.tick(deltaMs);
          const currentSnap = engineRef.current.getSnapshot();

          if (currentSnap.phase === 'LEVEL_COMPLETE') {
            onLevelComplete?.();
          }

          setSnapshot(currentSnap);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, onLevelComplete]);

  // Handle Note On
  const handleNoteOn = useCallback((midi: number) => {
    const res = engineRef.current.handleNoteOn(midi);
    const snap = engineRef.current.getSnapshot();
    setSnapshot(snap);

    if (res.outcome === 'correct_hit') {
      playSanctuaryWakeChime();
    } else if (res.outcome === 'correction_complete') {
      playSanctuaryRestChime();
    } else if (res.outcome === 'wrong_notes') {
      playMutedFeltThud();
    } else if (res.outcome === 'level_advance') {
      onLevelComplete?.();
    }
  }, [onLevelComplete]);

  // Handle Note Off
  const handleNoteOff = useCallback((midi: number) => {
    engineRef.current.handleNoteOff(midi);
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  const handleNoteOnRef = useRef(handleNoteOn);
  handleNoteOnRef.current = handleNoteOn;
  const handleNoteOffRef = useRef(handleNoteOff);
  handleNoteOffRef.current = handleNoteOff;

  // Register with parent if requested
  useEffect(() => {
    if (onMidiRegister) {
      onMidiRegister({
        onNoteOn: (m) => handleNoteOnRef.current(m),
        onNoteOff: (m) => handleNoteOffRef.current(m),
      });
    }
  }, [onMidiRegister]);

  // Local Web MIDI API fallback when rendered standalone
  useEffect(() => {
    if (onMidiRegister) return;

    const midi = new MidiManager({
      onNoteOn: (midi) => {
        handleNoteOnRef.current(midi);
      },
      onNoteOff: (midi) => {
        handleNoteOffRef.current(midi);
      },
      onConnectionChange: () => {},
    });

    midi.init();
    return () => midi.dispose();
  }, [onMidiRegister]);

  // Computer Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return; // Handled by App
      if (e.repeat) return;

      const mapped = mapKeyboardEventToInput(e);
      if (mapped && mapped.source === 'computer_keyboard') {
        const targetOctave = 3;
        let midi = (targetOctave + 1) * 12 + mapped.pitchClass;
        handleNoteOn(midi);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;

      const mapped = mapKeyboardEventToInput(e);
      if (mapped && mapped.source === 'computer_keyboard') {
        const targetOctave = 3;
        let midi = (targetOctave + 1) * 12 + mapped.pitchClass;
        handleNoteOff(midi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteOn, handleNoteOff]);

  // Piano Key click / toggle
  const handlePianoKeyToggle = useCallback((midi: number) => {
    if (snapshot.activeHeldMidis.includes(midi)) {
      handleNoteOff(midi);
    } else {
      handleNoteOn(midi);
    }
  }, [snapshot.activeHeldMidis, handleNoteOff, handleNoteOn]);

  // Build active keyboard highlights
  const keyboardHighlights: ActiveKeyHighlight[] = [];
  const target = snapshot.currentTargetChord;
  const isLearnOrMistake =
    snapshot.phase === 'LEARN' || snapshot.substate === 'WAITING_FOR_CORRECTION';

  if (target && isLearnOrMistake) {
    // Illuminate reference chord keys during Learn / Mistake freeze in Jasmine yellow
    for (const midi of target.referenceVoicing.allMidis) {
      keyboardHighlights.push({ midi, status: 'neutral' });
    }
  }

  // Held notes override with real-time feedback (emerald green or coral red)
  if (target) {
    for (const midi of snapshot.activeHeldMidis) {
      const valid = isHeldMidiValid(midi, target, snapshot.activeHeldMidis);
      // Remove any existing highlight for this key
      const existingIdx = keyboardHighlights.findIndex((h) => h.midi === midi);
      if (existingIdx >= 0) {
        keyboardHighlights.splice(existingIdx, 1);
      }
      keyboardHighlights.push({
        midi,
        status: valid ? 'correct' : 'wrong',
      });
    }
  }

  // Key signature accidentals
  const primaryKeySig = chordLevel.keySignatures[0] || 'C_MAJOR';
  const keySigSpec = KEY_SIGNATURES[primaryKeySig];

  const hitZoneLeft = 120;
  const hitZoneWidth = 50;
  const hitZoneCenter = 145;

  let hitZoneFill = 'rgba(96, 211, 148, 0.16)';
  let hitZoneBorder = 'rgba(96, 211, 148, 0.45)';
  if (snapshot.substate === 'WAITING_FOR_CORRECTION') {
    hitZoneFill = 'rgba(238, 96, 85, 0.22)';
    hitZoneBorder = 'rgba(238, 96, 85, 0.65)';
  }

  return (
    <div className="nnsr-chord-arena" data-testid="chord-arena">
      {/* Title & Level Header */}
      <div className="nnsr-rhythm-banner" style={{ marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink-primary)' }}>
            Chord Symbols — Tier {chordLevel.tier}: {chordLevel.title}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#5a625e' }}>
            {chordLevel.subtitle} · Target: {chordLevel.targetBpm} BPM
            {snapshot.phase !== 'LEARN' && ` (Current: ${snapshot.actualBpm} BPM)`}
          </p>
        </div>
      </div>

      {/* Main Grand Staff Vector Engraving (840 x 260) */}
      <div className="nnsr-staff-container" style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 840 260"
          width="840"
          height="260"
          style={{ display: 'block', backgroundColor: '#ffffff' }}
        >
          <defs>
            <filter id="reference-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dedicated Chord Symbol Lead-Sheet Track Separator */}
          <line
            x1={16}
            y1={84}
            x2={840}
            y2={84}
            stroke="#e2dfd7"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Bass staff lines (y: 172, 184, 196, 208, 220) */}
          {[172, 184, 196, 208, 220].map((y) => (
            <line
              key={`bass-line-${y}`}
              x1={16}
              y1={y}
              x2={840}
              y2={y}
              stroke="#2c332f"
              strokeWidth={1.2}
            />
          ))}

          {/* Left vertical bar for bass staff */}
          <line x1={16} y1={172} x2={16} y2={220} stroke="#2c332f" strokeWidth={2.0} />

          {/* Bass Clef */}
          <text
            x={42}
            y={203}
            fontFamily="serif"
            fontSize={52}
            fill="#1f2421"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            𝄢
          </text>

          {/* Key Signature Accidentals */}
          {keySigSpec && keySigSpec.accidentalType !== 'none' && (
            <g fontFamily="serif" fontSize={22} fill="#1f2421" textAnchor="middle">
              {keySigSpec.bassStepOffsets.map((offset, idx) => (
                <text
                  key={`bass-acc-${idx}`}
                  x={74 + idx * 14}
                  y={220 - offset * 6 + 7}
                >
                  {keySigSpec.accidentalType === 'sharp' ? '♯' : '♭'}
                </text>
              ))}
            </g>
          )}

          {/* Hit Zone Column */}
          <rect
            data-testid="hit-zone"
            x={hitZoneLeft}
            y={20}
            width={hitZoneWidth}
            height={220}
            rx={6}
            fill={hitZoneFill}
            stroke={hitZoneBorder}
            strokeWidth={2.0}
          />

          {/* Countdown Indicator */}
          {snapshot.phase === 'COUNTDOWN' && (
            <text
              x={hitZoneCenter}
              y={130}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="serif"
              fontSize={52}
              fontWeight="bold"
              fill="#1f2421"
            >
              {Math.ceil(snapshot.countdownRemainingSec)}
            </text>
          )}

          {/* Scrolling Timeline Chord Badges */}
          {(snapshot.phase === 'SPEED_UP' || snapshot.phase === 'HOLD') &&
            snapshot.activeChords.map((chordEvent) => {
              const formatted = formatChordLabel(chordEvent.chord, chordNotationSystem);
              const isHit = chordEvent.state === 'hit';
              const isFailed = chordEvent.state === 'failed';

              let badgeBg = '#ffffff';
              let badgeBorder = '#b0aba2';
              let badgeOpacity = 1.0;
              let renderX = chordEvent.x;

              if (isHit) {
                badgeBg = '#60d394';
                badgeBorder = '#04724d';
                badgeOpacity = Math.max(0, 1 - chordEvent.stateTimeMs / 220);
              } else if (isFailed) {
                badgeBg = '#fdf0ed';
                badgeBorder = '#c0392b';
                renderX += Math.sin(chordEvent.stateTimeMs * 0.05) * 3;
              }

              return (
                <g
                  key={chordEvent.id}
                  data-testid={`chord-card-${chordEvent.chord.id}`}
                  opacity={badgeOpacity}
                  transform={`translate(${renderX}, 48)`}
                >
                  <rect
                    x={-34}
                    y={-20}
                    width={68}
                    height={40}
                    rx={6}
                    fill={badgeBg}
                    stroke={badgeBorder}
                    strokeWidth={2.0}
                  />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="var(--font-sans, sans-serif)"
                    fontSize={17}
                    fontWeight="bold"
                    fill="#1f2421"
                  >
                    {formatted}
                  </text>
                </g>
              );
            })}

          {/* Learn Phase: Large Chord Symbol Card */}
          {target && snapshot.phase === 'LEARN' && (
            <g
              data-testid="large-chord-symbol"
              transform={`translate(${hitZoneCenter}, 48)`}
            >
              <rect
                x={-34}
                y={-20}
                width={68}
                height={40}
                rx={6}
                fill="#ffffff"
                stroke="#60d394"
                strokeWidth={2.0}
              />
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-sans, sans-serif)"
                fontSize={17}
                fontWeight="bold"
                fill="#1f2421"
              >
                {formatChordLabel(target, chordNotationSystem)}
              </text>
            </g>
          )}

          {/* Learn Phase & Mistake Freeze: Stacked Canonical Reference Voicing Noteheads on Bass Staff */}
          {target && isLearnOrMistake && (
            <g>
              {(() => {
                const sortedRefMidis = [...target.referenceVoicing.allMidis].sort((a, b) => a - b);
                let prevStepOffset: number | null = null;

                return sortedRefMidis.map((midi) => {
                  const y = midiToBassStaffY(midi);
                  const { stepOffset, noteLetter, accidental } = midiToBassDiatonicStep(midi);
                  const ledgerLines = getLedgerLines(stepOffset);

                  const isSecond = prevStepOffset !== null && stepOffset - prevStepOffset <= 1;
                  prevStepOffset = stepOffset;

                  const noteheadX = isSecond ? hitZoneCenter + 14 : hitZoneCenter;
                  const labelX = isSecond ? hitZoneCenter + 30 : hitZoneCenter + 18;

                  return (
                    <g key={`reference-voicing-${midi}`}>
                      {/* Ledger lines */}
                      {ledgerLines.map((lOffset) => {
                        const ly = 220 - lOffset * 6;
                        return (
                          <line
                            key={`ref-ledger-${midi}-${lOffset}`}
                            x1={noteheadX - 14}
                            y1={ly}
                            x2={noteheadX + 14}
                            y2={ly}
                            stroke="#1f2421"
                            strokeWidth={1.8}
                          />
                        );
                      })}

                      {/* Accidental symbol */}
                      {accidental !== 0 && (
                        <text
                          x={hitZoneCenter - 16}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="serif"
                          fontSize={20}
                          fill="#1f2421"
                        >
                          {accidental === 1 ? '♯' : '♭'}
                        </text>
                      )}

                      {/* Glowing outer aura */}
                      <ellipse
                        cx={noteheadX}
                        cy={y}
                        rx={11}
                        ry={8.5}
                        fill="rgba(96, 211, 148, 0.4)"
                        stroke="#60d394"
                        strokeWidth={2}
                        filter="url(#reference-glow)"
                      />

                      {/* Reference Notehead */}
                      <ellipse
                        data-testid={`reference-notehead-${midi}`}
                        cx={noteheadX}
                        cy={y}
                        rx={7.5}
                        ry={5.4}
                        fill="#60d394"
                        stroke="#04724d"
                        strokeWidth={1.5}
                        transform={`rotate(-20 ${noteheadX} ${y})`}
                      />

                      {/* Pitch Name Label */}
                      <text
                        data-testid={`reference-label-${midi}`}
                        x={labelX}
                        y={y}
                        dominantBaseline="middle"
                        fontFamily="var(--font-sans, sans-serif)"
                        fontSize={12}
                        fontWeight="bold"
                        fill="#1f2421"
                      >
                        {formatChordLabel(noteLetter, chordNotationSystem)}
                      </text>
                    </g>
                  );
                });
              })()}
            </g>
          )}

          {/* Real-Time Live Polyphonic Held Notes Noteheads on Staff */}
          {target &&
            snapshot.activeHeldMidis.map((midi) => {
              let displayMidi = midi;
              while (displayMidi > 64) displayMidi -= 12;
              while (displayMidi < 36) displayMidi += 12;

              const y = midiToBassStaffY(displayMidi);
              const { stepOffset } = midiToBassDiatonicStep(displayMidi);
              const ledgerLines = getLedgerLines(stepOffset);
              const valid = isHeldMidiValid(midi, target, snapshot.activeHeldMidis);

              const fill = valid ? '#04724d' : '#c0392b';
              const stroke = valid ? '#60d394' : '#ee6055';

              return (
                <g key={`held-note-${midi}`}>
                  {/* Ledger lines */}
                  {ledgerLines.map((lOffset) => {
                    const ly = 220 - lOffset * 6;
                    return (
                      <line
                        key={`held-ledger-${midi}-${lOffset}`}
                        x1={hitZoneCenter - 14}
                        y1={ly}
                        x2={hitZoneCenter + 14}
                        y2={ly}
                        stroke={fill}
                        strokeWidth={1.8}
                      />
                    );
                  })}

                  {/* Held Notehead */}
                  <ellipse
                    data-testid={`held-notehead-${midi}`}
                    cx={hitZoneCenter}
                    cy={y}
                    rx={7.5}
                    ry={5.4}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                    transform={`rotate(-20 ${hitZoneCenter} ${y})`}
                  />
                </g>
              );
            })}
        </svg>

        {/* Mistake Freeze Banner */}
        {snapshot.substate === 'WAITING_FOR_CORRECTION' && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(238, 96, 85, 0.92)',
              color: '#ffffff',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Play the highlighted chord to resume
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar snapshot={snapshot} />

      {/* Piano Keyboard */}
      <PianoKeyboard
        activeHighlights={keyboardHighlights}
        onKeyToggle={handlePianoKeyToggle}
        onKeyPress={handleNoteOn}
      />
    </div>
  );
};
