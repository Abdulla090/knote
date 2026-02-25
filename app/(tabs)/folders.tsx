import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Modal,
    TextInput,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Plus,
    ChevronRight,
    Trash2,
    RefreshCw,
    Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    LinearTransition,
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useFoldersStore } from '../../src/stores/useFoldersStore';
import { useNotesStore } from '../../src/stores/useNotesStore';
import { LucideIcon, FolderIconBadge, FOLDER_ICON_NAMES } from '../../src/components/LucideIconMap';
import { fontSize, spacing, radius } from '../../src/constants/theme';
import type { Folder } from '../../src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FOLDER_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

// ========== CREATE FOLDER MODAL ==========
function CreateFolderModal({ visible, onClose, colors, t }: {
    visible: boolean; onClose: () => void; colors: any; t: any;
}) {
    const [name, setName] = useState('');
    const [nameKu, setNameKu] = useState('');
    const [icon, setIcon] = useState('folder');
    const [color, setColor] = useState('#6366F1');

    const handleCreate = async () => {
        if (!name.trim()) return;
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await useFoldersStore.getState().createFolder({ name: name.trim(), nameKu: nameKu.trim() || undefined, icon, color });
        setName(''); setNameKu(''); setIcon('folder'); setColor('#6366F1');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Animated.View
                    entering={SlideInDown.springify().damping(18).stiffness(140)}
                    exiting={SlideOutDown.duration(200)}
                >
                    <Pressable style={[styles.modalContent, { backgroundColor: colors.surface, borderCurve: 'continuous' } as any]} onPress={() => { }}>
                        <View style={[styles.modalHandle, { backgroundColor: colors.textTertiary + '40' }]} />
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('folders.createFolder')}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                            {/* Name Input */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('folders.folderName')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border, borderCurve: 'continuous' } as any]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Work, School, Ideas..."
                                placeholderTextColor={colors.textTertiary}
                                maxLength={30}
                            />

                            {/* Kurdish Name */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('folders.folderNameKu')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border, textAlign: 'right', writingDirection: 'rtl', borderCurve: 'continuous' } as any]}
                                value={nameKu}
                                onChangeText={setNameKu}
                                placeholder="بۆ نموونە: کار، قوتابخانە..."
                                placeholderTextColor={colors.textTertiary}
                                maxLength={30}
                            />

                            {/* Icon Picker */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('folders.folderIcon')}</Text>
                            <View style={styles.iconGrid}>
                                {FOLDER_ICON_NAMES.map((iconName) => (
                                    <Pressable
                                        key={iconName}
                                        style={[
                                            styles.iconOption,
                                            icon === iconName && { backgroundColor: color + '20', borderColor: color },
                                            { borderCurve: 'continuous' } as any,
                                        ]}
                                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); setIcon(iconName); }}
                                    >
                                        <LucideIcon name={iconName} size={20} color={icon === iconName ? color : colors.textSecondary} />
                                    </Pressable>
                                ))}
                            </View>

                            {/* Color Picker */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('folders.folderColor')}</Text>
                            <View style={styles.colorGrid}>
                                {FOLDER_COLORS.map((c) => (
                                    <Pressable
                                        key={c}
                                        style={[styles.colorOption, { backgroundColor: c }, color === c && { borderColor: colors.textPrimary }]}
                                        onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); setColor(c); }}
                                    >
                                        {color === c && <Check size={16} color="#FFF" strokeWidth={3} />}
                                    </Pressable>
                                ))}
                            </View>

                            {/* Preview */}
                            <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
                                <FolderIconBadge name={icon} size={22} color={color} containerSize={48} borderRadius={12} />
                                <View>
                                    <Text style={[styles.previewName, { color: colors.textPrimary }]}>{name || 'Folder Name'}</Text>
                                    {nameKu ? <Text style={[styles.previewNameKu, { color: colors.textSecondary }]}>{nameKu}</Text> : null}
                                </View>
                            </View>
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <Pressable
                                style={({ pressed }) => [styles.modalActionBtn, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                                onPress={onClose}
                            >
                                <Text style={[styles.modalActionText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.modalActionBtn,
                                    { backgroundColor: colors.primary, opacity: name.trim() ? (pressed ? 0.85 : 1) : 0.5, borderCurve: 'continuous' } as any,
                                ]}
                                onPress={handleCreate}
                                disabled={!name.trim()}
                            >
                                <Text style={[styles.modalActionText, { color: '#FFF' }]}>{t('common.create')}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ========== FOLDER CARD ==========
function FolderCard({ folder, noteCount, onPress, onLongPress, colors, language, index }: {
    folder: Folder; noteCount: number; onPress: () => void; onLongPress?: () => void; colors: any; language: string; index: number;
}) {
    const displayName = language === 'ku' && folder.nameKu ? folder.nameKu : folder.name;
    const isTrash = folder.name === 'Trash';

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onLongPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onLongPress?.();
            }}
            onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
            style={[animatedStyle]}
        >
            <Animated.View
                entering={FadeInDown.delay(index * 50).duration(350).springify().damping(18)}
                layout={LinearTransition.springify().damping(18)}
                style={[
                    styles.folderCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderCurve: 'continuous',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    } as any,
                ]}
            >
                <FolderIconBadge name={folder.icon} size={22} color={folder.color} containerSize={48} borderRadius={12} />
                <View style={styles.folderInfo}>
                    <Text style={[styles.folderName, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
                    <Text style={[styles.folderCount, { color: colors.textSecondary, fontVariant: ['tabular-nums'] }]}>
                        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                    </Text>
                </View>
                {isTrash && noteCount > 0 && (
                    <View style={[styles.trashBadge, { backgroundColor: colors.errorSurface, borderCurve: 'continuous' } as any]}>
                        <Text style={[styles.trashBadgeText, { color: colors.error, fontVariant: ['tabular-nums'] }]}>{noteCount}</Text>
                    </View>
                )}
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
            </Animated.View>
        </AnimatedPressable>
    );
}

