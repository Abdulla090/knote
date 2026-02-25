import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import {
    FileText,
    Mic,
    Flame,
    Trophy,
    Clock,
    TrendingUp,
    Brain,
    Quote,
    Timer,
    Play,
    Pause,
    RotateCcw,
    // Calendar icons
    ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { fontSize, spacing, radius } from '../constants/theme';
import { useSettingsStore, StreakData } from '../stores/useSettingsStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ======================================================================
// 1. STATS DASHBOARD
// ======================================================================
export function StatsDashboard({ colors, stats }: {
    colors: any;
    stats: { total: number; voice: number; text: number; words: number; favs: number };
}) {
    const statItems = [
        { label: 'Total Notes', value: stats.total, Icon: FileText, color: colors.primary, gradient: [colors.primary + '25', colors.primary + '08'] as [string, string] },
        { label: 'Voice Notes', value: stats.voice, Icon: Mic, color: colors.accent || '#EC4899', gradient: [colors.accent + '25', colors.accent + '08'] as [string, string] },
        { label: 'Text Notes', value: stats.text, Icon: FileText, color: '#3B82F6', gradient: ['#3B82F625', '#3B82F608'] },
        { label: 'Words Written', value: stats.words, Icon: TrendingUp, color: '#10B981', gradient: ['#10B98125', '#10B98108'] },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify().damping(18)} style={ds.container}>
            <View style={ds.grid}>
                {statItems.map((s, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeInDown.delay(150 + i * 60).duration(350).springify().damping(18)}
                        style={[ds.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}
                    >
                        <LinearGradient
                            colors={s.gradient as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[ds.statIconBg, { borderCurve: 'continuous' } as any]}
                        >
                            <s.Icon size={18} color={s.color} strokeWidth={2} />
                        </LinearGradient>
                        <Text style={[ds.statValue, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}>{s.value}</Text>
                        <Text style={[ds.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    );
}

const ds = StyleSheet.create({
    container: { marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    statCard: { flex: 1, minWidth: '45%', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', gap: spacing.xs },
    statIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ======================================================================
// 2. STREAK TRACKER
// ======================================================================
export function StreakTracker({ colors, streak }: { colors: any; streak: StreakData }) {
    const flameGlow = useSharedValue(0);

    useEffect(() => {
        if (streak.currentStreak > 0) {
            flameGlow.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true,
            );
        }
    }, [streak.currentStreak]);

    const flameStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + flameGlow.value * 0.08 }],
        opacity: 0.9 + flameGlow.value * 0.1,
    }));

    // Generate last 7 days
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
            key: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en', { weekday: 'narrow' }),
            isToday: i === 6,
        };
    });

    return (
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify().damping(18)} style={[sk.container, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
            <View style={sk.header}>
                <View style={sk.headerLeft}>
                    <Animated.View style={flameStyle}>
                        <Flame size={22} color={streak.currentStreak > 0 ? '#F59E0B' : colors.textTertiary} strokeWidth={2} fill={streak.currentStreak > 0 ? '#FBBF2440' : 'transparent'} />
                    </Animated.View>
                    <View>
                        <Text style={[sk.streakCount, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}>{streak.currentStreak}</Text>
                        <Text style={[sk.streakLabel, { color: colors.textSecondary }]}>
                            day streak
                        </Text>
                    </View>
                </View>
                <View style={sk.headerRight}>
                    <View style={[sk.bestBadge, { backgroundColor: '#F59E0B18', borderCurve: 'continuous' } as any]}>
                        <Trophy size={12} color="#F59E0B" strokeWidth={2.5} />
                        <Text style={[sk.bestText, { color: '#F59E0B', fontVariant: ['tabular-nums'] }]}>Best: {streak.longestStreak}</Text>
                    </View>
                    <View style={[sk.bestBadge, { backgroundColor: colors.primarySurface, borderCurve: 'continuous' } as any]}>
                        <Brain size={12} color={colors.primary} strokeWidth={2.5} />
                        <Text style={[sk.bestText, { color: colors.primary, fontVariant: ['tabular-nums'] }]}>{streak.totalNotesCreated} total</Text>
                    </View>
                </View>
            </View>

            {/* Mini Calendar */}
            <View style={sk.calendarRow}>
                {last7Days.map((day) => {
                    const isActive = streak.activeDays.includes(day.key);
                    return (
                        <View key={day.key} style={sk.dayCol}>
                            <Text style={[sk.dayLabel, { color: day.isToday ? colors.primary : colors.textTertiary }]}>{day.label}</Text>
                            <View style={[
                                sk.dayDot,
                                isActive
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 },
                                day.isToday && !isActive && { borderColor: colors.primary, borderWidth: 1.5 },
                            ]}>
                                {isActive && <View style={sk.dayDotInner} />}
                            </View>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const sk = StyleSheet.create({
    container: { borderRadius: radius.base, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.base },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    streakCount: { fontSize: 28, fontWeight: '800', lineHeight: 32, letterSpacing: -0.5 },
    streakLabel: { fontSize: 12, fontWeight: '500', marginTop: -2 },
    headerRight: { gap: spacing.xs, alignItems: 'flex-end' },
    bestBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs, gap: 4 },
    bestText: { fontSize: 11, fontWeight: '700' },
    calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol: { alignItems: 'center', gap: 6 },
    dayLabel: { fontSize: 10, fontWeight: '600' },
    dayDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dayDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
});

// ======================================================================
// 3. INSPIRATIONAL QUOTES
// ======================================================================
const QUOTES = [
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Write it down. Written goals have a way of transforming wishes into wants.", author: "Anonymous" },
    { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
    { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour" },
    { text: "A note is worth a thousand memories.", author: "Knote" },
    { text: "One small note today can change the way you think tomorrow.", author: "Unknown" },
    { text: "The faintest ink is more powerful than the strongest memory.", author: "Chinese Proverb" },
    { text: "Capture your thoughts before they escape. That's what notes are for.", author: "Knote" },
    { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
    { text: "Great ideas often start as a simple note.", author: "Knote" },
];

export function QuoteWidget({ colors }: { colors: any }) {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Pick quote based on day of year for consistency
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        setQuote(QUOTES[dayOfYear % QUOTES.length]);
    }, []);

    return (
        <Animated.View entering={FadeInDown.delay(300).duration(400).springify().damping(18)}>
            <LinearGradient
                colors={[colors.primary + '12', colors.accent + '08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[qt.container, { borderColor: colors.primary + '20', borderCurve: 'continuous' } as any]}
            >
                <View style={[qt.quoteIcon, { backgroundColor: colors.primary + '18', borderCurve: 'continuous' } as any]}>
                    <Quote size={16} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={[qt.quoteText, { color: colors.textPrimary }]}>"{quote.text}"</Text>
                <Text style={[qt.quoteAuthor, { color: colors.textSecondary }]}>— {quote.author}</Text>
            </LinearGradient>
        </Animated.View>
    );
}

const qt = StyleSheet.create({
    container: { borderRadius: radius.base, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1 },
    quoteIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    quoteText: { fontSize: fontSize.base, fontWeight: '500', fontStyle: 'italic', lineHeight: 22, marginBottom: spacing.sm },
    quoteAuthor: { fontSize: fontSize.xs, fontWeight: '600' },
});

// ======================================================================
// 4. FOCUS TIMER
// ======================================================================
export function FocusTimer({ colors, onComplete }: { colors: any; onComplete?: () => void }) {
    const focusDuration = useSettingsStore((s) => s.focusDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [isBreak, setIsBreak] = useState(false);

    const totalTime = focusDuration * 60;
    const progress = 1 - timeLeft / totalTime;
    const circumference = 2 * Math.PI * 36;

    useEffect(() => {
        setTimeLeft(focusDuration * 60);
    }, [focusDuration]);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsRunning(false);
                    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning]);

    const toggleTimer = () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRunning(false);
        setTimeLeft(focusDuration * 60);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <Animated.View entering={FadeInDown.delay(250).duration(400).springify().damping(18)} style={[ft.container, { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous' } as any]}>
            <View style={ft.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={[ft.timerIcon, { backgroundColor: '#F59E0B18', borderCurve: 'continuous' } as any]}>
                        <Timer size={16} color="#F59E0B" strokeWidth={2.5} />
                    </View>
                    <View>
                        <Text style={[ft.title, { color: colors.textPrimary }]}>Focus Mode</Text>
                        <Text style={[ft.subtitle, { color: colors.textTertiary }]}>{focusDuration} min session</Text>
                    </View>
                </View>
            </View>

            <View style={ft.timerArea}>
                {/* Circular progress */}
                <View style={ft.circleWrap}>
                    <Svg width={84} height={84} viewBox="0 0 84 84">
                        <SvgCircle
                            cx="42" cy="42" r="36"
                            stroke={colors.border}
                            strokeWidth="4"
                            fill="none"
                        />
                        <SvgCircle
                            cx="42" cy="42" r="36"
                            stroke={isBreak ? '#10B981' : colors.primary}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${circumference}`}
                            strokeDashoffset={circumference * (1 - progress)}
                            strokeLinecap="round"
                            transform="rotate(-90 42 42)"
                        />
                    </Svg>
                    <Text style={[ft.timeText, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}>
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </Text>
                </View>

                <View style={ft.controls}>
                    <Pressable
                        style={({ pressed }) => [ft.controlBtn, { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                        onPress={resetTimer}
                    >
                        <RotateCcw size={18} color={colors.textSecondary} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [ft.playBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, borderCurve: 'continuous' } as any]}
                        onPress={toggleTimer}
                    >
                        {isRunning ? (
                            <Pause size={20} color="#FFF" strokeWidth={2.5} fill="#FFF" />
                        ) : (
                            <Play size={20} color="#FFF" strokeWidth={2.5} fill="#FFF" />
                        )}
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
}

const ft = StyleSheet.create({
    container: { borderRadius: radius.base, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
    header: { marginBottom: spacing.md },
    timerIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: fontSize.md, fontWeight: '700' },
    subtitle: { fontSize: 11, fontWeight: '500' },
    timerArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    circleWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
    timeText: { position: 'absolute', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    controls: { flexDirection: 'row', gap: spacing.sm },
    controlBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    playBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});

// ======================================================================
// 5. QUICK ACTIONS (Smart suggestions)
// ======================================================================
export function QuickActions({ colors, onVoice, onText, onSearch }: {
    colors: any;
    onVoice: () => void;
    onText: () => void;
    onSearch: () => void;
}) {
    const actions = [
        { Icon: Mic, label: 'Voice Note', color: colors.accent || '#EC4899', gradient: [colors.accent + '20', colors.accent + '08'] as [string, string], onPress: onVoice },
        { Icon: FileText, label: 'Text Note', color: colors.primary, gradient: [colors.primary + '20', colors.primary + '08'] as [string, string], onPress: onText },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(50).duration(400).springify().damping(18)} style={qa.container}>
            {actions.map((a, i) => (
                <Pressable
                    key={i}
                    style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => {
                        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        a.onPress();
                    }}
                >
                    <LinearGradient
                        colors={a.gradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[qa.card, { borderColor: a.color + '25', borderCurve: 'continuous' } as any]}
                    >
                        <View style={[qa.iconBg, { backgroundColor: a.color + '20', borderCurve: 'continuous' } as any]}>
                            <a.Icon size={22} color={a.color} strokeWidth={2} />
                        </View>
                        <Text style={[qa.label, { color: colors.textPrimary }]}>{a.label}</Text>
                        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            ))}
        </Animated.View>
    );
}

const qa = StyleSheet.create({
    container: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    card: { padding: spacing.base, borderRadius: radius.base, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
    iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: fontSize.sm, fontWeight: '700' },
});
