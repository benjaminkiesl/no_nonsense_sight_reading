import React from 'react';
import { EngineSnapshot } from '../types/engine';

export interface ProgressBarProps {
  snapshot: EngineSnapshot;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ snapshot }) => {
  if (snapshot.isAccelerando) {
    const startBpm = snapshot.accelerandoStartBpm ?? 40;
    const maxBpm = 240;
    const currentBpm = snapshot.targetBpm;
    const fraction = Math.min(1, Math.max(0, (currentBpm - startBpm) / (maxBpm - startBpm)));
    const percent = Math.round(fraction * 100);

    // 24 discrete step indicators across the span
    const steps = Array.from({ length: 24 }, (_, i) => i);
    const filledStepCount = Math.round(fraction * 24);

    return (
      <div className="nnsr-progress-bar-container nnsr-progress-bar-accelerando" style={{ width: '840px' }}>
        <div className="nnsr-accelerando-progress-wrap">
          <div className="nnsr-accelerando-meta-row">
            <div className="nnsr-accelerando-badge">⚡ INFINITE SPEED-UP</div>
            <div className="nnsr-accelerando-tempo-display">
              <span className="nnsr-accelerando-start-tag">{startBpm} BPM</span>
              <span className="nnsr-accelerando-arrow">→</span>
              <span className="nnsr-accelerando-current-tag">
                <strong>{currentBpm.toFixed(1)}</strong> BPM
                {snapshot.actualBpm < snapshot.targetBpm - 0.5 && (
                  <em> (recovery: {snapshot.actualBpm.toFixed(0)})</em>
                )}
              </span>
              <span className="nnsr-accelerando-arrow">→</span>
              <span className="nnsr-accelerando-max-tag">{maxBpm} BPM</span>
            </div>
            <div className="nnsr-accelerando-percent">{percent}%</div>
          </div>
          <div className="nnsr-progress-track nnsr-accelerando-track">
            {steps.map((idx) => {
              const isFilled = idx < filledStepCount;
              return (
                <div
                  key={`accel-step-${idx}`}
                  className={`nnsr-progress-step ${isFilled ? 'filled pulse' : ''}`}
                  style={{
                    backgroundColor: isFilled ? 'var(--gold-champagne)' : 'var(--surface-subtle)',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
