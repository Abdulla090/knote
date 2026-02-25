import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Mic,
    FileText,
    Pin,
    Star,
    Undo2,
    RefreshCw,
    Trash2,
    FolderOpen,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useFoldersStore, useFolderById } from '../../src/stores/useFoldersStore';
import { useNotesStore } from '../../src/stores/useNotesStore';
import { LucideIcon } from '../../src/components/LucideIconMap';
import { fontSize, spacing, radius } from '../../src/constants/theme';
import { formatNoteDate, truncateText, isRTLText } from '../../src/utils/helpers';
import { NOTE_COLORS } from '../../src/types/note';
import type { Note } from '../../src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FolderDetailScreen() {
    const { theme } = useTheme();
    const c = theme.colors;
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const folder = useFolderById(id || '');
    const allNotes = useNotesStore((s) => s.notes);

    const isTrash = folder?.name === 'Trash';

    const notes = useMemo(() => {
        if (!folder) return [];
        if (folder.name === 'All Notes') return allNotes.filter((n) => !n.isDeleted).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (folder.name === 'Favorites') return allNotes.filter((n) => n.isFavorite && !n.isDeleted).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (folder.name === 'Trash') return allNotes.filter((n) => n.isDeleted).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return allNotes.filter((n) => n.folderId === folder.id && !n.isDeleted).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [folder, allNotes]);

    const displayName = folder ? (i18n.language === 'ku' && folder.nameKu ? folder.nameKu : folder.name) : '';

    const handleNoteAction = useCallback((note: Note) => {
        if (isTrash) {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(note.title || 'Untitled', '', [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('notes.restored'), onPress: () => useNotesStore.getState().restoreNote(note.id) },
                {
                    text: t('notes.permanentDelete'), style: 'destructive', onPress: () => {
                        Alert.alert(t('notes.permanentDelete'), t('notes.permanentDeleteMessage'), [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('common.delete'), style: 'destructive', onPress: () => useNotesStore.getState().permanentlyDelete(note.id) },
                        ]);
                    }
                },
            ]);
        } else {
            router.push(`/note/${note.id}`);
        }
    }, [isTrash, router, t]);

    const renderNote = useCallback(({ item, index }: { item: Note; index: number }) => {
        const isK = isRTLText(item.title || item.content);
        const colorAccent = item.color !== 'none' ? NOTE_COLORS[item.color] : null;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 40).duration(300).springify().damping(18)}
                layout={LinearTransition.springify().damping(18)}
            >
                <Pressable
                    style={({ pressed }) => [
                        s.card,
                        {
                            backgroundColor: c.surface,
                            borderColor: colorAccent || c.border,
                            opacity: pressed ? 0.7 : 1,
                            borderCurve: 'continuous',
                        } as any,
                        colorAccent && { borderLeftWidth: 4, borderLeftColor: colorAccent },
                    ]}
                    onPress={() => handleNoteAction(item)}
                >
                    <View style={[s.icon, { backgroundColor: item.noteType === 'voice' ? c.accentSurface : c.primarySurface, borderCurve: 'continuous' } as any]}>
                        {item.noteType === 'voice' ? (
                            <Mic size={18} color={c.accent} strokeWidth={2} />
                        ) : (
                            <FileText size={18} color={c.primary} strokeWidth={2} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {item.isPinned && <Pin size={12} color={c.warning} strokeWidth={2.5} fill={c.warning} />}
                            <Text style={[s.cardT, { color: c.textPrimary }, isK && s.rtl]} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                        </View>
                        <Text style={[s.cardP, { color: c.textSecondary }, isK && s.rtl]} numberOfLines={1}>{truncateText(item.content || item.transcription || '', 80)}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <Text style={[s.cardD, { color: c.textTertiary }]}>{formatNoteDate(item.updatedAt)}</Text>
                            {isTrash && item.deletedAt && <Text style={[s.cardD, { color: c.error }]}>Deleted {formatNoteDate(item.deletedAt)}</Text>}
                        </View>
                    </View>
                    {item.isFavorite && <Star size={14} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />}
                    {isTrash && <Undo2 size={16} color={c.primary} strokeWidth={2} style={{ marginLeft: 8 }} />}
                </Pressable>
            </Animated.View>
        );
    }, [c, handleNoteAction, isTrash]);

    return (
        <View style={[s.ctn, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <Animated.View entering={FadeInDown.duration(300)} style={s.hdr}>
                <Pressable
                    style={({ pressed }) => [s.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={s.hInfo}>
                    <View style={[s.hIconBadge, { backgroundColor: (folder?.color || '#6366F1') + '18', borderCurve: 'continuous' } as any]}>
                        <LucideIcon name={folder?.icon || 'folder'} size={20} color={folder?.color || '#6366F1'} />
                    </View>
                    <Text style={[s.hTitle, { color: c.textPrimary }]}>{displayName}</Text>
                </View>
                <Text style={[s.hCount, { color: c.textSecondary, fontVariant: ['tabular-nums'] }]}>{notes.length}</Text>
            </Animated.View>

            {/* Trash Actions */}
            {isTrash && notes.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={[s.trashBar, { backgroundColor: c.errorSurface, borderColor: c.error + '30', borderCurve: 'continuous' } as any]}>
                    <Pressable
                        style={({ pressed }) => [s.trashBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => Alert.alert(t('folders.restoreAll'), '', [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('common.confirm'), onPress: () => useNotesStore.getState().restoreAllTrash() },
                        ])}
                    >
                        <RefreshCw size={14} color="#FFF" strokeWidth={2.5} />
                        <Text style={s.trashBtnT}>{t('folders.restoreAll')}</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [s.trashBtn, { backgroundColor: c.error, opacity: pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                        onPress={() => Alert.alert(t('folders.emptyTrash'), t('folders.emptyTrashConfirm'), [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('common.delete'), style: 'destructive', onPress: () => useNotesStore.getState().emptyTrash() },
                        ])}
                    >
                        <Trash2 size={14} color="#FFF" strokeWidth={2.5} />
                        <Text style={s.trashBtnT}>{t('folders.emptyTrash')}</Text>
                    </Pressable>
                </Animated.View>
            )}

            <FlatList
                data={notes}
                renderItem={renderNote}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
                        {isTrash ? (
                            <Trash2 size={48} color={c.textTertiary} strokeWidth={1.5} />
                        ) : (
                            <FolderOpen size={48} color={c.textTertiary} strokeWidth={1.5} />
                        )}
                        <Text style={[s.emptyT, { color: c.textSecondary }]}>{t('folders.emptyFolder')}</Text>
                    </Animated.View>
                }
            />
        </View>
    );
}

const s = StyleSheet.create({
    ctn: { flex: 1 },
    hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
    hBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    hInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    hIconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    hTitle: { fontSize: fontSize.xl, fontWeight: '700' },
    hCount: { fontSize: fontSize.sm, fontWeight: '600' },
    trashBar: { flexDirection: 'row', marginHorizontal: spacing.lg, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.md },
    trashBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: radius.sm, gap: 4 },
    trashBtnT: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md },
    icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    cardT: { fontSize: fontSize.base, fontWeight: '600', marginBottom: 2, flex: 1 },
    cardP: { fontSize: fontSize.sm, marginBottom: 4 },
    cardD: { fontSize: fontSize.xs },
    rtl: { textAlign: 'right', writingDirection: 'rtl' },
    empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
    emptyT: { fontSize: fontSize.base },
});
