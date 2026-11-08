import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LevelGraph } from '../../src/components/LevelGraph';

describe('LevelGraph Component', () => {
  it('renders the 5 lane headers: Treble, Both, Bass, Rhythm, Chords', () => {
    render(
      <LevelGraph
        currentLevelId="treble-1"
        completedLevelIds={new Set()}
        onSelectLevel={vi.fn()}
      />
    );

    expect(screen.getByText('Treble')).toBeDefined();
    expect(screen.getByText('Both')).toBeDefined();
    expect(screen.getByText('Bass')).toBeDefined();
    expect(screen.getByText('Rhythm')).toBeDefined();
    expect(screen.getByText('Chords')).toBeDefined();
  });

  it('renders all 60 level nodes (36 pitch + 12 rhythm + 12 chords), highlights current level, and applies celebratory ring', () => {
    const { container } = render(
      <LevelGraph
        currentLevelId="treble-3"
        completedLevelIds={new Set(['treble-1', 'treble-2', 'treble-3'])}
        onSelectLevel={vi.fn()}
        celebratingLevelId="treble-3"
      />
    );

    const nodes = container.querySelectorAll('.nnsr-graph-node');
    expect(nodes.length).toBe(60);

    const currentNode = container.querySelector('.nnsr-graph-node.current');
    expect(currentNode).toBeDefined();

    const celebratingNode = container.querySelector('.nnsr-graph-node.celebrating-node');
    expect(celebratingNode).toBeDefined();

    const rippleRing = container.querySelector('.nnsr-celebrate-ring');
    expect(rippleRing).toBeDefined();
  });

  it('triggers onSelectLevel when a node is clicked', () => {
    const onSelectLevel = vi.fn();
    render(
      <LevelGraph
        currentLevelId="treble-1"
        completedLevelIds={new Set()}
        onSelectLevel={onSelectLevel}
      />
    );

    const bassNode = screen.getByLabelText(/Bass Clef - Tier 1\b/);
    fireEvent.click(bassNode);
    expect(onSelectLevel).toHaveBeenCalledWith('bass-1');

    const rhythm1Node = screen.getByTestId('rhythm-node-1');
    fireEvent.click(rhythm1Node);
    expect(onSelectLevel).toHaveBeenCalledWith('rhythm-1');

    const chord1Node = screen.getByTestId('chord-node-1');
    fireEvent.click(chord1Node);
    expect(onSelectLevel).toHaveBeenCalledWith('chord-1');
  });

  it('formats mini motif badges on chord nodes with international vs german notation', () => {
    const { rerender } = render(
      <LevelGraph
        currentLevelId="treble-1"
        completedLevelIds={new Set()}
        onSelectLevel={vi.fn()}
        chordNotationSystem="international"
      />
    );

    // Tier 2: G/B in international
    expect(screen.getByText('G/B')).toBeDefined();
    // Tier 5: Bb · C7 in international
    expect(screen.getByText('Bb · C7')).toBeDefined();

    rerender(
      <LevelGraph
        currentLevelId="treble-1"
        completedLevelIds={new Set()}
        onSelectLevel={vi.fn()}
        chordNotationSystem="german"
      />
    );

    // Tier 2: G/H in German
    expect(screen.getByText('G/H')).toBeDefined();
    // Tier 5: B · C7 in German
    expect(screen.getByText('B · C7')).toBeDefined();
  });
});
