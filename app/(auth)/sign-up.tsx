import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp } from '@clerk/expo';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { GradientButton } from '@/components/ui/GradientButton';

export default function SignUpScreen() {
  const { fetchStatus, signUp } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const disabled = useMemo(() => {
    return !email.trim() || !password.trim() || isSubmitting || fetchStatus === 'fetching';
  }, [email, password, isSubmitting, fetchStatus]);

  const onSignUpPress = async () => {
    if (disabled) return;

    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      const { error: createError } = await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      if (createError) {
        setErrorMessage(createError.longMessage ?? createError.message ?? 'Unable to create account.');
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize();
        router.replace('/(tabs)');
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setErrorMessage(sendError.longMessage ?? sendError.message ?? 'Unable to send verification code.');
        return;
      }

      setInfoMessage('Verification code sent. Check your email to continue.');
      router.push('./verify-email');
    } catch (error: unknown) {
      const fallback = 'Unable to create your account right now.';
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Create your account"
      subtitle="Use your email and password to get started."
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
      {!!infoMessage && <ThemedText style={styles.infoText}>{infoMessage}</ThemedText>}

      <GradientButton
        title={isSubmitting ? 'Creating account...' : 'Sign Up'}
        onPress={onSignUpPress}
        disabled={disabled}
      />

      <View style={styles.footerRow}>
        <ThemedText>Already have an account? </ThemedText>
        <Link href="./login" asChild>
          <Pressable>
            <ThemedText type="link">Log in</ThemedText>
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
  infoText: {
    color: '#2e7d32',
    marginBottom: 12,
  },
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
