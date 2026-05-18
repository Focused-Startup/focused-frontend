import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Platform, StatusBar, StyleSheet, Animated, View } from 'react-native';
import FocusedLogo from '@/components/FocusedLogo';
import { useRef, useEffect } from 'react';

interface HeaderProps {
    isVisible?: boolean;
    title?: string;
    headerRight?: React.ReactNode;
    headerLeft?: React.ReactNode;
}

export function Header({ isVisible = true, title, headerRight, headerLeft }: HeaderProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const hasLeft = Boolean(headerLeft);
    const hasRight = Boolean(headerRight);
    const showCenteredTitle = hasLeft && hasRight;
    const showLeftAlignedTitle = !hasLeft && hasRight;

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
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <ThemedView style={styles.content}>
                <View style={styles.sideContainer}>{headerLeft ?? null}</View>
                <View style={styles.titleContainer}>
                    {title ? (
                        <ThemedText
                            type="title"
                            numberOfLines={1}
                            style={[
                                styles.title,
                                showCenteredTitle ? styles.centerTitle : undefined,
                                showLeftAlignedTitle ? styles.leftTitle : undefined,
                            ]}
                        >
                            {title}
                        </ThemedText>
                    ) : (
                        <FocusedLogo />
                    )}
                </View>
                <View style={[styles.sideContainer, styles.rightContainer]}>{headerRight ?? null}</View>
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
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sideContainer: {
        width: 40,
        minHeight: 40,
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContainer: {
        alignItems: 'flex-end',
    },
    title: {
        textAlign: 'center',
    },
    centerTitle: {
        textAlign: 'center',
    },
    leftTitle: {
        textAlign: 'left',
    },
});