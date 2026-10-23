import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LevelGraph } from '../../src/components/LevelGraph';

describe('LevelGraph Component', () => {
  it('renders the 3 lane headers', () => {
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
  });

  it('renders all 36 level nodes, highlights current level, and applies celebratory ring', () => {
    const { container } = render(
      <LevelGraph
        currentLevelId="treble-3"
        completedLevelIds={new Set(['treble-1', 'treble-2', 'treble-3'])}
        onSelectLevel={vi.fn()}
        celebratingLevelId="treble-3"
      />
    );

    const nodes = container.querySelectorAll('.nnsr-graph-node');
    expect(nodes.length).toBe(36);

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
  });
});
