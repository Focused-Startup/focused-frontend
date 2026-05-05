import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@clerk/expo';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { GradientButton } from '@/components/ui/GradientButton';

export default function ForgotPasswordScreen() {
  const { fetchStatus, signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const disabled = useMemo(() => {
    return !email.trim() || isSubmitting || fetchStatus === 'fetching';
  }, [email, isSubmitting, fetchStatus]);

  const onResetPress = async () => {
    if (disabled) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() });
      if (createError) {
        setErrorMessage(createError.longMessage ?? createError.message ?? 'Unable to start reset.');
        return;
      }

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setErrorMessage(sendError.longMessage ?? sendError.message ?? 'Unable to send reset email.');
        return;
      }

      setSuccessMessage('Reset code sent. Check your inbox for next steps.');
      router.push(`./reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error: unknown) {
      const fallback = 'Unable to send reset email. Please try again.';
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Reset your password"
      subtitle="Enter your account email and we will send reset instructions."
    >
      <ThemedTextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
      {!!successMessage && <ThemedText style={styles.successText}>{successMessage}</ThemedText>}

      <GradientButton
        title={isSubmitting ? 'Sending...' : 'Send Reset Email'}
        onPress={onResetPress}
        disabled={disabled}
      />

      <View style={styles.footerRow}>
        <Link href="./login" asChild>
          <Pressable>
            <ThemedText type="link">Back to login</ThemedText>
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
  successText: {
    color: '#2e7d32',
    marginBottom: 12,
  },
  footerRow: {
    marginTop: 20,
    alignItems: 'center',
  },
});
