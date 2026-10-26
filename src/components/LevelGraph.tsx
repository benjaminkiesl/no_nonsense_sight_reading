import React, { useEffect, useRef, useState } from 'react';
import { getAllLevels } from '../curriculum/graph';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { getStaffStepOffset } from '../music/pitch';
import { RHYTHM_LEVELS } from '../rhythm/curriculum';
import { LevelSpec } from '../types/curriculum';
import { StaffNoteTarget } from '../types/music';
import { MiniRhythmMotifType } from '../types/rhythm';

export interface LevelGraphProps {
  currentLevelId: string;
  completedLevelIds: ReadonlySet<string>;
  onSelectLevel: (levelId: string) => void;
  onOpenAccelerando?: () => void;
  onOpenRhythmStream?: () => void;
  celebratingLevelId?: string | null;
}

const ALL_LEVELS = getAllLevels();

const PADDING_TOP = 110;
const TIER_HEIGHT = 96;
const BOTH_Y_OFFSET = 36; // "both" is positioned 36px higher up than single clefs
const SVG_WIDTH = 400;
const SVG_HEIGHT = PADDING_TOP + 11 * TIER_HEIGHT + BOTH_Y_OFFSET + 70;
const NODE_RADIUS = 25;

const LANE_X: Record<string, number> = {
  treble: 55,
  both: 150,
  bass: 245,
};
const RHYTHM_X = 345;

export function getNodePosition(level: LevelSpec): { x: number; y: number } {
  const x = LANE_X[level.lane]!;
  const tierIndex = 12 - level.tier; // 0 for Tier 12, 11 for Tier 1
  const baseY = PADDING_TOP + tierIndex * TIER_HEIGHT + BOTH_Y_OFFSET;
  const y = level.lane === 'both' ? baseY - BOTH_Y_OFFSET : baseY;
  return { x, y };
}

function getOctagonPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

interface MiniStaffProps {
  cx: number;
  cy: number;
  clef: 'treble' | 'bass';
  intervalNotes?: readonly [StaffNoteTarget, StaffNoteTarget];
  accidentalSymbol?: string;
  isCompact?: boolean;
}

const MiniStaff: React.FC<MiniStaffProps> = ({
  cx,
  cy,
  clef,
  intervalNotes,
  accidentalSymbol,
  isCompact = false,
}) => {
  const spacing = isCompact ? 1.7 : 2.5;
  const stepScale = isCompact ? 0.85 : 1.25;
  const halfStaff = 2 * spacing;
  const staffWidth = isCompact ? 30 : 34;
  const leftX = cx - staffWidth / 2;
  const rightX = cx + staffWidth / 2;
  const bottomY = cy + halfStaff;

  const staffLines = [-2, -1, 0, 1, 2].map((i) => cy + i * spacing);

  // Position notes
  const notesToDraw: React.JSX.Element[] = [];
  if (intervalNotes && intervalNotes.length === 2) {
    const [lowest, highest] = intervalNotes;
    const noteTargets = [
      { target: lowest, nx: cx + (isCompact ? 3.5 : 4.5) },
      { target: highest, nx: cx + (isCompact ? 9.5 : 11.5) },
    ];

    noteTargets.forEach(({ target, nx }, i) => {
      const stepOffset = getStaffStepOffset(target.pitch, clef);
      const ny = bottomY - stepOffset * stepScale;
      const stemDir = getStemDirection(stepOffset);
      const stemLength = isCompact ? 5.5 : 7.5;
      const ledger = getLedgerLines(stepOffset);

      notesToDraw.push(
        <g key={`note-${i}`}>
          {/* Ledger lines */}
          {ledger.map((lOffset) => {
            const ly = bottomY - lOffset * stepScale;
            return (
              <line
                key={`ledger-${lOffset}`}
                x1={nx - (isCompact ? 3.5 : 4.5)}
                y1={ly}
                x2={nx + (isCompact ? 3.5 : 4.5)}
                y2={ly}
                stroke="#1f2421"
                strokeWidth={isCompact ? 0.8 : 1.0}
              />
            );
          })}

          {/* Notehead */}
          <ellipse
            cx={nx}
            cy={ny}
            rx={isCompact ? 2.5 : 3.2}
            ry={isCompact ? 1.8 : 2.4}
            fill="#1f2421"
            transform={`rotate(-20 ${nx} ${ny})`}
          />

          {/* Stem */}
          <line
            x1={stemDir === 'up' ? nx + (isCompact ? 2.1 : 2.8) : nx - (isCompact ? 2.1 : 2.8)}
            y1={ny}
            x2={stemDir === 'up' ? nx + (isCompact ? 2.1 : 2.8) : nx - (isCompact ? 2.1 : 2.8)}
            y2={stemDir === 'up' ? ny - stemLength : ny + stemLength}
            stroke="#1f2421"
            strokeWidth={isCompact ? 0.8 : 1.1}
          />
        </g>
      );
    });
  }

  return (
    <g>
      {/* 5 Staff Lines */}
      {staffLines.map((yPos, idx) => (
        <line
          key={`staff-line-${idx}`}
          x1={leftX}
          y1={yPos}
          x2={rightX}
          y2={yPos}
          stroke="#b0aba2"
          strokeWidth={0.7}
        />
      ))}

      {/* Accidental / Key Signature Symbol */}
      {accidentalSymbol && (
        <text
          x={cx - (isCompact ? 9 : 11)}
          y={cy + (isCompact ? 3.5 : 4.5)}
          fontFamily="serif"
          fontSize={isCompact ? 10 : 13}
          fill="#1f2421"
          textAnchor="middle"
        >
          {accidentalSymbol}
        </text>
      )}

      {/* Render Notes */}
      {notesToDraw}
    </g>
  );
};

