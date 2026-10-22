import { create } from 'zustand';
import { getTransitiveCompletedLevels } from '../curriculum/graph';

export const STORAGE_KEY = 'nnsr_progress_v1';

export interface PersistedProgress {
  readonly version: 1;
  readonly currentLevelId: string;
  readonly directlyCompletedLevelIds: string[];
}

export interface AppState {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  allFinishedLevelIds: Set<string>;
  midiDeviceName: string | null;
  selectLevel: (levelId: string) => void;
  markLevelCompleted: (levelId: string) => void;
  setMidiDeviceName: (name: string | null) => void;
}

function loadInitialProgress(): { currentLevelId: string; directlyCompletedLevelIds: string[] } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { currentLevelId: 'treble-1', directlyCompletedLevelIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedProgress;
      if (parsed && parsed.version === 1 && typeof parsed.currentLevelId === 'string') {
        return {
          currentLevelId: parsed.currentLevelId,
          directlyCompletedLevelIds: Array.isArray(parsed.directlyCompletedLevelIds)
            ? parsed.directlyCompletedLevelIds
            : [],
        };
      }
    }
  } catch {
    // Fall through to defaults
  }

  return { currentLevelId: 'treble-1', directlyCompletedLevelIds: [] };
}

function saveProgress(currentLevelId: string, directlyCompletedLevelIds: string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const data: PersistedProgress = {
      version: 1,
      currentLevelId,
      directlyCompletedLevelIds,
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

  selectLevel: (levelId: string) => {
    set({ currentLevelId: levelId });
    saveProgress(levelId, get().directlyCompletedLevelIds);
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

    saveProgress(get().currentLevelId, updated);
  },

  setMidiDeviceName: (name: string | null) => {
    set({ midiDeviceName: name });
  },
}));