// ========== MAIN SCREEN ==========
export default function FoldersScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const folders = useFoldersStore((s) => s.folders);
    const notes = useNotesStore((s) => s.notes);
    const [showCreate, setShowCreate] = useState(false);

    const getNotesCountForFolder = useCallback(
        (folderId: string, folderName: string) => {
            if (folderName === 'All Notes') return notes.filter((n) => !n.isDeleted).length;
            if (folderName === 'Favorites') return notes.filter((n) => n.isFavorite && !n.isDeleted).length;
            if (folderName === 'Trash') return notes.filter((n) => n.isDeleted).length;
            return notes.filter((n) => n.folderId === folderId && !n.isDeleted).length;
        },
        [notes],
    );

    const handleDeleteFolder = useCallback((folder: Folder) => {
        if (folder.isDefault) return;
        Alert.alert(t('folders.deleteFolder'), t('folders.deleteFolderConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'), style: 'destructive', onPress: async () => {
                    const folderNotes = notes.filter(n => n.folderId === folder.id);
                    for (const n of folderNotes) {
                        await useNotesStore.getState().moveToFolder(n.id, null);
                    }
                    await useFoldersStore.getState().deleteFolder(folder.id);
                },
            },
        ]);
    }, [notes, t]);

    const renderFolder = useCallback(
        ({ item, index }: { item: Folder; index: number }) => (
            <FolderCard
                folder={item}
                noteCount={getNotesCountForFolder(item.id, item.name)}
                onPress={() => router.push(`/folder/${item.id}`)}
                onLongPress={() => handleDeleteFolder(item)}
                colors={colors}
                language={i18n.language}
                index={index}
            />
        ),
        [colors, getNotesCountForFolder, router, i18n.language, handleDeleteFolder],
    );

    const trashCount = notes.filter((n) => n.isDeleted).length;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('folders.title')}</Text>
                <Pressable
                    style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primarySurface, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => {
                        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowCreate(true);
                    }}
                >
                    <Plus size={22} color={colors.primary} strokeWidth={2.5} />
                </Pressable>
            </Animated.View>

            {/* Trash Actions */}
            {trashCount > 0 && (
                <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={[styles.trashActions, { backgroundColor: colors.errorSurface, borderColor: colors.error + '30', borderCurve: 'continuous' } as any]}
                >
                    <Text style={[styles.trashText, { color: colors.error }]}>
                        {t('folders.trashCount', { count: trashCount })}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Pressable
                            style={({ pressed }) => [styles.trashBtn, { backgroundColor: '#FFF', opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                            onPress={() => {
                                Alert.alert(t('folders.restoreAll'), '', [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    { text: t('common.confirm'), onPress: () => useNotesStore.getState().restoreAllTrash() },
                                ]);
                            }}
                        >
                            <RefreshCw size={14} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.trashBtnText, { color: colors.primary }]}>{t('folders.restoreAll')}</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.trashBtn, { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                            onPress={() => {
                                Alert.alert(t('folders.emptyTrash'), t('folders.emptyTrashConfirm'), [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    { text: t('common.delete'), style: 'destructive', onPress: () => useNotesStore.getState().emptyTrash() },
                                ]);
                            }}
                        >
                            <Trash2 size={14} color="#FFF" strokeWidth={2.5} />
                            <Text style={[styles.trashBtnText, { color: '#FFF' }]}>{t('folders.emptyTrash')}</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            )}

            <FlatList
                data={folders}
                renderItem={renderFolder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <CreateFolderModal visible={showCreate} onClose={() => setShowCreate(false)} colors={colors} t={t} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.base, paddingBottom: spacing.md },
    headerTitle: { fontSize: fontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
    addButton: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    folderCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: radius.base, marginBottom: spacing.sm, borderWidth: 1, gap: spacing.md },
    folderInfo: { flex: 1 },
    folderName: { fontSize: fontSize.md, fontWeight: '600', marginBottom: 2 },
    folderCount: { fontSize: fontSize.sm },
    trashBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs, marginRight: spacing.sm },
    trashBadgeText: { fontSize: 11, fontWeight: '700' },
    trashActions: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.md, alignItems: 'center', gap: spacing.sm },
    trashText: { fontSize: fontSize.sm, fontWeight: '600' },
    trashBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, gap: 4 },
    trashBtnText: { fontSize: 12, fontWeight: '600' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: spacing.md },
    modalTitle: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg },
    inputLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, marginBottom: spacing.md },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    iconOption: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    colorGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    colorOption: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
    previewCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.lg, gap: spacing.md },
    previewName: { fontSize: fontSize.base, fontWeight: '600' },
    previewNameKu: { fontSize: fontSize.sm, marginTop: 2 },
    modalActions: { flexDirection: 'row', gap: spacing.sm },
    modalActionBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    modalActionText: { fontSize: fontSize.base, fontWeight: '600' },
});
