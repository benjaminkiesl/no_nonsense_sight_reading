import React from 'react';
import { LevelSpec } from '../types/curriculum';

export interface CelebrationOverlayProps {
  level?: LevelSpec;
  customTitle?: string;
  customDescription?: string;
  onContinue: () => void;
  onAccelerandoContinue?: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  level,
  customTitle,
  customDescription,
  onContinue,
  onAccelerandoContinue,
}) => {
  const title = customTitle ?? level?.title ?? 'Level Complete';
  const description =
    customDescription ??
    'Outstanding sight-reading! You successfully hit 32 consecutive notes error-free at maximum speed.';

  return (
    <div className="nnsr-celebration-overlay" data-testid="celebration-overlay" onClick={onContinue}>
      <div className="nnsr-celebration-card" onClick={(e) => e.stopPropagation()}>
        <div className="nnsr-celebration-badge">✦ LEVEL COMPLETE ✦</div>
        <h2 className="nnsr-celebration-title">{title}</h2>
        <p className="nnsr-celebration-desc">{description}</p>
        <div className="nnsr-celebration-prompt">Press any key or choose an option below</div>
        <div className="nnsr-celebration-actions">
          <button
            type="button"
            className="nnsr-celebration-button"
            onClick={onContinue}
            data-testid="next-level-button"
          >
            Next Level →
          </button>
          {onAccelerandoContinue && (
            <button
              type="button"
              className="nnsr-celebration-button nnsr-celebration-button-accelerando"
              onClick={(e) => {
                e.stopPropagation();
                onAccelerandoContinue();
              }}
              data-testid="celebration-accelerando-button"
            >
              Infinite Speed-Up →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
