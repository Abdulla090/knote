import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    Platform,
    Share,
    Image,
} from 'react-native';
import {
    Palette,
    Languages,
    Sparkles,
    FolderOpen,
    List,
    Mic,
    Save,
    Download,
    Info,
    ChevronRight,
    Timer,
    Minus,
    Plus,
    Check,
    Layers,
    Image as ImageIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    LinearTransition,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSettingsStore, THEME_PRESETS, ThemePreset, BgPattern } from '../../src/stores/useSettingsStore';
import { useNotesStore } from '../../src/stores/useNotesStore';
import { fontSize, spacing, radius } from '../../src/constants/theme';
import i18n from '../../src/locales/i18n';

function SettingsSection({ title, children, colors, index }: { title: string; children: React.ReactNode; colors: any; index?: number }) {
    return (
        <Animated.View
            entering={FadeInDown.delay((index || 0) * 60).duration(350).springify().damping(18)}
            layout={LinearTransition.springify().damping(18)}
            style={styles.section}
        >
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}>{children}</View>
        </Animated.View>
    );
}

function SettingsRow({ Icon, label, value, onPress, colors, rightComponent, iconColor }: {
    Icon: any; label: string; value?: string; onPress?: () => void; colors: any; rightComponent?: React.ReactNode; iconColor?: string;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.6 }]}
            onPress={() => {
                if (onPress) {
                    if (Platform.OS === 'ios') Haptics.selectionAsync();
                    onPress();
                }
            }}
            disabled={!onPress && !rightComponent}
        >
            <View style={[styles.rowIcon, { backgroundColor: (iconColor || colors.primary) + '18', borderCurve: 'continuous' } as any]}>
                <Icon size={18} color={iconColor || colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
            {rightComponent || (
                <View style={styles.rowRight}>
                    {value && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
                    {onPress && <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />}
                </View>
            )}
        </Pressable>
    );
}

