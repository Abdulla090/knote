import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Activity, Clock, ScanText, MicIcon, Smile, Crown } from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useNotesStore } from '../src/stores/useNotesStore';
import { StatsDashboard, StreakTracker, QuoteWidget, FocusTimer } from '../src/components/DashboardWidgets';
import { radius, spacing, fontSize } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
    const { theme } = useTheme();
    const c = theme.colors;
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Global States
    const streak = useSettingsStore((s) => s.streak);
    const allNotes = useNotesStore((s) => s.notes);

    // Stats calculation
    const stats = useMemo(() => {
        const active = allNotes.filter((n) => !n.isDeleted && !n.isArchived);
        const totalWords = active.reduce((sum, n) => {
            const text = (n.content || '') + ' ' + (n.transcription || '');
            return sum + text.trim().split(/\s+/).filter(w => w.length > 0).length;
        }, 0);

        return {
            total: active.length,
            voice: active.filter((n) => n.noteType === 'voice').length,
            text: active.filter((n) => n.noteType === 'text').length,
            words: totalWords,
            favs: active.filter((n) => n.isFavorite).length,
        };
    }, [allNotes]);

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Focus & Hub</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Premium Tools Hub */}
                <Animated.View entering={FadeInDown.duration(300)}>
                    <View style={styles.hubSection}>
                        <View style={styles.hubTitleRow}>
                            <Crown size={16} color="#F59E0B" strokeWidth={2.5} />
                            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Premium AI Tools</Text>
                        </View>

                        <View style={styles.grid}>
                            <Pressable style={({ pressed }) => [styles.toolGridItem, { backgroundColor: '#3B82F615', borderColor: '#3B82F630', opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push('/scan')}>
                                <View style={[styles.iconWrap, { backgroundColor: '#3B82F6' }]}><ScanText size={20} color="#FFF" /></View>
                                <Text style={[styles.toolGridText, { color: c.textPrimary }]}>Document Scanner</Text>
                            </Pressable>

                            <Pressable style={({ pressed }) => [styles.toolGridItem, { backgroundColor: '#10B98115', borderColor: '#10B98130', opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push('/briefing')}>
                                <View style={[styles.iconWrap, { backgroundColor: '#10B981' }]}><MicIcon size={20} color="#FFF" /></View>
                                <Text style={[styles.toolGridText, { color: c.textPrimary }]}>Voice Briefing</Text>
                            </Pressable>

                            <Pressable style={({ pressed }) => [styles.toolGridItem, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30', opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push('/insights')}>
                                <View style={[styles.iconWrap, { backgroundColor: '#F59E0B' }]}><Smile size={20} color="#FFF" /></View>
                                <Text style={[styles.toolGridText, { color: c.textPrimary }]}>Mood Insights</Text>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>

                {/* Dashboard Widgets */}
                <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                    <View style={styles.hubSection}>
                        <View style={styles.hubTitleRow}>
                            <Activity size={16} color={c.textSecondary} strokeWidth={2.5} />
                            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Your Stats</Text>
                        </View>
                        <StatsDashboard colors={c} stats={stats} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                    <View style={styles.hubSection}>
                        <View style={styles.hubTitleRow}>
                            <Sparkles size={16} color={c.textSecondary} strokeWidth={2.5} />
                            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Consistency Tracker</Text>
                        </View>
                        <StreakTracker colors={c} streak={streak} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                    <View style={styles.hubSection}>
                        <View style={styles.hubTitleRow}>
                            <Clock size={16} color={c.textSecondary} strokeWidth={2.5} />
                            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Focus Timer</Text>
                        </View>
                        <FocusTimer colors={c} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(300)}>
                    <QuoteWidget colors={c} />
                </Animated.View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, zIndex: 10 },
    hBtn: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    titleWrap: { flex: 1, alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700' },
    hBtnPlaceholder: { width: 38, height: 38 },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },

    hubSection: { marginBottom: spacing.xl },
    hubTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, marginLeft: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    toolGridItem: { flexBasis: '48%', flexGrow: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 12 },
    iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    toolGridText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
});
