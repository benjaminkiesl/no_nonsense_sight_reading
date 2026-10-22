import React from 'react';
import { LevelSpec } from '../types/curriculum';

export interface CelebrationOverlayProps {
  level: LevelSpec;
  onContinue: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ level, onContinue }) => {
  return (
    <div className="nnsr-celebration-overlay" onClick={onContinue}>
      <div className="nnsr-celebration-card" onClick={(e) => e.stopPropagation()}>
        <div className="nnsr-celebration-badge">✦ LEVEL COMPLETE ✦</div>
        <h2 className="nnsr-celebration-title">{level.title}</h2>
        <p className="nnsr-celebration-desc">
          Outstanding sight-reading! You successfully hit 32 consecutive notes error-free at maximum
          speed.
        </p>
        <div className="nnsr-celebration-prompt">Press any key to continue</div>
        <button className="nnsr-celebration-button" onClick={onContinue}>
          Next Level →
        </button>
      </div>
    </div>
  );
};
