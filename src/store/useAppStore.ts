import { create } from 'zustand';
import { getTransitiveCompletedLevels } from '../curriculum/graph';

export const STORAGE_KEY = 'nnsr_progress_v1';

export interface PersistedProgress {
  readonly version: 1;
  readonly currentLevelId: string;
  readonly directlyCompletedLevelIds: string[];
  readonly bestAccelerandoBpm?: number | null;
}

export interface AppState {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  allFinishedLevelIds: Set<string>;
  midiDeviceName: string | null;
  bestAccelerandoBpm: number | null;
  selectLevel: (levelId: string) => void;
  markLevelCompleted: (levelId: string) => void;
  setMidiDeviceName: (name: string | null) => void;
  updateBestAccelerandoBpm: (bpm: number) => void;
}

function loadInitialProgress(): {
  currentLevelId: string;
  directlyCompletedLevelIds: string[];
  bestAccelerandoBpm: number | null;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { currentLevelId: 'treble-1', directlyCompletedLevelIds: [], bestAccelerandoBpm: null };
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
          bestAccelerandoBpm:
            typeof parsed.bestAccelerandoBpm === 'number' && parsed.bestAccelerandoBpm > 0
              ? parsed.bestAccelerandoBpm
              : null,
        };
      }
    }
  } catch {
    // Fall through to defaults
  }

  return { currentLevelId: 'treble-1', directlyCompletedLevelIds: [], bestAccelerandoBpm: null };
}

function saveProgress(
  currentLevelId: string,
  directlyCompletedLevelIds: string[],
  bestAccelerandoBpm: number | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const data: PersistedProgress = {
      version: 1,
      currentLevelId,
      directlyCompletedLevelIds,
      bestAccelerandoBpm: bestAccelerandoBpm ?? undefined,
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

  selectLevel: (levelId: string) => {
    set({ currentLevelId: levelId });
    saveProgress(levelId, get().directlyCompletedLevelIds, get().bestAccelerandoBpm);
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

    saveProgress(get().currentLevelId, updated, get().bestAccelerandoBpm);
  },

  setMidiDeviceName: (name: string | null) => {
    set({ midiDeviceName: name });
  },

  updateBestAccelerandoBpm: (bpm: number) => {
    const currentBest = get().bestAccelerandoBpm ?? 0;
    if (bpm > currentBest) {
      const rounded = Math.round(bpm * 10) / 10;
      set({ bestAccelerandoBpm: rounded });
      saveProgress(get().currentLevelId, get().directlyCompletedLevelIds, rounded);
    }
  },
}));
