import React from 'react';
import { EngineSnapshot } from '../types/engine';

export interface ProgressBarProps {
  snapshot: EngineSnapshot;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ snapshot }) => {
  const {
    learnStepIndex,
    learnTotalSteps,
    speedStepIndex,
    speedTotalSteps,
    holdCompletedCount,
    holdTotalCount,
  } = snapshot;

  // Learn steps array
  const learnSteps = Array.from({ length: Math.max(1, learnTotalSteps) }, (_, i) => i);
  // Speed Up steps (24)
  const speedSteps = Array.from({ length: speedTotalSteps }, (_, i) => i);
  // Hold steps (32)
  const holdSteps = Array.from({ length: holdTotalCount }, (_, i) => i);

  return (
    <div className="nnsr-progress-bar-container" style={{ width: '840px' }}>
      {/* Learn Section (20%) */}
      <div className="nnsr-progress-section nnsr-progress-learn" style={{ width: '20%' }}>
        <div className="nnsr-progress-label">Learn</div>
        <div className="nnsr-progress-track">
          {learnSteps.map((idx) => {
            const isFilled = idx < learnStepIndex;
            return (
              <div
                key={`learn-${idx}`}
                className={`nnsr-progress-step ${isFilled ? 'filled' : ''}`}
                style={{
                  backgroundColor: isFilled ? 'var(--light-green)' : 'var(--surface-subtle)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Speed Up Section (55%) */}
      <div className="nnsr-progress-section nnsr-progress-speed" style={{ width: '55%' }}>
        <div className="nnsr-progress-label">Speed Up</div>
        <div className="nnsr-progress-track">
          {speedSteps.map((idx) => {
            const isFilled = idx < speedStepIndex;
            return (
              <div
                key={`speed-${idx}`}
                className={`nnsr-progress-step ${isFilled ? 'filled pulse' : ''}`}
                style={{
                  backgroundColor: isFilled ? 'var(--emerald)' : 'var(--surface-subtle)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Hold Section (25%) */}
      <div className="nnsr-progress-section nnsr-progress-hold" style={{ width: '25%' }}>
        <div className="nnsr-progress-label">Hold</div>
        <div className="nnsr-progress-track">
          {holdSteps.map((idx) => {
            const isFilled = idx < holdCompletedCount;
            return (
              <div
                key={`hold-${idx}`}
                className={`nnsr-progress-step ${isFilled ? 'filled' : ''}`}
                style={{
                  backgroundColor: isFilled ? 'var(--jasmine)' : 'var(--surface-subtle)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
