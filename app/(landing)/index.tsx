import { Platform, StyleSheet, StatusBar } from 'react-native';
import FocusedLogo from '@/components/FocusedLogo';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(landing)/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.logoContainer}>
          <FocusedLogo width={200} height={100} x={50} y={50} />
        </ThemedView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});