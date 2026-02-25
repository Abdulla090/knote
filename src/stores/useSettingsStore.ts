import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, SummaryLevel } from '../types';

const SETTINGS_STORAGE_KEY = '@knote_settings';
const STREAK_STORAGE_KEY = '@knote_streak';

// ========== THEME PRESETS ==========
export type ThemePreset = 'default' | 'aurora' | 'sunset' | 'ocean' | 'mint' | 'rose';
export type BgPattern = 'none' | 'waves' | 'dots' | 'circuit' | 'orbs';

export interface ThemePresetConfig {
    key: ThemePreset;
    label: string;
    primaryDark: string;
    accentDark: string;
    primaryLight: string;
    accentLight: string;
}

export const THEME_PRESETS: ThemePresetConfig[] = [
    { key: 'default', label: 'Ember', primaryDark: '#FB923C', primaryLight: '#EA580C', accentDark: '#FB7185', accentLight: '#E11D48' },
    { key: 'aurora', label: 'Aurora', primaryDark: '#67E8F9', primaryLight: '#0891B2', accentDark: '#A78BFA', accentLight: '#7C3AED' },
    { key: 'sunset', label: 'Sunset', primaryDark: '#FBBF24', primaryLight: '#D97706', accentDark: '#FB7185', accentLight: '#DB2777' },
    { key: 'ocean', label: 'Ocean', primaryDark: '#38BDF8', primaryLight: '#0284C7', accentDark: '#34D399', accentLight: '#059669' },
    { key: 'mint', label: 'Mint', primaryDark: '#34D399', primaryLight: '#059669', accentDark: '#A78BFA', accentLight: '#7C3AED' },
    { key: 'rose', label: 'Rosé', primaryDark: '#FB7185', primaryLight: '#E11D48', accentDark: '#FBBF24', accentLight: '#D97706' },
];

// ========== STREAK ==========
export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // ISO date string YYYY-MM-DD
    activeDays: string[]; // Array of YYYY-MM-DD strings for the last 30 days
    totalNotesCreated: number;
}

const defaultStreak: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activeDays: [],
    totalNotesCreated: 0,
};

// ========== SETTINGS ==========
export interface AppSettings {
    appLanguage: Language;
    defaultRecordingLanguage: Language;
    autoSummarize: boolean;
    autoCategorize: boolean;
    summaryLevel: SummaryLevel;
    noteViewMode: 'grid' | 'list';
    audioQuality: 'high' | 'medium' | 'low';
    hasCompletedOnboarding: boolean;
    // NEW: Theme features
    themePreset: ThemePreset;
    bgPattern: BgPattern;
    // NEW: Focus mode
    focusDuration: number; // minutes
    breakDuration: number; // minutes
}

const defaultSettings: AppSettings = {
    appLanguage: 'en',
    defaultRecordingLanguage: 'en',
    autoSummarize: true,
    autoCategorize: true,
    summaryLevel: 'standard',
    noteViewMode: 'list',
    audioQuality: 'high',
    hasCompletedOnboarding: false,
    themePreset: 'default',
    bgPattern: 'none',
    focusDuration: 25,
    breakDuration: 5,
};

interface SettingsState extends AppSettings {
    loaded: boolean;
    streak: StreakData;
    loadSettings: () => Promise<void>;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
    resetSettings: () => Promise<void>;
    recordActivity: () => Promise<void>;
    loadStreak: () => Promise<void>;
}

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function getDaysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...defaultSettings,
    loaded: false,
    streak: defaultStreak,

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                set({ ...defaultSettings, ...parsed, loaded: true });
            } else {
                set({ loaded: true });
            }
        } catch {
            set({ loaded: true });
        }
    },

    loadStreak: async () => {
        try {
            const stored = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
            if (stored) {
                const parsed: StreakData = JSON.parse(stored);
                const today = getTodayKey();
                // If the user didn't log in yesterday, reset streak
                if (parsed.lastActiveDate && getDaysBetween(parsed.lastActiveDate, today) > 1) {
                    const reset: StreakData = { ...parsed, currentStreak: 0 };
                    set({ streak: reset });
                    await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(reset));
                } else {
                    set({ streak: parsed });
                }
            }
        } catch { }
    },

    recordActivity: async () => {
        const today = getTodayKey();
        const current = get().streak;

        if (current.lastActiveDate === today) {
            // Already active today — just increment total
            const updated: StreakData = {
                ...current,
                totalNotesCreated: current.totalNotesCreated + 1,
            };
            set({ streak: updated });
            await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
            return;
        }

        const daysSinceLastActive = current.lastActiveDate
            ? getDaysBetween(current.lastActiveDate, today)
            : 0;

        const newStreak = daysSinceLastActive === 1 ? current.currentStreak + 1 : 1;
        const newActiveDays = [...current.activeDays, today].slice(-30); // Keep last 30 days

        const updated: StreakData = {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, current.longestStreak),
            lastActiveDate: today,
            activeDays: newActiveDays,
            totalNotesCreated: current.totalNotesCreated + 1,
        };

        set({ streak: updated });
        await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
    },

    updateSetting: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        set({ [key]: value } as any);
        const state = get();
        const settings: AppSettings = {
            appLanguage: state.appLanguage,
            defaultRecordingLanguage: state.defaultRecordingLanguage,
            autoSummarize: state.autoSummarize,
            autoCategorize: state.autoCategorize,
            summaryLevel: state.summaryLevel,
            noteViewMode: state.noteViewMode,
            audioQuality: state.audioQuality,
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            themePreset: state.themePreset,
            bgPattern: state.bgPattern,
            focusDuration: state.focusDuration,
            breakDuration: state.breakDuration,
        };
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    },

    resetSettings: async () => {
        set(defaultSettings);
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    },
}));
