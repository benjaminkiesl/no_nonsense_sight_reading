import React, { useEffect, useRef } from 'react';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { getStaffStepOffset } from '../music/pitch';
import { KEY_SIGNATURES } from '../music/scales';
import { LevelSpec } from '../types/curriculum';
import { EngineSnapshot } from '../types/engine';

export interface GrandStaffCanvasProps {
  snapshot: EngineSnapshot;
  level: LevelSpec;
}

export const GrandStaffCanvas: React.FC<GrandStaffCanvasProps> = ({ snapshot, level }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Guard for testing environments without Canvas 2D support

    const width = 840;
    const height = 280;
    const dpr = window.devicePixelRatio || 1;

    // Handle HiDPI scaling
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Background paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw Grand Staff lines
    ctx.strokeStyle = '#2c332f';
    ctx.lineWidth = 1.2;

    // Treble staff lines (y: 58, 70, 82, 94, 106)
    for (let i = 0; i < 5; i++) {
      const y = 58 + i * 12;
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Bass staff lines (y: 172, 184, 196, 208, 220)
    for (let i = 0; i < 5; i++) {
      const y = 172 + i * 12;
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left connecting vertical line across both staves
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(16, 58);
    ctx.lineTo(16, 220);
    ctx.stroke();

    // Classic brace arc
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 58);
    ctx.bezierCurveTo(8, 90, 8, 120, 4, 139);
    ctx.bezierCurveTo(8, 158, 8, 188, 16, 220);
    ctx.stroke();

    // Clefs (standard music engraving sizing & positioning)
    ctx.fillStyle = '#1f2421';
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Treble clef glyph centered on G line (y=94)
    ctx.fillText('𝄞', 42, 91);
    // Bass clef glyph positioned so dots straddle F line (y=184)
    ctx.font = '52px serif';
    ctx.fillText('𝄢', 42, 203);

    // Key Signature
    const keySigSpec = KEY_SIGNATURES[level.keySignature];
    if (keySigSpec && keySigSpec.accidentalType !== 'none') {
      const symbol = keySigSpec.accidentalType === 'sharp' ? '♯' : '♭';
      ctx.font = '22px serif';

      // Treble key accidentals
      keySigSpec.trebleStepOffsets.forEach((offset, idx) => {
        const x = 74 + idx * 14;
        const y = 106 - offset * 6;
        ctx.fillText(symbol, x, y);
      });

      // Bass key accidentals
      keySigSpec.bassStepOffsets.forEach((offset, idx) => {
        const x = 74 + idx * 14;
        const y = 220 - offset * 6;
        ctx.fillText(symbol, x, y);
      });
    }

    // Hit Zone Bar (x: 120..156, width: 36)
    const hitZoneLeft = 120;
    const hitZoneWidth = 36;
    let hitZoneFill = 'rgba(96, 211, 148, 0.16)';
    let hitZoneBorder = 'rgba(96, 211, 148, 0.45)';

    if (snapshot.substate === 'WAITING_FOR_CORRECTION') {
      hitZoneFill = 'rgba(238, 96, 85, 0.22)';
      hitZoneBorder = 'rgba(238, 96, 85, 0.65)';
    } else if (snapshot.emptyZonePulseRemainingMs > 0) {
      hitZoneFill = 'rgba(255, 217, 125, 0.45)';
      hitZoneBorder = 'rgba(255, 217, 125, 0.75)';
    }

    ctx.fillStyle = hitZoneFill;
    ctx.strokeStyle = hitZoneBorder;
    ctx.lineWidth = 2.0;

    // Draw rounded hit zone bar
    const radius = 6;
    const barTop = 24;
    const barHeight = 232;
    ctx.beginPath();
    ctx.roundRect(hitZoneLeft, barTop, hitZoneWidth, barHeight, radius);
    ctx.fill();
    ctx.stroke();

    // Draw Countdown overlay if active
    if (snapshot.phase === 'COUNTDOWN') {
      const count = Math.ceil(snapshot.countdownRemainingSec);
      if (count > 0) {
        ctx.fillStyle = '#1f2421';
        ctx.font = 'bold 52px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${count}`, 138, 139);
      }
    }

    // Draw Notes
    for (const note of snapshot.activeNotes) {
      const stepOffset = getStaffStepOffset(note.target.pitch, note.target.clef);
      const baseY = note.target.clef === 'treble' ? 106 : 220;
      const noteY = baseY - stepOffset * 6;

      ctx.save();

      let alpha = 1.0;
      let noteColor = '#1f2421';
      let renderX = note.x;

      if (note.state === 'hit') {
        alpha = Math.max(0, 1 - note.stateTimeMs / 200);
        noteColor = '#60d394';
      } else if (note.state === 'failed') {
        noteColor = '#ee6055';
        // Small shake animation
        renderX += Math.sin(note.stateTimeMs * 0.05) * 3;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = noteColor;
      ctx.strokeStyle = noteColor;

      // Ledger lines
      const ledgerLines = getLedgerLines(stepOffset);
      if (ledgerLines.length > 0) {
        ctx.lineWidth = 1.8;
        for (const lOffset of ledgerLines) {
          const lY = baseY - lOffset * 6;
          ctx.beginPath();
          ctx.moveTo(renderX - 13, lY);
          ctx.lineTo(renderX + 13, lY);
          ctx.stroke();
        }
      }

      // Accidental (sharp or flat)
      if (note.target.pitch.accidental !== 0) {
        const symbol = note.target.pitch.accidental === 1 ? '♯' : '♭';
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, renderX - 16, noteY);
      }

      // Notehead (oval tilted -20 degrees)
      ctx.save();
      ctx.translate(renderX, noteY);
      ctx.rotate((-20 * Math.PI) / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 5.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Stem
      const stemDir = getStemDirection(stepOffset);
      const stemLength = 38;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (stemDir === 'up') {
        ctx.moveTo(renderX + 6.5, noteY);
        ctx.lineTo(renderX + 6.5, noteY - stemLength);
      } else {
        ctx.moveTo(renderX - 6.5, noteY);
        ctx.lineTo(renderX - 6.5, noteY + stemLength);
      }
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }, [snapshot, level]);

  return (
    <div className="nnsr-staff-container">
      <canvas
        ref={canvasRef}
        className="nnsr-staff-canvas"
        style={{ width: '840px', height: '280px', display: 'block' }}
      />
    </div>
  );
};
