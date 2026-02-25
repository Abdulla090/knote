import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNoteById } from '../../src/stores/useNotesStore';
import { generateMindMap } from '../../src/services/ai';
import { radius, spacing, fontSize } from '../../src/constants/theme';

interface MindMapNodeProps {
    node: any;
    depth?: number;
    colorScale: string[];
}

function MindMapNode({ node, depth = 0, colorScale }: MindMapNodeProps) {
    const { theme } = useTheme();
    const c = theme.colors;
    const [expanded, setExpanded] = useState(true);

    const hasChildren = node.children && node.children.length > 0;
    const color = colorScale[Math.min(depth, colorScale.length - 1)];

    return (
        <Animated.View layout={Layout.springify()} style={[styles.nodeWrapper, { marginLeft: depth === 0 ? 0 : 20, borderLeftWidth: depth === 0 ? 0 : 2, borderLeftColor: color + '40' }]}>
            <Pressable
                style={({ pressed }) => [styles.nodeContent, { backgroundColor: pressed ? c.surfaceElevated : 'transparent' }]}
                onPress={() => hasChildren && setExpanded(!expanded)}
            >
                <View style={[styles.nodeLine, { backgroundColor: depth === 0 ? 'transparent' : color + '40' }]} />
                <View style={[styles.nodeBox, { backgroundColor: depth === 0 ? color : c.surfaceElevated, borderColor: color, borderWidth: depth === 0 ? 0 : 1 }]}>
                    <Text style={[styles.nodeLabel, { color: depth === 0 ? '#FFF' : c.textPrimary, fontWeight: depth === 0 ? '800' : '600' }]}>{node.label}</Text>
                </View>
                {hasChildren && (
                    <View style={styles.expandIcon}>
                        {expanded ? <ChevronDown size={14} color={c.textTertiary} /> : <ChevronRight size={14} color={c.textTertiary} />}
                    </View>
                )}
            </Pressable>

            {expanded && hasChildren && (
                <View style={styles.childrenContainer}>
                    {node.children.map((child: any, idx: number) => (
                        <MindMapNode key={child.id || idx.toString()} node={child} depth={depth + 1} colorScale={colorScale} />
                    ))}
                </View>
            )}
        </Animated.View>
    );
}

export default function MindMapScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const note = useNoteById(id || '');
    const router = useRouter();
    const { theme } = useTheme();
    const c = theme.colors;
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState<any>(null);

    const colorScale = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

    useEffect(() => {
        if (!note) return;
        const fetchMap = async () => {
            setLoading(true);
            try {
                const textContext = note.content || note.transcription || '';
                const result = await generateMindMap(textContext, note.language);
                setMapData(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchMap();
    }, [note?.id]);

    if (!note) return null;

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Mind Map: {note.title || 'Untitled'}</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#EC4899" />
                    <Text style={[styles.loadingText, { color: c.textSecondary }]}>Analyzing structure...</Text>
                </View>
            ) : !mapData || (!mapData.children && mapData.id === 'root' && mapData.label === 'Error generating map') ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: c.error }]}>Failed to generate mind map. Content might be too short.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} horizontal={true}>
                    <ScrollView contentContainerStyle={styles.scrollVertical}>
                        <Animated.View entering={FadeInDown.duration(400).springify()}>
                            <MindMapNode node={mapData} colorScale={colorScale} />
                        </Animated.View>
                    </ScrollView>
                </ScrollView>
            )}
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
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    loadingText: { marginTop: spacing.md, fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center' },
    content: { padding: spacing.xl, paddingBottom: 100, minWidth: '100%' },
    scrollVertical: { flexGrow: 1 },

    nodeWrapper: { marginVertical: 4 },
    nodeContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderRadius: radius.sm },
    nodeLine: { width: 20, height: 2 },
    nodeBox: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, maxWidth: 260 },
    nodeLabel: { fontSize: fontSize.sm },
    expandIcon: { marginLeft: 8 },
    childrenContainer: { marginTop: 4 },
});
