import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MidiManager } from '../../src/input/midiManager';

describe('MidiManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles missing Web MIDI API gracefully', async () => {
    // Navigator without requestMIDIAccess
    const onConnectionChange = vi.fn();
    const onNoteOn = vi.fn();

    const originalNavigator = globalThis.navigator;
    // @ts-expect-error mocking navigator
    globalThis.navigator = {};

    const manager = new MidiManager({ onNoteOn, onConnectionChange });
    await manager.init();

    expect(onConnectionChange).toHaveBeenCalledWith(null);
    expect(onNoteOn).not.toHaveBeenCalled();

    globalThis.navigator = originalNavigator;
  });

  it('receives Note On and Note Off events and tracks device connection', async () => {
    const onConnectionChange = vi.fn();
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();

    // Mock MIDIInput
    const mockInput: Partial<WebMidi.MIDIInput> = {
      id: 'input-1',
      name: 'Yamaha NU1XA',
      state: 'connected',
      onmidimessage: null,
    };

    const mockInputsMap = new Map<string, WebMidi.MIDIInput>();
    mockInputsMap.set('input-1', mockInput as WebMidi.MIDIInput);

    const mockMidiAccess: Partial<WebMidi.MIDIAccess> = {
      inputs: mockInputsMap as unknown as WebMidi.MIDIInputMap,
      onstatechange: null,
    };

    // @ts-expect-error mocking navigator
    globalThis.navigator = {
      requestMIDIAccess: vi.fn().mockResolvedValue(mockMidiAccess),
    };

    const manager = new MidiManager({ onNoteOn, onNoteOff, onConnectionChange });
    await manager.init();

    expect(onConnectionChange).toHaveBeenCalledWith('Yamaha NU1XA');
    expect(mockInput.onmidimessage).toBeTypeOf('function');

    // Simulate Note On (0x90 = 144, note 60, velocity 100)
    mockInput.onmidimessage!({
      data: new Uint8Array([0x90, 60, 100]),
    } as unknown as WebMidi.MIDIMessageEvent);

    expect(onNoteOn).toHaveBeenCalledWith(60, 100);

    // Simulate Note Off with velocity 0 on 0x90
    mockInput.onmidimessage!({
      data: new Uint8Array([0x90, 60, 0]),
    } as unknown as WebMidi.MIDIMessageEvent);

    expect(onNoteOff).toHaveBeenCalledWith(60);

    // Simulate standard Note Off (0x80)
    mockInput.onmidimessage!({
      data: new Uint8Array([0x80, 64, 64]),
    } as unknown as WebMidi.MIDIMessageEvent);

    expect(onNoteOff).toHaveBeenCalledWith(64);

    manager.dispose();
    expect(mockInput.onmidimessage).toBeNull();
  });
});
