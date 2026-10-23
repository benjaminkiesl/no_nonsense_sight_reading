import React, { useEffect, useRef, useState } from 'react';
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
  celebratingLevelId?: string | null;
}

const ALL_LEVELS = getAllLevels();

const PADDING_TOP = 104;
const TIER_HEIGHT = 92;
const BOTH_Y_OFFSET = 32; // "both" is positioned 32px higher up than single clefs
const SVG_WIDTH = 680;
const SVG_HEIGHT = PADDING_TOP + 9 * TIER_HEIGHT + BOTH_Y_OFFSET + 60; // 1024
const NODE_RADIUS = 25;

export function getNodePosition(level: LevelSpec): { x: number; y: number } {
  const { tier, lane } = level;

  // Row Y positions
  // row 1: tiers 12 (Flat) and 11 (Sharp)
  // row 2: tiers 10 (Flat) and 9 (Sharp)
  // row 3: tier 8
  // ...
  // row 10: tier 1
  let rowIndex: number;
  if (tier === 12 || tier === 11) {
    rowIndex = 1;
  } else if (tier === 10 || tier === 9) {
    rowIndex = 2;
  } else {
    // tier 8 -> row 3, tier 1 -> row 10
    rowIndex = 3 + (8 - tier);
  }

  const baseY = PADDING_TOP + (rowIndex - 1) * TIER_HEIGHT + BOTH_Y_OFFSET;
  const y = lane === 'both' ? baseY - BOTH_Y_OFFSET : baseY;

  let x: number;
  if (tier === 10 || tier === 12) {
    // Left Wing (Flat)
    x = lane === 'treble' ? 65 : lane === 'both' ? 150 : 235;
  } else if (tier === 9 || tier === 11) {
    // Right Wing (Sharp)
    x = lane === 'treble' ? 445 : lane === 'both' ? 530 : 615;
  } else {
    // Central Trunk (Tiers 1-8)
    x = lane === 'treble' ? 250 : lane === 'both' ? 340 : 430;
  }

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
  celebratingLevelId,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isTrophyCelebrating, setIsTrophyCelebrating] = useState(false);

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

  const isTrophyCompleted =
    completedLevelIds.has('both-12') && completedLevelIds.has('both-11');

  const handleTrophyClick = () => {
    if (isTrophyCompleted) {
      setIsTrophyCelebrating(true);
      setTimeout(() => setIsTrophyCelebrating(false), 800);
    }
    onSelectLevel('both-12');
  };

  // Helper to render directed edges between nodes with markerEnd arrowhead
  const renderDirectedArrow = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    isCompleted: boolean,
    key: string,
    targetIsRect = false
  ) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    const ux = dx / len;
    const uy = dy / len;

    const x1 = fromX + ux * NODE_RADIUS;
    const y1 = fromY + uy * NODE_RADIUS;
    const x2 = targetIsRect ? toX : toX - ux * (NODE_RADIUS + 4);
    const y2 = targetIsRect ? toY : toY - uy * (NODE_RADIUS + 4);

    return (
      <line
        key={key}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isCompleted ? 'var(--emerald)' : '#b0aba2'}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
  };

  // Generate all directed arrows in curriculum graph
  const arrows: React.JSX.Element[] = [];

  // Summit arrows: both-12 (Flat wing top) and both-11 (Sharp wing top) -> Summit Trophy foot
  const arrowBoth12ToTrophy = renderDirectedArrow(
    150,
    104,
    325,
    62,
    completedLevelIds.has('both-12'),
    'arrow-both-12-trophy',
    true
  );
  if (arrowBoth12ToTrophy) arrows.push(arrowBoth12ToTrophy);

  const arrowBoth11ToTrophy = renderDirectedArrow(
    530,
    104,
    355,
    62,
    completedLevelIds.has('both-11'),
    'arrow-both-11-trophy',
    true
  );
  if (arrowBoth11ToTrophy) arrows.push(arrowBoth11ToTrophy);

  // Central Trunk (Tiers 1..8)
  for (let tier = 1; tier <= 8; tier++) {
    const { y: yTrebleCur } = getNodePosition({ id: `treble-${tier}`, tier, lane: 'treble' } as LevelSpec);
    const { y: yBothCur } = getNodePosition({ id: `both-${tier}`, tier, lane: 'both' } as LevelSpec);
    const { y: yBassCur } = getNodePosition({ id: `bass-${tier}`, tier, lane: 'bass' } as LevelSpec);

    // Slanted arrows: Treble-k -> Both-k, Bass-k -> Both-k
    const aTrebleBoth = renderDirectedArrow(
      250,
      yTrebleCur,
      340,
      yBothCur,
      completedLevelIds.has(`both-${tier}`),
      `arrow-slant-t-${tier}`
    );
    if (aTrebleBoth) arrows.push(aTrebleBoth);

    const aBassBoth = renderDirectedArrow(
      430,
      yBassCur,
      340,
      yBothCur,
      completedLevelIds.has(`both-${tier}`),
      `arrow-slant-b-${tier}`
    );
    if (aBassBoth) arrows.push(aBassBoth);

    // Upward arrows within trunk (tier -> tier + 1)
    if (tier < 8) {
      const { y: yTrebleNext } = getNodePosition({ id: `treble-${tier + 1}`, tier: tier + 1, lane: 'treble' } as LevelSpec);
      const { y: yBothNext } = getNodePosition({ id: `both-${tier + 1}`, tier: tier + 1, lane: 'both' } as LevelSpec);
      const { y: yBassNext } = getNodePosition({ id: `bass-${tier + 1}`, tier: tier + 1, lane: 'bass' } as LevelSpec);

      const aTrebleUp = renderDirectedArrow(
        250,
        yTrebleCur,
        250,
        yTrebleNext,
        completedLevelIds.has(`treble-${tier + 1}`),
        `arrow-trunk-t-${tier}`
      );
      if (aTrebleUp) arrows.push(aTrebleUp);

      const aBothUp = renderDirectedArrow(
        340,
        yBothCur,
        340,
        yBothNext,
        completedLevelIds.has(`both-${tier + 1}`),
        `arrow-trunk-both-${tier}`
      );
      if (aBothUp) arrows.push(aBothUp);

      const aBassUp = renderDirectedArrow(
        430,
        yBassCur,
        430,
        yBassNext,
        completedLevelIds.has(`bass-${tier + 1}`),
        `arrow-trunk-b-${tier}`
      );
      if (aBassUp) arrows.push(aBassUp);
    }
  }

  // Branching arrows from Tier 8 into Left Wing (Tier 10) and Right Wing (Tier 9)
  const posT8 = getNodePosition({ id: 'treble-8', tier: 8, lane: 'treble' } as LevelSpec);
  const posM8 = getNodePosition({ id: 'both-8', tier: 8, lane: 'both' } as LevelSpec);
  const posB8 = getNodePosition({ id: 'bass-8', tier: 8, lane: 'bass' } as LevelSpec);

  // Left Wing (Tier 10)
  const posT10 = getNodePosition({ id: 'treble-10', tier: 10, lane: 'treble' } as LevelSpec);
  const posM10 = getNodePosition({ id: 'both-10', tier: 10, lane: 'both' } as LevelSpec);
  const posB10 = getNodePosition({ id: 'bass-10', tier: 10, lane: 'bass' } as LevelSpec);

  const aT8T10 = renderDirectedArrow(posT8.x, posT8.y, posT10.x, posT10.y, completedLevelIds.has('treble-10'), 'arrow-t8-t10');
  if (aT8T10) arrows.push(aT8T10);
  const aM8M10 = renderDirectedArrow(posM8.x, posM8.y, posM10.x, posM10.y, completedLevelIds.has('both-10'), 'arrow-m8-m10');
  if (aM8M10) arrows.push(aM8M10);
  const aB8B10 = renderDirectedArrow(posB8.x, posB8.y, posB10.x, posB10.y, completedLevelIds.has('bass-10'), 'arrow-b8-b10');
  if (aB8B10) arrows.push(aB8B10);

  // Right Wing (Tier 9)
  const posT9 = getNodePosition({ id: 'treble-9', tier: 9, lane: 'treble' } as LevelSpec);
  const posM9 = getNodePosition({ id: 'both-9', tier: 9, lane: 'both' } as LevelSpec);
  const posB9 = getNodePosition({ id: 'bass-9', tier: 9, lane: 'bass' } as LevelSpec);

  const aT8T9 = renderDirectedArrow(posT8.x, posT8.y, posT9.x, posT9.y, completedLevelIds.has('treble-9'), 'arrow-t8-t9');
  if (aT8T9) arrows.push(aT8T9);
  const aM8M9 = renderDirectedArrow(posM8.x, posM8.y, posM9.x, posM9.y, completedLevelIds.has('both-9'), 'arrow-m8-m9');
  if (aM8M9) arrows.push(aM8M9);
  const aB8B9 = renderDirectedArrow(posB8.x, posB8.y, posB9.x, posB9.y, completedLevelIds.has('bass-9'), 'arrow-b8-b9');
  if (aB8B9) arrows.push(aB8B9);

  // Left Wing (Flat Wing): Tier 10 inner, Tier 10 -> Tier 12, Tier 12 inner
  const posT12 = getNodePosition({ id: 'treble-12', tier: 12, lane: 'treble' } as LevelSpec);
  const posM12 = getNodePosition({ id: 'both-12', tier: 12, lane: 'both' } as LevelSpec);
  const posB12 = getNodePosition({ id: 'bass-12', tier: 12, lane: 'bass' } as LevelSpec);

  // Within Tier 10
  const aT10M10 = renderDirectedArrow(posT10.x, posT10.y, posM10.x, posM10.y, completedLevelIds.has('both-10'), 'arrow-t10-m10');
  if (aT10M10) arrows.push(aT10M10);
  const aB10M10 = renderDirectedArrow(posB10.x, posB10.y, posM10.x, posM10.y, completedLevelIds.has('both-10'), 'arrow-b10-m10');
  if (aB10M10) arrows.push(aB10M10);

  // Tier 10 -> Tier 12
  const aT10T12 = renderDirectedArrow(posT10.x, posT10.y, posT12.x, posT12.y, completedLevelIds.has('treble-12'), 'arrow-t10-t12');
  if (aT10T12) arrows.push(aT10T12);
  const aM10M12 = renderDirectedArrow(posM10.x, posM10.y, posM12.x, posM12.y, completedLevelIds.has('both-12'), 'arrow-m10-m12');
  if (aM10M12) arrows.push(aM10M12);
  const aB10B12 = renderDirectedArrow(posB10.x, posB10.y, posB12.x, posB12.y, completedLevelIds.has('bass-12'), 'arrow-b10-b12');
  if (aB10B12) arrows.push(aB10B12);

  // Within Tier 12
  const aT12M12 = renderDirectedArrow(posT12.x, posT12.y, posM12.x, posM12.y, completedLevelIds.has('both-12'), 'arrow-t12-m12');
  if (aT12M12) arrows.push(aT12M12);
  const aB12M12 = renderDirectedArrow(posB12.x, posB12.y, posM12.x, posM12.y, completedLevelIds.has('both-12'), 'arrow-b12-m12');
  if (aB12M12) arrows.push(aB12M12);

  // Right Wing (Sharp Wing): Tier 9 inner, Tier 9 -> Tier 11, Tier 11 inner
  const posT11 = getNodePosition({ id: 'treble-11', tier: 11, lane: 'treble' } as LevelSpec);
  const posM11 = getNodePosition({ id: 'both-11', tier: 11, lane: 'both' } as LevelSpec);
  const posB11 = getNodePosition({ id: 'bass-11', tier: 11, lane: 'bass' } as LevelSpec);

  // Within Tier 9
  const aT9M9 = renderDirectedArrow(posT9.x, posT9.y, posM9.x, posM9.y, completedLevelIds.has('both-9'), 'arrow-t9-m9');
  if (aT9M9) arrows.push(aT9M9);
  const aB9M9 = renderDirectedArrow(posB9.x, posB9.y, posM9.x, posM9.y, completedLevelIds.has('both-9'), 'arrow-b9-m9');
  if (aB9M9) arrows.push(aB9M9);

  // Tier 9 -> Tier 11
  const aT9T11 = renderDirectedArrow(posT9.x, posT9.y, posT11.x, posT11.y, completedLevelIds.has('treble-11'), 'arrow-t9-t11');
  if (aT9T11) arrows.push(aT9T11);
  const aM9M11 = renderDirectedArrow(posM9.x, posM9.y, posM11.x, posM11.y, completedLevelIds.has('both-11'), 'arrow-m9-m11');
  if (aM9M11) arrows.push(aM9M11);
  const aB9B11 = renderDirectedArrow(posB9.x, posB9.y, posB11.x, posB11.y, completedLevelIds.has('bass-11'), 'arrow-b9-b11');
  if (aB9B11) arrows.push(aB9B11);

  // Within Tier 11
  const aT11M11 = renderDirectedArrow(posT11.x, posT11.y, posM11.x, posM11.y, completedLevelIds.has('both-11'), 'arrow-t11-m11');
  if (aT11M11) arrows.push(aT11M11);
  const aB11M11 = renderDirectedArrow(posB11.x, posB11.y, posM11.x, posM11.y, completedLevelIds.has('both-11'), 'arrow-b11-m11');
  if (aB11M11) arrows.push(aB11M11);

  return (
    <div className="nnsr-level-graph-container">
      <div className="nnsr-level-graph-header">
        <div className="nnsr-header-wing left">♭ Flat Wing</div>
        <div className="nnsr-header-trunk">
          <span>Treble</span>
          <span>Both</span>
          <span>Bass</span>
        </div>
        <div className="nnsr-header-wing right">♯ Sharp Wing</div>
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

          {/* Summit Trophy Node: Standalone Vector Shape at Peak (Centered at X=340) */}
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
            transform="translate(190, 0)"
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

            {/* Pedestal Plinth */}
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

          {/* Accelerando Perpetuo Octagon Node (Left of Summit Trophy at X=230, Y=46) */}
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
              points={getOctagonPoints(230, 46, 23)}
              fill="#ffffff"
              stroke="var(--emerald)"
              strokeWidth={2.2}
            />
            {/* Speedometer SVG Icon */}
            <g transform="translate(230, 46)">
              {/* Dial Arc */}
              <path
                d="M -13 4 A 14 14 0 1 1 13 4"
                fill="none"
                stroke="#1f2421"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              {/* Gauge ticks */}
              <line x1="-10" y1="0" x2="-7" y2="0" stroke="var(--emerald)" strokeWidth={1.6} />
              <line x1="0" y1="-12" x2="0" y2="-9" stroke="var(--emerald)" strokeWidth={1.6} />
              <line x1="10" y1="0" x2="7" y2="0" stroke="var(--emerald)" strokeWidth={1.6} />
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
              <circle cx="0" cy="3" r="2.5" fill="#1f2421" />
            </g>
          </g>

          {/* Render Curriculum Level Nodes */}
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
                } ${isCelebrating ? 'celebrating-node' : ''}`}
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

                {/* Celebratory Ripple Ring */}
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
