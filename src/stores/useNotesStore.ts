import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, CreateNoteInput, UpdateNoteInput, NoteColor } from '../types';

const NOTES_STORAGE_KEY = '@knote_notes';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

interface NotesState {
    notes: Note[];
    loading: boolean;
    error: string | null;
}

interface NotesActions {
    loadNotes: () => Promise<void>;
    createNote: (input: CreateNoteInput) => Promise<Note>;
    updateNote: (id: string, updates: UpdateNoteInput) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    restoreNote: (id: string) => Promise<void>;
    permanentlyDelete: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    togglePin: (id: string) => Promise<void>;
    setNoteColor: (id: string, color: NoteColor) => Promise<void>;
    duplicateNote: (id: string) => Promise<Note | null>;
    emptyTrash: () => Promise<void>;
    restoreAllTrash: () => Promise<void>;
    moveToFolder: (noteId: string, folderId: string | null) => Promise<void>;
}

type NotesStore = NotesState & NotesActions;

async function persistNotes(notes: Note[]) {
    try {
        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
        console.error('Failed to persist notes:', err);
    }
}

export const useNotesStore = create<NotesStore>()((set, get) => ({
    notes: [],
    loading: false,
    error: null,

    loadNotes: async () => {
        set({ loading: true, error: null });
        try {
            const stored = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migrate old notes that don't have new fields
                const migrated = parsed.map((n: any) => ({
                    ...n,
                    isPinned: n.isPinned ?? false,
                    color: n.color ?? 'none',
                }));
                set({ notes: migrated, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (err) {
            set({ error: 'Failed to load notes', loading: false });
        }
    },

    createNote: async (input: CreateNoteInput) => {
        const now = new Date().toISOString();
        const content = input.content || '';

        const newNote: Note = {
            id: generateId(),
            userId: 'local',
            folderId: input.folderId || null,
            title: input.title || '',
            content,
            noteType: input.noteType || 'text',
            language: input.language || 'en',
            audioUri: input.audioUri || null,
            audioDuration: input.audioDuration || null,
            transcription: null,
            transcriptionSegments: null,
            transcriptionLanguage: null,
            transcriptionStatus: 'none',
            summary: null,
            summaryLevel: null,
            aiTitle: null,
            aiTags: [],
            aiCategory: null,
            aiConfidence: null,
            actionItems: [],
            keyPoints: [],
            aiMood: null,
            aiMoodReason: null,
            aiMoodScore: null,
            isPinned: input.isPinned || false,
            isFavorite: false,
            isArchived: false,
            isDeleted: false,
            deletedAt: null,
            color: input.color || 'none',
            wordCount: countWords(content),
            createdAt: now,
            updatedAt: now,
        };

        const updated = [newNote, ...get().notes];
        set({ notes: updated });
        await persistNotes(updated);
        return newNote;
    },

    updateNote: async (id: string, updates: UpdateNoteInput) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            const updatedNote = {
                ...note,
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            if (updates.content !== undefined) {
                updatedNote.wordCount = countWords(updates.content);
            }
            return updatedNote;
        });
        set({ notes });
        await persistNotes(notes);
    },

    deleteNote: async (id: string) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            return { ...note, isDeleted: true, deletedAt: new Date().toISOString(), isPinned: false };
        });
        set({ notes });
        await persistNotes(notes);
    },

    restoreNote: async (id: string) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            return { ...note, isDeleted: false, deletedAt: null };
        });
        set({ notes });
        await persistNotes(notes);
    },

    permanentlyDelete: async (id: string) => {
        const notes = get().notes.filter((note) => note.id !== id);
        set({ notes });
        await persistNotes(notes);
    },

    toggleFavorite: async (id: string) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            return { ...note, isFavorite: !note.isFavorite, updatedAt: new Date().toISOString() };
        });
        set({ notes });
        await persistNotes(notes);
    },

    togglePin: async (id: string) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            return { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
        });
        set({ notes });
        await persistNotes(notes);
    },

    setNoteColor: async (id: string, color: NoteColor) => {
        const notes = get().notes.map((note) => {
            if (note.id !== id) return note;
            return { ...note, color, updatedAt: new Date().toISOString() };
        });
        set({ notes });
        await persistNotes(notes);
    },

    duplicateNote: async (id: string) => {
        const original = get().notes.find((n) => n.id === id);
        if (!original) return null;

        const now = new Date().toISOString();
        const duplicate: Note = {
            ...original,
            id: generateId(),
            title: `${original.title} (Copy)`,
            isPinned: false,
            isDeleted: false,
            deletedAt: null,
            audioUri: null, // Don't duplicate audio file
            audioDuration: null,
            createdAt: now,
            updatedAt: now,
        };

        const updated = [duplicate, ...get().notes];
        set({ notes: updated });
        await persistNotes(updated);
        return duplicate;
    },

    emptyTrash: async () => {
        const notes = get().notes.filter((n) => !n.isDeleted);
        set({ notes });
        await persistNotes(notes);
    },

    restoreAllTrash: async () => {
        const notes = get().notes.map((n) =>
            n.isDeleted ? { ...n, isDeleted: false, deletedAt: null } : n
        );
        set({ notes });
        await persistNotes(notes);
    },

    moveToFolder: async (noteId: string, folderId: string | null) => {
        const notes = get().notes.map((note) => {
            if (note.id !== noteId) return note;
            return { ...note, folderId, updatedAt: new Date().toISOString() };
        });
        set({ notes });
        await persistNotes(notes);
    },
}));

// Stable selector hooks
export function useNoteById(id: string): Note | undefined {
    return useNotesStore((s) => s.notes.find((n) => n.id === id));
}
