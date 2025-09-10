import { ThemedView } from '@/components/ThemedView';
import { Platform, StatusBar, StyleSheet, Image } from 'react-native';
import FocusedLogo from '@/components/FocusedLogo';

export function Header() {
    return (
        <ThemedView style={styles.container}>
            <FocusedLogo />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
});