import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

interface UseAudioPlayerReturn {
    isPlaying: boolean;
    isPaused: boolean;
    position: number; // ms
    duration: number; // ms
    playbackSpeed: number;
    loadAudio: (uri: string) => Promise<void>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    seekTo: (positionMs: number) => Promise<void>;
    setSpeed: (speed: number) => void;
    unload: () => Promise<void>;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const soundRef = useRef<Audio.Sound | null>(null);

    const loadAudio = useCallback(async (uri: string) => {
        try {
            // On web, blob URLs can become invalid after navigation/hot-reload
            if (Platform.OS === 'web' && uri.startsWith('blob:')) {
                try {
                    const response = await fetch(uri, { method: 'HEAD' });
                    if (!response.ok) {
                        console.warn('Audio blob URL is no longer valid (web only):', uri);
                        return;
                    }
                } catch {
                    console.warn('Audio blob URL expired (web only). This is normal on web.');
                    return;
                }
            }

            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false, rate: playbackSpeed },
                (status) => {
                    if (status.isLoaded) {
                        setPosition(status.positionMillis || 0);
                        setDuration(status.durationMillis || 0);
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                            setIsPaused(false);
                            setPosition(0);
                        }
                    }
                }
            );

            soundRef.current = sound;
        } catch (error) {
            console.warn('Error loading audio (may be expected on web):', error);
        }
    }, [playbackSpeed]);

    const play = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            await soundRef.current.playAsync();
            setIsPlaying(true);
            setIsPaused(false);
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }, []);

    const pause = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
            setIsPaused(true);
        } catch (error) {
            console.error('Error pausing audio:', error);
        }
    }, []);

    const stop = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            await soundRef.current.stopAsync();
            setIsPlaying(false);
            setIsPaused(false);
            setPosition(0);
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    }, []);

    const seekTo = useCallback(async (positionMs: number) => {
        if (!soundRef.current) return;
        try {
            await soundRef.current.setPositionAsync(positionMs);
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }, []);

    const setSpeed = useCallback(
        (speed: number) => {
            setPlaybackSpeed(speed);
            if (soundRef.current) {
                soundRef.current.setRateAsync(speed, true);
            }
        },
        []
    );

    const unload = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setIsPlaying(false);
        setIsPaused(false);
        setPosition(0);
        setDuration(0);
    }, []);

    return {
        isPlaying,
        isPaused,
        position,
        duration,
        playbackSpeed,
        loadAudio,
        play,
        pause,
        stop,
        seekTo,
        setSpeed,
        unload,
    };
}
