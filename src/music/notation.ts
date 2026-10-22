/**
 * Computes the step offsets where ledger lines should be drawn.
 * Staff lines sit at 0, 2, 4, 6, 8.
 * Below staff: stepOffset <= -2 (ledger lines at -2, -4, ...)
 * Above staff: stepOffset >= 10 (ledger lines at 10, 12, ...)
 */
export function getLedgerLines(stepOffset: number): number[] {
  const lines: number[] = [];

  if (stepOffset <= -2) {
    for (let k = -2; k >= stepOffset; k -= 2) {
      lines.push(k);
    }
  } else if (stepOffset >= 10) {
    for (let k = 10; k <= stepOffset; k += 2) {
      lines.push(k);
    }
  }

  return lines;
}

/**
 * Middle line is stepOffset 4.
 * Notes on or above middle line have stems pointing down.
 * Notes below middle line have stems pointing up.
 */
export function getStemDirection(stepOffset: number): 'up' | 'down' {
  return stepOffset >= 4 ? 'down' : 'up';
}
