import { create } from 'zustand';
import { getTransitiveCompletedLevels } from '../curriculum/graph';
import { ChordNotationSystem } from '../types/chord';
import { StaffNoteTarget } from '../types/music';

export const STORAGE_KEY = 'nnsr_progress_v1';

export interface PersistedProgress {
  readonly version: 1;
  readonly currentLevelId: string;
  readonly directlyCompletedLevelIds: string[];
  readonly bestAccelerandoBpm?: number | null;
  readonly lastCustomAccelerandoNotes?: StaffNoteTarget[] | null;
  readonly chordNotationSystem?: ChordNotationSystem;
  readonly bestChordNamingSecPerChord?: number | null;
}

export interface AppState {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  allFinishedLevelIds: Set<string>;
  midiDeviceName: string | null;
  bestAccelerandoBpm: number | null;
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null;
  chordNotationSystem: ChordNotationSystem;
  bestChordNamingSecPerChord: number | null;
  selectLevel: (levelId: string) => void;
  markLevelCompleted: (levelId: string) => void;
  setMidiDeviceName: (name: string | null) => void;
  updateBestAccelerandoBpm: (bpm: number) => void;
  setLastCustomAccelerandoNotes: (notes: StaffNoteTarget[] | null) => void;
  setChordNotationSystem: (system: ChordNotationSystem) => void;
  updateBestChordNamingSecPerChord: (secPerChord: number) => void;
}

function loadInitialProgress(): {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  bestAccelerandoBpm: number | null;
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null;
  chordNotationSystem: ChordNotationSystem;
  bestChordNamingSecPerChord: number | null;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      bestAccelerandoBpm: null,
      lastCustomAccelerandoNotes: null,
      chordNotationSystem: 'international',
      bestChordNamingSecPerChord: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedProgress;
      if (parsed && parsed.version === 1 && typeof parsed.currentLevelId === 'string') {
        const chordNotation: ChordNotationSystem =
          parsed.chordNotationSystem === 'german' || parsed.chordNotationSystem === 'international'
            ? parsed.chordNotationSystem
            : 'international';

        return {
          currentLevelId: parsed.currentLevelId,
          directlyCompletedLevelIds: Array.isArray(parsed.directlyCompletedLevelIds)
            ? parsed.directlyCompletedLevelIds
            : [],
          bestAccelerandoBpm:
            typeof parsed.bestAccelerandoBpm === 'number' && parsed.bestAccelerandoBpm > 0
              ? parsed.bestAccelerandoBpm
              : null,
          lastCustomAccelerandoNotes:
            Array.isArray(parsed.lastCustomAccelerandoNotes) && parsed.lastCustomAccelerandoNotes.length > 0
              ? parsed.lastCustomAccelerandoNotes
              : null,
          chordNotationSystem: chordNotation,
          bestChordNamingSecPerChord:
            typeof parsed.bestChordNamingSecPerChord === 'number' && parsed.bestChordNamingSecPerChord > 0
              ? parsed.bestChordNamingSecPerChord
              : null,
        };
      }
    }
  } catch {
    // Fall through to defaults
  }

  return {
    currentLevelId: 'treble-1',
    directlyCompletedLevelIds: [],
    bestAccelerandoBpm: null,
    lastCustomAccelerandoNotes: null,
    chordNotationSystem: 'international',
    bestChordNamingSecPerChord: null,
  };
}

function saveProgress(
  currentLevelId: string,
  directlyCompletedLevelIds: string[],
  bestAccelerandoBpm: number | null,
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null,
  chordNotationSystem: ChordNotationSystem,
  bestChordNamingSecPerChord: number | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const data: PersistedProgress = {
      version: 1,
      currentLevelId,
      directlyCompletedLevelIds,
      bestAccelerandoBpm: bestAccelerandoBpm ?? undefined,
      lastCustomAccelerandoNotes: lastCustomAccelerandoNotes ?? undefined,
      chordNotationSystem,
      bestChordNamingSecPerChord: bestChordNamingSecPerChord ?? undefined,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota/permission issues
  }
}

const initialProgress = loadInitialProgress();

export const useAppStore = create<AppState>((set, get) => ({
  currentLevelId: initialProgress.currentLevelId,
  directlyCompletedLevelIds: initialProgress.directlyCompletedLevelIds,
  allFinishedLevelIds: getTransitiveCompletedLevels(initialProgress.directlyCompletedLevelIds),
  midiDeviceName: null,
  bestAccelerandoBpm: initialProgress.bestAccelerandoBpm,
  lastCustomAccelerandoNotes: initialProgress.lastCustomAccelerandoNotes,
  chordNotationSystem: initialProgress.chordNotationSystem,
  bestChordNamingSecPerChord: initialProgress.bestChordNamingSecPerChord,

  selectLevel: (levelId: string) => {
    set({ currentLevelId: levelId });
    saveProgress(
      levelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord
    );
  },

  markLevelCompleted: (levelId: string) => {
    const currentCompleted = get().directlyCompletedLevelIds;
    const updated = currentCompleted.includes(levelId)
      ? currentCompleted
      : [...currentCompleted, levelId];
    const finishedSet = getTransitiveCompletedLevels(updated);

    set({
      directlyCompletedLevelIds: updated,
      allFinishedLevelIds: finishedSet,
    });

    saveProgress(
      get().currentLevelId,
      updated,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord
    );
  },

  setMidiDeviceName: (name: string | null) => {
    set({ midiDeviceName: name });
  },

  updateBestAccelerandoBpm: (bpm: number) => {
    const currentBest = get().bestAccelerandoBpm ?? 0;
    if (bpm > currentBest) {
      const rounded = Math.round(bpm * 10) / 10;
      set({ bestAccelerandoBpm: rounded });
      saveProgress(
        get().currentLevelId,
        get().directlyCompletedLevelIds,
        rounded,
        get().lastCustomAccelerandoNotes,
        get().chordNotationSystem,
        get().bestChordNamingSecPerChord
      );
    }
  },

  setLastCustomAccelerandoNotes: (notes: StaffNoteTarget[] | null) => {
    set({ lastCustomAccelerandoNotes: notes });
    saveProgress(
      get().currentLevelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      notes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord
    );
  },

  setChordNotationSystem: (system: ChordNotationSystem) => {
    set({ chordNotationSystem: system });
    saveProgress(
      get().currentLevelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      system,
      get().bestChordNamingSecPerChord
    );
  },

  updateBestChordNamingSecPerChord: (secPerChord: number) => {
    const rounded = Math.round(secPerChord * 100) / 100;
    const currentBest = get().bestChordNamingSecPerChord;
    if (rounded > 0 && (currentBest === null || rounded < currentBest)) {
      set({ bestChordNamingSecPerChord: rounded });
      saveProgress(
        get().currentLevelId,
        get().directlyCompletedLevelIds,
        get().bestAccelerandoBpm,
        get().lastCustomAccelerandoNotes,
        get().chordNotationSystem,
        rounded
      );
    }
  },
}));
