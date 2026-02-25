import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, AppTheme } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: AppTheme;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: darkTheme,
    themeMode: 'system',
    setThemeMode: () => { },
    isDark: true,
});

const THEME_STORAGE_KEY = '@knote_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
            if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
                setThemeModeState(stored as ThemeMode);
            }
            setLoaded(true);
        });
    }, []);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    }, []);

    const isDark = useMemo(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark';
        }
        return themeMode === 'dark';
    }, [themeMode, systemColorScheme]);

    const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

    const value = useMemo(
        () => ({ theme, themeMode, setThemeMode, isDark }),
        [theme, themeMode, setThemeMode, isDark]
    );

    if (!loaded) return null;

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function useColors() {
    return useTheme().theme.colors;
}
