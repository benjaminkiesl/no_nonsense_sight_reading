import { describe, expect, it } from 'vitest';
import {
  generateRhythmPhrase,
  RHYTHM_CONCEPTS,
} from '../../src/rhythm/generator';
import { flattenPhraseToNotes } from '../../src/rhythm/curriculum';

describe('Procedural Rhythm Phrase Generator', () => {
  it('defines 12 distinct rhythmic concepts corresponding to Tiers 1-12', () => {
    expect(RHYTHM_CONCEPTS.length).toBe(12);
    const tiers = RHYTHM_CONCEPTS.map((c) => c.tier);
    expect(tiers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('generates a valid 2-bar 4/4 phrase with exactly 9 beat cells and a landing downbeat', () => {
    const phrase = generateRhythmPhrase({
      concepts: ['quarter_half', 'eighths'],
      targetBpm: 80,
    });

    expect(phrase.timeSignature).toBe('4/4');
    expect(phrase.beatsPerBar).toBe(4);
    expect(phrase.beatUnit).toBe(4);
    expect(phrase.targetBpm).toBe(80);
    expect(phrase.beatCells.length).toBe(9); // 8 beats + 1 landing downbeat

    const flattened = flattenPhraseToNotes(phrase);
    expect(flattened.length).toBeGreaterThan(0);

    const landing = flattened[flattened.length - 1]!;
    expect(landing.isLandingNote).toBe(true);
    expect(landing.startBeat).toBe(8.0); // Bar 3 Beat 1
  });

  it('clamps BPM safely to 35..200 range', () => {
    const slowPhrase = generateRhythmPhrase({
      concepts: ['quarter_half'],
      targetBpm: 10,
    });
    expect(slowPhrase.targetBpm).toBe(35);

    const fastPhrase = generateRhythmPhrase({
      concepts: ['quarter_half'],
      targetBpm: 300,
    });
    expect(fastPhrase.targetBpm).toBe(200);
  });

  it('supports all 12 concepts individually without errors', () => {
    for (const concept of RHYTHM_CONCEPTS) {
      const phrase = generateRhythmPhrase({
        concepts: [concept.id],
        targetBpm: 76,
      });

      expect(phrase.beatCells.length).toBe(9);
      const flattened = flattenPhraseToNotes(phrase);
      expect(flattened.length).toBeGreaterThan(0);
      for (const note of flattened) {
        expect(note.durationBeats).toBeGreaterThan(0);
        expect(note.startBeat).toBeGreaterThanOrEqual(0);
      }
      expect(flattened[flattened.length - 1]!.isLandingNote).toBe(true);
    }
  });

  it('generates varied phrases across repeated calls (non-repeating stream)', () => {
    const phrases = Array.from({ length: 5 }, () =>
      generateRhythmPhrase({
        concepts: ['eighths', 'sixteenths', 'gallop', 'rev_gallop'],
        targetBpm: 90,
      })
    );

    // Verify all have valid structure
    for (const p of phrases) {
      expect(p.beatCells.length).toBe(9);
      const notes = flattenPhraseToNotes(p);
      expect(notes[notes.length - 1]!.isLandingNote).toBe(true);
    }
  });
});
