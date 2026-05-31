import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@clerk/expo';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { GradientButton } from '@/components/ui/GradientButton';

export default function LoginScreen() {
  const { fetchStatus, signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const disabled = useMemo(() => {
    return !email.trim() || !password.trim() || isSubmitting || fetchStatus === 'fetching';
  }, [email, password, isSubmitting, fetchStatus]);

  const onSignInPress = async () => {
    if (disabled) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() });
      if (createError) {
        setErrorMessage(createError.longMessage ?? createError.message ?? 'Unable to sign in.');
        return;
      }

      const { error: pwError } = await signIn.password({ password });
      if (pwError) {
        setErrorMessage(pwError.longMessage ?? pwError.message ?? 'Invalid password.');
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace('/(tabs)');
        return;
      }

      setErrorMessage('Additional sign-in steps are required. Please try again.');
    } catch (error: unknown) {
      const fallback = 'Unable to sign in with those credentials.';
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      logo={true}
    >
      <ThemedTextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      <ThemedTextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}

      <GradientButton
        title={isSubmitting ? 'Signing in...' : 'Log In'}
        onPress={onSignInPress}
        disabled={disabled}
      />

      <View style={styles.linksRow}>
        <Link href="./forgot-password" asChild>
          <Pressable>
            <ThemedText type="link">Forgot password?</ThemedText>
          </Pressable>
        </Link>
      </View>

      <View style={styles.footerRow}>
        <ThemedText>Don&apos;t have an account? </ThemedText>
        <Link href="./sign-up" asChild>
          <Pressable>
            <ThemedText type="link">Sign up</ThemedText>
          </Pressable>
        </Link>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  linksRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
