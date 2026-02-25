import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Mic,
    Sparkles,
    FolderOpen,
    ArrowRight,
    Check,
    // Feature icons
    CircleDot,
    PenLine,
    Globe,
    FileText,
    Tag,
    Languages,
    Pin,
    Palette,
    Search,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/contexts/ThemeContext';
import { fontSize, spacing, radius } from '../src/constants/theme';

const ONBOARDING_KEY = '@knote_onboarded';

interface FeatureItem {
    Icon: any;
    iconColor: string;
    text: string;
}

interface OnboardingSlide {
    id: string;
    Icon: any;
    iconGradient: [string, string];
    title: string;
    subtitle: string;
    features: FeatureItem[];
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        Icon: Mic,
        iconGradient: ['#818CF8', '#6366F1'],
        title: 'Voice to Text',
        subtitle: 'Record your thoughts and Knote transcribes them instantly using AI',
        features: [
            { Icon: CircleDot, iconColor: '#EF4444', text: 'One-tap voice recording' },
            { Icon: PenLine, iconColor: '#6366F1', text: 'AI-powered transcription' },
            { Icon: Globe, iconColor: '#10B981', text: 'English & Kurdish support' },
        ],
    },
    {
        id: '2',
        Icon: Sparkles,
        iconGradient: ['#FBBF24', '#F59E0B'],
        title: 'Smart AI Features',
        subtitle: 'Let AI organize, summarize, and tag your notes automatically',
        features: [
            { Icon: FileText, iconColor: '#3B82F6', text: 'Auto-summarize notes' },
            { Icon: Tag, iconColor: '#8B5CF6', text: 'Smart tagging & categorization' },
            { Icon: Languages, iconColor: '#10B981', text: 'Instant translation' },
        ],
    },
    {
        id: '3',
        Icon: FolderOpen,
        iconGradient: ['#34D399', '#10B981'],
        title: 'Stay Organized',
        subtitle: 'Pin, color-code, and organize notes into folders effortlessly',
        features: [
            { Icon: Pin, iconColor: '#F59E0B', text: 'Pin important notes to top' },
            { Icon: Palette, iconColor: '#EC4899', text: 'Color-code for quick access' },
            { Icon: Search, iconColor: '#6366F1', text: 'Custom folders & search' },
        ],
    },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
    const { theme } = useTheme();
    const c = theme.colors;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const handleNext = async () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < slides.length - 1) {
            const nextIdx = currentIndex + 1;
            flatListRef.current?.scrollToOffset({ offset: nextIdx * SCREEN_WIDTH, animated: true });
            setCurrentIndex(nextIdx);
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/(tabs)');
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const { Icon, iconGradient } = item;

        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                {/* Icon */}
                <Animated.View entering={FadeInDown.delay(200).duration(500).springify().damping(15)}>
                    <LinearGradient
                        colors={iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.iconCircle, { borderCurve: 'continuous' } as any]}
                    >
                        <Icon size={56} color="#FFF" strokeWidth={1.8} />
                    </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                    <Text style={[styles.title, { color: c.textPrimary }]}>{item.title}</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(400).duration(500)}>
                    <Text style={[styles.subtitle, { color: c.textSecondary }]}>{item.subtitle}</Text>
                </Animated.View>

                {/* Features */}
                <View style={styles.features}>
                    {item.features.map((f, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeInDown.delay(500 + i * 80).duration(400).springify().damping(18)}
                            style={[styles.featureRow, { backgroundColor: c.surface, borderColor: c.border, borderCurve: 'continuous' } as any]}
                        >
                            <View style={[styles.featureIconBadge, { backgroundColor: f.iconColor + '18', borderCurve: 'continuous' } as any]}>
                                <f.Icon size={18} color={f.iconColor} strokeWidth={2} />
                            </View>
                            <Text style={[styles.featureText, { color: c.textPrimary }]}>{f.text}</Text>
                        </Animated.View>
                    ))}
                </View>
            </View>
        );
    };

    // Animated dots
    const DotIndicator = ({ index: dotIndex }: { index: number }) => {
        const dotStyle = useAnimatedStyle(() => {
            const inputRange = [(dotIndex - 1) * SCREEN_WIDTH, dotIndex * SCREEN_WIDTH, (dotIndex + 1) * SCREEN_WIDTH];
            const width = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
            const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
            return { width, opacity };
        });

        return <Animated.View style={[styles.dot, { backgroundColor: c.primary }, dotStyle]} />;
    };

    // Button scale
    const btnScale = useSharedValue(1);
    const btnAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnScale.value }],
    }));

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            {/* Skip */}
            <View style={styles.skipWrapper}>
                <Pressable
                    style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.5 : 1 }]}
                    onPress={finishOnboarding}
                >
                    <Text style={[styles.skipText, { color: c.textSecondary }]}>Skip</Text>
                </Pressable>
            </View>

            {/* Slides */}
            <View style={styles.slidesContainer}>
                <Animated.FlatList
                    ref={flatListRef as any}
                    data={slides}
                    renderItem={renderSlide}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setCurrentIndex(idx);
                    }}
                    keyExtractor={(item) => item.id}
                />
            </View>

            {/* Bottom */}
            <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
                {/* Dots */}
                <View style={styles.dots}>
                    {slides.map((_, i) => (
                        <DotIndicator key={i} index={i} />
                    ))}
                </View>

                {/* Button */}
                <AnimatedPressable
                    style={[btnAnimatedStyle]}
                    onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); }}
                    onPressOut={() => { btnScale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
                    onPress={handleNext}
                >
                    <LinearGradient
                        colors={[c.primary, `${c.primary}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.nextBtn, { borderCurve: 'continuous' } as any]}
                    >
                        <Text style={styles.nextBtnText}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                        {currentIndex === slides.length - 1 ? (
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                        ) : (
                            <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                        )}
                    </LinearGradient>
                </AnimatedPressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    skipWrapper: { alignItems: 'flex-end', paddingHorizontal: 20, paddingVertical: 8, zIndex: 10 },
    skipBtn: { paddingHorizontal: 16, paddingVertical: 8 },
    skipText: { fontSize: fontSize.base, fontWeight: '600' },
    slidesContainer: { flex: 1 },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    iconCircle: { width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: fontSize.base, lineHeight: 24, textAlign: 'center', marginBottom: 40 },
    features: { width: '100%', gap: 12 },
    featureRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.md, borderWidth: 1, gap: 14 },
    featureIconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    featureText: { fontSize: fontSize.base, fontWeight: '500', flex: 1 },
    bottom: { paddingHorizontal: 40, gap: 24 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { height: 8, borderRadius: 4 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radius.base, gap: 8 },
    nextBtnText: { color: '#FFF', fontSize: fontSize.lg, fontWeight: '700' },
});
