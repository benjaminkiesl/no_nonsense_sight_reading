import React, { useEffect, useRef } from 'react';
import { getAllLevels } from '../curriculum/graph';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { getStaffStepOffset } from '../music/pitch';
import { LevelSpec } from '../types/curriculum';
import { StaffNoteTarget } from '../types/music';

export interface LevelGraphProps {
  currentLevelId: string;
  completedLevelIds: ReadonlySet<string>;
  onSelectLevel: (levelId: string) => void;
  onOpenAccelerando?: () => void;
}

const ALL_LEVELS = getAllLevels();

const PADDING_TOP = 110;
const TIER_HEIGHT = 96;
const BOTH_Y_OFFSET = 36; // "both" is positioned 36px higher up than single clefs
const SVG_WIDTH = 300;
const SVG_HEIGHT = PADDING_TOP + 11 * TIER_HEIGHT + BOTH_Y_OFFSET + 70;
const NODE_RADIUS = 25;

const LANE_X: Record<string, number> = {
  treble: 55,
  both: 150,
  bass: 245,
};

function getNodePosition(level: LevelSpec): { x: number; y: number } {
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
                x1={nx - 2.8}
                y1={ly}
                x2={nx + 2.8}
                y2={ly}
                stroke="#1f2421"
                strokeWidth={0.7}
              />
            );
          })}

          {/* Notehead */}
          <ellipse
            cx={nx}
            cy={ny}
            rx={isCompact ? 1.3 : 1.8}
            ry={isCompact ? 0.9 : 1.2}
            transform={`rotate(-20 ${nx} ${ny})`}
            fill="#1f2421"
          />

          {/* Stem */}
          <line
            x1={stemDir === 'up' ? nx + (isCompact ? 1.1 : 1.5) : nx - (isCompact ? 1.1 : 1.5)}
            y1={ny}
            x2={stemDir === 'up' ? nx + (isCompact ? 1.1 : 1.5) : nx - (isCompact ? 1.1 : 1.5)}
            y2={stemDir === 'up' ? ny - stemLength : ny + stemLength}
            stroke="#1f2421"
            strokeWidth={0.7}
          />
        </g>
      );
    });
  }

  return (
    <g>
      {/* 5 Staff lines */}
      {staffLines.map((ly, idx) => (
        <line
          key={`line-${idx}`}
          x1={leftX}
          y1={ly}
          x2={rightX}
          y2={ly}
          stroke="#5a625e"
          strokeWidth={0.6}
        />
      ))}

      {/* Clef symbol on left */}
      <text
        x={cx - (isCompact ? 9.5 : 10.5)}
        y={cy + (clef === 'treble' ? (isCompact ? 1.8 : 2.5) : isCompact ? 1.0 : 1.5)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={clef === 'treble' ? (isCompact ? '9.5px' : '14px') : isCompact ? '8px' : '11px'}
        fontFamily="serif"
        fill="#1f2421"
      >
        {clef === 'treble' ? '𝄞' : '𝄢'}
      </text>

      {/* Accidental (# or b) right of clef, left of notes */}
      {accidentalSymbol && (
        <text
          x={cx - (isCompact ? 2.5 : 2.0)}
          y={cy + (isCompact ? 1.0 : 1.5)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isCompact ? '7px' : '9.5px'}
          fontFamily="serif"
          fontWeight="bold"
          fill="#1f2421"
        >
          {accidentalSymbol}
        </text>
      )}

      {/* Interval notes */}
      {notesToDraw}
    </g>
  );
};

