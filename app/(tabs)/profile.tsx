import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { router } from 'expo-router';

import { Header } from '@/components/ui/Header';
import { GradientButton } from '@/components/ui/GradientButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignOut = async () => {
    if (isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      const fallback = 'Unable to sign out right now. Please try again.';
      const authError = error as { message?: string };
      setErrorMessage(authError?.message ?? fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Profile" />
        <ThemedView style={styles.content}>
          <ThemedText style={styles.description}>
            Manage your account session from here.
          </ThemedText>

          {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}

          <GradientButton
            title={isSubmitting ? 'Signing out...' : 'Sign Out'}
            onPress={handleSignOut}
            disabled={isSubmitting}
          />
        </ThemedView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  description: {
    marginBottom: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
});
