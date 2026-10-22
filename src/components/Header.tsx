import React from 'react';

export interface HeaderProps {
  midiDeviceName: string | null;
}

export const Header: React.FC<HeaderProps> = ({ midiDeviceName }) => {
  return (
    <header className="nnsr-header">
      <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>

      <div className="nnsr-header-midi">
        <span
          className={`nnsr-midi-dot ${midiDeviceName ? 'connected' : 'disconnected'}`}
          aria-hidden="true"
        />
        <span className="nnsr-midi-label">
          <em>MIDI:</em> {midiDeviceName ? midiDeviceName : 'No device connected'}
        </span>
      </div>
    </header>
  );
};