export const LevelGraph: React.FC<LevelGraphProps> = ({
  currentLevelId,
  completedLevelIds,
  onSelectLevel,
  onOpenAccelerando,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to center the current level node on mount and when level changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const currentLevel = ALL_LEVELS.find((l) => l.id === currentLevelId);
    if (!currentLevel) return;

    const { y } = getNodePosition(currentLevel);
    const targetScrollTop = y - container.clientHeight / 2;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = Math.max(0, targetScrollTop);
    }
  }, [currentLevelId]);

  const isTrophyCompleted = completedLevelIds.has('both-12');

  // Generate directed arrows
  const arrows: React.JSX.Element[] = [];

  // Arrow connecting both-12 (x=150, y=110) to Summit Trophy node (x=150, y=45)
  arrows.push(
    <line
      key="arrow-both-trophy"
      x1={150}
      y1={110 - NODE_RADIUS}
      x2={150}
      y2={45 + NODE_RADIUS + 4}
      stroke={isTrophyCompleted ? 'var(--emerald)' : '#b0aba2'}
      strokeWidth={1.8}
      markerEnd="url(#arrowhead)"
    />
  );

  for (let tier = 1; tier <= 12; tier++) {
    const tierIdx = 12 - tier;
    const ySingleCur = PADDING_TOP + tierIdx * TIER_HEIGHT + BOTH_Y_OFFSET;
    const yBothCur = ySingleCur - BOTH_Y_OFFSET;

    // Upward arrows to next tier (tier -> tier + 1)
    if (tier < 12) {
      const ySingleNext = PADDING_TOP + (tierIdx - 1) * TIER_HEIGHT + BOTH_Y_OFFSET;
      const yBothNext = ySingleNext - BOTH_Y_OFFSET;

      // Treble upward
      arrows.push(
        <line
          key={`arrow-treble-${tier}`}
          x1={55}
          y1={ySingleCur - NODE_RADIUS}
          x2={55}
          y2={ySingleNext + NODE_RADIUS + 4}
          stroke="#b0aba2"
          strokeWidth={1.8}
          markerEnd="url(#arrowhead)"
        />
      );

      // Bass upward
      arrows.push(
        <line
          key={`arrow-bass-${tier}`}
          x1={245}
          y1={ySingleCur - NODE_RADIUS}
          x2={245}
          y2={ySingleNext + NODE_RADIUS + 4}
          stroke="#b0aba2"
          strokeWidth={1.8}
          markerEnd="url(#arrowhead)"
        />
      );

      // Both upward
      arrows.push(
        <line
          key={`arrow-both-${tier}`}
          x1={150}
          y1={yBothCur - NODE_RADIUS}
          x2={150}
          y2={yBothNext + NODE_RADIUS + 4}
          stroke="#b0aba2"
          strokeWidth={1.8}
          markerEnd="url(#arrowhead)"
        />
      );
    }

    // Slanted arrows into Both from Treble and Bass
    // Treble-k (55, ySingleCur) -> Both-k (150, yBothCur)
    const dx = 150 - 55; // 95
    const dy = yBothCur - ySingleCur; // -36 (upward)
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    arrows.push(
      <line
        key={`arrow-cross-t-both-${tier}`}
        x1={55 + ux * NODE_RADIUS}
        y1={ySingleCur + uy * NODE_RADIUS}
        x2={150 - ux * (NODE_RADIUS + 4)}
        y2={yBothCur - uy * (NODE_RADIUS + 4)}
        stroke="#b0aba2"
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );

    // Bass-k (245, ySingleCur) -> Both-k (150, yBothCur)
    const dxB = 150 - 245; // -95
    const uxB = dxB / len;

    arrows.push(
      <line
        key={`arrow-cross-b-both-${tier}`}
        x1={245 + uxB * NODE_RADIUS}
        y1={ySingleCur + uy * NODE_RADIUS}
        x2={150 - uxB * (NODE_RADIUS + 4)}
        y2={yBothCur - uy * (NODE_RADIUS + 4)}
        stroke="#b0aba2"
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
  }

  return (
    <div className="nnsr-level-graph-container">
      <div className="nnsr-level-graph-header">
        <div style={{ width: '33%', textAlign: 'center' }}>Treble</div>
        <div style={{ width: '33%', textAlign: 'center' }}>Both</div>
        <div style={{ width: '33%', textAlign: 'center' }}>Bass</div>
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

          {/* Summit Trophy Node (X=150, Y=45) */}
          <g
            className={`nnsr-graph-trophy-node ${isTrophyCompleted ? 'completed' : ''}`}
            aria-label="Grand Mastery Trophy"
            data-testid="summit-trophy-node"
          >
            {isTrophyCompleted && (
              <circle
                cx={150}
                cy={45}
                r={NODE_RADIUS + 4}
                fill="none"
                stroke="var(--gold-champagne)"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}
            <circle
              cx={150}
              cy={45}
              r={NODE_RADIUS}
              fill={isTrophyCompleted ? 'var(--gold-champagne)' : '#ffffff'}
              stroke={isTrophyCompleted ? 'var(--gold-primary)' : '#8c948f'}
              strokeWidth={isTrophyCompleted ? 2.5 : 1.8}
            />
            {/* Trophy Icon */}
            <g
              transform="translate(138, 33) scale(0.048)"
              fill={isTrophyCompleted ? '#183324' : '#8c948f'}
            >
              <path d="M400 32H112C85.5 32 64 53.5 64 80v32c0 70.6 57.4 128 128 128h16.2c16.3 35.5 48.7 61.9 87.8 70.3V384h-48c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h192c17.7 0 32-14.3 32-32v-32c0-17.7-14.3-32-32-32h-48v-73.7c39.1-8.4 71.5-34.8 87.8-70.3H320c70.6 0 128-57.4 128-128V80c0-26.5-21.5-48-48-48zM96 112V80c0-8.8 7.2-16 16-16h32v96c-26.5 0-48-21.5-48-48zm320 0c0 26.5-21.5 48-48 48V64h32c8.8 0 16 7.2 16 16v32z" />
            </g>
            <text
              x={150}
              y={79}
              textAnchor="middle"
              fontSize="8.5px"
              fontWeight="700"
              fill={isTrophyCompleted ? 'var(--gold-primary)' : 'var(--ink-secondary)'}
              letterSpacing="0.05em"
            >
              SUMMIT
            </text>
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
              stroke="#232b26"
              strokeWidth={2}
            />
            {/* Speedometer SVG Icon */}
            <g transform="translate(65, 65)">
              {/* Dial Arc */}
              <path
                d="M -13 4 A 14 14 0 1 1 13 4"
                fill="none"
                stroke="#183324"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              {/* Gauge ticks */}
              <line x1="-10" y1="0" x2="-7" y2="0" stroke="#d4af37" strokeWidth={1.5} />
              <line x1="0" y1="-12" x2="0" y2="-9" stroke="#d4af37" strokeWidth={1.5} />
              <line x1="10" y1="0" x2="7" y2="0" stroke="#d4af37" strokeWidth={1.5} />
              {/* Speedometer Needle pointing up-right */}
              <line
                x1="0"
                y1="3"
                x2="8"
                y2="-7"
                stroke="var(--vibrant-coral)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Center Hub */}
              <circle cx="0" cy="3" r="2.5" fill="#183324" />
            </g>
            <text
              x={65}
              y={98}
              textAnchor="middle"
              fontSize="7.5px"
              fontWeight="700"
              fill="var(--ink-secondary)"
              letterSpacing="0.04em"
            >
              PERPETUO
            </text>
          </g>

          {/* Render Curriculum Level Nodes */}
          {ALL_LEVELS.map((level) => {
            const { x, y } = getNodePosition(level);
            const isCurrent = level.id === currentLevelId;
            const isCompleted = completedLevelIds.has(level.id);

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

            // Key signature accidental symbol for scale levels
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
                }`}
              >
                {/* Active Outer Ring */}
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

                {/* Base Node Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                {/* Musical Engraving inside Node */}
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
        </svg>
      </div>
    </div>
  );
};
