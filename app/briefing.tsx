import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Animated as RNAnimated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Pause, Radio, FastForward, Rewind } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useNotesStore } from '../src/stores/useNotesStore';
import { generateBriefingText } from '../src/services/ai';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { radius, spacing, fontSize } from '../src/constants/theme';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export default function BriefingScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const c = theme.colors;
    const insets = useSafeAreaInsets();
    const appLanguage = useSettingsStore(s => s.appLanguage);

    const [loading, setLoading] = useState(true);
    const [briefingText, setBriefingText] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    // Get recent notes
    useEffect(() => {
        const fetchBriefing = async () => {
            const allNotes = useNotesStore.getState().notes.filter(n => !n.isDeleted && !n.isArchived);
            const urgentNotes = allNotes.filter(n => n.isPinned || n.isFavorite).slice(0, 5);
            const recentNotes = allNotes.slice(0, 5);
            const selected = [...new Set([...urgentNotes, ...recentNotes])].slice(0, 6)
                .map(n => ({
                    title: n.title || 'Untitled',
                    content: (n.content || n.transcription || '').slice(0, 300),
                    date: n.updatedAt
                }));

            try {
                if (selected.length > 0) {
                    const text = await generateBriefingText(selected, appLanguage);
                    setBriefingText(text);
                } else {
                    setBriefingText("You don't have any recent notes for a briefing today. Add some notes to hear your daily podcast!");
                }
            } catch (err) {
                console.error(err);
                setBriefingText("Sorry, I couldn't generate your briefing right now. Please try again later.");
            }
            setLoading(false);
        };
        fetchBriefing();

        return () => {
            Speech.stop();
        };
    }, []);

    // Audio Visualizer Animation
    const pulseValue = useSharedValue(1);
    useEffect(() => {
        if (isPlaying) {
            pulseValue.value = withRepeat(
                withTiming(1.3, { duration: 600 }),
                -1,
                true
            );
        } else {
            pulseValue.value = withTiming(1, { duration: 300 });
        }
    }, [isPlaying]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
    }));

    const togglePlay = () => {
        if (!briefingText) return;

        if (isPlaying) {
            Speech.stop();
            setIsPlaying(false);
            if (Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            setIsPlaying(true);
            if (Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Speech.speak(briefingText, {
                language: appLanguage === 'ku' ? 'ckb' : 'en-US',
                pitch: 1.0,
                rate: 0.95,
                onDone: () => setIsPlaying(false),
                onError: () => setIsPlaying(false),
                onStopped: () => setIsPlaying(false)
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Daily Briefing 🎙️</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={[styles.loadingText, { color: c.textSecondary }]}>Fetching and writing your daily podcast...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.visualizerContainer}>
                        <Animated.View style={[styles.pulseCircle, { backgroundColor: '#10B98120' }, pulseStyle]} />
                        <Animated.View style={[styles.pulseCircleSmall, { backgroundColor: '#10B98140' }, pulseStyle]} />
                        <View style={[styles.centerCircle, { backgroundColor: '#10B981' }]}>
                            <Radio size={48} color="#FFF" strokeWidth={2} />
                        </View>
                    </View>

                    <Animated.View entering={FadeInDown.duration(400)} style={styles.playerControls}>
                        <Pressable style={({ pressed }) => [styles.sideBtn, { opacity: pressed ? 0.5 : 1 }]} onPress={() => { Speech.stop(); setIsPlaying(false); }}>
                            <Rewind size={24} color={c.textPrimary} />
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.playBtn, { backgroundColor: '#10B981', opacity: pressed ? 0.8 : 1 }]} onPress={togglePlay}>
                            {isPlaying ? <Pause size={32} color="#FFF" fill="#FFF" /> : <Play size={32} color="#FFF" fill="#FFF" />}
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.sideBtn, { opacity: pressed ? 0.5 : 1 }]} disabled={true}>
                            <FastForward size={24} color={c.textTertiary} />
                        </Pressable>
                    </Animated.View>

                    <ScrollView style={styles.transcript} contentContainerStyle={{ paddingBottom: 40 }}>
                        <Text style={[styles.transcriptLabel, { color: c.textTertiary }]}>TRANSCRIPT</Text>
                        <Animated.Text entering={FadeIn.delay(200)} style={[styles.transcriptText, { color: c.textPrimary }]}>
                            {briefingText}
                        </Animated.Text>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    hBtn: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    titleWrap: { flex: 1, alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700' },
    hBtnPlaceholder: { width: 38, height: 38 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    loadingText: { marginTop: spacing.md, fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center' },
    content: { flex: 1, padding: spacing.lg },
    visualizerContainer: { height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl },
    pulseCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
    pulseCircleSmall: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
    centerCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
    playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.xl },
    playBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    sideBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    transcript: { flex: 1, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    transcriptLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
    transcriptText: { fontSize: fontSize.md, lineHeight: 28 },
});
