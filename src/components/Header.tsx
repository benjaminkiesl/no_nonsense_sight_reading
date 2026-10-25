import React from 'react';

export interface HeaderProps {
  midiDeviceName: string | null;
  activeView?: 'practice' | 'levels';
  onToggleView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  midiDeviceName,
  activeView = 'practice',
  onToggleView,
}) => {
  return (
    <header className="nnsr-header">
      <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>

      <div className="nnsr-header-actions">
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
