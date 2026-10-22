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

  it('renders all 36 level nodes and highlights current level', () => {
    const { container } = render(
      <LevelGraph
        currentLevelId="treble-3"
        completedLevelIds={new Set(['treble-1', 'treble-2'])}
        onSelectLevel={vi.fn()}
      />
    );

    const nodes = container.querySelectorAll('.nnsr-graph-node');
    expect(nodes.length).toBe(36);

    const currentNode = container.querySelector('.nnsr-graph-node.current');
    expect(currentNode).toBeDefined();

    const completedNodes = container.querySelectorAll('.nnsr-graph-node.completed');
    expect(completedNodes.length).toBe(2);
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
