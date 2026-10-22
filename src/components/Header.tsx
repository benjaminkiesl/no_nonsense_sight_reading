import React from 'react';

export interface HeaderProps {
  midiDeviceName: string | null;
}

export const Header: React.FC<HeaderProps> = ({ midiDeviceName }) => {
  return (
    <header className="nnsr-header">
      <div className="nnsr-header-side nnsr-header-left" />
      <div className="nnsr-header-center">
        <h1 className="nnsr-header-title">No-Nonsense Sight-Reading</h1>
      </div>
      <div className="nnsr-header-side nnsr-header-right">
        <div className="nnsr-header-midi">
          <em>MIDI:</em> {midiDeviceName ? midiDeviceName : 'No device connected'}
        </div>
      </div>
    </header>
  );
};
