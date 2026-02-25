import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioUri: string | null;
    startRecording: () => Promise<void>;
    pauseRecording: () => Promise<void>;
    resumeRecording: () => Promise<void>;
    stopRecording: () => Promise<string | null>;
    cancelRecording: () => Promise<void>;
    getAudioBase64: (uri: string) => Promise<string>;
    requestPermissions: () => Promise<boolean>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    const requestPermissions = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            return status === 'granted';
        } catch {
            return false;
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                throw new Error('Microphone permission not granted');
            }

            // Set audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create recording with high quality
            const { recording } = await Audio.Recording.createAsync(
                {
                    isMeteringEnabled: true,
                    android: {
                        extension: '.m4a',
                        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                        audioEncoder: Audio.AndroidAudioEncoder.AAC,
                        sampleRate: 44100,
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.m4a',
                        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                        audioQuality: Audio.IOSAudioQuality.HIGH,
                        sampleRate: 44100,
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    web: {
                        mimeType: 'audio/webm',
                        bitsPerSecond: 128000,
                    },
                }
            );

            recordingRef.current = recording;
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
            setAudioUri(null);

            // Start duration counter
            durationIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }, [requestPermissions]);

    const pauseRecording = useCallback(async () => {
        if (!recordingRef.current || !isRecording) return;
        try {
            await recordingRef.current.pauseAsync();
            setIsPaused(true);
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        } catch (error) {
            console.error('Error pausing recording:', error);
        }
    }, [isRecording]);

    const resumeRecording = useCallback(async () => {
        if (!recordingRef.current || !isPaused) return;
        try {
            await recordingRef.current.startAsync();
            setIsPaused(false);
            durationIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error resuming recording:', error);
        }
    }, [isPaused]);

    const stopRecording = useCallback(async (): Promise<string | null> => {
        if (!recordingRef.current) return null;
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            await recordingRef.current.stopAndUnloadAsync();

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recordingRef.current.getURI();
            recordingRef.current = null;
            setIsRecording(false);
            setIsPaused(false);
            setAudioUri(uri);
            return uri;
        } catch (error) {
            console.error('Error stopping recording:', error);
            setIsRecording(false);
            setIsPaused(false);
            return null;
        }
    }, []);

    const cancelRecording = useCallback(async () => {
        if (!recordingRef.current) return;
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;

            // Delete the file
            if (uri) {
                await FileSystem.deleteAsync(uri, { idempotent: true });
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setIsRecording(false);
            setIsPaused(false);
            setDuration(0);
            setAudioUri(null);
        } catch (error) {
            console.error('Error cancelling recording:', error);
            setIsRecording(false);
            setIsPaused(false);
        }
    }, []);

    const getAudioBase64 = useCallback(async (uri: string): Promise<string> => {
        if (Platform.OS === 'web') {
            // For web, fetch the blob and convert
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        // For native, use FileSystem
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64' as any,
        });
        return base64;
    }, []);

    return {
        isRecording,
        isPaused,
        duration,
        audioUri,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelRecording,
        getAudioBase64,
        requestPermissions,
    };
}