interface MiniRhythmMotifProps {
  motif: MiniRhythmMotifType;
  cx: number;
  cy: number;
}

const MiniRhythmMotif: React.FC<MiniRhythmMotifProps> = ({ motif, cx, cy }) => {
  const staffLineY = cy + 3;
  const staffLine = (
    <line
      x1={cx - 15}
      y1={staffLineY}
      x2={cx + 15}
      y2={staffLineY}
      stroke="#b0aba2"
      strokeWidth={0.8}
    />
  );

  const drawNotehead = (x: number, y: number, fill = '#1f2421') => (
    <ellipse
      cx={x}
      cy={y}
      rx={2.2}
      ry={1.5}
      fill={fill}
      transform={`rotate(-20 ${x} ${y})`}
    />
  );

  const stemTop = cy - 7;
  const stem = (x: number, yBottom = staffLineY) => (
    <line x1={x + 1.8} y1={yBottom} x2={x + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.0} />
  );

  switch (motif) {
    case 'q_q': {
      const n1 = cx - 6;
      const n2 = cx + 6;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
        </g>
      );
    }
    case 'e2_q': {
      const n1 = cx - 9;
      const n2 = cx - 3;
      const n3 = cx + 7;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
          <line x1={n1 + 1.8} y1={stemTop} x2={n2 + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={2.0} />
          {drawNotehead(n3, staffLineY)}
          {stem(n3)}
        </g>
      );
    }
    case 'q_rest': {
      const n1 = cx - 6;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          <text
            x={cx + 5}
            y={cy + 7}
            fontSize="14"
            fontFamily="serif"
            fill="#1f2421"
            textAnchor="middle"
          >
            𝄽
          </text>
        </g>
      );
    }
    case 'dotq_e': {
      const n1 = cx - 7;
      const n2 = cx + 6;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          <circle cx={n1 + 4.5} cy={staffLineY - 1} r={1.0} fill="#1f2421" />
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
          <path
            d={`M ${n2 + 1.8} ${stemTop} Q ${n2 + 5.5} ${stemTop + 2} ${n2 + 4.5} ${stemTop + 5}`}
            fill="none"
            stroke="#1f2421"
            strokeWidth={1.2}
          />
        </g>
      );
    }
    case 's4': {
      const notes = [cx - 9, cx - 3, cx + 3, cx + 9];
      return (
        <g>
          {staffLine}
          {notes.map((nx, i) => (
            <React.Fragment key={i}>
              {drawNotehead(nx, staffLineY)}
              {stem(nx)}
            </React.Fragment>
          ))}
          <line x1={notes[0]! + 1.8} y1={stemTop} x2={notes[3]! + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={notes[0]! + 1.8} y1={stemTop + 3.2} x2={notes[3]! + 1.8} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
        </g>
      );
    }
    case 'gallop': {
      const notes = [cx - 8, cx, cx + 7];
      return (
        <g>
          {staffLine}
          {notes.map((nx, i) => (
            <React.Fragment key={i}>
              {drawNotehead(nx, staffLineY)}
              {stem(nx)}
            </React.Fragment>
          ))}
          <line x1={notes[0]! + 1.8} y1={stemTop} x2={notes[2]! + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={notes[1]! + 1.8} y1={stemTop + 3.2} x2={notes[2]! + 1.8} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
        </g>
      );
    }
    case 'rev_gallop': {
      const notes = [cx - 7, cx, cx + 8];
      return (
        <g>
          {staffLine}
          {notes.map((nx, i) => (
            <React.Fragment key={i}>
              {drawNotehead(nx, staffLineY)}
              {stem(nx)}
            </React.Fragment>
          ))}
          <line x1={notes[0]! + 1.8} y1={stemTop} x2={notes[2]! + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={notes[0]! + 1.8} y1={stemTop + 3.2} x2={notes[1]! + 1.8} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
        </g>
      );
    }
    case 'dot8_s': {
      const n1 = cx - 6;
      const n2 = cx + 6;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          <circle cx={n1 + 4.5} cy={staffLineY - 1} r={1.0} fill="#1f2421" />
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
          <line x1={n1 + 1.8} y1={stemTop} x2={n2 + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={n2 - 3.5} y1={stemTop + 3.2} x2={n2 + 1.8} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
        </g>
      );
    }
    case 'sync_e_q_e': {
      const n1 = cx - 8;
      const n2 = cx;
      const n3 = cx + 8;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
          {drawNotehead(n3, staffLineY)}
          {stem(n3)}
          <path d={`M ${n1 + 1.8} ${stemTop} L ${n3 + 1.8} ${stemTop}`} stroke="#1f2421" strokeWidth={1.2} />
        </g>
      );
    }
    case 'tie_across': {
      const n1 = cx - 6;
      const n2 = cx + 6;
      return (
        <g>
          {staffLine}
          {drawNotehead(n1, staffLineY)}
          {stem(n1)}
          {drawNotehead(n2, staffLineY)}
          {stem(n2)}
          <path
            d={`M ${n1} ${staffLineY + 3.5} Q ${cx} ${staffLineY + 7.5} ${n2} ${staffLineY + 3.5}`}
            fill="none"
            stroke="#1f2421"
            strokeWidth={1.2}
          />
        </g>
      );
    }
    case 'compound_6_8': {
      const notes = [cx - 8, cx, cx + 8];
      return (
        <g>
          {staffLine}
          {notes.map((nx, i) => (
            <React.Fragment key={i}>
              {drawNotehead(nx, staffLineY)}
              {stem(nx)}
            </React.Fragment>
          ))}
          <line x1={notes[0]! + 1.8} y1={stemTop} x2={notes[2]! + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <text x={cx} y={stemTop - 2} fontSize="7" fontStyle="italic" fontWeight="bold" textAnchor="middle" fill="#1f2421">
            3
          </text>
        </g>
      );
    }
    case 'rag_sync': {
      const notes = [cx - 8, cx, cx + 8];
      return (
        <g>
          {staffLine}
          {notes.map((nx, i) => (
            <React.Fragment key={i}>
              {drawNotehead(nx, staffLineY)}
              {stem(nx)}
            </React.Fragment>
          ))}
          <line x1={notes[0]! + 1.8} y1={stemTop} x2={notes[2]! + 1.8} y2={stemTop} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={notes[0]! + 1.8} y1={stemTop + 3.2} x2={notes[0]! + 4.5} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
          <line x1={notes[2]! - 1.5} y1={stemTop + 3.2} x2={notes[2]! + 1.8} y2={stemTop + 3.2} stroke="#1f2421" strokeWidth={1.8} />
        </g>
      );
    }
  }
};

export const LevelGraph: React.FC<LevelGraphProps> = ({
  currentLevelId,
  completedLevelIds,
  onSelectLevel,
  onOpenAccelerando,
  onOpenRhythmStream,
  celebratingLevelId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTrophyCelebrating, setIsTrophyCelebrating] = useState(false);

  // Auto-scroll on mount to focus around the active/current level
  useEffect(() => {
    if (!scrollRef.current) return;
    const isRhythm = currentLevelId.startsWith('rhythm-');
    if (isRhythm) {
      const tier = parseInt(currentLevelId.replace('rhythm-', ''), 10) || 1;
      const y = PADDING_TOP + (12 - tier) * TIER_HEIGHT + BOTH_Y_OFFSET;
      scrollRef.current.scrollTop = Math.max(0, y - 220);
    } else {
      const currentLevel = ALL_LEVELS.find((l) => l.id === currentLevelId);
      if (currentLevel) {
        const { y } = getNodePosition(currentLevel);
        scrollRef.current.scrollTop = Math.max(0, y - 220);
      }
    }
  }, [currentLevelId]);

  const isTrophyCompleted = completedLevelIds.has('both-12');

  // Trigger celebration burst on Trophy click if completed
  const handleTrophyClick = () => {
    if (isTrophyCompleted) {
      setIsTrophyCelebrating(true);
      setTimeout(() => setIsTrophyCelebrating(false), 800);
    }
    onSelectLevel('both-12');
  };

  // Build arrow edges
  const arrows: React.JSX.Element[] = [];

  // Clean upward arrow connecting both-12 (x=150, y=110) to the base of the standalone Trophy (base at y=62)
  arrows.push(
    <line
      key="arrow-both-trophy"
      x1={150}
      y1={110 - NODE_RADIUS}
      x2={150}
      y2={68}
      stroke={isTrophyCompleted ? 'var(--emerald)' : '#b0aba2'}
      strokeWidth={1.8}
      markerEnd="url(#arrowhead)"
    />
  );

  for (let tier = 1; tier <= 11; tier++) {
    const tierIdxCur = 12 - tier;
    const tierIdxNext = 12 - (tier + 1);

    const ySingleCur = PADDING_TOP + tierIdxCur * TIER_HEIGHT + BOTH_Y_OFFSET;
    const ySingleNext = PADDING_TOP + tierIdxNext * TIER_HEIGHT + BOTH_Y_OFFSET;

    // Treble vertical upward arrow
    arrows.push(
      <line
        key={`arrow-treble-${tier}-${tier + 1}`}
        x1={55}
        y1={ySingleCur - NODE_RADIUS}
        x2={55}
        y2={ySingleNext + NODE_RADIUS + 4}
        stroke={completedLevelIds.has(`treble-${tier + 1}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );

    // Bass vertical upward arrow
    arrows.push(
      <line
        key={`arrow-bass-${tier}-${tier + 1}`}
        x1={245}
        y1={ySingleCur - NODE_RADIUS}
        x2={245}
        y2={ySingleNext + NODE_RADIUS + 4}
        stroke={completedLevelIds.has(`bass-${tier + 1}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );

    // Both vertical upward arrow
    const yBothCur = ySingleCur - BOTH_Y_OFFSET;
    const yBothNext = ySingleNext - BOTH_Y_OFFSET;
    arrows.push(
      <line
        key={`arrow-both-${tier}-${tier + 1}`}
        x1={150}
        y1={yBothCur - NODE_RADIUS}
        x2={150}
        y2={yBothNext + NODE_RADIUS + 4}
        stroke={completedLevelIds.has(`both-${tier + 1}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );

    // Rhythm vertical upward arrow
    const yRhythmCur = ySingleCur;
    const yRhythmNext = ySingleNext;
    arrows.push(
      <line
        key={`arrow-rhythm-${tier}-${tier + 1}`}
        x1={RHYTHM_X}
        y1={yRhythmCur - NODE_RADIUS}
        x2={RHYTHM_X}
        y2={yRhythmNext + NODE_RADIUS + 4}
        stroke={completedLevelIds.has(`rhythm-${tier + 1}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
  }

  // Cross arrows within each tier: Treble -> Both and Bass -> Both
  for (let tier = 1; tier <= 12; tier++) {
    const tierIdxCur = 12 - tier;
    const ySingleCur = PADDING_TOP + tierIdxCur * TIER_HEIGHT + BOTH_Y_OFFSET;
    const yBothCur = ySingleCur - BOTH_Y_OFFSET;

    const dxT = 150 - 55; // +95
    const dy = yBothCur - ySingleCur; // -36
    const len = Math.sqrt(dxT * dxT + dy * dy);
    const uxT = dxT / len;
    const uy = dy / len;

    arrows.push(
      <line
        key={`arrow-cross-t-both-${tier}`}
        x1={55 + uxT * NODE_RADIUS}
        y1={ySingleCur + uy * NODE_RADIUS}
        x2={150 - uxT * (NODE_RADIUS + 4)}
        y2={yBothCur - uy * (NODE_RADIUS + 4)}
        stroke={completedLevelIds.has(`both-${tier}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );

    const dxB = 150 - 245; // -95
    const uxB = dxB / len;

    arrows.push(
      <line
        key={`arrow-cross-b-both-${tier}`}
        x1={245 + uxB * NODE_RADIUS}
        y1={ySingleCur + uy * NODE_RADIUS}
        x2={150 - uxB * (NODE_RADIUS + 4)}
        y2={yBothCur - uy * (NODE_RADIUS + 4)}
        stroke={completedLevelIds.has(`both-${tier}`) ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
  }

  return (
    <div className="nnsr-level-graph-container">
      <div className="nnsr-level-graph-header">
        <div style={{ width: '25%', textAlign: 'center' }}>Treble</div>
        <div style={{ width: '25%', textAlign: 'center' }}>Both</div>
        <div style={{ width: '25%', textAlign: 'center' }}>Bass</div>
        <div style={{ width: '25%', textAlign: 'center' }}>Rhythm</div>
      </div>

      <div ref={scrollRef} className="nnsr-level-graph-scroll">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          height={SVG_HEIGHT}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="7"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 7 3, 0 6" fill="#8c948f" />
            </marker>
          </defs>

          {/* Render Edge Arrows */}
          <g className="nnsr-graph-arrows">{arrows}</g>

          {/* Summit Trophy Node: Standalone Vector Shape at Peak (No Circle) */}
          <g
            className={`nnsr-graph-trophy-node ${isTrophyCompleted ? 'completed' : ''} ${
              isTrophyCelebrating ? 'celebrating' : ''
            }`}
            aria-label="Grand Mastery Trophy"
            data-testid="summit-trophy-node"
            role="button"
            tabIndex={0}
            onClick={handleTrophyClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTrophyClick();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Left Handle */}
            <path
              d="M 136 21 C 122 21 122 34 136 36"
              fill="none"
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Right Handle */}
            <path
              d="M 164 21 C 178 21 178 34 164 36"
              fill="none"
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Cup Body */}
            <path
              d="M 135 18 L 135 27 C 135 37 143 43 150 43 C 157 43 165 37 165 27 L 165 18 Z"
              fill={isTrophyCompleted ? 'var(--jasmine)' : '#ffffff'}
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={1.5}
            />

            {/* Top Rim */}
            <rect
              x={133}
              y={15}
              width={34}
              height={3.5}
              rx={1.5}
              fill={isTrophyCompleted ? 'var(--jasmine)' : '#ffffff'}
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={1.2}
            />

            {/* Stem */}
            <path
              d="M 147 43 L 145 49 L 155 49 L 153 43 Z"
              fill={isTrophyCompleted ? 'var(--jasmine)' : '#ffffff'}
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={1.2}
            />

            {/* Pedestal Plinth with SUMMIT engraving */}
            <rect
              x={131}
              y={49}
              width={38}
              height={10}
              rx={1.5}
              fill={isTrophyCompleted ? 'var(--emerald)' : '#ffffff'}
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={1.4}
            />

            {/* Base Foot */}
            <rect
              x={127}
              y={59}
              width={46}
              height={3}
              rx={1}
              fill={isTrophyCompleted ? 'var(--jasmine)' : '#ffffff'}
              stroke={isTrophyCompleted ? '#1f2421' : '#8c948f'}
              strokeWidth={1.2}
            />

            {/* Star Icon in Cup */}
            <polygon
              points="150,23 151.8,27.5 156.5,27.8 153,30.8 154.2,35.5 150,32.8 145.8,35.5 147,30.8 143.5,27.8 148.2,27.5"
              fill={isTrophyCompleted ? '#1f2421' : '#8c948f'}
            />
          </g>

          {/* Accelerando Perpetuo Octagon Node (X=65, Y=65) */}
          <g
            className="nnsr-graph-octagon-node"
            role="button"
            tabIndex={0}
            aria-label="Accelerando Perpetuo"
            data-testid="accelerando-octagon-node"
            onClick={() => onOpenAccelerando?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenAccelerando?.();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <polygon
              points={getOctagonPoints(65, 65, 23)}
              fill="#ffffff"
              stroke="var(--emerald)"
              strokeWidth={2.2}
            />
            {/* Speedometer SVG Icon */}
            <g transform="translate(65, 65)">
              <path
                d="M -13 4 A 14 14 0 1 1 13 4"
                fill="none"
                stroke="#1f2421"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <line x1="-10" y1="0" x2="-7" y2="0" stroke="var(--emerald)" strokeWidth={1.6} />
              <line x1="0" y1="-12" x2="0" y2="-9" stroke="var(--emerald)" strokeWidth={1.6} />
              <line x1="10" y1="0" x2="7" y2="0" stroke="var(--emerald)" strokeWidth={1.6} />
              <line
                x1="0"
                y1="3"
                x2="8"
                y2="-7"
                stroke="var(--vibrant-coral)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx="0" cy="3" r="2.5" fill="#1f2421" />
            </g>
          </g>

          {/* Infinite Rhythm Stream Octagon Node (X=RHYTHM_X=345, Y=65) */}
          <g
            className="nnsr-graph-octagon-node"
            role="button"
            tabIndex={0}
            aria-label="Infinite Rhythm Stream"
            data-testid="rhythm-stream-octagon-node"
            onClick={() => onOpenRhythmStream?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenRhythmStream?.();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <polygon
              points={getOctagonPoints(RHYTHM_X, 65, 23)}
              fill="#ffffff"
              stroke="var(--emerald)"
              strokeWidth={2.2}
            />
            {/* Metronome SVG Icon */}
            <g transform={`translate(${RHYTHM_X}, 65)`}>
              {/* Metronome Body */}
              <path
                d="M -7 11 L -4 -9 L 4 -9 L 7 11 Z"
                fill="none"
                stroke="#1f2421"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Pendulum arm */}
              <line
                x1="0"
                y1="9"
                x2="6"
                y2="-6"
                stroke="var(--emerald)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Sliding weight bead */}
              <circle cx="4.5" cy="-3.5" r="2.2" fill="var(--vibrant-coral)" />
            </g>
          </g>

          {/* Render Pitch Curriculum Level Nodes (36 total) */}
          {ALL_LEVELS.map((level) => {
            const { x, y } = getNodePosition(level);
            const isCurrent = level.id === currentLevelId;
            const isCompleted = completedLevelIds.has(level.id);
            const isCelebrating = celebratingLevelId === level.id;

            let fillColor = '#ffffff';
            let strokeColor = '#8c948f';
            let strokeWidth = 1.8;

            if (isCompleted) {
              fillColor = 'var(--light-green)';
              strokeColor = 'var(--emerald)';
              strokeWidth = 2.4;
            }

            if (isCurrent) {
              strokeColor = 'var(--emerald)';
              strokeWidth = 3;
            }

            let accidentalSymbol: string | undefined;
            if (level.keySignature === 'G_MAJOR') accidentalSymbol = '♯';
            else if (level.keySignature === 'F_MAJOR') accidentalSymbol = '♭';
            else if (level.keySignature === 'D_MAJOR') accidentalSymbol = '♯';
            else if (level.keySignature === 'BB_MAJOR') accidentalSymbol = '♭';

            return (
              <g
                key={level.id}
                role="button"
                tabIndex={0}
                aria-label={`Level ${level.title}`}
                onClick={() => onSelectLevel(level.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLevel(level.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
                className={`nnsr-graph-node ${isCurrent ? 'current' : ''} ${
                  isCompleted ? 'completed' : ''
                } ${isCelebrating ? 'celebrating-node' : ''}`}
              >
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 4.5}
                    fill="none"
                    stroke="var(--jasmine)"
                    strokeWidth={3}
                    strokeDasharray="4 2"
                  />
                )}

                {isCelebrating && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke="var(--emerald)"
                    strokeWidth={3}
                    className="nnsr-celebrate-ring"
                  />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                {level.lane === 'both' ? (
                  <g>
                    <MiniStaff
                      cx={x}
                      cy={y - 7}
                      clef="treble"
                      intervalNotes={level.displayInterval.treble}
                      accidentalSymbol={accidentalSymbol}
                      isCompact={true}
                    />
                    <MiniStaff
                      cx={x}
                      cy={y + 7}
                      clef="bass"
                      intervalNotes={level.displayInterval.bass}
                      accidentalSymbol={accidentalSymbol}
                      isCompact={true}
                    />
                  </g>
                ) : (
                  <MiniStaff
                    cx={x}
                    cy={y}
                    clef={level.lane as 'treble' | 'bass'}
                    intervalNotes={
                      level.lane === 'treble'
                        ? level.displayInterval.treble
                        : level.displayInterval.bass
                    }
                    accidentalSymbol={accidentalSymbol}
                    isCompact={false}
                  />
                )}
              </g>
            );
          })}

          {/* Render Rhythm Curriculum Level Nodes (12 total) */}
          {RHYTHM_LEVELS.map((rhythmLevel) => {
            const x = RHYTHM_X;
            const y = PADDING_TOP + (12 - rhythmLevel.tier) * TIER_HEIGHT + BOTH_Y_OFFSET;
            const isCurrent = rhythmLevel.id === currentLevelId;
            const isCompleted = completedLevelIds.has(rhythmLevel.id);
            const isCelebrating = celebratingLevelId === rhythmLevel.id;

            let fillColor = '#ffffff';
            let strokeColor = '#8c948f';
            let strokeWidth = 1.8;

            if (isCompleted) {
              fillColor = 'var(--light-green)';
              strokeColor = 'var(--emerald)';
              strokeWidth = 2.4;
            }

            if (isCurrent) {
              strokeColor = 'var(--emerald)';
              strokeWidth = 3;
            }

            return (
              <g
                key={rhythmLevel.id}
                role="button"
                tabIndex={0}
                aria-label={`Level Rhythm - Tier ${rhythmLevel.tier}: ${rhythmLevel.title}`}
                data-testid={`rhythm-node-${rhythmLevel.tier}`}
                onClick={() => onSelectLevel(rhythmLevel.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLevel(rhythmLevel.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
                className={`nnsr-graph-node nnsr-rhythm-graph-node ${isCurrent ? 'current' : ''} ${
                  isCompleted ? 'completed' : ''
                } ${isCelebrating ? 'celebrating-node' : ''}`}
              >
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 4.5}
                    fill="none"
                    stroke="var(--jasmine)"
                    strokeWidth={3}
                    strokeDasharray="4 2"
                  />
                )}

                {isCelebrating && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke="var(--emerald)"
                    strokeWidth={3}
                    className="nnsr-celebrate-ring"
                  />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                <MiniRhythmMotif motif={rhythmLevel.motif} cx={x} cy={y} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
