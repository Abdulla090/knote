import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    X,
    Mic,
    Square,
    FileText,
    Pencil,
    Type,
    Clock,
    Trash2,
    Play,
    Pause,
    CheckCircle,
    AlertCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotesStore } from '../../src/stores/useNotesStore';
import { useFoldersStore } from '../../src/stores/useFoldersStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useAudioRecorder } from '../../src/hooks/useAudioRecorder';
import { LucideIcon } from '../../src/components/LucideIconMap';
import { transcribeAudio, summarizeNote, generateTitle, generateTags, categorizeNote } from '../../src/services/ai';
import { fontSize, spacing, radius, shadows } from '../../src/constants/theme';
import { formatDuration } from '../../src/utils/helpers';
import type { Language, NoteType } from '../../src/types';

type AIStage = 'idle' | 'transcribing' | 'summarizing' | 'titling' | 'tagging' | 'categorizing' | 'done' | 'error';

export default function NewNoteScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ type?: string }>();
    const isVoiceMode = params.type === 'voice';

    // Stores — use getState() for actions to avoid selector instability
    const folders = useFoldersStore((s) => s.folders);
    const autoSummarize = useSettingsStore((s) => s.autoSummarize);
    const autoCategorize = useSettingsStore((s) => s.autoCategorize);
    const summaryLevel = useSettingsStore((s) => s.summaryLevel);
    const defaultRecordingLanguage = useSettingsStore((s) => s.defaultRecordingLanguage);

    // State
    const [noteType, setNoteType] = useState<NoteType>(isVoiceMode ? 'voice' : 'text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [recordingLanguage, setRecordingLanguage] = useState<Language>(defaultRecordingLanguage);
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [aiStage, setAIStage] = useState<AIStage>('idle');
    const [saving, setSaving] = useState(false);

    // Audio recorder
    const {
        isRecording,
        isPaused,
        duration,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelRecording,
        getAudioBase64,
    } = useAudioRecorder();

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const recordBgAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording && !isPaused) {
            // Pulsing animation
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            );
            pulse.start();
            Animated.timing(recordBgAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
            if (!isRecording) {
                Animated.timing(recordBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
            }
        }
    }, [isRecording, isPaused]);

    const handleStartRecording = useCallback(async () => {
        try {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await startRecording();
        } catch (error: any) {
            Alert.alert(t('recording.permissionRequired'), t('recording.permissionMessage'));
        }
    }, [startRecording, t]);

    const handleStopAndProcess = useCallback(async () => {
        try {
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            const audioUri = await stopRecording();
            if (!audioUri) return;

            // Start AI pipeline
            setAIStage('transcribing');

            // 1. Transcribe
            const base64 = await getAudioBase64(audioUri);
            const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
            const transcriptionResult = await transcribeAudio(base64, mimeType, recordingLanguage);
            setTranscription(transcriptionResult);

            // 2. Generate title
            if (transcriptionResult) {
                setAIStage('titling');
                const aiTitle = await generateTitle(transcriptionResult, recordingLanguage);
                setTitle(aiTitle);

                // 3. Summarize (if enabled)
                if (autoSummarize) {
                    setAIStage('summarizing');
                    const aiSummary = await summarizeNote(transcriptionResult, summaryLevel, recordingLanguage);
                    setSummary(aiSummary);
                }

                // 4. Auto-tag and categorize
                setAIStage('tagging');
                const tags = await generateTags(transcriptionResult, recordingLanguage);

                // Save the note
                setSaving(true);
                const note = await useNotesStore.getState().createNote({
                    title: aiTitle || 'Voice Note',
                    content: transcriptionResult,
                    noteType: 'voice',
                    language: recordingLanguage,
                    audioUri,
                    audioDuration: duration,
                });

                // Update with AI data
                const updateData: any = {
                    transcription: transcriptionResult,
                    transcriptionStatus: 'completed',
                    transcriptionLanguage: recordingLanguage,
                    aiTitle,
                    aiTags: tags,
                };

                if (autoSummarize && summary) {
                    updateData.summary = summary;
                    updateData.summaryLevel = summaryLevel;
                }

                // 5. Auto-categorize
                if (autoCategorize) {
                    setAIStage('categorizing');
                    const folderNames = folders.filter((f) => !['All Notes', 'Favorites', 'Trash'].includes(f.name)).map((f) => f.name);
                    if (folderNames.length > 0) {
                        const cat = await categorizeNote(transcriptionResult, folderNames);
                        if (cat.folder) {
                            const matchedFolder = folders.find((f) => f.name === cat.folder);
                            if (matchedFolder) {
                                updateData.folderId = matchedFolder.id;
                                updateData.aiCategory = cat.folder;
                                updateData.aiConfidence = cat.confidence;
                            }
                        }
                    }
                }

                await useNotesStore.getState().updateNote(note.id, updateData);
                setAIStage('done');
                setSaving(false);

                setTimeout(() => {
                    router.replace(`/note/${note.id}`);
                }, 600);
            }
        } catch (error) {
            console.error('AI processing error:', error);
            setAIStage('error');
            setSaving(false);
        }
    }, [
        stopRecording, getAudioBase64, recordingLanguage, autoSummarize, autoCategorize,
        summaryLevel, folders, duration, router, t, summary,
    ]);

    const handleSaveTextNote = useCallback(async () => {
        if (!title.trim() && !content.trim()) return;

        setSaving(true);
        try {
            const note = await useNotesStore.getState().createNote({
                title: title.trim() || 'Untitled',
                content: content.trim(),
                noteType: 'text',
                language: recordingLanguage,
            });

            // AI processing for text notes
            if (content.trim().length > 20) {
                const updates: any = {};

                if (autoSummarize) {
                    const aiSummary = await summarizeNote(content, summaryLevel, recordingLanguage);
                    updates.summary = aiSummary;
                    updates.summaryLevel = summaryLevel;
                }

                const tags = await generateTags(content, recordingLanguage);
                updates.aiTags = tags;

                if (autoCategorize) {
                    const folderNames = folders.filter((f) => !['All Notes', 'Favorites', 'Trash'].includes(f.name)).map((f) => f.name);
                    if (folderNames.length > 0) {
                        const cat = await categorizeNote(content, folderNames);
                        if (cat.folder) {
                            const matchedFolder = folders.find((f) => f.name === cat.folder);
                            if (matchedFolder) {
                                updates.folderId = matchedFolder.id;
                                updates.aiCategory = cat.folder;
                                updates.aiConfidence = cat.confidence;
                            }
                        }
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await useNotesStore.getState().updateNote(note.id, updates);
                }
            }

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.replace(`/note/${note.id}`);
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert(t('common.error'), 'Failed to save note');
        } finally {
            setSaving(false);
        }
    }, [title, content, recordingLanguage, autoSummarize, autoCategorize, summaryLevel, folders, router, t]);

    const bgColor = recordBgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.background, colors.errorSurface],
    });

    // AI Status messages
    const aiStageMessages: Record<AIStage, string> = {
        idle: '',
        transcribing: t('transcription.transcribing'),
        summarizing: t('ai.summarizing'),
        titling: t('ai.titleGeneration'),
        tagging: t('ai.tagging'),
        categorizing: t('ai.categorizing'),
        done: t('common.success'),
        error: t('common.error'),
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => {
                        if (isRecording) cancelRecording();
                        router.back();
                    }}
                >
                    <X size={22} color={colors.textPrimary} strokeWidth={2} />
                </Pressable>

                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    {t('notes.newNote')}
                </Text>

                {noteType === 'text' && (
                    <Pressable
                        style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                        onPress={handleSaveTextNote}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        )}
                    </Pressable>
                )}
                {noteType === 'voice' && <View style={{ width: 70 }} />}
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <Pressable
                    style={({ pressed }) => [
                        styles.modeButton,
                        noteType === 'text' && { backgroundColor: colors.primary },
                        noteType !== 'text' && { backgroundColor: colors.surfaceElevated },
                        pressed && { opacity: 0.85 },
                        { borderCurve: 'continuous' } as any,
                    ]}
                    onPress={() => !isRecording && setNoteType('text')}
                    disabled={isRecording}
                >
                    <Pencil size={18} color={noteType === 'text' ? '#FFF' : colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.modeText, { color: noteType === 'text' ? '#FFF' : colors.textSecondary }]}>
                        {t('notes.textNote')}
                    </Text>
                </Pressable>
                <Pressable
                    style={({ pressed }) => [
                        styles.modeButton,
                        noteType === 'voice' && { backgroundColor: colors.accent },
                        noteType !== 'voice' && { backgroundColor: colors.surfaceElevated },
                        pressed && { opacity: 0.85 },
                        { borderCurve: 'continuous' } as any,
                    ]}
                    onPress={() => !isRecording && setNoteType('voice')}
                    disabled={isRecording}
                >
                    <Mic size={18} color={noteType === 'voice' ? '#FFF' : colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.modeText, { color: noteType === 'voice' ? '#FFF' : colors.textSecondary }]}>
                        {t('notes.voiceNote')}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top + 50}
            >
                <ScrollView
                    style={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ===== TEXT NOTE MODE ===== */}
                    {noteType === 'text' && (
                        <View style={styles.textEditorContainer}>
                            {/* Templates */}
                            {!title && !content && (
                                <View style={styles.templatesSection}>
                                    <Text style={[styles.templatesSectionTitle, { color: colors.textSecondary }]}>
                                        Quick Templates
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesRow}>
                                        {[
                                            { icon: 'sticky-note', iconColor: '#6366F1', label: 'Quick Note', title: '', content: '' },
                                            { icon: 'users', iconColor: '#3B82F6', label: 'Meeting', title: 'Meeting Notes', content: 'Date: \nAttendees: \n\nAgenda:\n• \n\nNotes:\n\n\nAction Items:\n• ' },
                                            { icon: 'check-square', iconColor: '#10B981', label: 'Todo', title: 'Todo List', content: '☐ \n☐ \n☐ \n☐ \n☐ ' },
                                            { icon: 'book-text', iconColor: '#F59E0B', label: 'Journal', title: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), content: 'Mood: \n\nToday:\n\n\nThoughts:\n\n\nGrateful for:\n• ' },
                                            { icon: 'zap', iconColor: '#F97316', label: 'Ideas', title: 'Ideas', content: 'Main Idea:\n\n\nProblem it solves:\n\n\nSteps:\n1. \n2. \n3. \n\nQuestions:\n• ' },
                                        ].map((tpl, i) => (
                                            <Pressable
                                                key={i}
                                                style={({ pressed }) => [styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                                                onPress={() => { setTitle(tpl.title); setContent(tpl.content); }}
                                            >
                                                <View style={[styles.templateIconBadge, { backgroundColor: tpl.iconColor + '18' }]}>
                                                    <LucideIcon name={tpl.icon} size={20} color={tpl.iconColor} />
                                                </View>
                                                <Text style={[styles.templateLabel, { color: colors.textPrimary }]}>{tpl.label}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <TextInput
                                style={[styles.titleInput, { color: colors.textPrimary }]}
                                placeholder={t('notes.untitled')}
                                placeholderTextColor={colors.textTertiary}
                                value={title}
                                onChangeText={setTitle}
                                multiline
                                maxLength={200}
                            />
                            <TextInput
                                style={[styles.contentInput, { color: colors.textPrimary }]}
                                placeholder="Start writing..."
                                placeholderTextColor={colors.textTertiary}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                textAlignVertical="top"
                            />

                            {/* Live Word Counter */}
                            {content.length > 0 && (
                                <View style={[styles.wordCountBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
                                    <View style={styles.wordCountItem}>
                                        <Type size={12} color={colors.textTertiary} strokeWidth={2} />
                                        <Text style={[styles.wordCountText, { color: colors.textTertiary, fontVariant: ['tabular-nums'] }]}>
                                            {content.trim().split(/\s+/).filter(Boolean).length} words
                                        </Text>
                                    </View>
                                    <View style={styles.wordCountItem}>
                                        <Pencil size={12} color={colors.textTertiary} strokeWidth={2} />
                                        <Text style={[styles.wordCountText, { color: colors.textTertiary, fontVariant: ['tabular-nums'] }]}>
                                            {content.length} chars
                                        </Text>
                                    </View>
                                    <View style={styles.wordCountItem}>
                                        <Clock size={12} color={colors.textTertiary} strokeWidth={2} />
                                        <Text style={[styles.wordCountText, { color: colors.textTertiary, fontVariant: ['tabular-nums'] }]}>
                                            ~{Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200))} min read
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ===== VOICE NOTE MODE ===== */}
                    {noteType === 'voice' && (
                        <View style={styles.voiceContainer}>
                            {/* Language Selector */}
                            <View style={styles.languageSelector}>
                                <Text style={[styles.langLabel, { color: colors.textSecondary }]}>
                                    {t('recording.language')}:
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.langButton,
                                        recordingLanguage === 'en' && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        recordingLanguage !== 'en' && { borderColor: colors.border },
                                        pressed && { opacity: 0.85 },
                                        { borderCurve: 'continuous' } as any,
                                    ]}
                                    onPress={() => setRecordingLanguage('en')}
                                    disabled={isRecording}
                                >
                                    <Text style={[styles.langText, { color: recordingLanguage === 'en' ? '#FFF' : colors.textSecondary }]}>
                                        🇬🇧 {t('recording.english')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.langButton,
                                        recordingLanguage === 'ku' && { backgroundColor: colors.accent, borderColor: colors.accent },
                                        recordingLanguage !== 'ku' && { borderColor: colors.border },
                                        pressed && { opacity: 0.85 },
                                        { borderCurve: 'continuous' } as any,
                                    ]}
                                    onPress={() => setRecordingLanguage('ku')}
                                    disabled={isRecording}
                                >
                                    <Text style={[styles.langText, { color: recordingLanguage === 'ku' ? '#FFF' : colors.textSecondary }]}>
                                        🇮🇶 {t('recording.kurdish')}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Recording Area */}
                            <View style={styles.recordingArea}>
                                {/* Duration */}
                                <Text style={[styles.durationDisplay, { color: isRecording ? colors.recording : colors.textPrimary }]}>
                                    {formatDuration(duration)}
                                </Text>

                                {/* Waveform Placeholder */}
                                {isRecording && (
                                    <View style={styles.waveformContainer}>
                                        {Array.from({ length: 30 }).map((_, i) => (
                                            <Animated.View
                                                key={i}
                                                style={[
                                                    styles.waveBar,
                                                    {
                                                        backgroundColor: colors.primary,
                                                        height: Math.random() * 40 + 8,
                                                        opacity: isPaused ? 0.3 : 0.7,
                                                    },
                                                ]}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* Status */}
                                {isRecording && (
                                    <View style={styles.recordingStatus}>
                                        <View style={[styles.recordingDot, { backgroundColor: isPaused ? colors.warning : colors.recording }]} />
                                        <Text style={[styles.recordingStatusText, { color: colors.textSecondary }]}>
                                            {isPaused ? t('recording.pause') : t('recording.recording')}
                                        </Text>
                                    </View>
                                )}

                                {/* Record Button */}
                                <View style={styles.recordControls}>
                                    {isRecording && (
                                        <Pressable
                                            style={({ pressed }) => [styles.controlButton, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1 }]}
                                            onPress={cancelRecording}
                                        >
                                            <Trash2 size={22} color={colors.error} strokeWidth={2} />
                                        </Pressable>
                                    )}

                                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.recordButton,
                                                { backgroundColor: isRecording ? colors.recording : colors.primary, opacity: pressed ? 0.85 : 1 },
                                                isRecording && { ...shadows.glow(colors.recording) },
                                            ]}
                                            onPress={isRecording ? handleStopAndProcess : handleStartRecording}
                                        >
                                            {isRecording ? (
                                                <Square size={32} color="#FFF" strokeWidth={2} fill="#FFF" />
                                            ) : (
                                                <Mic size={36} color="#FFF" strokeWidth={2} />
                                            )}
                                        </Pressable>
                                    </Animated.View>

                                    {isRecording && (
                                        <Pressable
                                            style={({ pressed }) => [styles.controlButton, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1 }]}
                                            onPress={isPaused ? resumeRecording : pauseRecording}
                                        >
                                            {isPaused ? <Play size={22} color={colors.textPrimary} strokeWidth={2} fill={colors.textPrimary} /> : <Pause size={22} color={colors.textPrimary} strokeWidth={2} fill={colors.textPrimary} />}
                                        </Pressable>
                                    )}
                                </View>

                                {!isRecording && aiStage === 'idle' && (
                                    <Text style={[styles.tapHint, { color: colors.textTertiary }]}>
                                        {t('recording.tapToRecord')}
                                    </Text>
                                )}
                            </View>

                            {/* AI Processing Status */}
                            {aiStage !== 'idle' && aiStage !== 'done' && (
                                <View style={[styles.aiStatusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.aiStatusText, { color: colors.textPrimary }]}>
                                        {aiStageMessages[aiStage]}
                                    </Text>
                                    <View style={[styles.aiProgressBar, { backgroundColor: colors.skeleton }]}>
                                        <Animated.View
                                            style={[
                                                styles.aiProgressFill,
                                                {
                                                    backgroundColor: colors.primary,
                                                    width: `${aiStage === 'transcribing' ? 20
                                                        : aiStage === 'titling' ? 40
                                                            : aiStage === 'summarizing' ? 60
                                                                : aiStage === 'tagging' ? 80
                                                                    : aiStage === 'categorizing' ? 90
                                                                        : 100
                                                        }%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* AI Done Status */}
                            {aiStage === 'done' && (
                                <View style={[styles.aiStatusCard, { backgroundColor: colors.successSurface, borderColor: colors.success + '30', borderCurve: 'continuous' } as any]}>
                                    <CheckCircle size={22} color={colors.success} strokeWidth={2} />
                                    <Text style={[styles.aiStatusText, { color: colors.success }]}>
                                        {t('common.success')} — {t('transcription.transcriptionComplete')}
                                    </Text>
                                </View>
                            )}

                            {/* Error Status */}
                            {aiStage === 'error' && (
                                <View style={[styles.aiStatusCard, { backgroundColor: colors.errorSurface, borderColor: colors.error + '30', borderCurve: 'continuous' } as any]}>
                                    <AlertCircle size={22} color={colors.error} strokeWidth={2} />
                                    <Text style={[styles.aiStatusText, { color: colors.error }]}>
                                        {t('transcription.transcriptionFailed')}
                                    </Text>
                                    <Pressable
                                        style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                                        onPress={() => setAIStage('idle')}
                                    >
                                        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                                    </Pressable>
                                </View>
                            )}

                            {/* Transcription Preview */}
                            {transcription ? (
                                <View style={[styles.transcriptionPreview, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
                                    <View style={styles.transcriptionHeader}>
                                        <FileText size={16} color={colors.primary} strokeWidth={2} />
                                        <Text style={[styles.transcriptionLabel, { color: colors.primary }]}>
                                            Transcription
                                        </Text>
                                    </View>
                                    <Text style={[styles.transcriptionText, { color: colors.textPrimary }]} selectable>
                                        {transcription}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        minWidth: 70,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    modeToggle: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.base,
        gap: spacing.sm,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        gap: spacing.xs,
    },
    modeText: {
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
    scrollContent: {
        flex: 1,
    },
    textEditorContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    titleInput: {
        fontSize: fontSize['2xl'],
        fontWeight: '700',
        marginBottom: spacing.md,
        lineHeight: 32,
    },
    contentInput: {
        fontSize: fontSize.base,
        lineHeight: 24,
        minHeight: 300,
    },
    voiceContainer: {
        paddingHorizontal: spacing.lg,
    },
    languageSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    langLabel: {
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
    langButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
    },
    langText: {
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
    recordingArea: {
        alignItems: 'center',
        paddingVertical: spacing['3xl'],
    },
    durationDisplay: {
        fontSize: fontSize['5xl'],
        fontWeight: '200',
        letterSpacing: 2,
        marginBottom: spacing.xl,
        fontVariant: ['tabular-nums'],
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 2,
        marginBottom: spacing.xl,
        width: '100%',
    },
    waveBar: {
        width: 3,
        borderRadius: 2,
    },
    recordingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    recordingStatusText: {
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
    recordControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xl,
    },
    controlButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tapHint: {
        marginTop: spacing.xl,
        fontSize: fontSize.sm,
    },
    aiStatusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.base,
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.xl,
        gap: spacing.md,
        flexWrap: 'wrap',
    },
    aiStatusText: {
        fontSize: fontSize.sm,
        fontWeight: '500',
        flex: 1,
    },
    aiProgressBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        marginTop: spacing.sm,
    },
    aiProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    retryButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.xs,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: fontSize.xs,
        fontWeight: '600',
    },
    transcriptionPreview: {
        marginTop: spacing.xl,
        padding: spacing.base,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    transcriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    transcriptionLabel: {
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
    transcriptionText: {
        fontSize: fontSize.base,
        lineHeight: 22,
    },
    // Templates
    templatesSection: {
        marginBottom: spacing.lg,
    },
    templatesSectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    templatesRow: {
        gap: spacing.sm,
        paddingRight: spacing.md,
    },
    templateCard: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
        minWidth: 80,
    },
    templateIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    templateLabel: {
        fontSize: fontSize.xs,
        fontWeight: '600',
    },
    // Word Counter
    wordCountBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        marginTop: spacing.md,
    },
    wordCountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    wordCountText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
