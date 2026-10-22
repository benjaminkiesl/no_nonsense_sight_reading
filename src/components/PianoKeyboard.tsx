import React from 'react';

export interface ActiveKeyHighlight {
  midi: number;
  status: 'correct' | 'wrong' | 'neutral';
}

export interface PianoKeyboardProps {
  onKeyPress: (midi: number) => void;
  activeHighlights: readonly ActiveKeyHighlight[];
}

interface WhiteKeyInfo {
  midi: number;
  noteName: string;
  hasBlackAfter: boolean;
  blackMidi?: number;
}

const WHITE_KEYS_OCTAVE: Array<{ semitone: number; name: string; hasBlackAfter: boolean }> = [
  { semitone: 0, name: 'C', hasBlackAfter: true },
  { semitone: 2, name: 'D', hasBlackAfter: true },
  { semitone: 4, name: 'E', hasBlackAfter: false },
  { semitone: 5, name: 'F', hasBlackAfter: true },
  { semitone: 7, name: 'G', hasBlackAfter: true },
  { semitone: 9, name: 'A', hasBlackAfter: true },
  { semitone: 11, name: 'B', hasBlackAfter: false },
];

function generatePianoKeys(): {
  whiteKeys: WhiteKeyInfo[];
  blackKeys: Array<{ midi: number; x: number }>;
} {
  const whiteKeys: WhiteKeyInfo[] = [];
  const blackKeys: Array<{ midi: number; x: number }> = [];

  const whiteKeyWidth = 840 / 29;
  let whiteIndex = 0;

  for (let octave = 2; octave <= 5; octave++) {
    for (const wk of WHITE_KEYS_OCTAVE) {
      const midi = (octave + 1) * 12 + wk.semitone;
      const blackMidi = wk.hasBlackAfter ? midi + 1 : undefined;

      whiteKeys.push({
        midi,
        noteName: `${wk.name}${octave}`,
        hasBlackAfter: wk.hasBlackAfter,
        blackMidi,
      });

      if (wk.hasBlackAfter && blackMidi !== undefined) {
        // Position black key centered over the boundary between white keys
        const blackX = (whiteIndex + 1) * whiteKeyWidth - 9;
        blackKeys.push({ midi: blackMidi, x: blackX });
      }

      whiteIndex++;
    }
  }

  // Final C6 key (MIDI 84)
  whiteKeys.push({
    midi: 84,
    noteName: 'C6',
    hasBlackAfter: false,
  });

  return { whiteKeys, blackKeys };
}

const { whiteKeys: PIANO_WHITE_KEYS, blackKeys: PIANO_BLACK_KEYS } = generatePianoKeys();

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ onKeyPress, activeHighlights }) => {
  const highlightMap = new Map<number, 'correct' | 'wrong' | 'neutral'>();
  for (const h of activeHighlights) {
    highlightMap.set(h.midi, h.status);
  }

  const whiteKeyWidth = 840 / 29;

  const getFillColor = (midi: number, isBlack: boolean): string => {
    const status = highlightMap.get(midi);
    if (status === 'correct') return 'var(--emerald)';
    if (status === 'wrong') return 'var(--vibrant-coral)';
    if (status === 'neutral') return 'var(--jasmine)';
    return isBlack ? '#1f2421' : '#ffffff';
  };

  return (
    <div className="nnsr-piano-container" style={{ width: '840px', height: '170px' }}>
      <svg
        viewBox="0 0 840 170"
        width="840"
        height="170"
        style={{ display: 'block', userSelect: 'none' }}
      >
        {/* Render White Keys */}
        {PIANO_WHITE_KEYS.map((key, index) => {
          const x = index * whiteKeyWidth;
          const fill = getFillColor(key.midi, false);
          const isMiddleC = key.midi === 60;

          return (
            <g
              key={`white-${key.midi}`}
              onPointerDown={(e) => {
                e.preventDefault();
                onKeyPress(key.midi);
              }}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={0}
                width={whiteKeyWidth}
                height={170}
                fill={fill}
                stroke="#2c332f"
                strokeWidth={1}
                rx={2}
              />
              {isMiddleC && (
                <circle
                  cx={x + whiteKeyWidth / 2}
                  cy={154}
                  r={3.5}
                  fill={fill === '#ffffff' ? '#5a625e' : '#1f2421'}
                />
              )}
            </g>
          );
        })}

        {/* Render Black Keys on top */}
        {PIANO_BLACK_KEYS.map((key) => {
          const fill = getFillColor(key.midi, true);

          return (
            <rect
              key={`black-${key.midi}`}
              x={key.x}
              y={0}
              width={18}
              height={106}
              fill={fill}
              stroke="#1f2421"
              strokeWidth={1}
              rx={1.5}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onKeyPress(key.midi);
              }}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
    </div>
  );
};
