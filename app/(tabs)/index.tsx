import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    Pressable,
    RefreshControl,
    useWindowDimensions,
    Modal,
    Share,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    FileText,
    Mic,
    Pin,
    Star,
    Copy,
    Share2,
    Trash2,
    ArrowDownUp,
    LayoutGrid,
    LayoutList,
    Plus,
    Clock,
    ArrowDown,
    ArrowUp,
    Type,
    CalendarClock,
    Activity,
    ChevronRight,
    X,
    Check,
    Sparkles,
    Brain,
    ScanText,
    MicIcon,
    Smile,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    FadeOutDown,
    LinearTransition,
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotesStore } from '../../src/stores/useNotesStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useFoldersStore } from '../../src/stores/useFoldersStore';
import { QuickActions } from '../../src/components/DashboardWidgets';
import { LucideIcon, FolderIconBadge } from '../../src/components/LucideIconMap';
import { fontSize, spacing, radius, shadows } from '../../src/constants/theme';
import { formatNoteDate, truncateText, isRTLText } from '../../src/utils/helpers';
import { NOTE_COLORS } from '../../src/types/note';
import type { Note, NoteColor } from '../../src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SortMode = 'newest' | 'oldest' | 'title' | 'modified';

// ========== GREETING ==========
function getGreeting(): { text: string; emoji: string; iconName: string } {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { text: 'Good Morning', emoji: '☀️', iconName: 'sun' };
    if (h >= 12 && h < 17) return { text: 'Good Afternoon', emoji: '🌤', iconName: 'sun' };
    if (h >= 17 && h < 21) return { text: 'Good Evening', emoji: '🌅', iconName: 'sunset' };
    return { text: 'Good Night', emoji: '🌙', iconName: 'moon' };
}

// ========== NOTE CARD ==========
function NoteCard({ note, onPress, onLongPress, colors, viewMode, index }: {
    note: Note; onPress: () => void; onLongPress: () => void; colors: any; viewMode: 'list' | 'grid'; index: number;
}) {
    const isKurdish = note.language === 'ku' || isRTLText(note.title || note.content);
    const preview = truncateText(note.content || note.transcription || '', viewMode === 'grid' ? 80 : 120);
    const displayTitle = note.title || note.aiTitle || 'Untitled Note';
    const colorAccent = note.color !== 'none' ? NOTE_COLORS[note.color] : null;

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onLongPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onLongPress();
            }}
            onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
            style={[animatedStyle]}
        >
            <Animated.View
                entering={FadeInDown.delay(index * 40).duration(350).springify().damping(18)}
                layout={LinearTransition.springify().damping(18)}
                style={[
                    styles.noteCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colorAccent || colors.border,
                        borderCurve: 'continuous',
                    } as any,
                    viewMode === 'grid' && styles.noteCardGrid,
                    colorAccent && { borderLeftWidth: 4, borderLeftColor: colorAccent },
                ]}
            >
                <View style={styles.noteCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[
                            styles.typeBadge,
                            {
                                backgroundColor: note.noteType === 'voice' ? colors.accentSurface : colors.primarySurface,
                                borderCurve: 'continuous',
                            } as any,
                        ]}>
                            {note.noteType === 'voice' ? (
                                <Mic size={11} color={colors.accent} strokeWidth={2.5} />
                            ) : (
                                <FileText size={11} color={colors.primary} strokeWidth={2.5} />
                            )}
                            <Text style={[styles.typeBadgeText, { color: note.noteType === 'voice' ? colors.accent : colors.primary }]}>
                                {note.noteType === 'voice' ? 'Voice' : 'Text'}
                            </Text>
                        </View>
                        {note.isPinned && <Pin size={12} color={colors.warning} strokeWidth={2.5} fill={colors.warning} />}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {note.isFavorite && <Star size={14} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />}
                    </View>
                </View>
                <Text style={[styles.noteTitle, { color: colors.textPrimary }, isKurdish && styles.rtlText]} numberOfLines={2}>{displayTitle}</Text>
                {preview ? <Text style={[styles.notePreview, { color: colors.textSecondary }, isKurdish && styles.rtlText]} numberOfLines={viewMode === 'grid' ? 3 : 2}>{preview}</Text> : null}
                {note.aiTags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {note.aiTags.slice(0, 3).map((tag, i) => (
                            <View key={i} style={[styles.tag, { backgroundColor: colors.primarySurface, borderCurve: 'continuous' } as any]}>
                                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
                <View style={styles.noteFooter}>
                    <Text style={[styles.noteDate, { color: colors.textTertiary }]}>{formatNoteDate(note.updatedAt)}</Text>
                    {note.audioDuration && (
                        <View style={styles.durationBadge}>
                            <Clock size={11} color={colors.textTertiary} strokeWidth={2} />
                            <Text style={[styles.durationText, { color: colors.textTertiary, fontVariant: ['tabular-nums'] }]}>
                                {Math.floor(note.audioDuration / 60)}:{(note.audioDuration % 60).toString().padStart(2, '0')}
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </AnimatedPressable>
    );
}

// ========== EMPTY STATE ==========
function EmptyState({ colors, t, onCreateNote, router }: { colors: any; t: any; onCreateNote: () => void; router: any }) {
    const streak = useSettingsStore((s) => s.streak);
    const folders = useFoldersStore((s) => s.folders);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.emptyScrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick Actions */}
            <QuickActions
                colors={colors}
                onVoice={() => router.push({ pathname: '/note/new', params: { type: 'voice' } })}
                onText={() => router.push({ pathname: '/note/new', params: { type: 'text' } })}
                onSearch={() => router.push('/(tabs)/search' as any)}
            />

            {/* Prominent Dashboard Banner */}
            <DashboardBanner colors={colors} router={router} />

            {/* Empty CTA */}
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primarySurface, borderCurve: 'continuous' } as any]}>
                    <FileText size={48} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('notes.noNotes')}</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('notes.noNotesSubtitle')}</Text>
                <Pressable style={({ pressed }) => [styles.emptyButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]} onPress={onCreateNote}>
                    <Plus size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.emptyButtonText}>{t('notes.newNote')}</Text>
                </Pressable>
            </Animated.View>
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

