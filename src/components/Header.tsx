import React from 'react';

export interface HeaderProps {
  midiDeviceName: string | null;
  activeView?: 'practice' | 'levels' | 'rhythm';
  onToggleView?: () => void;
  onToggleRhythm?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  midiDeviceName,
  activeView = 'practice',
  onToggleView,
  onToggleRhythm,
}) => {
  return (
    <header className="nnsr-header">
      <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>

      <div className="nnsr-header-actions">
        {onToggleRhythm && (
          <button
            type="button"
            className="nnsr-rhythm-mode-btn"
            onClick={onToggleRhythm}
            data-testid="rhythm-mode-button"
            aria-label={activeView === 'rhythm' ? 'Return to Pitch Practice' : 'Switch to Rhythm Training'}
          >
            {activeView === 'rhythm' ? '← Pitch' : 'Rhythm'}
          </button>
        )}

        {onToggleView && (
          <button
            type="button"
            className="nnsr-view-toggle-btn"
            onClick={onToggleView}
            data-testid="view-toggle-button"
            aria-label={activeView === 'practice' ? 'Switch to Levels' : 'Return to Practice Arena'}
          >
            {activeView === 'practice' ? 'Levels' : '← Practice'}
          </button>
        )}

        <div className="nnsr-header-midi">
          <span
            className={`nnsr-midi-dot ${midiDeviceName ? 'connected' : 'disconnected'}`}
            aria-hidden="true"
          />
          <span className="nnsr-midi-label">
            <em>MIDI:</em> {midiDeviceName ? midiDeviceName : 'No device connected'}
          </span>
        </div>
      </div>
    </header>
  );
};
