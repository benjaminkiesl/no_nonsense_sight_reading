import React from 'react';
import { ChordNotationSystem } from '../types/chord';

export interface HeaderProps {
  midiDeviceName: string | null;
  activeView?: 'practice' | 'levels';
  onToggleView?: () => void;
  chordNotationSystem?: ChordNotationSystem;
  onToggleChordNotation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  midiDeviceName,
  activeView = 'practice',
  onToggleView,
  chordNotationSystem = 'international',
  onToggleChordNotation,
}) => {
  return (
    <header className="nnsr-header">
      <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>

      <div className="nnsr-header-actions">
        {onToggleChordNotation && (
          <button
            type="button"
            className="nnsr-notation-toggle-btn"
            onClick={onToggleChordNotation}
            data-testid="chord-notation-toggle"
            aria-label={`Chord notation system: ${chordNotationSystem}. Click to toggle.`}
            title="Toggle between International (Bb/B) and German (B/H) notation"
          >
            {chordNotationSystem === 'german' ? '🇩🇪 B / H' : '🌐 Bb / B'}
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
