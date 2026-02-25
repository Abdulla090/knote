import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Platform, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Pin,
    Star,
    Pencil,
    Check,
    MoreHorizontal,
    Share2,
    Copy,
    ClipboardCopy,
    Trash2,
    Sparkles,
    Tag,
    Languages,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    Play,
    Pause,
    Mic,
    FileText,
    X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotesStore, useNoteById } from '../../src/stores/useNotesStore';
import { useFoldersStore } from '../../src/stores/useFoldersStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { summarizeNote, generateTags, translateText, continueWriting, improveWriting, enhanceTranscript, findRelatedNotes } from '../../src/services/ai';
import { LucideIcon } from '../../src/components/LucideIconMap';
import { fontSize, spacing, radius } from '../../src/constants/theme';
import { formatNoteDate, formatDuration, isRTLText } from '../../src/utils/helpers';
import { NOTE_COLORS } from '../../src/types/note';
import type { NoteColor } from '../../src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NoteDetailScreen() {
    const { theme } = useTheme();
    const c = theme.colors;
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const note = useNoteById(id || '');
    const folders = useFoldersStore((s) => s.folders);
    const summaryLevel = useSettingsStore((s) => s.summaryLevel);
    const [editing, setEditing] = useState(false);
    const [eTitle, setETitle] = useState('');
    const [eContent, setEContent] = useState('');
    const [aiLoad, setAiLoad] = useState<string | null>(null);
    const [showSum, setShowSum] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showMore, setShowMore] = useState(false);
    const [showAITools, setShowAITools] = useState(false);
    const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const player = useAudioPlayer();

    useEffect(() => {
        if (note) { setETitle(note.title); setEContent(note.content); if (note.audioUri) player.loadAudio(note.audioUri); }
        return () => { player.unload(); };
    }, [note?.id]);

    useEffect(() => {
        if (!editing || !note) return;
        setSaveStatus('saving');
        if (saveRef.current) clearTimeout(saveRef.current);
        saveRef.current = setTimeout(async () => {
            await useNotesStore.getState().updateNote(note.id, { title: eTitle, content: eContent });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1500);
        return () => { if (saveRef.current) clearTimeout(saveRef.current); };
    }, [eTitle, eContent, editing]);

    const handleDel = useCallback(() => {
        if (!note) return;
        Alert.alert(t('notes.deleteConfirm'), t('notes.deleteConfirmMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: async () => { await useNotesStore.getState().deleteNote(note.id); if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); } },
        ]);
    }, [note?.id, router, t]);

    const handleShare = useCallback(async () => {
        if (!note) return;
        const text = `${note.title}\n\n${note.content || note.transcription || ''}`;
        try { await Share.share({ message: text, title: note.title }); } catch { }
    }, [note?.id, note?.title, note?.content, note?.transcription]);

    const handleCopy = useCallback(async () => {
        if (!note) return;
        const text = `${note.title}\n\n${note.content || note.transcription || ''}`;
        await Clipboard.setStringAsync(text);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(t('common.copied'));
    }, [note?.id, t]);

    const handleDuplicate = useCallback(async () => {
        if (!note) return;
        const dup = await useNotesStore.getState().duplicateNote(note.id);
        if (dup) { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace(`/note/${dup.id}`); }
    }, [note?.id, router]);

    const regenSummary = useCallback(async () => {
        if (!note) return;
        const txt = note.content || note.transcription || '';
        if (!txt) return;
        setAiLoad('summary');
        try { const s = await summarizeNote(txt, summaryLevel, note.language); await useNotesStore.getState().updateNote(note.id, { summary: s, summaryLevel }); } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.content, note?.transcription, note?.language, summaryLevel]);

    const regenTags = useCallback(async () => {
        if (!note) return;
        setAiLoad('tags');
        try { const tags = await generateTags(note.content || note.transcription || '', note.language); await useNotesStore.getState().updateNote(note.id, { aiTags: tags }); } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.content, note?.transcription, note?.language]);

    const doTranslate = useCallback(async () => {
        if (!note) return;
        const txt = note.content || note.transcription || '';
        const tgt = note.language === 'en' ? 'ku' as const : 'en' as const;
        setAiLoad('translate');
        try { const tr = await translateText(txt, tgt); await useNotesStore.getState().updateNote(note.id, { content: `${txt}\n\n--- ${tgt === 'ku' ? 'وەرگێڕان' : 'Translation'} ---\n\n${tr}` }); setEContent(`${txt}\n\n--- ${tgt === 'ku' ? 'وەرگێڕان' : 'Translation'} ---\n\n${tr}`); } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.content, note?.transcription, note?.language]);

    // === NEW AI FEATURES ===
    const handleContinueWriting = useCallback(async () => {
        if (!note) return;
        const txt = eContent || note.content || '';
        if (!txt.trim()) return;
        setAiLoad('continue');
        try {
            const continuation = await continueWriting(txt, note.language);
            if (continuation) {
                const newContent = txt + ' ' + continuation;
                setEContent(newContent);
                setEditing(true);
                await useNotesStore.getState().updateNote(note.id, { content: newContent });
            }
        } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, eContent, note?.content, note?.language]);

    const handleImproveWriting = useCallback(async () => {
        if (!note) return;
        const txt = note.content || note.transcription || '';
        if (!txt.trim()) return;
        setAiLoad('improve');
        try {
            const improved = await improveWriting(txt, note.language);
            if (improved) {
                setEContent(improved);
                setEditing(true);
                await useNotesStore.getState().updateNote(note.id, { content: improved });
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.content, note?.transcription, note?.language]);

    const handleEnhanceTranscript = useCallback(async () => {
        if (!note || !note.transcription) return;
        setAiLoad('enhance');
        try {
            const enhanced = await enhanceTranscript(note.transcription, note.language);
            if (enhanced) {
                await useNotesStore.getState().updateNote(note.id, { content: enhanced });
                setEContent(enhanced);
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.transcription, note?.language]);

    const [relatedNotes, setRelatedNotes] = useState<Array<{ id: string; relevance: number; reason: string }>>([]);

    const handleFindRelated = useCallback(async () => {
        if (!note) return;
        const allNotes = useNotesStore.getState().notes;
        const others = allNotes
            .filter(n => n.id !== note.id && !n.isDeleted && !n.isArchived)
            .slice(0, 20)
            .map(n => ({ id: n.id, title: n.title || n.aiTitle || 'Untitled', snippet: (n.content || n.transcription || '').slice(0, 150) }));
        if (others.length === 0) return;
        setAiLoad('related');
        try {
            const results = await findRelatedNotes(
                { id: note.id, title: note.title || note.aiTitle || '', content: (note.content || note.transcription || '').slice(0, 500) },
                others
            );
            setRelatedNotes(results);
        } catch (e) { console.error(e); }
        setAiLoad(null);
    }, [note?.id, note?.title, note?.content, note?.transcription]);

    if (!note) return <View style={[s.ctn, { backgroundColor: c.background, paddingTop: insets.top }]}><View style={s.load}><ActivityIndicator size="large" color={c.primary} /></View></View>;

    const isK = note.language === 'ku' || isRTLText(note.title || note.content);
    const folder = note.folderId ? folders.find(f => f.id === note.folderId) : null;
    const colorAccent = note.color !== 'none' ? NOTE_COLORS[note.color] : null;

    // Word / char / reading time stats
    const noteStats = useMemo(() => {
        const text = (note.content || '') + ' ' + (note.transcription || '');
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = (note.content || note.transcription || '').length;
        const readingTime = Math.max(1, Math.ceil(words / 200)); // ~200 wpm average
        return { words, chars, readingTime };
    }, [note.content, note.transcription]);

    const colorLabels: NoteColor[] = ['none', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

    return (
        <View style={[s.ctn, { backgroundColor: c.background, paddingTop: insets.top }]}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(300)} style={s.hdr}>
                <Pressable
                    style={({ pressed }) => [s.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => { if (editing && note) useNotesStore.getState().updateNote(note.id, { title: eTitle, content: eContent }); router.back(); }}
                >
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>

                {/* Save Status */}
                {editing && saveStatus !== 'idle' && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={[s.saveBadge, { backgroundColor: saveStatus === 'saved' ? c.successSurface : c.primarySurface, borderCurve: 'continuous' } as any]}
                    >
                        {saveStatus === 'saving' && <ActivityIndicator size="small" color={c.primary} />}
                        {saveStatus === 'saved' && <Check size={14} color={c.success} strokeWidth={2.5} />}
                        <Text style={[s.saveBadgeText, { color: saveStatus === 'saved' ? c.success : c.primary }]}>
                            {saveStatus === 'saving' ? t('notes.saving') : t('notes.saved')}
                        </Text>
                    </Animated.View>
                )}

                <View style={s.hR}>
                    <Pressable
                        style={({ pressed }) => [s.hBtn, { backgroundColor: note.isPinned ? '#FEF3C7' : c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); useNotesStore.getState().togglePin(note.id); }}
                    >
                        <Pin size={18} color={note.isPinned ? '#F59E0B' : c.textSecondary} strokeWidth={2} fill={note.isPinned ? '#F59E0B' : 'none'} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [s.hBtn, { backgroundColor: note.isFavorite ? '#FEF3C7' : c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); useNotesStore.getState().toggleFavorite(note.id); }}
                    >
                        <Star size={18} color={note.isFavorite ? '#F59E0B' : c.textSecondary} strokeWidth={2} fill={note.isFavorite ? '#F59E0B' : 'none'} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [s.hBtn, { backgroundColor: editing ? c.primarySurface : c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); setEditing(!editing); }}
                    >
                        {editing ? <Check size={18} color={c.primary} strokeWidth={2.5} /> : <Pencil size={18} color={c.textSecondary} strokeWidth={2} />}
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [s.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => setShowMore(!showMore)}
                    >
                        <MoreHorizontal size={18} color={c.textSecondary} strokeWidth={2} />
                    </Pressable>
                </View>
            </Animated.View>

            {/* More Actions */}
            {showMore && (
                <Animated.View
                    entering={FadeInDown.duration(200).springify().damping(18)}
                    exiting={FadeOut.duration(150)}
                    style={[s.moreBar, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderCurve: 'continuous' } as any]}
                >
                    <Pressable style={({ pressed }) => [s.moreAction, pressed && { opacity: 0.6 }]} onPress={handleShare}>
                        <Share2 size={18} color={c.primary} strokeWidth={2} />
                        <Text style={[s.moreText, { color: c.textPrimary }]}>{t('notes.share')}</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [s.moreAction, pressed && { opacity: 0.6 }]} onPress={handleCopy}>
                        <Copy size={18} color="#3B82F6" strokeWidth={2} />
                        <Text style={[s.moreText, { color: c.textPrimary }]}>{t('notes.copyContent')}</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [s.moreAction, pressed && { opacity: 0.6 }]} onPress={handleDuplicate}>
                        <ClipboardCopy size={18} color="#8B5CF6" strokeWidth={2} />
                        <Text style={[s.moreText, { color: c.textPrimary }]}>{t('notes.duplicate')}</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [s.moreAction, pressed && { opacity: 0.6 }]} onPress={handleDel}>
                        <Trash2 size={18} color={c.error} strokeWidth={2} />
                        <Text style={[s.moreText, { color: c.error }]}>{t('common.delete')}</Text>
                    </Pressable>
                </Animated.View>
            )}

            {/* Color Strip */}
            {colorAccent && <View style={[s.colorStrip, { backgroundColor: colorAccent }]} />}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Meta */}
                <Animated.View entering={FadeIn.delay(100).duration(300)} style={s.meta}>
                    <Text style={[s.metaD, { color: c.textTertiary }]}>{formatNoteDate(note.createdAt)}</Text>
                    {folder && <View style={[s.fBdg, { backgroundColor: folder.color + '18', borderCurve: 'continuous' } as any]}><LucideIcon name={folder.icon} size={12} color={folder.color} /><Text style={[s.fBdgT, { color: folder.color }]}>{folder.name}</Text></View>}
                    <View style={[s.tBdg, { backgroundColor: note.noteType === 'voice' ? c.accentSurface : c.primarySurface, borderCurve: 'continuous' } as any]}>
                        {note.noteType === 'voice' ? <Mic size={12} color={c.accent} strokeWidth={2.5} /> : <FileText size={12} color={c.primary} strokeWidth={2.5} />}
                    </View>
                </Animated.View>

                {/* Color Labels */}
                <View style={s.colorLabelRow}>
                    {colorLabels.map((key) => (
                        <Pressable
                            key={key}
                            style={[s.colorDot, { backgroundColor: key === 'none' ? c.surfaceElevated : NOTE_COLORS[key], borderColor: note.color === key ? c.textPrimary : 'transparent' }]}
                            onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); useNotesStore.getState().setNoteColor(note.id, key); }}
                        >
                            {key === 'none' && <X size={10} color={c.textTertiary} strokeWidth={2.5} />}
                            {note.color === key && key !== 'none' && <Check size={10} color="#FFF" strokeWidth={3} />}
                        </Pressable>
                    ))}
                </View>

                {/* Note Stats */}
                <View style={[s.noteStatsRow, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderCurve: 'continuous' } as any]}>
                    <View style={s.noteStatItem}>
                        <Text style={[s.noteStatVal, { color: c.textPrimary, fontVariant: ['tabular-nums'] }]}>{noteStats.words}</Text>
                        <Text style={[s.noteStatLbl, { color: c.textTertiary }]}>words</Text>
                    </View>
                    <View style={[s.noteStatSep, { backgroundColor: c.border }]} />
                    <View style={s.noteStatItem}>
                        <Text style={[s.noteStatVal, { color: c.textPrimary, fontVariant: ['tabular-nums'] }]}>{noteStats.chars}</Text>
                        <Text style={[s.noteStatLbl, { color: c.textTertiary }]}>chars</Text>
                    </View>
                    <View style={[s.noteStatSep, { backgroundColor: c.border }]} />
                    <View style={s.noteStatItem}>
                        <Text style={[s.noteStatVal, { color: c.textPrimary, fontVariant: ['tabular-nums'] }]}>{noteStats.readingTime}</Text>
                        <Text style={[s.noteStatLbl, { color: c.textTertiary }]}>min read</Text>
                    </View>
                </View>

                {/* Title */}
                {editing ? <TextInput style={[s.tIn, { color: c.textPrimary }, isK && s.rtl]} value={eTitle} onChangeText={setETitle} placeholder={t('notes.untitled')} placeholderTextColor={c.textTertiary} multiline />
                    : <Text style={[s.ttl, { color: c.textPrimary }, isK && s.rtl]} selectable>{note.title || t('notes.untitled')}</Text>}

                {/* Audio Player */}
                {note.audioUri && <View style={[s.aud, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderCurve: 'continuous' } as any]}>
                    <Pressable
                        style={({ pressed }) => [s.playB, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
                        onPress={player.isPlaying ? player.pause : player.play}
                    >
                        {player.isPlaying ? <Pause size={22} color="#FFF" strokeWidth={2} fill="#FFF" /> : <Play size={22} color="#FFF" strokeWidth={2} fill="#FFF" />}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <View style={[s.pBar, { backgroundColor: c.skeleton }]}><View style={[s.pFill, { backgroundColor: c.primary, width: player.duration ? `${(player.position / player.duration) * 100}%` : '0%' }]} /></View>
                        <View style={s.aTm}>
                            <Text style={[s.aTmT, { color: c.textTertiary, fontVariant: ['tabular-nums'] }]}>{formatDuration(Math.floor(player.position / 1000))}</Text>
                            <Text style={[s.aTmT, { color: c.textTertiary, fontVariant: ['tabular-nums'] }]}>{formatDuration(Math.floor(player.duration / 1000))}</Text>
                        </View>
                    </View>
                    <Pressable
                        style={({ pressed }) => [s.spB, { backgroundColor: c.primarySurface, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => player.setSpeed(player.playbackSpeed >= 2 ? 0.5 : player.playbackSpeed + 0.5)}
                    >
                        <Text style={[s.spT, { color: c.primary, fontVariant: ['tabular-nums'] }]}>{player.playbackSpeed}x</Text>
                    </Pressable>
                </View>}

                {/* Summary */}
                {note.summary && <Animated.View entering={FadeIn.duration(300)} style={[s.sumC, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder, borderCurve: 'continuous' } as any]}>
                    <Pressable style={s.sumH} onPress={() => setShowSum(!showSum)}>
                        <Sparkles size={16} color={c.primary} strokeWidth={2} />
                        <Text style={[s.sumT, { color: c.primary }]}>{t('ai.summary')}</Text>
                        {showSum ? <ChevronUp size={16} color={c.primary} strokeWidth={2} /> : <ChevronDown size={16} color={c.primary} strokeWidth={2} />}
                    </Pressable>
                    {showSum && <Text style={[s.sumTx, { color: c.textPrimary }, isK && s.rtl]} selectable>{note.summary}</Text>}
                    <Pressable style={({ pressed }) => [s.regB, pressed && { opacity: 0.6 }]} onPress={regenSummary} disabled={!!aiLoad}>
                        {aiLoad === 'summary' ? <ActivityIndicator size="small" color={c.primary} /> : <>
                            <RefreshCw size={14} color={c.primary} strokeWidth={2.5} />
                            <Text style={[s.regT, { color: c.primary }]}>{t('ai.regenerate')}</Text>
                        </>}
                    </Pressable>
                </Animated.View>}

                {/* Tags */}
                {note.aiTags.length > 0 && <View style={s.tagS}>
                    <View style={s.tagH}>
                        <Tag size={14} color={c.textSecondary} strokeWidth={2} />
                        <Text style={[s.tagHT, { color: c.textSecondary }]}>{t('ai.tags')}</Text>
                    </View>
                    <View style={s.tagW}>{note.aiTags.map((tag, i) => <View key={i} style={[s.tagC, { backgroundColor: c.primarySurface, borderCurve: 'continuous' } as any]}><Text style={[s.tagCT, { color: c.primary }]}>{tag}</Text></View>)}</View>
                </View>}

                {/* Content */}
                {editing ? <TextInput style={[s.cIn, { color: c.textPrimary }, isK && s.rtl]} value={eContent} onChangeText={setEContent} multiline textAlignVertical="top" />
                    : <Text style={[s.cnt, { color: c.textPrimary }, isK && s.rtl]} selectable>{note.content || note.transcription || 'No content'}</Text>}

                {/* AI Assistant Toggle */}
                <Pressable
                    style={({ pressed }) => [s.aiToggleBtn, { backgroundColor: c.primarySurface, borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 } as any]}
                    onPress={() => setShowAITools(!showAITools)}
                >
                    <Sparkles size={18} color={c.primary} strokeWidth={2.5} />
                    <Text style={[s.aiToggleText, { color: c.primary }]}>✨ AI Magic Tools</Text>
                    {showAITools ? <ChevronUp size={18} color={c.primary} strokeWidth={2} /> : <ChevronDown size={18} color={c.primary} strokeWidth={2} />}
                </Pressable>

                {/* AI Actions */}
                {showAITools && (
                    <Animated.View entering={FadeInDown.duration(200).springify().damping(18)} exiting={FadeOut.duration(150)} style={s.aiA}>
                        {!note.summary && <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={regenSummary} disabled={!!aiLoad}>
                            {aiLoad === 'summary' ? <ActivityIndicator size="small" color={c.primary} /> : <>
                                <Sparkles size={16} color={c.primary} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.primary }]}>Summarize</Text>
                            </>}
                        </Pressable>}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={regenTags} disabled={!!aiLoad}>
                            {aiLoad === 'tags' ? <ActivityIndicator size="small" color={c.accent} /> : <>
                                <Tag size={16} color={c.accent} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.accent }]}>{t('ai.tags')}</Text>
                            </>}
                        </Pressable>
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={doTranslate} disabled={!!aiLoad}>
                            {aiLoad === 'translate' ? <ActivityIndicator size="small" color={c.warning} /> : <>
                                <Languages size={16} color={c.warning} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.warning }]}>{note.language === 'en' ? t('ai.translateToKurdish') : t('ai.translateToEnglish')}</Text>
                            </>}
                        </Pressable>
                        {/* NEW: Continue Writing */}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={handleContinueWriting} disabled={!!aiLoad}>
                            {aiLoad === 'continue' ? <ActivityIndicator size="small" color={c.primary} /> : <>
                                <Sparkles size={16} color={c.primary} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.primary }]}>Continue ✨</Text>
                            </>}
                        </Pressable>
                        {/* NEW: Improve Text */}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.successSurface, borderColor: c.success + '30', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={handleImproveWriting} disabled={!!aiLoad}>
                            {aiLoad === 'improve' ? <ActivityIndicator size="small" color={c.success} /> : <>
                                <Sparkles size={16} color={c.success} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.success }]}>Improve ✏️</Text>
                            </>}
                        </Pressable>
                        {/* NEW: Enhance Transcript (voice notes only) */}
                        {note.noteType === 'voice' && note.transcription && (
                            <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.accentSurface, borderColor: c.accent + '30', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={handleEnhanceTranscript} disabled={!!aiLoad}>
                                {aiLoad === 'enhance' ? <ActivityIndicator size="small" color={c.accent} /> : <>
                                    <Mic size={16} color={c.accent} strokeWidth={2} />
                                    <Text style={[s.aiBT, { color: c.accent }]}>Enhance 🎧</Text>
                                </>}
                            </Pressable>
                        )}
                        {/* NEW: Find Related */}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: c.warningSurface, borderColor: c.warning + '30', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={handleFindRelated} disabled={!!aiLoad}>
                            {aiLoad === 'related' ? <ActivityIndicator size="small" color={c.warning} /> : <>
                                <Sparkles size={16} color={c.warning} strokeWidth={2} />
                                <Text style={[s.aiBT, { color: c.warning }]}>Related 🔗</Text>
                            </>}
                        </Pressable>
                        {/* NEW: Study Mode */}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF630', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={() => router.push(`/study/${note.id}`)}>
                            <FileText size={16} color="#8B5CF6" strokeWidth={2} />
                            <Text style={[s.aiBT, { color: '#8B5CF6' }]}>Study 📚</Text>
                        </Pressable>
                        {/* NEW: Mind Map */}
                        <Pressable style={({ pressed }) => [s.aiB, { backgroundColor: '#EC489920', borderColor: '#EC489930', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]} onPress={() => router.push(`/mindmap/${note.id}`)}>
                            <Tag size={16} color="#EC4899" strokeWidth={2} />
                            <Text style={[s.aiBT, { color: '#EC4899' }]}>Mind Map 🧠</Text>
                        </Pressable>
                    </Animated.View>
                )}

                {/* NEW: Related Notes Section */}
                {relatedNotes.length > 0 && (
                    <View style={[s.relatedSection, { borderColor: c.border, borderCurve: 'continuous' } as any]}>
                        <Text style={[s.relatedTitle, { color: c.textPrimary }]}>🔗 Related Notes</Text>
                        {relatedNotes.map((rel) => {
                            const relNote = useNotesStore.getState().notes.find(n => n.id === rel.id);
                            if (!relNote) return null;
                            return (
                                <Pressable
                                    key={rel.id}
                                    style={({ pressed }) => [s.relatedCard, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.8 : 1, borderCurve: 'continuous' } as any]}
                                    onPress={() => router.push(`/note/${rel.id}`)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.relatedName, { color: c.textPrimary }]} numberOfLines={1}>
                                            {relNote.title || relNote.aiTitle || 'Untitled'}
                                        </Text>
                                        <Text style={[s.relatedReason, { color: c.textSecondary }]} numberOfLines={1}>
                                            {rel.reason}
                                        </Text>
                                    </View>
                                    <View style={[s.relatedBadge, { backgroundColor: c.primarySurface }]}>
                                        <Text style={[s.relatedScore, { color: c.primary }]}>{Math.round(rel.relevance * 100)}%</Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* Word Count */}
                <Text style={[s.wc, { color: c.textTertiary, fontVariant: ['tabular-nums'] }]}>{t('notes.wordCount', { count: note.wordCount })}</Text>
            </ScrollView>
        </View>
    );
}
const s = StyleSheet.create({
    ctn: { flex: 1 }, load: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    hBtn: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    hR: { flexDirection: 'row', gap: spacing.xs },
    saveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, gap: 4 },
    saveBadgeText: { fontSize: 11, fontWeight: '600' },
    moreBar: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.lg, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, marginBottom: spacing.sm },
    moreAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 6, borderRadius: radius.sm },
    moreText: { fontSize: fontSize.xs, fontWeight: '600' },
    colorStrip: { height: 3 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
    metaD: { fontSize: fontSize.xs }, fBdg: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs, gap: 4 }, fBdgT: { fontSize: 11, fontWeight: '600' },
    tBdg: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs, gap: 4 },
    colorLabelRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
    colorDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    ttl: { fontSize: fontSize['2xl'], fontWeight: '700', lineHeight: 32, marginBottom: spacing.md },
    tIn: { fontSize: fontSize['2xl'], fontWeight: '700', lineHeight: 32, marginBottom: spacing.md },
    rtl: { textAlign: 'right', writingDirection: 'rtl' },
    aud: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.base, gap: spacing.md },
    playB: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    pBar: { height: 4, borderRadius: 2, marginBottom: 4 }, pFill: { height: '100%', borderRadius: 2 },
    aTm: { flexDirection: 'row', justifyContent: 'space-between' }, aTmT: { fontSize: 10 },
    spB: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xs }, spT: { fontSize: 12, fontWeight: '700' },
    sumC: { padding: spacing.base, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.base },
    sumH: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }, sumT: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
    sumTx: { fontSize: fontSize.sm, lineHeight: 20 },
    regB: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, alignSelf: 'flex-start' }, regT: { fontSize: fontSize.xs, fontWeight: '600' },
    tagS: { marginBottom: spacing.base }, tagH: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }, tagHT: { fontSize: fontSize.xs, fontWeight: '600' },
    tagW: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, tagC: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full }, tagCT: { fontSize: fontSize.xs, fontWeight: '600' },
    cnt: { fontSize: fontSize.base, lineHeight: 24, marginBottom: spacing.xl },
    cIn: { fontSize: fontSize.base, lineHeight: 24, marginBottom: spacing.xl, minHeight: 200 },
    aiToggleBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg, gap: spacing.sm },
    aiToggleText: { fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
    aiA: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
    aiB: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, gap: 6 },
    aiBT: { fontSize: fontSize.xs, fontWeight: '600' },
    wc: { fontSize: fontSize.xs, textAlign: 'center' },
    noteStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, marginBottom: spacing.md },
    noteStatItem: { alignItems: 'center', flex: 1 },
    noteStatVal: { fontSize: fontSize.md, fontWeight: '800' },
    noteStatLbl: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    noteStatSep: { width: 1, height: 24 },
    relatedSection: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
    relatedTitle: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: 4 },
    relatedCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, gap: spacing.sm },
    relatedName: { fontSize: fontSize.sm, fontWeight: '600' },
    relatedReason: { fontSize: fontSize.xs, marginTop: 2 },
    relatedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
    relatedScore: { fontSize: 11, fontWeight: '800' },
});
