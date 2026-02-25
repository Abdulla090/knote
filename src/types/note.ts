// ============================================
// NOTE TYPES
// ============================================

export type NoteType = 'text' | 'voice' | 'mixed';
export type TranscriptionStatus = 'none' | 'processing' | 'completed' | 'failed';
export type SummaryLevel = 'brief' | 'standard' | 'detailed';
export type Language = 'en' | 'ku';

// Color labels for notes
export type NoteColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export const NOTE_COLORS: Record<NoteColor, string> = {
    none: 'transparent',
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#EAB308',
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#8B5CF6',
};

export interface TranscriptionSegment {
    start: string; // "MM:SS"
    end: string;
    text: string;
    speaker?: string;
}

export interface ActionItem {
    text: string;
    completed: boolean;
}

export interface Note {
    id: string;
    userId: string;
    folderId: string | null;

    // Content
    title: string;
    content: string;
    noteType: NoteType;
    language: Language;

    // Voice / Transcription
    audioUri: string | null;
    audioDuration: number | null; // seconds
    transcription: string | null;
    transcriptionSegments: TranscriptionSegment[] | null;
    transcriptionLanguage: Language | null;
    transcriptionStatus: TranscriptionStatus;

    // AI Generated
    summary: string | null;
    summaryLevel: SummaryLevel | null;
    aiTitle: string | null;
    aiTags: string[];
    aiCategory: string | null;
    aiConfidence: number | null;
    actionItems: ActionItem[];
    keyPoints: string[];
    aiMood: string | null;
    aiMoodReason: string | null;
    aiMoodScore: number | null;

    // Metadata
    isPinned: boolean;
    isFavorite: boolean;
    isArchived: boolean;
    isDeleted: boolean;
    deletedAt: string | null;
    color: NoteColor;
    wordCount: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteInput {
    title?: string;
    content?: string;
    noteType?: NoteType;
    language?: Language;
    folderId?: string;
    audioUri?: string;
    audioDuration?: number;
    color?: NoteColor;
    isPinned?: boolean;
}

export interface UpdateNoteInput {
    title?: string;
    content?: string;
    folderId?: string | null;
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    isDeleted?: boolean;
    color?: NoteColor;
    transcription?: string;
    transcriptionSegments?: TranscriptionSegment[];
    transcriptionStatus?: TranscriptionStatus;
    transcriptionLanguage?: Language;
    summary?: string;
    summaryLevel?: SummaryLevel;
    aiTitle?: string;
    aiTags?: string[];
    aiCategory?: string;
    aiConfidence?: number;
    actionItems?: ActionItem[];
    keyPoints?: string[];
    language?: Language;
    aiMood?: string;
    aiMoodReason?: string;
    aiMoodScore?: number;
}
