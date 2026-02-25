// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
    name: 'Knote',
    version: '1.0.0',
    defaultLanguage: 'en' as const,
    supportedLanguages: ['en', 'ku'] as const,
};

// ============================================
// GEMINI AI CONFIG
// ============================================
export const GEMINI_CONFIG = {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    models: {
        flash: 'gemini-2.5-flash',
        pro: 'gemini-2.5-pro',
    },
    defaultModel: 'gemini-2.5-flash',
};

// ============================================
// AUDIO CONFIG
// ============================================
export const AUDIO_CONFIG = {
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    maxDurationMs: 30 * 60 * 1000, // 30 minutes
    allowedFormats: ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac'] as const,
};

// ============================================
// AI PROMPTS
// ============================================
export const AI_PROMPTS = {
    transcribe: (language: string) =>
        `Transcribe the following audio accurately. The audio is in ${language === 'ku' ? 'Kurdish Sorani (Central Kurdish)' : 'English'}. 
     Provide the transcription as plain text. If you detect the language is different from what was specified, 
     transcribe in the actual language spoken. Keep the original language - do not translate.
     Return ONLY the transcription text, nothing else.`,

    transcribeWithTimestamps: (language: string) =>
        `Transcribe the following audio with timestamps. The audio is in ${language === 'ku' ? 'Kurdish Sorani (Central Kurdish)' : 'English'}.
     Return a JSON object with this exact structure:
     {
       "language": "detected language code",
       "segments": [
         {"start": "MM:SS", "end": "MM:SS", "text": "segment text", "speaker": "Speaker 1"}
       ]
     }
     Identify distinct speakers if there are multiple. Keep the original language - do not translate.`,

    summarize: (level: 'brief' | 'standard' | 'detailed', language: string) => {
        const langInstruction = language === 'ku'
            ? 'Respond in Kurdish Sorani (Central Kurdish) using Sorani script.'
            : 'Respond in English.';

        const levelInstructions = {
            brief: 'Provide a very brief summary in 1-2 sentences.',
            standard: 'Provide a summary with key points in bullet format. Include 3-7 key points.',
            detailed: 'Provide a comprehensive detailed summary. Include all important points, action items, and key details.',
        };

        return `${levelInstructions[level]} ${langInstruction}
    Summarize the following note content. Preserve important names, dates, and numbers.`;
    },

    generateTitle: (language: string) =>
        `Generate a short, descriptive title (max 8 words) for the following note content.
     ${language === 'ku' ? 'The title should be in Kurdish Sorani.' : 'The title should be in English.'}
     Return ONLY the title text, nothing else.`,

    categorize: (folderNames: string[]) =>
        `Based on the following note content, which of these existing folders is the best match?
     Available folders: ${folderNames.join(', ')}
     
     Return a JSON object:
     {
       "folder": "best matching folder name or null if none match well",
       "confidence": 0.0 to 1.0,
       "suggestedNewFolder": "name of new folder if no good match exists, or null"
     }
     Return ONLY the JSON, nothing else.`,

    autoTag: (language: string) =>
        `Analyze the following note content and suggest 2-5 relevant tags.
     ${language === 'ku' ? 'Tags should be in Kurdish Sorani.' : 'Tags should be in English.'}
     Return a JSON array of tag strings. Example: ["meeting", "project", "deadline"]
     Return ONLY the JSON array, nothing else.`,

    extractActionItems: (language: string) =>
        `Extract any action items, tasks, or to-dos from the following note content.
     ${language === 'ku' ? 'Keep items in Kurdish Sorani.' : 'Keep items in English.'}
     Return a JSON array of objects: [{"text": "action item text", "completed": false}]
     If no action items found, return an empty array: []
     Return ONLY the JSON array, nothing else.`,

    continueWriting: (language: string) =>
        `You are a brilliant writing assistant. Read the following note content carefully, understand its tone, style, subject, and context. Then seamlessly continue writing 2-3 more sentences that naturally flow from the existing text. Match the exact style, formality level, and language.
     ${language === 'ku' ? 'Continue writing in Kurdish Sorani.' : 'Continue writing in English.'}
     Return ONLY the continuation text, nothing else. Do NOT repeat any existing content.`,

    findRelatedNotes: () =>
        `You are given a target note and a list of other notes with their IDs and content summaries. Find the most related notes.
     Return a JSON array of the top 3 most related note objects:
     [{"id": "note-id", "relevance": 0.0 to 1.0, "reason": "brief reason why related"}]
     Only include notes with relevance >= 0.3.
     Return ONLY the JSON array, nothing else.`,

    improveWriting: (language: string) =>
        `You are an expert editor. Rewrite the following note to significantly improve its clarity, grammar, structure, and readability while preserving ALL original meaning, facts, and intent. Fix any typos, awkward phrasing, or run-on sentences. Make it polished and professional.
     ${language === 'ku' ? 'Keep the text in Kurdish Sorani.' : 'Keep the text in English.'}
     Return ONLY the improved text, nothing else.`,

    askAboutNotes: () =>
        `You are KNote AI — a smart personal knowledge assistant. You have access to ALL of the user's notes provided below. Answer the user's question based on their notes. Be specific, helpful, cite which notes the info comes from if relevant. If you cannot find an answer in the notes, say so politely.
     Be concise but thorough. Use bullet points when listing multiple items.`,

    enhanceTranscript: (language: string) =>
        `You are a transcript editor. The following is a raw voice-to-text transcription that may contain: filler words (um, uh, like, you know), repetitions, run-on sentences, missing punctuation, and poor formatting.
     Clean it up into a polished, well-structured text that reads naturally. Remove filler words, fix grammar, add proper punctuation, and organize into clear paragraphs.
     ${language === 'ku' ? 'Keep the text in Kurdish Sorani.' : 'Keep the text in English.'}
     Preserve ALL original meaning and information. Return ONLY the enhanced text, nothing else.`,

    generateFlashcards: (language: string) =>
        `Analyze the following note content and generate educational Q&A flashcards. Focus on the most important concepts, facts, or definitions.
     ${language === 'ku' ? 'The flashcards should be in Kurdish Sorani.' : 'The flashcards should be in English.'}
     Return a JSON array of objects with the exact structure: [{"question": "...", "answer": "..."}]
     Generate between 3 and 10 flashcards depending on the note's length. Return ONLY the JSON array, nothing else.`,

    generateMindMap: (language: string) =>
        `Analyze the following note content and extract its core structure into a hierarchical tree format suitable for a mind map.
     ${language === 'ku' ? 'The nodes should be in Kurdish Sorani.' : 'The nodes should be in English.'}
     Identify the central topic, main branches, and sub-branches.
     Return a JSON object with this exact structure:
     {
       "id": "root",
       "label": "Central Topic",
       "children": [
         {
           "id": "branch1",
           "label": "Main Branch 1",
           "children": [{"id": "sub1", "label": "Sub Branch 1"}]
         }
       ]
     }
     Return ONLY the JSON object, nothing else.`,

    parseDocumentImage: (language: string) =>
        `Analyze this image (it may be a document, receipt, business card, or handwritten note). Extract all the written information and structure it cleanly.
     ${language === 'ku' ? 'Respond in Kurdish Sorani.' : 'Respond in English.'}
     If it's a receipt: extract the date, vendor, items, tax, and total.
     If it's a business card: extract name, job title, company, email, phone, and address.
     If it's a general document/note: extract the full text while preserving the logical structure and headings.
     Return the information formatted clearly using Markdown.`,

    analyzeMood: () =>
        `Analyze the emotional tone and sentiment of the following journal entry or note.
     Identify the primary mood from this list: Happy, Sad, Anxious, Calm, Excited, Frustrated, Grateful, Neutral.
     Also provide a brief 1-sentence explanation of why this mood was chosen.
     Return a JSON object: {"mood": "MoodName", "reason": "Brief explanation", "score": 0.0 to 1.0 (where 0 is very negative and 1 is very positive)}
     Return ONLY the JSON object, nothing else.`
};

// ============================================
// DEFAULT FOLDERS
// ============================================
export const DEFAULT_FOLDERS = [
    { name: 'All Notes', nameKu: 'هەموو تێبینییەکان', icon: 'inbox', color: '#6366F1', isDefault: true },
    { name: 'Favorites', nameKu: 'دڵخوازەکان', icon: 'star', color: '#F59E0B', isDefault: true },
    { name: 'Work', nameKu: 'کار', icon: 'briefcase', color: '#3B82F6', isDefault: true },
    { name: 'Personal', nameKu: 'کەسی', icon: 'home', color: '#10B981', isDefault: true },
    { name: 'Ideas', nameKu: 'بیرۆکەکان', icon: 'lightbulb', color: '#F97316', isDefault: true },
    { name: 'Trash', nameKu: 'زیبڵدان', icon: 'trash', color: '#EF4444', isDefault: true },
];
