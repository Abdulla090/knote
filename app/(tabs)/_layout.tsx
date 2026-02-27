import React from 'react';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    FileText,
    FolderOpen,
    Plus,
    Search,
    Settings,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { layout, radius, fontSize } from '../../src/constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_ICONS = {
    index: { Icon: FileText, label: 'Notes' },
    folders: { Icon: FolderOpen, label: 'Folders' },
    search: { Icon: Search, label: 'Search' },
    settings: { Icon: Settings, label: 'Settings' },
} as const;

function CustomTabBar({ state, descriptors, navigation }: any) {
    const { theme, isDark } = useTheme();
    const c = theme.colors;
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const tabs = [
        { route: 'index', label: 'Notes' },
        { route: 'folders', label: 'Folders' },
        { route: '__center__', label: '' },
        { route: 'search', label: 'Search' },
        { route: 'settings', label: 'Settings' },
    ];

    return (
        <View style={[styles.tabBarWrapper]}>
            <View
                style={[
                    styles.tabBar,
                    {
                        backgroundColor: isDark ? 'rgba(15, 15, 23, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                        borderTopColor: c.tabBarBorder,
                        paddingBottom: Math.max(insets.bottom, 10),
                    },
                ]}
            >
                {tabs.map((tab, index) => {
                    if (tab.route === '__center__') {
                        return (
                            <CenterButton
                                key="center"
                                color={c.primary}
                                onPress={() => {
                                    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/note/new');
                                }}
                            />
                        );
                    }

                    const tabIndex = index > 2 ? index - 1 : index;
                    const isFocused = state.index === tabIndex;
                    const config = TAB_ICONS[tab.route as keyof typeof TAB_ICONS];
                    const { Icon } = config;

                    return (
                        <TabButton
                            key={tab.route}
                            Icon={Icon}
                            label={tab.label}
                            isFocused={isFocused}
                            activeColor={c.tabActive}
                            inactiveColor={c.tabInactive}
                            primarySurface={c.primary + '15'}
                            onPress={() => {
                                const route = state.routes[tabIndex];
                                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                                if (!isFocused && !event.defaultPrevented) {
                                    if (Platform.OS === 'ios') Haptics.selectionAsync();
                                    navigation.navigate(route.name);
                                }
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function TabButton({
    Icon,
    label,
    isFocused,
    activeColor,
    inactiveColor,
    primarySurface,
    onPress,
}: {
    Icon: any;
    label: string;
    isFocused: boolean;
    activeColor: string;
    inactiveColor: string;
    primarySurface: string;
    onPress: () => void;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[styles.tabItem, animatedStyle]}
            onPressIn={() => {
                scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={onPress}
        >
            <View style={[styles.tabIconWrap, isFocused && { backgroundColor: primarySurface }]}>
                <Icon
                    size={isFocused ? 22 : 20}
                    color={isFocused ? activeColor : inactiveColor}
                    strokeWidth={isFocused ? 2.2 : 1.8}
                />
            </View>
            <Text
                style={[
                    styles.tabLabel,
                    { color: isFocused ? activeColor : inactiveColor },
                    isFocused && styles.tabLabelActive,
                ]}
            >
                {label}
            </Text>
        </AnimatedPressable>
    );
}

function CenterButton({ color, onPress }: { color: string; onPress: () => void }) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[animatedStyle]}
            onPressIn={() => {
                scale.value = withSpring(0.85, { damping: 12, stiffness: 400 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 12, stiffness: 400 });
            }}
            onPress={onPress}
        >
            <LinearGradient
                colors={[color, `${color}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerButton}
            >
                <Plus size={26} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
        </AnimatedPressable>
    );
}

export default function TabLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="folders" />
            <Tabs.Screen name="search" />
            <Tabs.Screen name="settings" />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabIconWrap: {
        width: 44,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
    } as any,
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.1,
    },
    tabLabelActive: {
        fontWeight: '700',
    },
    centerButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -26,
        borderCurve: 'continuous',
        boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)',
    } as any,
});
