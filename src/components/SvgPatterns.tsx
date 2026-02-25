import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Rect, G } from 'react-native-svg';

interface PatternProps {
    width: number;
    height: number;
    colors: any;
    opacity?: number;
}

// ========== WAVE PATTERN ==========
export function WavePattern({ width, height, colors, opacity = 0.08 }: PatternProps) {
    const h = height;
    const w = width;
    return (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                <Defs>
                    <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={colors.primary} stopOpacity={opacity} />
                        <Stop offset="1" stopColor={colors.accent} stopOpacity={opacity * 0.5} />
                    </SvgLinearGradient>
                </Defs>
                <Path
                    d={`M0 ${h * 0.6} C ${w * 0.25} ${h * 0.4}, ${w * 0.5} ${h * 0.8}, ${w} ${h * 0.55} L ${w} ${h} L 0 ${h} Z`}
                    fill="url(#waveGrad)"
                />
                <Path
                    d={`M0 ${h * 0.75} C ${w * 0.3} ${h * 0.65}, ${w * 0.65} ${h * 0.85}, ${w} ${h * 0.7} L ${w} ${h} L 0 ${h} Z`}
                    fill={colors.primary}
                    opacity={opacity * 0.6}
                />
            </Svg>
        </View>
    );
}

// ========== DOTS GRID ==========
export function DotsPattern({ width, height, colors, opacity = 0.06 }: PatternProps) {
    const gap = 32;
    const dots: { x: number; y: number }[] = [];
    for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
            dots.push({ x, y });
        }
    }
    return (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width={width} height={height}>
                {dots.map((d, i) => (
                    <Circle key={i} cx={d.x} cy={d.y} r={1.5} fill={colors.primary} opacity={opacity + (i % 3) * 0.02} />
                ))}
            </Svg>
        </View>
    );
}

// ========== GEO/CIRCUIT PATTERN ==========
export function CircuitPattern({ width, height, colors, opacity = 0.05 }: PatternProps) {
    return (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width={width} height={height}>
                <Defs>
                    <SvgLinearGradient id="circuitGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={colors.accent} stopOpacity={opacity} />
                        <Stop offset="1" stopColor={colors.primary} stopOpacity={opacity * 0.3} />
                    </SvgLinearGradient>
                </Defs>
                {/* Hexagon-like shapes */}
                <G opacity={opacity * 2}>
                    <Circle cx={width * 0.85} cy={height * 0.12} r={60} fill="none" stroke={colors.primary} strokeWidth={0.8} />
                    <Circle cx={width * 0.85} cy={height * 0.12} r={30} fill="none" stroke={colors.primary} strokeWidth={0.5} />
                    <Circle cx={width * 0.1} cy={height * 0.45} r={80} fill="none" stroke={colors.accent} strokeWidth={0.6} />
                    <Circle cx={width * 0.1} cy={height * 0.45} r={40} fill="none" stroke={colors.accent} strokeWidth={0.4} />
                    <Circle cx={width * 0.7} cy={height * 0.8} r={50} fill="none" stroke={colors.primary} strokeWidth={0.5} />
                </G>
                {/* Connection lines */}
                <Path
                    d={`M${width * 0.85} ${height * 0.12 + 60} L${width * 0.6} ${height * 0.35} L${width * 0.1} ${height * 0.45 - 80}`}
                    stroke={colors.primary}
                    strokeWidth={0.4}
                    fill="none"
                    opacity={opacity * 3}
                    strokeDasharray="5 8"
                />
            </Svg>
        </View>
    );
}

// ========== GRADIENT ORB ==========
export function GradientOrbs({ width, height, colors, opacity = 0.12 }: PatternProps) {
    return (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width={width} height={height}>
                <Defs>
                    <SvgLinearGradient id="orb1" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={colors.primary} stopOpacity={opacity} />
                        <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="orb2" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={colors.accent} stopOpacity={opacity * 0.7} />
                        <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                    </SvgLinearGradient>
                </Defs>
                <Circle cx={width * 0.8} cy={height * 0.15} r={120} fill="url(#orb1)" />
                <Circle cx={width * 0.15} cy={height * 0.6} r={100} fill="url(#orb2)" />
                <Circle cx={width * 0.6} cy={height * 0.85} r={80} fill="url(#orb1)" />
            </Svg>
        </View>
    );
}

// Map of all patterns by key
export const PATTERNS: Record<string, React.ComponentType<PatternProps>> = {
    none: () => null,
    waves: WavePattern,
    dots: DotsPattern,
    circuit: CircuitPattern,
    orbs: GradientOrbs,
};

export type PatternKey = keyof typeof PATTERNS;
