import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, FileText, Upload, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useNotesStore } from '../src/stores/useNotesStore';
import { parseDocumentImage } from '../src/services/ai';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { radius, spacing, fontSize } from '../src/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export default function DocumentScanScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const c = theme.colors;
    const insets = useSafeAreaInsets();
    const appLanguage = useSettingsStore(s => s.appLanguage);

    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);

    const pickImage = async (useCamera: boolean) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Camera permission is required to scan documents.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Gallery permission is required to select documents.');
                    return;
                }
            }

            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,
                });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                if (Haptics?.notificationAsync) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setImageUri(result.assets[0].uri);
                processDocument(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to read image.');
        }
    };

    const processDocument = async (base64: string, mimeType: string) => {
        setLoading(true);
        try {
            const parsedText = await parseDocumentImage(base64, mimeType, appLanguage);

            if (parsedText) {
                // Auto create the note
                const note = await useNotesStore.getState().createNote({
                    title: '📄 Scanned Document',
                    content: parsedText,
                    noteType: 'text',
                    language: appLanguage,
                });

                if (Haptics?.notificationAsync) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Redirect to the newly created note after a brief delay
                setTimeout(() => {
                    setLoading(false);
                    router.replace(`/note/${note.id}`);
                }, 1000);
            } else {
                setLoading(false);
                Alert.alert('Analysis Failed', 'Could not extract text from this document.');
                setImageUri(null);
            }
        } catch (err) {
            setLoading(false);
            console.error('Document scan error', err);
            Alert.alert('Error', 'An error occurred while analyzing the document.');
            setImageUri(null);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable style={({ pressed }) => [styles.hBtn, { backgroundColor: c.surfaceElevated, opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={c.textPrimary} strokeWidth={2} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>Scan Document</Text>
                </View>
                <View style={styles.hBtnPlaceholder} />
            </View>

            <View style={styles.content}>
                {loading ? (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingContainer}>
                        {imageUri && (
                            <Image source={{ uri: imageUri }} style={[styles.previewImage, { opacity: 0.3 }]} blurRadius={10} />
                        )}
                        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                        <Text style={[styles.loadingTitle, { color: c.textPrimary }]}>Analyzing Document...</Text>
                        <Text style={[styles.loadingDesc, { color: c.textSecondary }]}>Our vision AI is extracting the text and formatting it perfectly.</Text>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.actionContainer}>
                        <View style={[styles.heroIcon, { backgroundColor: '#3B82F615' }]}>
                            <FileText size={48} color="#3B82F6" strokeWidth={1.5} />
                            <View style={styles.heroSparkle}>
                                <Sparkles size={24} color="#F59E0B" fill="#F59E0B" />
                            </View>
                        </View>
                        <Text style={[styles.heroTitle, { color: c.textPrimary }]}>Smart AI Scanner</Text>
                        <Text style={[styles.heroDesc, { color: c.textSecondary }]}>
                            Scan physical documents, receipts, business cards, or handwritten notes. The AI will instantly read, structure, and save them for you.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: '#3B82F6', opacity: pressed ? 0.8 : 1 }]}
                            onPress={() => pickImage(true)}
                        >
                            <Camera size={20} color="#FFF" />
                            <Text style={styles.primaryBtnText}>Open Camera</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}
                            onPress={() => pickImage(false)}
                        >
                            <Upload size={20} color={c.textPrimary} />
                            <Text style={[styles.secondaryBtnText, { color: c.textPrimary }]}>Upload from Gallery</Text>
                        </Pressable>
                    </Animated.View>
                )}
            </View>
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
    content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
    actionContainer: { alignItems: 'center', paddingBottom: 60 },
    heroIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
    heroSparkle: { position: 'absolute', top: 10, right: 10 },
    heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
    heroDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center', opacity: 0.8, marginBottom: 40, paddingHorizontal: 20 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: radius.lg, width: '100%', gap: spacing.sm, marginBottom: spacing.md, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: radius.lg, borderWidth: 1, width: '100%', gap: spacing.sm },
    secondaryBtnText: { fontSize: 16, fontWeight: '700' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 60 },
    previewImage: { position: 'absolute', width: '100%', height: '100%', borderRadius: radius.xl },
    loadingTitle: { fontSize: 20, fontWeight: '700', marginTop: spacing.lg, marginBottom: 8 },
    loadingDesc: { fontSize: 14, textAlign: 'center', opacity: 0.7, paddingHorizontal: 40 },
});