// ========== NOTE ACTIONS MODAL ==========
function NoteActionsModal({ visible, note, onClose, colors, t, router }: {
    visible: boolean; note: Note | null; onClose: () => void; colors: any; t: any; router: any;
}) {
    if (!note) return null;

    const actionHandler = async (action: string) => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const store = useNotesStore.getState();
        switch (action) {
            case 'pin': await store.togglePin(note.id); break;
            case 'favorite': await store.toggleFavorite(note.id); break;
            case 'duplicate': await store.duplicateNote(note.id); break;
            case 'delete': await store.deleteNote(note.id); break;
            case 'share':
                const text = `${note.title}\n\n${note.content || note.transcription || ''}`;
                try { await Share.share({ message: text, title: note.title }); } catch { }
                break;
        }
        onClose();
    };

    const colorLabels: { key: NoteColor; label: string }[] = [
        { key: 'none', label: t('notes.noColor') },
        { key: 'red', label: '' }, { key: 'orange', label: '' }, { key: 'yellow', label: '' },
        { key: 'green', label: '' }, { key: 'blue', label: '' }, { key: 'purple', label: '' },
    ];

    const actions = [
        { Icon: Pin, label: note.isPinned ? t('notes.unpin') : t('notes.pin'), action: 'pin', color: colors.warning },
        { Icon: Star, label: note.isFavorite ? t('notes.unfavorite') : t('notes.favorite'), action: 'favorite', color: '#F59E0B' },
        { Icon: Copy, label: t('notes.duplicate'), action: 'duplicate', color: colors.primary },
        { Icon: Share2, label: t('notes.share'), action: 'share', color: '#3B82F6' },
        { Icon: Trash2, label: t('common.delete'), action: 'delete', color: colors.error },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Animated.View
                    entering={SlideInDown.springify().damping(18).stiffness(150)}
                    exiting={SlideOutDown.duration(200)}
                    style={[styles.modalContent, { backgroundColor: colors.surface, borderCurve: 'continuous' } as any]}
                >
                    <View style={[styles.modalHandle, { backgroundColor: colors.textTertiary + '40' }]} />
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {note.title || 'Untitled'}
                    </Text>
                    {/* Color labels */}
                    <View style={styles.colorRow}>
                        <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>{t('notes.colorLabel')}</Text>
                        <View style={styles.colorOptions}>
                            {colorLabels.map(({ key }) => (
                                <Pressable
                                    key={key}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: key === 'none' ? colors.surfaceElevated : NOTE_COLORS[key], borderColor: note.color === key ? colors.textPrimary : 'transparent' },
                                    ]}
                                    onPress={async () => { await useNotesStore.getState().setNoteColor(note.id, key); onClose(); }}
                                >
                                    {key === 'none' && <X size={12} color={colors.textTertiary} strokeWidth={2.5} />}
                                    {note.color === key && key !== 'none' && <Check size={12} color="#FFF" strokeWidth={3} />}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                    {actions.map(({ Icon, label, action, color }, idx) => (
                        <Animated.View key={action} entering={FadeInDown.delay(idx * 30).duration(200)}>
                            <Pressable
                                style={({ pressed }) => [styles.modalAction, pressed && { opacity: 0.6 }]}
                                onPress={() => actionHandler(action)}
                            >
                                <Icon size={20} color={color} strokeWidth={2} />
                                <Text style={[styles.modalActionText, { color: colors.textPrimary }]}>{label}</Text>
                            </Pressable>
                        </Animated.View>
                    ))}
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ========== LIST HEADER WITH DASHBOARD ==========
function ListHeader({ colors, stats, streak, router }: { colors: any; stats: any; streak: any; router: any }) {
    const folders = useFoldersStore((s) => s.folders);

    return (
        <View style={styles.dashboardContainer}>
            {/* Quick Actions */}
            <QuickActions
                colors={colors}
                onVoice={() => router.push({ pathname: '/note/new', params: { type: 'voice' } })}
                onText={() => router.push({ pathname: '/note/new', params: { type: 'text' } })}
                onSearch={() => router.push('/(tabs)/search' as any)}
            />

            {/* Prominent Dashboard Banner */}
            <DashboardBanner colors={colors} router={router} />
        </View>
    );
}

// ========== DASHBOARD BANNER ==========
function DashboardBanner({ colors, router }: { colors: any; router: any }) {
    return (
        <Animated.View entering={FadeInDown.delay(50).duration(350).springify().damping(18)} style={{ marginBottom: spacing.lg }}>
            <Pressable
                style={({ pressed }) => [styles.dashboardBanner, { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); router.push('/dashboard'); }}
            >
                <View style={[styles.dashboardBannerIcon, { backgroundColor: colors.primary }]}>
                    <Activity size={22} color="#FFF" />
                </View>
                <View style={styles.dashboardBannerTextWrap}>
                    <Text style={[styles.dashboardBannerTitle, { color: colors.primary }]}>Focus & Hub</Text>
                    <Text style={[styles.dashboardBannerSub, { color: colors.textSecondary }]}>AI Tools, Stats, & Focus Timer</Text>
                </View>
                <View style={[styles.dashboardBannerChevron, { backgroundColor: colors.surfaceElevated }]}>
                    <ChevronRight size={16} color={colors.primary} strokeWidth={2.5} />
                </View>
            </Pressable>
        </Animated.View>
    );
}

// ========== MAIN SCREEN ==========
export default function NotesScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const allNotes = useNotesStore((s) => s.notes);
    const viewMode = useSettingsStore((s) => s.noteViewMode);
    const streak = useSettingsStore((s) => s.streak);
    const [refreshing, setRefreshing] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('newest');
    const [showSort, setShowSort] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [showActions, setShowActions] = useState(false);
    const greeting = useMemo(() => getGreeting(), []);

    // Load streak on mount
    useEffect(() => {
        useSettingsStore.getState().loadStreak();
    }, []);

    // Split pinned and unpinned, then sort
    const { pinnedNotes, unpinnedNotes, stats } = useMemo(() => {
        const active = allNotes.filter((n) => !n.isDeleted && !n.isArchived);
        const pinned = active.filter((n) => n.isPinned);
        const unpinned = active.filter((n) => !n.isPinned);

        const sorter = (a: Note, b: Note) => {
            switch (sortMode) {
                case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title': return (a.title || '').localeCompare(b.title || '');
                case 'modified': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        };

        // Calculate word count across all notes
        const totalWords = active.reduce((sum, n) => {
            const text = (n.content || '') + ' ' + (n.transcription || '');
            return sum + text.trim().split(/\s+/).filter(w => w.length > 0).length;
        }, 0);

        return {
            pinnedNotes: pinned.sort(sorter),
            unpinnedNotes: unpinned.sort(sorter),
            stats: {
                total: active.length,
                voice: active.filter((n) => n.noteType === 'voice').length,
                text: active.filter((n) => n.noteType === 'text').length,
                words: totalWords,
                favs: active.filter((n) => n.isFavorite).length,
            },
        };
    }, [allNotes, sortMode]);

    const allSortedNotes = useMemo(() => [...pinnedNotes, ...unpinnedNotes], [pinnedNotes, unpinnedNotes]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await useNotesStore.getState().loadNotes();
        setRefreshing(false);
    }, []);

    const toggleViewMode = useCallback(() => {
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        useSettingsStore.getState().updateSetting('noteViewMode', viewMode === 'list' ? 'grid' : 'list');
    }, [viewMode]);

    const renderNote = useCallback(
        ({ item, index }: { item: Note; index: number }) => {
            const showPinnedHeader = item.isPinned && index === 0;
            const showOtherHeader = !item.isPinned && pinnedNotes.length > 0 && index === pinnedNotes.length;

            return (
                <>
                    {showPinnedHeader && (
                        <Animated.View entering={FadeIn} style={styles.sectionHeader}>
                            <Pin size={14} color={colors.warning} strokeWidth={2.5} fill={colors.warning} />
                            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{t('notes.pinned')}</Text>
                        </Animated.View>
                    )}
                    {showOtherHeader && (
                        <Animated.View entering={FadeIn} style={styles.sectionHeader}>
                            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
                                {t('notes.allNotes')}
                            </Text>
                        </Animated.View>
                    )}
                    <NoteCard
                        note={item}
                        index={index}
                        onPress={() => router.push(`/note/${item.id}`)}
                        onLongPress={() => { setSelectedNote(item); setShowActions(true); }}
                        colors={colors}
                        viewMode={viewMode}
                    />
                </>
            );
        },
        [colors, viewMode, router, pinnedNotes.length, t],
    );

    const sortOptions: { key: SortMode; label: string; Icon: any }[] = [
        { key: 'newest', label: t('notes.sortNewest'), Icon: ArrowDown },
        { key: 'oldest', label: t('notes.sortOldest'), Icon: ArrowUp },
        { key: 'title', label: t('notes.sortTitle'), Icon: Type },
        { key: 'modified', label: t('notes.sortModified'), Icon: CalendarClock },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header with Greeting */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting.text} 👋</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('notes.title')}</Text>
                        <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Sparkles size={12} color={colors.primary} />
                            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI Powered</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <Pressable
                        style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); setShowSort(!showSort); }}
                    >
                        <ArrowDownUp size={18} color={colors.textSecondary} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={toggleViewMode}
                    >
                        {viewMode === 'list' ? (
                            <LayoutGrid size={18} color={colors.textSecondary} strokeWidth={2} />
                        ) : (
                            <LayoutList size={18} color={colors.textSecondary} strokeWidth={2} />
                        )}
                    </Pressable>
                </View>
            </Animated.View>

            {/* Sort Bar */}
            {showSort && (
                <Animated.View
                    entering={FadeInDown.duration(200).springify().damping(18)}
                    exiting={FadeOut.duration(150)}
                    style={[styles.sortBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderCurve: 'continuous' } as any]}
                >
                    {sortOptions.map(({ key, label, Icon }) => (
                        <Pressable
                            key={key}
                            style={[styles.sortChip, sortMode === key && { backgroundColor: colors.primary }, { borderCurve: 'continuous' } as any]}
                            onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); setSortMode(key); setShowSort(false); }}
                        >
                            <Icon size={12} color={sortMode === key ? '#FFF' : colors.textSecondary} strokeWidth={2.5} />
                            <Text style={[styles.sortChipText, { color: sortMode === key ? '#FFF' : colors.textSecondary }]}>{label}</Text>
                        </Pressable>
                    ))}
                </Animated.View>
            )}

            {/* Notes List or Empty State with Dashboard */}
            {allSortedNotes.length === 0 ? (
                <EmptyState colors={colors} t={t} onCreateNote={() => router.push('/note/new')} router={router} />
            ) : (
                <FlatList
                    data={allSortedNotes}
                    renderItem={renderNote}
                    keyExtractor={(item) => item.id}
                    key={viewMode}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    contentContainerStyle={[styles.listContent, viewMode === 'grid' && styles.gridContent]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
                    ListHeaderComponent={<ListHeader colors={colors} stats={stats} streak={streak} router={router} />}
                />
            )}

            {/* FAB */}
            <View style={[styles.fabContainer, { bottom: 16 }]}>
                {/* AI Chat Button */}
                <Pressable
                    style={({ pressed }) => [styles.aiFab, { backgroundColor: colors.accentSurface, borderColor: colors.accent + '40', opacity: pressed ? 0.8 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => router.push('/ai-chat')}
                >
                    <Brain size={20} color={colors.accent} strokeWidth={2} />
                </Pressable>
            </View>

            {/* Note Actions Modal */}
            <NoteActionsModal visible={showActions} note={selectedNote} onClose={() => setShowActions(false)} colors={colors} t={t} router={router} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
    greeting: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: 2 },
    headerTitle: { fontSize: fontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 },
    aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.sm, gap: 4 },
    aiBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    headerActions: { flexDirection: 'row', gap: spacing.xs },
    headerButton: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    sortBar: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.xs, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs },
    sortChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: radius.sm, gap: 4 },
    sortChipText: { fontSize: 11, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: spacing.sm, paddingTop: spacing.xs },
    sectionHeaderText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    gridContent: { gap: spacing.md },
    dashboardContainer: { marginBottom: spacing.sm },
    dashboardBanner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, borderCurve: 'continuous' as any },
    dashboardBannerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    dashboardBannerTextWrap: { flex: 1 },
    dashboardBannerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    dashboardBannerSub: { fontSize: 13, fontWeight: '500' },
    dashboardBannerChevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    aiToolsContainer: { marginBottom: spacing.md },
    aiToolsRow: { gap: spacing.sm, paddingRight: spacing.lg },
    aiToolCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, gap: 8 },
    aiToolText: { fontSize: 13, fontWeight: '700' },
    emptyScrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    folderChipsRow: { gap: spacing.xs, marginBottom: spacing.md },
    folderChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, gap: 5 },
    folderChipText: { fontSize: 11, fontWeight: '700' },
    noteCard: { borderRadius: radius.base, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1 },
    noteCardGrid: { flex: 1, marginBottom: 0 },
    noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.sm, gap: 3 },
    typeBadgeText: { fontSize: 10, fontWeight: '600' },
    noteTitle: { fontSize: fontSize.md, fontWeight: '600', lineHeight: 22, marginBottom: 2 },
    notePreview: { fontSize: fontSize.sm, lineHeight: 19, marginBottom: spacing.xs },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.xs },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
    tagText: { fontSize: 10, fontWeight: '600' },
    noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    noteDate: { fontSize: fontSize.xs },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    durationText: { fontSize: fontSize.xs },
    emptyState: { alignItems: 'center', paddingTop: spacing.lg, paddingHorizontal: spacing.xl },
    emptyIcon: { width: 80, height: 80, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
    emptySubtitle: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
    emptyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.base, gap: spacing.sm },
    emptyButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
    fabContainer: { position: 'absolute', right: spacing.lg, alignItems: 'flex-end' },
    fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    fabOptions: { marginBottom: spacing.md, gap: spacing.sm },
    fabOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: radius.base, gap: spacing.sm, minWidth: 140 },
    fabOptionText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: '600' },
    aiFab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginTop: spacing.sm },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
    modalTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
    colorRow: { marginBottom: spacing.md },
    colorLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.sm },
    colorOptions: { flexDirection: 'row', gap: spacing.sm },
    colorDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    modalDivider: { height: 1, marginBottom: spacing.sm },
    modalAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
    modalActionText: { fontSize: fontSize.base, fontWeight: '500' },
});
