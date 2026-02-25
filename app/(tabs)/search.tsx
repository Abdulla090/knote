import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Pressable,
    ScrollView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Search,
    FileText,
    Mic,
    Pin,
    Star,
    Tag,
    Clock,
    X,
    Filter,
    Grid2x2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
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
import { useNotesStore } from '../../src/stores/useNotesStore';
import { fontSize, spacing, radius } from '../../src/constants/theme';
import { formatNoteDate, truncateText, isRTLText } from '../../src/utils/helpers';
import { NOTE_COLORS } from '../../src/types/note';
import type { Note } from '../../src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterType = 'all' | 'text' | 'voice' | 'favorites' | 'pinned';
const RECENT_SEARCHES_KEY = '@knote_recent_searches';

const FILTERS: { key: FilterType; Icon: any; label: string }[] = [
    { key: 'all', Icon: Grid2x2, label: 'All' },
    { key: 'text', Icon: FileText, label: 'Text' },
    { key: 'voice', Icon: Mic, label: 'Voice' },
    { key: 'favorites', Icon: Star, label: 'Favorites' },
    { key: 'pinned', Icon: Pin, label: 'Pinned' },
];

export default function SearchScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const allNotes = useNotesStore((s) => s.notes);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((data) => {
            if (data) setRecentSearches(JSON.parse(data));
        });
    }, []);

    const saveSearch = useCallback(async (term: string) => {
        if (!term.trim()) return;
        const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 8);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    const clearRecent = useCallback(async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    }, []);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        allNotes.filter((n) => !n.isDeleted).forEach((n) => n.aiTags.forEach((tag) => tags.add(tag)));
        return Array.from(tags).slice(0, 20);
    }, [allNotes]);

    const results = useMemo(() => {
        let filtered: Note[];
        if (query.trim()) {
            const q = query.toLowerCase();
            filtered = allNotes
                .filter((n) => !n.isDeleted)
                .filter(
                    (n) =>
                        n.title.toLowerCase().includes(q) ||
                        n.content.toLowerCase().includes(q) ||
                        (n.transcription && n.transcription.toLowerCase().includes(q)) ||
                        (n.summary && n.summary.toLowerCase().includes(q)) ||
                        n.aiTags.some((tag) => tag.toLowerCase().includes(q))
                );
        } else {
            filtered = allNotes.filter((n) => !n.isDeleted && !n.isArchived);
        }

        switch (filter) {
            case 'text': return filtered.filter((n) => n.noteType === 'text');
            case 'voice': return filtered.filter((n) => n.noteType === 'voice');
            case 'favorites': return filtered.filter((n) => n.isFavorite);
            case 'pinned': return filtered.filter((n) => n.isPinned);
            default: return filtered;
        }
    }, [query, filter, allNotes]);

    const renderResult = useCallback(
        ({ item, index }: { item: Note; index: number }) => {
            const isKurdish = isRTLText(item.title || item.content);
            const displayTitle = item.title || item.aiTitle || 'Untitled';
            const preview = truncateText(item.content || item.transcription || '', 100);
            const colorAccent = item.color !== 'none' ? NOTE_COLORS[item.color] : null;

            return (
                <Animated.View
                    entering={FadeInDown.delay(index * 30).duration(300).springify().damping(18)}
                    layout={LinearTransition.springify().damping(18)}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.resultCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colorAccent || colors.border,
                                borderCurve: 'continuous',
                                opacity: pressed ? 0.7 : 1,
                            } as any,
                            colorAccent && { borderLeftWidth: 3, borderLeftColor: colorAccent },
                        ]}
                        onPress={() => { saveSearch(query); router.push(`/note/${item.id}`); }}
                    >
                        <View style={[styles.resultIcon, {
                            backgroundColor: item.noteType === 'voice' ? colors.accentSurface : colors.primarySurface,
                            borderCurve: 'continuous',
                        } as any]}>
                            {item.noteType === 'voice' ? (
                                <Mic size={18} color={colors.accent} strokeWidth={2} />
                            ) : (
                                <FileText size={18} color={colors.primary} strokeWidth={2} />
                            )}
                        </View>
                        <View style={styles.resultContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                {item.isPinned && <Pin size={12} color={colors.warning} strokeWidth={2.5} fill={colors.warning} />}
                                <Text style={[styles.resultTitle, { color: colors.textPrimary }, isKurdish && styles.rtlText]} numberOfLines={1}>{displayTitle}</Text>
                            </View>
                            {preview ? <Text style={[styles.resultPreview, { color: colors.textSecondary }, isKurdish && styles.rtlText]} numberOfLines={1}>{preview}</Text> : null}
                            <View style={styles.resultMeta}>
                                <Text style={[styles.resultDate, { color: colors.textTertiary }]}>{formatNoteDate(item.updatedAt)}</Text>
                                {item.aiTags.length > 0 && (
                                    <View style={{ flexDirection: 'row', gap: 4 }}>
                                        {item.aiTags.slice(0, 2).map((tag, i) => (
                                            <View key={i} style={[styles.resultTag, { backgroundColor: colors.primarySurface, borderCurve: 'continuous' } as any]}>
                                                <Text style={[styles.resultTagText, { color: colors.primary }]}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                        {item.isFavorite && <Star size={14} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />}
                    </Pressable>
                </Animated.View>
            );
        },
        [colors, router, query, saveSearch],
    );

    const showRecent = !query.trim() && recentSearches.length > 0;
    const showTags = !query.trim() && allTags.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(350)}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('search.title')}</Text>
            </Animated.View>

            {/* Search Input */}
            <Animated.View
                entering={FadeInDown.delay(50).duration(350)}
                style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderCurve: 'continuous' } as any]}
            >
                <Search size={20} color={colors.textTertiary} strokeWidth={2} />
                <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder={t('search.placeholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => saveSearch(query)}
                />
                {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')} hitSlop={8}>
                        <Animated.View entering={FadeIn.duration(150)}>
                            <X size={20} color={colors.textTertiary} strokeWidth={2} />
                        </Animated.View>
                    </Pressable>
                )}
            </Animated.View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                {FILTERS.map(({ key, Icon, label }) => (
                    <Pressable
                        key={key}
                        style={[
                            styles.filterChip,
                            filter === key && { backgroundColor: colors.primary },
                            { borderCurve: 'continuous' } as any,
                        ]}
                        onPress={() => {
                            if (Platform.OS === 'ios') Haptics.selectionAsync();
                            setFilter(key);
                        }}
                    >
                        <Icon size={14} color={filter === key ? '#FFF' : colors.textSecondary} strokeWidth={2} />
                        <Text style={[styles.filterText, { color: filter === key ? '#FFF' : colors.textSecondary }]}>{label}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Recent Searches */}
            {showRecent && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.recentSection}>
                    <View style={styles.recentHeader}>
                        <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>{t('search.recentSearches')}</Text>
                        <Pressable onPress={clearRecent}>
                            <Text style={[styles.clearText, { color: colors.primary }]}>{t('search.clearRecent')}</Text>
                        </Pressable>
                    </View>
                    <View style={styles.recentChips}>
                        {recentSearches.map((search, i) => (
                            <Pressable
                                key={i}
                                style={({ pressed }) => [styles.recentChip, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                                onPress={() => setQuery(search)}
                            >
                                <Clock size={14} color={colors.textTertiary} strokeWidth={2} />
                                <Text style={[styles.recentChipText, { color: colors.textPrimary }]}>{search}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>
            )}

            {/* Tags */}
            {showTags && (
                <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.recentSection}>
                    <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>Browse by Tags</Text>
                    <View style={styles.recentChips}>
                        {allTags.map((tag, i) => (
                            <Pressable
                                key={i}
                                style={({ pressed }) => [styles.tagChip, { backgroundColor: colors.primarySurface, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                                onPress={() => setQuery(tag)}
                            >
                                <Tag size={12} color={colors.primary} strokeWidth={2.5} />
                                <Text style={[styles.tagChipText, { color: colors.primary }]}>{tag}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>
            )}

            {/* Results Count */}
            {query.trim().length > 0 && (
                <Animated.View entering={FadeIn.duration(200)}>
                    <Text style={[styles.resultCount, { color: colors.textSecondary, fontVariant: ['tabular-nums'] }]}>
                        {results.length} result{results.length !== 1 ? 's' : ''}
                    </Text>
                </Animated.View>
            )}

            {/* Results */}
            <FlatList
                data={results}
                renderItem={renderResult}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    query.trim() ? (
                        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                            <Search size={48} color={colors.textTertiary} strokeWidth={1.5} />
                            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('search.noResults')}</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('search.noResultsSubtitle')}</Text>
                        </Animated.View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerTitle: { fontSize: fontSize['3xl'], fontWeight: '700', letterSpacing: -0.5, paddingHorizontal: spacing.lg, paddingTop: spacing.base, paddingBottom: spacing.sm },
    searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.base, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.sm },
    searchInput: { flex: 1, fontSize: fontSize.base, paddingVertical: 0 },
    filterScroll: { maxHeight: 44, marginBottom: spacing.sm },
    filterContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, gap: 6 },
    filterText: { fontSize: fontSize.xs, fontWeight: '600' },
    recentSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    recentTitle: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    clearText: { fontSize: fontSize.xs, fontWeight: '600' },
    recentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    recentChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, gap: 6 },
    recentChipText: { fontSize: fontSize.xs, fontWeight: '500' },
    tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, gap: 4 },
    tagChipText: { fontSize: fontSize.xs, fontWeight: '600' },
    resultCount: { fontSize: fontSize.xs, fontWeight: '600', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    resultCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md },
    resultIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    resultContent: { flex: 1 },
    resultTitle: { fontSize: fontSize.base, fontWeight: '600', marginBottom: 2 },
    resultPreview: { fontSize: fontSize.sm, marginBottom: 4 },
    resultMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    resultDate: { fontSize: fontSize.xs },
    resultTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.xs },
    resultTagText: { fontSize: 9, fontWeight: '600' },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
    emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: '700' },
    emptySubtitle: { fontSize: fontSize.base },
});
