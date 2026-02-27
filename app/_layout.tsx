import 'react-native-reanimated';
import '../src/locales/i18n';

import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, ActivityIndicator, View, Text, TextInput, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { useNotesStore } from '../src/stores/useNotesStore';
import { useFoldersStore } from '../src/stores/useFoldersStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import i18n from '../src/locales/i18n';

// Globally override font family for Text and TextInput
const customizeText = () => {
    const T: any = Text;
    const TI: any = TextInput;
    const customProps = { style: { fontFamily: 'Rabar_039' } };

    // Standard defaultProps approach
    if (T.defaultProps) T.defaultProps.style = { ...T.defaultProps.style, ...customProps.style };
    else T.defaultProps = customProps;

    if (TI.defaultProps) TI.defaultProps.style = { ...TI.defaultProps.style, ...customProps.style };
    else TI.defaultProps = customProps;

    // React Native 0.72+ forwardRef render override
    if (T.render) {
        const oldRender = T.render;
        T.render = function (...args: any) {
            const origin = oldRender.call(this, ...args);
            return React.cloneElement(origin, { style: [customProps.style, origin.props.style] });
        };
    }
    if (TI.render) {
        const oldRender = TI.render;
        TI.render = function (...args: any) {
            const origin = oldRender.call(this, ...args);
            return React.cloneElement(origin, { style: [customProps.style, origin.props.style] });
        };
    }
};
customizeText();

const ONBOARDING_KEY = '@knote_onboarded';

function AppContent() {
    const { theme, isDark } = useTheme();
    const appLanguage = useSettingsStore((s) => s.appLanguage);

    // Make Android system navigation bar transparent so app goes edge-to-edge
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync('transparent');
            NavigationBar.setPositionAsync('absolute');
            NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        }
    }, [isDark]);
    const initialized = useRef(false);
    const [ready, setReady] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [fontsLoaded] = useFonts({
        'Rabar_039': require('../assets/KFONT/Rabar_039.ttf'),
    });

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        (async () => {
            // Load all stores
            await Promise.all([
                useNotesStore.getState().loadNotes(),
                useFoldersStore.getState().loadFolders(),
                useSettingsStore.getState().loadSettings(),
                useSettingsStore.getState().loadStreak(),
            ]);

            // Check onboarding
            const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
            setShowOnboarding(!onboarded);
            setReady(true);
        })();
    }, []);

    useEffect(() => {
        if (appLanguage && i18n.language !== appLanguage) {
            i18n.changeLanguage(appLanguage);
        }
    }, [appLanguage]);

    if (!ready || !fontsLoaded) {
        return (
            <View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <>
            <Head>
                <title>Knote - AI-Powered Notes</title>
                <meta name="description" content="Knote is your ultimate AI-powered note companion. Transcribe voice, enhance text, generate flashcards, summaries, and mind maps using advanced artificial intelligence." />
                <meta name="keywords" content="AI notes, voice transcription, AI flashcards, smart notes, mind map generator, memo, AI productivity, KNote" />
                <meta property="og:title" content="Knote - AI-Powered Notes" />
                <meta property="og:description" content="Elevate your thoughts with Knote. Transcribe, enhance, study, and organize with advanced AI." />
                <meta property="og:type" content="website" />
                {Platform.OS === 'web' && (
                    <style type="text/css">{`
                        @font-face {
                            font-family: 'Rabar_039';
                            src: url(${require('../assets/KFONT/Rabar_039.ttf')}) format('truetype');
                        }
                        * { font-family: 'Rabar_039', sans-serif !important; }
                    `}</style>
                )}
            </Head>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                    animation: 'slide_from_right',
                }}
                initialRouteName={showOnboarding ? 'onboarding' : '(tabs)'}
            >
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="ai-chat" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="note/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="note/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="folder/[id]" options={{ animation: 'slide_from_right' }} />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
