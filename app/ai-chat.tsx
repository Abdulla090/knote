import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Sparkles, Brain, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useNotesStore } from '../src/stores/useNotesStore';
import { askAboutNotes } from '../src/services/ai';
import { fontSize, spacing, radius } from '../src/constants/theme';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}

const SUGGESTIONS = [
    '📝 Summarize all my notes',
    '🔍 What topics do I write about most?',
    '📋 List all my action items',
    '💡 What ideas have I captured recently?',
    '📊 Give me an overview of my notes',
];

export default function AIChatScreen() {
    const { theme } = useTheme();
    const c = theme.colors;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = useCallback(async (text?: string) => {
        const question = (text || input).trim();
        if (!question || loading) return;

        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: question,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const allNotes = useNotesStore.getState().notes
                .filter((n) => !n.isDeleted && !n.isArchived)
                .slice(0, 30)
                .map((n) => ({
                    title: n.title || n.aiTitle || 'Untitled',
                    content: (n.content || n.transcription || '').slice(0, 300),
                    date: new Date(n.createdAt).toLocaleDateString(),
                }));

            const answer = await askAboutNotes(question, allNotes);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: answer || "I couldn't find a relevant answer in your notes.",
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (e) {
            console.error(e);
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: 'Sorry, something went wrong. Please try again.',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errMsg]);
        }

        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }, [input, loading]);

    const clearChat = () => {
        setMessages([]);
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View
                entering={FadeInDown.duration(300).springify().damping(18)}
                style={[
                    styles.msgRow,
                    isUser ? styles.msgRowUser : styles.msgRowAi,
                ]}
            >
                {!isUser && (
                    <View style={[styles.aiAvatar, { backgroundColor: c.primarySurface }]}>
                        <Brain size={16} color={c.primary} strokeWidth={2} />
                    </View>
                )}
                <View
                    style={[
                        styles.msgBubble,
                        isUser
                            ? [styles.userBubble, { backgroundColor: c.primary }]
                            : [styles.aiBubble, { backgroundColor: c.surfaceElevated, borderColor: c.border }],
                    ]}
                >
                    <Text
                        style={[
                            styles.msgText,
                            { color: isUser ? '#FFF' : c.textPrimary },
                        ]}
                        selectable
                    >
                        {item.text}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Animated.View entering={FadeIn.duration(500)} style={[styles.emptyIcon, { backgroundColor: c.primarySurface }]}>
                <Brain size={48} color={c.primary} strokeWidth={1.5} />
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>KNote AI</Text>
            <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                Ask me anything about your notes.{'\n'}I have access to all of them! 🧠
            </Text>
            <View style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                    <Animated.View key={i} entering={FadeInDown.delay(100 + i * 50).duration(300)}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.suggestionChip,
                                { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any,
                            ]}
                            onPress={() => sendMessage(s.replace(/^[^\s]+\s/, ''))}
                        >
                            <Text style={[styles.suggestionText, { color: c.textPrimary }]}>{s}</Text>
                        </Pressable>
                    </Animated.View>
                ))}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.headerBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Sparkles size={18} color={c.primary} strokeWidth={2} />
                    <Text style={[styles.headerTitle, { color: c.textPrimary }]}>KNote AI</Text>
                </View>
                <Pressable
                    style={({ pressed }) => [styles.headerBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' } as any]}
                    onPress={clearChat}
                >
                    <Trash2 size={18} color={c.textSecondary} strokeWidth={2} />
                </Pressable>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.messagesList, messages.length === 0 && { flex: 1 }]}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
                    }}
                />

                {/* Loading indicator */}
                {loading && (
                    <Animated.View entering={FadeIn.duration(200)} style={[styles.typingIndicator, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
                        <ActivityIndicator size="small" color={c.primary} />
                        <Text style={[styles.typingText, { color: c.textSecondary }]}>KNote AI is thinking...</Text>
                    </Animated.View>
                )}

                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: c.background, borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
                    <View style={[styles.inputRow, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderCurve: 'continuous' } as any]}>
                        <TextInput
                            style={[styles.input, { color: c.textPrimary }]}
                            placeholder="Ask about your notes..."
                            placeholderTextColor={c.textTertiary}
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={500}
                            onSubmitEditing={() => sendMessage()}
                            editable={!loading}
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendBtn,
                                { backgroundColor: input.trim() ? c.primary : c.skeleton, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            <Send size={18} color="#FFF" strokeWidth={2} />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    headerBtn: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '800' },
    messagesList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
    msgRow: { marginBottom: spacing.md, flexDirection: 'row', gap: spacing.xs },
    msgRowUser: { justifyContent: 'flex-end' },
    msgRowAi: { justifyContent: 'flex-start' },
    aiAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    msgBubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
    userBubble: { borderBottomRightRadius: 4 },
    aiBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
    msgText: { fontSize: fontSize.sm, lineHeight: 22 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    emptyTitle: { fontSize: fontSize['2xl'], fontWeight: '800', marginBottom: spacing.xs },
    emptySubtitle: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
    suggestions: { width: '100%', gap: spacing.sm },
    suggestionChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
    suggestionText: { fontSize: fontSize.sm, fontWeight: '500' },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
    typingText: { fontSize: fontSize.xs, fontWeight: '500' },
    inputContainer: { borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: spacing.xs },
    input: { flex: 1, fontSize: fontSize.base, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 4 },
    sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
