export interface MidiManagerCallbacks {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff?: (midi: number) => void;
  onConnectionChange: (deviceName: string | null) => void;
}

function isVirtualMidiDevice(name: string | null | undefined): boolean {
  if (!name) return true;
  return /midi through|through port|virtual|loopback|rtpmidi/i.test(name);
}

export class MidiManager {
  private readonly callbacks: MidiManagerCallbacks;
  private midiAccess: MIDIAccess | null = null;
  private activeInputs: MIDIInput[] = [];

  constructor(callbacks: MidiManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public async init(): Promise<void> {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      this.callbacks.onConnectionChange(null);
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      this.midiAccess = access;
      access.onstatechange = () => {
        this.updateInputs();
      };
      this.updateInputs();
    } catch {
      this.callbacks.onConnectionChange(null);
    }
  }

  public dispose(): void {
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }
    for (const input of this.activeInputs) {
      input.onmidimessage = null;
    }
    this.activeInputs = [];
    this.midiAccess = null;
  }

  private updateInputs(): void {
    if (!this.midiAccess) {
      this.callbacks.onConnectionChange(null);
      return;
    }

    // Detach previous listeners
    for (const input of this.activeInputs) {
      input.onmidimessage = null;
    }
    this.activeInputs = [];

    const inputs: MIDIInput[] = [];
    let primaryDeviceName: string | null = null;

    for (const input of this.midiAccess.inputs.values()) {
      if (input.state === 'connected' && !isVirtualMidiDevice(input.name)) {
        inputs.push(input);
        if (!primaryDeviceName && input.name) {
          primaryDeviceName = input.name;
        }
      }
    }

    this.activeInputs = inputs;

    for (const input of inputs) {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        this.handleMidiMessage(event);
      };
    }

    this.callbacks.onConnectionChange(primaryDeviceName || (inputs.length > 0 ? 'MIDI Device' : null));
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0]!;
    const command = statusByte & 0xf0;
    const note = data[1]!;
    const velocity = data.length > 2 ? data[2]! : 0;

    // Note On: 0x90 with velocity > 0
    if (command === 0x90 && velocity > 0) {
      this.callbacks.onNoteOn(note, velocity);
    }
    // Note Off: 0x80, or 0x90 with velocity === 0
    else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      this.callbacks.onNoteOff?.(note);
    }
  }
}
