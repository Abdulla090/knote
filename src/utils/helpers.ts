import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format a date string for display in note cards.
 */
export function formatNoteDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) {
        return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }
    return format(date, 'MMM d, yyyy');
}

/**
 * Format duration in seconds to MM:SS.
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to a max length.
 */
export function truncateText(text: string, maxLength: number = 120): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Count words in text.
 */
export function countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Generate a preview from note content.
 */
export function getNotePreview(note: {
    content?: string;
    transcription?: string | null;
}): string {
    const text = note.content || note.transcription || '';
    return truncateText(text, 150);
}

/**
 * Detect if text is RTL (Arabic/Kurdish script).
 */
export function isRTLText(text: string): boolean {
    if (!text) return false;
    // Check first meaningful character for Arabic script range
    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text.slice(0, 50));
}
