import { create } from 'zustand';
import {
  INITIAL_ADAPTIVE_NAMING_STATE,
  PersistedAdaptiveNamingState,
} from '../chord/naming';
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
  readonly chordNamingAdaptiveState?: PersistedAdaptiveNamingState;
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
  chordNamingAdaptiveState: PersistedAdaptiveNamingState;
  selectLevel: (levelId: string) => void;
  markLevelCompleted: (levelId: string) => void;
  setMidiDeviceName: (name: string | null) => void;
  updateBestAccelerandoBpm: (bpm: number) => void;
  setLastCustomAccelerandoNotes: (notes: StaffNoteTarget[] | null) => void;
  setChordNotationSystem: (system: ChordNotationSystem) => void;
  updateBestChordNamingSecPerChord: (secPerChord: number) => void;
  setChordNamingAdaptiveState: (state: PersistedAdaptiveNamingState) => void;
  resetChordNamingAdaptiveState: () => void;
}

function loadInitialProgress(): {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  bestAccelerandoBpm: number | null;
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null;
  chordNotationSystem: ChordNotationSystem;
  bestChordNamingSecPerChord: number | null;
  chordNamingAdaptiveState: PersistedAdaptiveNamingState;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      bestAccelerandoBpm: null,
      lastCustomAccelerandoNotes: null,
      chordNotationSystem: 'international',
      bestChordNamingSecPerChord: null,
      chordNamingAdaptiveState: INITIAL_ADAPTIVE_NAMING_STATE,
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

        const adaptiveState: PersistedAdaptiveNamingState =
          parsed.chordNamingAdaptiveState &&
          typeof parsed.chordNamingAdaptiveState.unlockedChordCount === 'number'
            ? {
                unlockedChordCount: parsed.chordNamingAdaptiveState.unlockedChordCount,
                unlockedRomanCount:
                  typeof parsed.chordNamingAdaptiveState.unlockedRomanCount === 'number'
                    ? parsed.chordNamingAdaptiveState.unlockedRomanCount
                    : INITIAL_ADAPTIVE_NAMING_STATE.unlockedRomanCount,
                statsByKey: parsed.chordNamingAdaptiveState.statsByKey ?? {},
              }
            : INITIAL_ADAPTIVE_NAMING_STATE;

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
          chordNamingAdaptiveState: adaptiveState,
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
    chordNamingAdaptiveState: INITIAL_ADAPTIVE_NAMING_STATE,
  };
}

function saveProgress(
  currentLevelId: string,
  directlyCompletedLevelIds: string[],
  bestAccelerandoBpm: number | null,
  lastCustomAccelerandoNotes: StaffNoteTarget[] | null,
  chordNotationSystem: ChordNotationSystem,
  bestChordNamingSecPerChord: number | null,
  chordNamingAdaptiveState: PersistedAdaptiveNamingState
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
      chordNamingAdaptiveState,
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
  chordNamingAdaptiveState: initialProgress.chordNamingAdaptiveState,

  selectLevel: (levelId: string) => {
    set({ currentLevelId: levelId });
    saveProgress(
      levelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord,
      get().chordNamingAdaptiveState
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
      get().bestChordNamingSecPerChord,
      get().chordNamingAdaptiveState
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
        get().bestChordNamingSecPerChord,
        get().chordNamingAdaptiveState
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
      get().bestChordNamingSecPerChord,
      get().chordNamingAdaptiveState
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
      get().bestChordNamingSecPerChord,
      get().chordNamingAdaptiveState
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
        rounded,
        get().chordNamingAdaptiveState
      );
    }
  },

  setChordNamingAdaptiveState: (state: PersistedAdaptiveNamingState) => {
    set({ chordNamingAdaptiveState: state });
    saveProgress(
      get().currentLevelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord,
      state
    );
  },

  resetChordNamingAdaptiveState: () => {
    set({ chordNamingAdaptiveState: INITIAL_ADAPTIVE_NAMING_STATE });
    saveProgress(
      get().currentLevelId,
      get().directlyCompletedLevelIds,
      get().bestAccelerandoBpm,
      get().lastCustomAccelerandoNotes,
      get().chordNotationSystem,
      get().bestChordNamingSecPerChord,
      INITIAL_ADAPTIVE_NAMING_STATE
    );
  },
}));
