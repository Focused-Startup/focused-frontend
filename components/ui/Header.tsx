import { ThemedView } from '@/components/ThemedView';
import { Platform, StatusBar, StyleSheet, Animated } from 'react-native';
import FocusedLogo from '@/components/FocusedLogo';
import { useRef, useEffect } from 'react';

interface HeaderProps {
    isVisible?: boolean;
}

export function Header({ isVisible = true }: HeaderProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: isVisible ? 0 : -40,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: isVisible ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isVisible, translateY, opacity]);

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [{ translateY }],
                opacity,
            }
        ]}>
            <ThemedView style={styles.content}>
                <FocusedLogo />
            </ThemedView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
});