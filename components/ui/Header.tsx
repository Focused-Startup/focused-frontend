import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Platform, StatusBar, StyleSheet, Animated, TouchableOpacity, Modal, View, Text } from 'react-native';
import FocusedLogo from '@/components/FocusedLogo';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SignOutButton } from '../SignOutButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface HeaderProps {
    isVisible?: boolean;
    title?: string;
    headerRight?: React.ReactNode;
}

export function Header({ isVisible = true, title, headerRight }: HeaderProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const [modalVisible, setModalVisible] = useState(false);
    const colorScheme = useColorScheme();
    const iconColor = Colors[colorScheme ?? 'light'].text;

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
        <>
            <Animated.View style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                }
            ]}>
                <ThemedView style={styles.content}>
                    {title ? (
                        <ThemedText type="title" style={styles.title}>{title}</ThemedText>
                    ) : (
                        <FocusedLogo />
                    )}
                    <View style={styles.rightContainer}>
                        {headerRight}
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconContainer}>
                            <Ionicons name="person-circle-outline" size={32} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </Animated.View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Account</Text>
                        <View style={styles.modalItem}>
                            <SignOutButton onSignOut={() => setModalVisible(false)} />
                        </View>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
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
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    iconContainer: {
        padding: 4,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalItem: {
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        marginTop: 10,
        padding: 10,
    },
    closeButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
});