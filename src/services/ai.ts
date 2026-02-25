import { GoogleGenAI } from '@google/genai';
import { GEMINI_CONFIG, AI_PROMPTS } from '../constants/config';
import type { SummaryLevel, Language } from '../types';

// ============================================
// GEMINI AI SERVICE
// ============================================

const ai = new GoogleGenAI({ apiKey: GEMINI_CONFIG.apiKey });

/**
 * Transcribe audio using Gemini's native audio understanding.
 * Gemini natively supports audio input and can transcribe in many languages
 * including Kurdish Sorani — no separate STT API needed!
 */
export async function transcribeAudio(
    audioBase64: string,
    mimeType: string = 'audio/wav',
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.transcribe(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: audioBase64,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Transcribe audio with detailed timestamps and speaker diarization.
 */
export async function transcribeAudioWithTimestamps(
    audioBase64: string,
    mimeType: string = 'audio/wav',
    language: Language = 'en'
): Promise<{
    language: string;
    segments: Array<{ start: string; end: string; text: string; speaker?: string }>;
}> {
    const prompt = AI_PROMPTS.transcribeWithTimestamps(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: audioBase64,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
        ],
    });

    try {
        const text = response.text || '{}';
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return { language: language, segments: [] };
    }
}

/**
 * Summarize note content using AI.
 */
export async function summarizeNote(
    content: string,
    level: SummaryLevel = 'standard',
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.summarize(level, language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Generate a title for a note from its content.
 */
export async function generateTitle(
    content: string,
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.generateTitle(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Auto-categorize a note into the best matching folder.
 */
export async function categorizeNote(
    content: string,
    folderNames: string[]
): Promise<{ folder: string | null; confidence: number; suggestedNewFolder: string | null }> {
    const prompt = AI_PROMPTS.categorize(folderNames);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '{}';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return { folder: null, confidence: 0, suggestedNewFolder: null };
    }
}

/**
 * Generate tags for a note.
 */
export async function generateTags(
    content: string,
    language: Language = 'en'
): Promise<string[]> {
    const prompt = AI_PROMPTS.autoTag(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return [];
    }
}

/**
 * Extract action items from note content.
 */
export async function extractActionItems(
    content: string,
    language: Language = 'en'
): Promise<Array<{ text: string; completed: boolean }>> {
    const prompt = AI_PROMPTS.extractActionItems(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return [];
    }
}

/**
 * Translate text between English and Kurdish Sorani.
 */
export async function translateText(
    text: string,
    targetLanguage: Language
): Promise<string> {
    const langName = targetLanguage === 'ku' ? 'Kurdish Sorani (Central Kurdish)' : 'English';
    const prompt = `Translate the following text to ${langName}. Return ONLY the translation, nothing else.`;

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${text}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * AI Smart Compose — continue writing from existing content.
 */
export async function continueWriting(
    content: string,
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.continueWriting(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Find related notes using AI analysis.
 */
export async function findRelatedNotes(
    targetNote: { id: string; title: string; content: string },
    otherNotes: Array<{ id: string; title: string; snippet: string }>
): Promise<Array<{ id: string; relevance: number; reason: string }>> {
    if (otherNotes.length === 0) return [];

    const prompt = AI_PROMPTS.findRelatedNotes();
    const notesList = otherNotes
        .map((n) => `[ID: ${n.id}] Title: "${n.title}" — ${n.snippet}`)
        .join('\n');

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `${prompt}\n\n--- TARGET NOTE ---\nTitle: "${targetNote.title}"\n${targetNote.content}\n\n--- OTHER NOTES ---\n${notesList}`,
                    },
                ],
            },
        ],
    });

    try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return [];
    }
}

/**
 * Improve writing quality of note content.
 */
export async function improveWriting(
    content: string,
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.improveWriting(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * AI Q&A — ask questions about all notes.
 */
export async function askAboutNotes(
    question: string,
    notesContext: Array<{ title: string; content: string; date: string }>
): Promise<string> {
    const prompt = AI_PROMPTS.askAboutNotes();
    const context = notesContext
        .map((n) => `📝 "${n.title}" (${n.date}):\n${n.content}`)
        .join('\n\n---\n\n');

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `${prompt}\n\n=== USER'S NOTES ===\n${context}\n\n=== USER'S QUESTION ===\n${question}`,
                    },
                ],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Enhance a raw voice transcript into polished text.
 */
export async function enhanceTranscript(
    rawTranscript: string,
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.enhanceTranscript(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${rawTranscript}` }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Generate Flashcards from note content.
 */
export async function generateFlashcards(
    content: string,
    language: Language = 'en'
): Promise<Array<{ question: string; answer: string }>> {
    const prompt = AI_PROMPTS.generateFlashcards(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return [];
    }
}

/**
 * Generate Mind Map structure from note content.
 */
export async function generateMindMap(
    content: string,
    language: Language = 'en'
): Promise<any> {
    const prompt = AI_PROMPTS.generateMindMap(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '{}';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return { id: 'root', label: 'Error generating map', children: [] };
    }
}

/**
 * Analyze the emotional mood of a note.
 */
export async function analyzeMood(
    content: string
): Promise<{ mood: string; reason: string; score: number } | null> {
    const prompt = AI_PROMPTS.analyzeMood();

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: `${prompt}\n\n---\n\n${content}` }],
            },
        ],
    });

    try {
        const text = response.text || '{}';
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
        return JSON.parse(jsonMatch[1] || text);
    } catch {
        return null;
    }
}

/**
 * Generate a smart voice briefing from notes.
 */
export async function generateBriefingText(
    notes: Array<{ title: string; content: string; date: string }>,
    language: Language = 'en'
): Promise<string> {
    const langName = language === 'ku' ? 'Kurdish Sorani' : 'English';
    const context = notes.map(n => `Title: ${n.title}\nDate: ${n.date}\nContent: ${n.content}`).join('\n\n');

    let prompt = `You are a helpful and friendly personal assistant hosting a "Daily Podcast" or smart briefing. Review the user's recent or important notes below.
Create a conversational, engaging, and clear spoken summary of these notes, mentioning key tasks left, interesting ideas, or general updates.
Do not use markdown formatting (like asterisks or hashes), just plain spoken text.
Speak in ${langName}. Make it sound like a friendly morning radio update.
Here are the notes:\n\n${context}`;

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ],
    });

    return response.text?.trim() || '';
}

/**
 * Parse an image of a document or receipt.
 */
export async function parseDocumentImage(
    base64Image: string,
    mimeType: string,
    language: Language = 'en'
): Promise<string> {
    const prompt = AI_PROMPTS.parseDocumentImage(language);

    const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        }
                    },
                    { text: prompt }
                ],
            },
        ],
    });

    return response.text?.trim() || '';
}