function SettingsDivider({ colors }: { colors: any }) {
    return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export default function SettingsScreen() {
    const { theme, themeMode, setThemeMode, isDark } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const appLanguage = useSettingsStore((s) => s.appLanguage);
    const autoSummarize = useSettingsStore((s) => s.autoSummarize);
    const autoCategorize = useSettingsStore((s) => s.autoCategorize);
    const summaryLevel = useSettingsStore((s) => s.summaryLevel);
    const defaultRecordingLanguage = useSettingsStore((s) => s.defaultRecordingLanguage);
    const themePreset = useSettingsStore((s) => s.themePreset);
    const bgPattern = useSettingsStore((s) => s.bgPattern);
    const focusDuration = useSettingsStore((s) => s.focusDuration);
    const totalNotes = useNotesStore((s) => s.notes.length);

    const toggleLanguage = () => {
        const newLang = appLanguage === 'en' ? 'ku' : 'en';
        useSettingsStore.getState().updateSetting('appLanguage', newLang);
        i18n.changeLanguage(newLang);
    };

    const cycleTheme = () => {
        const modes = ['system', 'light', 'dark'] as const;
        const idx = modes.indexOf(themeMode);
        setThemeMode(modes[(idx + 1) % 3]);
    };

    const cycleSummaryLevel = () => {
        const levels = ['brief', 'standard', 'detailed'] as const;
        const idx = levels.indexOf(summaryLevel);
        useSettingsStore.getState().updateSetting('summaryLevel', levels[(idx + 1) % 3]);
    };

    const toggleRecordingLanguage = () => {
        useSettingsStore.getState().updateSetting('defaultRecordingLanguage', defaultRecordingLanguage === 'en' ? 'ku' : 'en');
    };

    const handleExport = async () => {
        try {
            const notes = useNotesStore.getState().notes;
            const data = notes.filter(n => !n.isDeleted).map(n => ({
                title: n.title,
                content: n.content,
                type: n.noteType,
                created: n.createdAt,
                tags: n.aiTags,
                summary: n.summary,
            }));
            const json = JSON.stringify(data, null, 2);
            if (Platform.OS !== 'web') {
                await Share.share({ message: json, title: 'Knote Export' });
            }
            Alert.alert(t('settings.exported'));
        } catch (e) {
            console.error('Export failed:', e);
        }
    };

    const adjustFocusDuration = (delta: number) => {
        const newVal = Math.max(5, Math.min(60, focusDuration + delta));
        useSettingsStore.getState().updateSetting('focusDuration', newVal);
        if (Platform.OS === 'ios') Haptics.selectionAsync();
    };

    const themeLabel = themeMode === 'system' ? t('settings.systemMode') : themeMode === 'dark' ? t('settings.darkMode') : t('settings.lightMode');

    const patterns: { key: BgPattern; label: string }[] = [
        { key: 'none', label: 'None' },
        { key: 'waves', label: 'Waves' },
        { key: 'dots', label: 'Dots' },
        { key: 'circuit', label: 'Circuit' },
        { key: 'orbs', label: 'Orbs' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <Animated.View entering={FadeInDown.duration(350)}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings.title')}</Text>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Theme Presets */}
                <Animated.View entering={FadeInDown.delay(50).duration(350).springify().damping(18)} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THEME PRESETS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themePresetsRow}>
                        {THEME_PRESETS.map((preset) => {
                            const isActive = themePreset === preset.key;
                            return (
                                <Pressable
                                    key={preset.key}
                                    style={({ pressed }) => [
                                        styles.themeCard,
                                        {
                                            borderColor: isActive ? colors.primary : colors.border,
                                            borderWidth: isActive ? 2 : 1,
                                            opacity: pressed ? 0.8 : 1,
                                            borderCurve: 'continuous',
                                        } as any,
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        useSettingsStore.getState().updateSetting('themePreset', preset.key);
                                    }}
                                >
                                    {preset.image ? (
                                        <Image source={preset.image} style={styles.themeImage} />
                                    ) : (
                                        <LinearGradient
                                            colors={isDark ? [preset.primaryDark, preset.accentDark] : [preset.primaryLight, preset.accentLight]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.themeGradient}
                                        />
                                    )}
                                    <View style={styles.themeCardFooter}>
                                        <Text style={[styles.themeCardLabel, { color: colors.textPrimary }]}>{preset.label}</Text>
                                        {isActive && (
                                            <View style={[styles.themeCheckmark, { backgroundColor: colors.primary }]}>
                                                <Check size={10} color="#FFF" strokeWidth={3} />
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </Animated.View>

                {/* Background Pattern */}
                <Animated.View entering={FadeInDown.delay(100).duration(350).springify().damping(18)} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BACKGROUND PATTERN</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
                        <View style={styles.patternRow}>
                            {patterns.map((p) => {
                                const isActive = bgPattern === p.key;
                                return (
                                    <Pressable
                                        key={p.key}
                                        style={[
                                            styles.patternChip,
                                            isActive ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceElevated },
                                            { borderCurve: 'continuous' } as any,
                                        ]}
                                        onPress={() => {
                                            if (Platform.OS === 'ios') Haptics.selectionAsync();
                                            useSettingsStore.getState().updateSetting('bgPattern', p.key);
                                        }}
                                    >
                                        <Text style={[styles.patternChipText, { color: isActive ? '#FFF' : colors.textSecondary }]}>{p.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>

                {/* Appearance */}
                <SettingsSection title={t('settings.appearance')} colors={colors} index={2}>
                    <SettingsRow Icon={Palette} label={t('settings.appearance')} value={themeLabel} onPress={cycleTheme} colors={colors} />
                </SettingsSection>

                {/* Language */}
                <SettingsSection title={t('settings.language')} colors={colors} index={3}>
                    <SettingsRow Icon={Languages} label={t('settings.language')} value={appLanguage === 'en' ? t('settings.english') : t('settings.kurdish')} onPress={toggleLanguage} colors={colors} iconColor="#3B82F6" />
                </SettingsSection>

                {/* Focus Mode */}
                <SettingsSection title="FOCUS MODE" colors={colors} index={4}>
                    <SettingsRow
                        Icon={Timer} label="Focus Duration" colors={colors} iconColor="#F59E0B"
                        rightComponent={
                            <View style={styles.durationControl}>
                                <Pressable style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => adjustFocusDuration(-5)}>
                                    <Minus size={14} color={colors.textSecondary} strokeWidth={2.5} />
                                </Pressable>
                                <Text style={[styles.durationValue, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}>{focusDuration} min</Text>
                                <Pressable style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => adjustFocusDuration(5)}>
                                    <Plus size={14} color={colors.textSecondary} strokeWidth={2.5} />
                                </Pressable>
                            </View>
                        }
                    />
                </SettingsSection>

                {/* AI Settings */}
                <SettingsSection title={t('settings.aiSettings')} colors={colors} index={5}>
                    <SettingsRow
                        Icon={Sparkles} label={t('settings.autoSummarize')} colors={colors} iconColor="#F59E0B"
                        rightComponent={
                            <Switch value={autoSummarize} onValueChange={(v) => useSettingsStore.getState().updateSetting('autoSummarize', v)}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }} thumbColor={autoSummarize ? colors.primary : colors.textTertiary} />
                        }
                    />
                    <SettingsDivider colors={colors} />
                    <SettingsRow
                        Icon={FolderOpen} label={t('settings.autoCategorize')} colors={colors} iconColor="#10B981"
                        rightComponent={
                            <Switch value={autoCategorize} onValueChange={(v) => useSettingsStore.getState().updateSetting('autoCategorize', v)}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }} thumbColor={autoCategorize ? colors.primary : colors.textTertiary} />
                        }
                    />
                    <SettingsDivider colors={colors} />
                    <SettingsRow Icon={List} label={t('settings.summaryLevel')} value={t(`ai.summary${summaryLevel.charAt(0).toUpperCase() + summaryLevel.slice(1)}`)} onPress={cycleSummaryLevel} colors={colors} iconColor="#8B5CF6" />
                </SettingsSection>

                {/* Recording */}
                <SettingsSection title={t('settings.recordingSettings')} colors={colors} index={6}>
                    <SettingsRow Icon={Mic} label={t('settings.defaultRecordingLanguage')} value={defaultRecordingLanguage === 'en' ? t('recording.english') : t('recording.kurdish')} onPress={toggleRecordingLanguage} colors={colors} iconColor="#EF4444" />
                </SettingsSection>

                {/* Storage & Data */}
                <SettingsSection title={t('settings.storage')} colors={colors} index={7}>
                    <SettingsRow Icon={Save} label={t('settings.storageUsed', { count: totalNotes })} colors={colors} iconColor="#14B8A6" />
                    <SettingsDivider colors={colors} />
                    <SettingsRow Icon={Download} label={t('settings.exportData')} onPress={handleExport} colors={colors} iconColor="#6366F1" />
                </SettingsSection>

                {/* About */}
                <SettingsSection title={t('settings.about')} colors={colors} index={8}>
                    <SettingsRow Icon={Info} label={t('settings.version')} value="1.0.0" colors={colors} iconColor="#6B7280" />
                </SettingsSection>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerTitle: { fontSize: fontSize['3xl'], fontWeight: '700', letterSpacing: -0.5, paddingHorizontal: spacing.lg, paddingTop: spacing.base, paddingBottom: spacing.md },
    scrollContent: { paddingBottom: 100 },
    section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
    sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
    sectionContent: { borderRadius: radius.base, borderWidth: 1, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, minHeight: 52 },
    rowIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    rowLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '500' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rowValue: { fontSize: fontSize.sm },
    divider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
    // Theme pickers
    themePresetsRow: { gap: spacing.sm, paddingHorizontal: spacing.xs },
    themeCard: { width: 100, borderRadius: radius.md, overflow: 'hidden' },
    themeImage: { width: 100, height: 70, borderRadius: 0 },
    themeGradient: { width: 100, height: 70 },
    themeCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
    themeCardLabel: { fontSize: 11, fontWeight: '700' },
    themeCheckmark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    // Pattern picker
    patternRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.md },
    patternChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
    patternChipText: { fontSize: fontSize.xs, fontWeight: '600' },
    // Duration control
    durationControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    durationBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    durationValue: { fontSize: fontSize.sm, fontWeight: '700', minWidth: 50, textAlign: 'center' },
});
