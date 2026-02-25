import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder, CreateFolderInput, UpdateFolderInput } from '../types';
import { DEFAULT_FOLDERS } from '../constants/config';

const FOLDERS_STORAGE_KEY = '@knote_folders';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface FoldersState {
    folders: Folder[];
    loading: boolean;
}

interface FoldersActions {
    loadFolders: () => Promise<void>;
    createFolder: (input: CreateFolderInput) => Promise<Folder>;
    updateFolder: (id: string, updates: UpdateFolderInput) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
}

type FoldersStore = FoldersState & FoldersActions;

async function persistFolders(folders: Folder[]) {
    try {
        await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch (err) {
        console.error('Failed to persist folders:', err);
    }
}

export const useFoldersStore = create<FoldersStore>()((set, get) => ({
    folders: [],
    loading: false,

    loadFolders: async () => {
        set({ loading: true });
        try {
            const stored = await AsyncStorage.getItem(FOLDERS_STORAGE_KEY);
            if (stored) {
                // Migrate old emoji icons to Lucide icon names
                const EMOJI_TO_ICON: Record<string, string> = {
                    '📥': 'inbox', '⭐': 'star', '💼': 'briefcase', '🏠': 'home',
                    '💡': 'lightbulb', '🗑️': 'trash', '📁': 'folder', '📚': 'book-open',
                    '🎨': 'palette', '🔬': 'flask', '📝': 'file-text', '🎵': 'music',
                    '📸': 'camera', '✈️': 'plane', '🏋️': 'dumbbell', '🍳': 'cooking',
                    '❤️': 'heart', '🎯': 'trophy', '⭐️': 'star',
                };
                let folders: Folder[] = JSON.parse(stored);
                let migrated = false;
                folders = folders.map(f => {
                    if (EMOJI_TO_ICON[f.icon]) {
                        migrated = true;
                        return { ...f, icon: EMOJI_TO_ICON[f.icon] };
                    }
                    return f;
                });
                set({ folders, loading: false });
                if (migrated) await persistFolders(folders);
            } else {
                const now = new Date().toISOString();
                const defaults: Folder[] = DEFAULT_FOLDERS.map((f, i) => ({
                    id: `default_${i}`,
                    userId: 'local',
                    name: f.name,
                    nameKu: f.nameKu,
                    icon: f.icon,
                    color: f.color,
                    isDefault: f.isDefault,
                    sortOrder: i,
                    noteCount: 0,
                    createdAt: now,
                    updatedAt: now,
                }));
                set({ folders: defaults, loading: false });
                await persistFolders(defaults);
            }
        } catch {
            set({ loading: false });
        }
    },

    createFolder: async (input: CreateFolderInput) => {
        const now = new Date().toISOString();
        const folder: Folder = {
            id: generateId(),
            userId: 'local',
            name: input.name,
            nameKu: input.nameKu || null,
            icon: input.icon || 'folder',
            color: input.color || '#6366F1',
            isDefault: false,
            sortOrder: get().folders.length,
            noteCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        const updated = [...get().folders, folder];
        set({ folders: updated });
        await persistFolders(updated);
        return folder;
    },

    updateFolder: async (id: string, updates: UpdateFolderInput) => {
        const folders = get().folders.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        );
        set({ folders });
        await persistFolders(folders);
    },

    deleteFolder: async (id: string) => {
        const folders = get().folders.filter((f) => f.id !== id);
        set({ folders });
        await persistFolders(folders);
    },
}));

// Stable selector hook
export function useFolderById(id: string): Folder | undefined {
    return useFoldersStore((s) => s.folders.find((f) => f.id === id));
}
