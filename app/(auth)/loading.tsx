import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LandingScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('./login');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('@/assets/images/focused.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ThemedText type="title" style={styles.title}>
        Focused
      </ThemedText>
      <ThemedText style={styles.tagline}>
        Stay intentional. Stay present.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    marginBottom: 28,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 16,
  },
});
