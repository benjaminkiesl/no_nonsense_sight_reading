import React from 'react';
import { getAllLevels } from '../curriculum/graph';
import { LevelSpec } from '../types/curriculum';

export interface LevelGraphProps {
  currentLevelId: string;
  completedLevelIds: ReadonlySet<string>;
  onSelectLevel: (levelId: string) => void;
}

const ALL_LEVELS = getAllLevels();

const ROW_HEIGHT = 78;
const PADDING_TOP = 46;
const PADDING_BOTTOM = 46;
const SVG_WIDTH = 300;
const SVG_HEIGHT = PADDING_TOP + 11 * ROW_HEIGHT + PADDING_BOTTOM;
const NODE_RADIUS = 26;

const LANE_X: Record<string, number> = {
  treble: 50,
  both: 150,
  bass: 250,
};

function getNodePosition(level: LevelSpec): { x: number; y: number } {
  const x = LANE_X[level.lane]!;
  const y = PADDING_TOP + (12 - level.tier) * ROW_HEIGHT;
  return { x, y };
}

export const LevelGraph: React.FC<LevelGraphProps> = ({
  currentLevelId,
  completedLevelIds,
  onSelectLevel,
}) => {
  // Generate arrow paths
  const arrows: React.JSX.Element[] = [];

  for (let tier = 1; tier <= 12; tier++) {
    const yCur = PADDING_TOP + (12 - tier) * ROW_HEIGHT;
    const yNext = PADDING_TOP + (12 - (tier + 1)) * ROW_HEIGHT;

    // Upward arrows (tier -> tier + 1)
    if (tier < 12) {
      // Treble upward
      arrows.push(
        <line
          key={`arrow-treble-${tier}`}
          x1={50}
          y1={yCur - NODE_RADIUS}
          x2={50}
          y2={yNext + NODE_RADIUS + 4}
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
          y1={yCur - NODE_RADIUS}
          x2={150}
          y2={yNext + NODE_RADIUS + 4}
          stroke="#b0aba2"
          strokeWidth={1.8}
          markerEnd="url(#arrowhead)"
        />
      );
      // Bass upward
      arrows.push(
        <line
          key={`arrow-bass-${tier}`}
          x1={250}
          y1={yCur - NODE_RADIUS}
          x2={250}
          y2={yNext + NODE_RADIUS + 4}
          stroke="#b0aba2"
          strokeWidth={1.8}
          markerEnd="url(#arrowhead)"
        />
      );
    }

    // Cross arrows into Both (treble -> both, bass -> both)
    arrows.push(
      <line
        key={`arrow-cross-t-both-${tier}`}
        x1={50 + NODE_RADIUS}
        y1={yCur}
        x2={150 - NODE_RADIUS - 4}
        y2={yCur}
        stroke="#b0aba2"
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
    arrows.push(
      <line
        key={`arrow-cross-b-both-${tier}`}
        x1={250 - NODE_RADIUS}
        y1={yCur}
        x2={150 + NODE_RADIUS + 4}
        y2={yCur}
        stroke="#b0aba2"
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
    );
  }

  return (
    <div className="nnsr-level-graph-container" style={{ width: '300px' }}>
      <div className="nnsr-level-graph-header">
        <div style={{ width: '33%', textAlign: 'center' }}>Treble</div>
        <div style={{ width: '33%', textAlign: 'center' }}>Both</div>
        <div style={{ width: '33%', textAlign: 'center' }}>Bass</div>
      </div>

      <div className="nnsr-level-graph-scroll">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          style={{ display: 'block' }}
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

          {/* Render Nodes */}
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

            const shortLabel =
              level.lane === 'treble'
                ? `T${level.tier}`
                : level.lane === 'bass'
                ? `B${level.tier}`
                : `M${level.tier}`;

            // Scale tier badge
            let scaleBadge: string | null = null;
            if (level.tier === 9) scaleBadge = '1♯';
            else if (level.tier === 10) scaleBadge = '1♭';
            else if (level.tier === 11) scaleBadge = '2♯';
            else if (level.tier === 12) scaleBadge = '2♭';

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
                    r={NODE_RADIUS + 5}
                    fill="none"
                    stroke="var(--jasmine)"
                    strokeWidth={3.5}
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

                {/* Mini staff interval icon */}
                <g transform={`translate(${x - 18}, ${y - 12})`}>
                  {/* Mini staff lines */}
                  <line x1={0} y1={4} x2={36} y2={4} stroke="#8c948f" strokeWidth={0.7} />
                  <line x1={0} y1={9} x2={36} y2={9} stroke="#8c948f" strokeWidth={0.7} />
                  <line x1={0} y1={14} x2={36} y2={14} stroke="#8c948f" strokeWidth={0.7} />
                  <line x1={0} y1={19} x2={36} y2={19} stroke="#8c948f" strokeWidth={0.7} />
                  <line x1={0} y1={24} x2={36} y2={24} stroke="#8c948f" strokeWidth={0.7} />

                  {/* Two note interval dots */}
                  <circle cx={10} cy={16} r={2.5} fill="#1f2421" />
                  <line x1={12.5} y1={16} x2={12.5} y2={7} stroke="#1f2421" strokeWidth={0.9} />

                  <circle cx={26} cy={8} r={2.5} fill="#1f2421" />
                  <line x1={23.5} y1={8} x2={23.5} y2={17} stroke="#1f2421" strokeWidth={0.9} />
                </g>

                {/* Short level label */}
                <text
                  x={x}
                  y={y + 17}
                  textAnchor="middle"
                  fontSize="9.5px"
                  fontWeight="bold"
                  fill="#1f2421"
                >
                  {shortLabel}
                </text>

                {/* Scale badge for Tiers 9-12 */}
                {scaleBadge && (
                  <text
                    x={x + 16}
                    y={y - 14}
                    textAnchor="middle"
                    fontSize="9px"
                    fontWeight="bold"
                    fill="var(--vibrant-coral)"
                  >
                    {scaleBadge}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
