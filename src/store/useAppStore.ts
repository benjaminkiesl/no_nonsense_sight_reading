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
}

export interface AppState {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  allFinishedLevelIds: Set<string>;
  midiDeviceName: string | null;
  bestAccelerandoBpm: number | null;
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null;
  chordNotationSystem: ChordNotationSystem;
  selectLevel: (levelId: string) => void;
  markLevelCompleted: (levelId: string) => void;
  setMidiDeviceName: (name: string | null) => void;
  updateBestAccelerandoBpm: (bpm: number) => void;
  setLastCustomAccelerandoNotes: (notes: StaffNoteTarget[] | null) => void;
  setChordNotationSystem: (system: ChordNotationSystem) => void;
}

function loadInitialProgress(): {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  bestAccelerandoBpm: number | null;
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null;
  chordNotationSystem: ChordNotationSystem;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      bestAccelerandoBpm: null,
      lastCustomAccelerandoNotes: null,
      chordNotationSystem: 'international',
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
  };
}

function saveProgress(
  currentLevelId: string,
  directlyCompletedLevelIds: string[],
  bestAccelerandoBpm: number | null,
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null,
  chordNotationSystem: ChordNotationSystem
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

  selectLevel: (levelId: string) => {
    set({ currentLevelId: levelId });
    saveProgress(
      levelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem
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
      get().chordNotationSystem
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
        get().chordNotationSystem
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
      get().chordNotationSystem
    );
  },

  setChordNotationSystem: (system: ChordNotationSystem) => {
    set({ chordNotationSystem: system });
    saveProgress(
      get().currentLevelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      system
    );
  },
}));
