import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BrainCircuit, Activity, Heart, Frown, Smile, Zap, Coffee, CloudRain } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useNotesStore } from '../src/stores/useNotesStore';
import { analyzeMood } from '../src/services/ai';
import { radius, spacing, fontSize } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const MOODS = {
    Happy: { icon: Smile, color: '#F59E0B' },
    Sad: { icon: Frown, color: '#3B82F6' },
    Anxious: { icon: Activity, color: '#8B5CF6' },
    Calm: { icon: CloudRain, color: '#10B981' },
    Excited: { icon: Zap, color: '#EC4899' },
    Frustrated: { icon: BrainCircuit, color: '#EF4444' },
    Grateful: { icon: Heart, color: '#F43F5E' },
    Neutral: { icon: Coffee, color: '#6B7280' },
};

export default function InsightsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const c = theme.colors;
    const insets = useSafeAreaInsets();

    const [analyzing, setAnalyzing] = useState(false);
    const [analyzedCount, setAnalyzedCount] = useState(0);

    // Get all notes to analyze
    const allNotes = useNotesStore(s => s.notes);
    const notes = allNotes.filter(n => !n.isDeleted);

    // Calculate aggregated mood data
    const moodCounts: Record<string, number> = {};
    let totalScore = 0;
    let scoredNotes = 0;

    notes.forEach(n => {
        if (n.aiMood) {
            moodCounts[n.aiMood] = (moodCounts[n.aiMood] || 0) + 1;
            if (typeof n.aiMoodScore === 'number') {
                totalScore += n.aiMoodScore;
                scoredNotes++;
            }
        }
    });

    const averageScore = scoredNotes > 0 ? totalScore / scoredNotes : 0;
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const topMood = sortedMoods.length > 0 ? sortedMoods[0][0] : 'Neutral';

    const TopMoodIcon = MOODS[topMood as keyof typeof MOODS]?.icon || Smile;
    const topMoodColor = MOODS[topMood as keyof typeof MOODS]?.color || '#F59E0B';

    const handleAnalyzeRecent = async () => {
        setAnalyzing(true);
        if (Haptics?.selectionAsync) Haptics.selectionAsync();

        // Get recent notes without mood to analyze
        const unanalyzed = notes.filter(n => !n.aiMood && n.content && n.content.length > 50).slice(0, 5);

        let count = 0;
        for (const note of unanalyzed) {
            try {
                const result = await analyzeMood(note.content);
                if (result) {
                    await useNotesStore.getState().updateNote(note.id, {
                        aiMood: result.mood,
                        aiMoodReason: result.reason,
                        aiMoodScore: result.score
                    });
                    count++;
                }
            } catch (err) {
                console.error('Error analyzing note', note.id, err);
            }
        }

        setAnalyzedCount(count);
        setAnalyzing(false);
        if (count > 0 && Haptics?.notificationAsync) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Mood Insights</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                {/* Hero Summary */}
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.heroCard, { backgroundColor: topMoodColor + '15', borderColor: topMoodColor + '40' }]}>
                    <View style={styles.heroTop}>
                        <View style={[styles.heroIconWrap, { backgroundColor: topMoodColor }]}>
                            <TopMoodIcon size={32} color="#FFF" />
                        </View>
                        <View style={styles.heroTextWrap}>
                            <Text style={[styles.heroLabel, { color: c.textSecondary }]}>Your Top Mood</Text>
                            <Text style={[styles.heroTitle, { color: topMoodColor }]}>{topMood}</Text>
                        </View>
                    </View>
                    <Text style={[styles.heroDesc, { color: c.textPrimary }]}>
                        Based on your journaling and notes, you've been feeling predominantly '{topMood}' recently.
                        Your overall positivity score is <Text style={{ fontWeight: '800' }}>{Math.round(averageScore * 100)}%</Text>.
                    </Text>
                </Animated.View>

                {/* Analysis CTA */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.ctaWrapper}>
                    <Pressable
                        style={({ pressed }) => [styles.analyzeBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: analyzing || pressed ? 0.6 : 1 }]}
                        onPress={handleAnalyzeRecent}
                        disabled={analyzing}
                    >
                        {analyzing ? <ActivityIndicator size="small" color="#8B5CF6" /> : <BrainCircuit size={20} color="#8B5CF6" />}
                        <Text style={[styles.analyzeBtnText, { color: c.textPrimary }]}>
                            {analyzing ? 'Analyzing New Notes...' : 'Analyze Recent Notes'}
                        </Text>
                    </Pressable>
                    {analyzedCount > 0 && (
                        <Animated.Text entering={FadeIn} style={[styles.successText, { color: c.success }]}>
                            Successfully analyzed {analyzedCount} new notes.
                        </Animated.Text>
                    )}
                </Animated.View>

                {/* Recent Mood Insights */}
                <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Recent Moods</Text>

                {notes.filter(n => n.aiMood).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10).length === 0 ? (
                    <Text style={[styles.emptyText, { color: c.textTertiary }]}>No mood data yet. Write some journal entries and click analyze!</Text>
                ) : (
                    notes.filter(n => n.aiMood).map((note, index) => {
                        const MoodIcon = MOODS[note.aiMood as keyof typeof MOODS]?.icon || Smile;
                        const mColor = MOODS[note.aiMood as keyof typeof MOODS]?.color || c.primary;

                        return (
                            <Animated.View key={note.id} entering={SlideInRight.delay(index * 100).duration(300)}>
                                <Pressable
                                    style={({ pressed }) => [styles.insightCard, { backgroundColor: c.surfaceElevated, borderColor: mColor + '30', opacity: pressed ? 0.7 : 1 }]}
                                    onPress={() => router.push(`/note/${note.id}`)}
                                >
                                    <View style={[styles.insightIconWrap, { backgroundColor: mColor + '20' }]}>
                                        <MoodIcon size={22} color={mColor} />
                                    </View>
                                    <View style={styles.insightContent}>
                                        <View style={styles.insightHeader}>
                                            <Text style={[styles.insightTitle, { color: c.textPrimary }]} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                                            <Text style={[styles.insightMood, { color: mColor }]}>{note.aiMood}</Text>
                                        </View>
                                        <Text style={[styles.insightReason, { color: c.textSecondary }]} numberOfLines={2}>{note.aiMoodReason}</Text>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })
                )}
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
    content: { flex: 1, padding: spacing.lg },

    heroCard: { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, marginBottom: spacing.lg },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    heroIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    heroTextWrap: { flex: 1 },
    heroLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    heroTitle: { fontSize: 28, fontWeight: '800' },
    heroDesc: { fontSize: 15, lineHeight: 24 },

    ctaWrapper: { marginBottom: spacing.xl, alignItems: 'center' },
    analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.lg, borderWidth: 1, width: '100%' },
    analyzeBtnText: { fontSize: 15, fontWeight: '700' },
    successText: { fontSize: 13, marginTop: 8, fontWeight: '600' },

    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md, marginTop: spacing.sm },
    emptyText: { textAlign: 'center', fontSize: 15, marginTop: spacing.xl },

    insightCard: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.sm, alignItems: 'center', gap: spacing.md },
    insightIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    insightContent: { flex: 1 },
    insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    insightTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
    insightMood: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    insightReason: { fontSize: 13, lineHeight: 18 },
});
