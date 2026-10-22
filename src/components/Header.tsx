import React from 'react';

export interface HeaderProps {
  midiDeviceName: string | null;
}

export const Header: React.FC<HeaderProps> = ({ midiDeviceName }) => {
  return (
    <header className="nnsr-header">
      <div className="nnsr-header-brand">
        <svg
          className="nnsr-header-logo"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* 5 Clean Grand Staff Lines */}
          <line x1="3" y1="6" x2="29" y2="6" stroke="#e5c158" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="3" y1="11" x2="29" y2="11" stroke="#e5c158" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="3" y1="16" x2="29" y2="16" stroke="#e5c158" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="3" y1="21" x2="29" y2="21" stroke="#e5c158" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="3" y1="26" x2="29" y2="26" stroke="#e5c158" strokeWidth="1" strokeOpacity="0.5" />

          {/* Grand Staff Left Brace Accent */}
          <path
            d="M 5 6 C 3.5 6 3.5 16 2 16 C 3.5 16 3.5 26 5 26"
            stroke="#d4af37"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Piano Key Motif (3 White Keys, 2 Black Keys) */}
          <rect x="9" y="6" width="5.5" height="20" rx="1" fill="#fdfbf7" stroke="#183324" strokeWidth="0.5" />
          <rect x="15" y="6" width="5.5" height="20" rx="1" fill="#fdfbf7" stroke="#183324" strokeWidth="0.5" />
          <rect x="21" y="6" width="5.5" height="20" rx="1" fill="#fdfbf7" stroke="#183324" strokeWidth="0.5" />
          <rect x="13" y="6" width="3" height="12" rx="0.6" fill="#183324" />
          <rect x="19" y="6" width="3" height="12" rx="0.6" fill="#183324" />
        </svg>

        <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>
      </div>

      <div className="nnsr-header-midi">
        <span
          className={`nnsr-midi-dot ${midiDeviceName ? 'connected' : 'disconnected'}`}
          aria-hidden="true"
        />
        <span className="nnsr-midi-label">
          <span className="nnsr-midi-prefix">MIDI:</span>{' '}
          {midiDeviceName ? midiDeviceName : 'No device connected'}
        </span>
      </div>
    </header>
  );
};
