import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Languages } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
    withSpring,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNoteById } from '../../src/stores/useNotesStore';
import { generateFlashcards } from '../../src/services/ai';
import { radius, spacing, fontSize } from '../../src/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Flashcard {
    question: string;
    answer: string;
}

export default function StudyScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const note = useNoteById(id || '');
    const router = useRouter();
    const { theme } = useTheme();
    const c = theme.colors;
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Flip animation state
    const isFlipped = useSharedValue(0);

    useEffect(() => {
        if (!note) return;
        const fetchCards = async () => {
            setLoading(true);
            try {
                const textContext = note.content || note.transcription || '';
                const result = await generateFlashcards(textContext, note.language);
                setFlashcards(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchCards();
    }, [note?.id]);

    const flipCard = () => {
        isFlipped.value = withTiming(isFlipped.value === 0 ? 1 : 0, { duration: 400 });
        if (Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const nextCard = () => {
        if (currentIndex < flashcards.length - 1) {
            isFlipped.value = 0; // reset
            setCurrentIndex(prev => prev + 1);
            if (Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            isFlipped.value = 0; // reset
            setCurrentIndex(prev => prev - 1);
            if (Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(isFlipped.value, [0, 1], [0, 180]);
        return {
            transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
            opacity: interpolate(isFlipped.value, [0, 0.5, 1], [1, 0, 0]),
            backfaceVisibility: 'hidden',
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(isFlipped.value, [0, 1], [-180, 0]);
        return {
            transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
            opacity: interpolate(isFlipped.value, [0, 0.5, 1], [0, 0, 1]),
            backfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
        };
    });

    if (!note) return null;

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Study: {note.title || 'Untitled'}</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={[styles.loadingText, { color: c.textSecondary }]}>Generating smart flashcards...</Text>
                </View>
            ) : flashcards.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: c.error }]}>Failed to generate flashcards. Content might be too short.</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.progressWrap}>
                        <Text style={[styles.progressText, { color: c.textTertiary }]}>{currentIndex + 1} of {flashcards.length}</Text>
                        <View style={[styles.progressBar, { backgroundColor: c.surfaceElevated }]}>
                            <View style={[styles.progressFill, { backgroundColor: '#8B5CF6', width: `${((currentIndex + 1) / flashcards.length) * 100}%` }]} />
                        </View>
                    </View>

                    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.cardContainer}>
                        <Pressable onPress={flipCard} style={{ flex: 1 }}>
                            {/* FRONT CARD */}
                            <Animated.View style={[styles.card, { backgroundColor: c.surfaceElevated, borderColor: '#8B5CF640' }, frontAnimatedStyle]}>
                                <Text style={[styles.cardTag, { color: '#8B5CF6' }]}>QUESTION</Text>
                                <ScrollView contentContainerStyle={styles.cardScroll}>
                                    <Text style={[styles.cardText, { color: c.textPrimary }]}>{flashcards[currentIndex].question}</Text>
                                </ScrollView>
                                <Text style={[styles.tapHint, { color: c.textTertiary }]}>Tap to flip</Text>
                            </Animated.View>

                            {/* BACK CARD */}
                            <Animated.View style={[styles.card, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF6' }, backAnimatedStyle]}>
                                <Text style={[styles.cardTag, { color: '#8B5CF6' }]}>ANSWER</Text>
                                <ScrollView contentContainerStyle={styles.cardScroll}>
                                    <Text style={[styles.cardText, { color: c.textPrimary }]} selectable>{flashcards[currentIndex].answer}</Text>
                                </ScrollView>
                                <Text style={[styles.tapHint, { color: c.textTertiary }]}>Tap to flip back</Text>
                            </Animated.View>
                        </Pressable>
                    </Animated.View>

                    <View style={styles.controls}>
                        <Pressable style={({ pressed }) => [styles.ctrlBtn, { backgroundColor: c.surfaceElevated, opacity: currentIndex === 0 || pressed ? 0.5 : 1 }]} onPress={prevCard} disabled={currentIndex === 0}>
                            <Text style={[styles.ctrlBtnText, { color: c.textPrimary }]}>Previous</Text>
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.ctrlBtn, { backgroundColor: '#8B5CF6', opacity: currentIndex === flashcards.length - 1 || pressed ? 0.5 : 1 }]} onPress={nextCard} disabled={currentIndex === flashcards.length - 1}>
                            <Text style={[styles.ctrlBtnText, { color: '#FFF' }]}>Next Card</Text>
                        </Pressable>
                    </View>
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
    progressWrap: { marginBottom: spacing.xl, alignItems: 'center' },
    progressText: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 8 },
    progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    cardContainer: { flex: 1, marginBottom: spacing.xl },
    card: { flex: 1, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    cardTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.lg, alignSelf: 'center' },
    cardScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    cardText: { fontSize: fontSize['2xl'], fontWeight: '700', lineHeight: 36, textAlign: 'center' },
    tapHint: { fontSize: 12, marginTop: spacing.lg, opacity: 0.6 },
    controls: { flexDirection: 'row', gap: spacing.md },
    ctrlBtn: { flex: 1, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    ctrlBtnText: { fontSize: 16, fontWeight: '700' },
});
