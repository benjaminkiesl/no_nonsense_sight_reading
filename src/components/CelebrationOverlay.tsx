import React from 'react';
import { LevelSpec } from '../types/curriculum';

export interface CelebrationOverlayProps {
  level: LevelSpec;
  onContinue: () => void;
  onAccelerandoContinue?: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  level,
  onContinue,
  onAccelerandoContinue,
}) => {
  return (
    <div className="nnsr-celebration-overlay" onClick={onContinue}>
      <div className="nnsr-celebration-card" onClick={(e) => e.stopPropagation()}>
        <div className="nnsr-celebration-badge">✦ LEVEL COMPLETE ✦</div>
        <h2 className="nnsr-celebration-title">{level.title}</h2>
        <p className="nnsr-celebration-desc">
          Outstanding sight-reading! You successfully hit 32 consecutive notes error-free at maximum
          speed.
        </p>
        <div className="nnsr-celebration-prompt">Press any key or choose an option below</div>
        <div className="nnsr-celebration-actions">
          <button className="nnsr-celebration-button" onClick={onContinue}>
            Next Level →
          </button>
          {onAccelerandoContinue && (
            <button
              className="nnsr-celebration-button nnsr-celebration-button-accelerando"
              onClick={(e) => {
                e.stopPropagation();
                onAccelerandoContinue();
              }}
            >
              Continue in Accelerando Perpetuo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
