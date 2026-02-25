import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
    Inbox,
    Star,
    Briefcase,
    Home,
    Lightbulb,
    Trash2,
    FolderOpen,
    GraduationCap,
    Palette,
    FlaskConical,
    FileText,
    Music,
    Camera,
    Plane,
    Dumbbell,
    CookingPot,
    Heart,
    Bookmark,
    Code,
    ShoppingCart,
    Calendar,
    BookOpen,
    Trophy,
    Gamepad2,
    Stethoscope,
    Wallet,
    // Note templates
    StickyNote,
    Users,
    CheckSquare,
    BookOpenText,
    Zap,
    // Onboarding
    Mic,
    Sparkles,
    Pin,
    PaintBucket,
    Search,
    Globe,
    Tag,
    Languages,
} from 'lucide-react-native';

// Mapping icon name strings to Lucide icon components
const ICON_MAP: Record<string, any> = {
    // Folder default icons
    inbox: Inbox,
    star: Star,
    briefcase: Briefcase,
    home: Home,
    lightbulb: Lightbulb,
    trash: Trash2,
    folder: FolderOpen,
    'graduation-cap': GraduationCap,
    palette: Palette,
    flask: FlaskConical,
    'file-text': FileText,
    music: Music,
    camera: Camera,
    plane: Plane,
    dumbbell: Dumbbell,
    cooking: CookingPot,
    heart: Heart,
    bookmark: Bookmark,
    code: Code,
    shopping: ShoppingCart,
    calendar: Calendar,
    'book-open': BookOpen,
    trophy: Trophy,
    gamepad: Gamepad2,
    stethoscope: Stethoscope,
    wallet: Wallet,
    // Note templates
    'sticky-note': StickyNote,
    users: Users,
    'check-square': CheckSquare,
    'book-text': BookOpenText,
    zap: Zap,
    // Other
    mic: Mic,
    sparkles: Sparkles,
    pin: Pin,
    'paint-bucket': PaintBucket,
    search: Search,
    globe: Globe,
    tag: Tag,
    languages: Languages,
};

// All available folder icon names for the picker
export const FOLDER_ICON_NAMES = [
    'folder', 'briefcase', 'book-open', 'lightbulb', 'trophy',
    'home', 'palette', 'flask', 'file-text', 'music',
    'camera', 'plane', 'dumbbell', 'cooking', 'star', 'heart',
    'bookmark', 'code', 'shopping', 'calendar',
    'graduation-cap', 'gamepad', 'stethoscope', 'wallet',
];

// Note template icon names
export const TEMPLATE_ICONS = {
    quickNote: 'sticky-note',
    meeting: 'users',
    todo: 'check-square',
    journal: 'book-text',
    ideas: 'zap',
};

interface LucideIconProps {
    name: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
}

/**
 * Renders a Lucide icon by name string.
 * Falls back to FolderOpen if the name is not found.
 */
export function LucideIcon({ name, size = 22, color = '#6366F1', strokeWidth = 2 }: LucideIconProps) {
    const IconComponent = ICON_MAP[name] || FolderOpen;
    return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}

interface FolderIconProps {
    name: string;
    size?: number;
    color?: string;
    bgColor?: string;
    containerSize?: number;
    borderRadius?: number;
}

/**
 * Renders a folder icon in a colored container with matching background.
 */
export function FolderIconBadge({
    name,
    size = 22,
    color = '#6366F1',
    bgColor,
    containerSize = 48,
    borderRadius = 12,
}: FolderIconProps) {
    const bg = bgColor || `${color}18`;
    return (
        <View style={[styles.container, {
            width: containerSize,
            height: containerSize,
            borderRadius,
            backgroundColor: bg,
            borderCurve: 'continuous',
        } as any]}>
            <LucideIcon name={name} size={size} color={color} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
