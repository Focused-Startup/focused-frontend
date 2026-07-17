import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp, useUser } from '@clerk/expo';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { CREATE_USER } from '@/graphql/queries';
import { useMutation } from '@apollo/client/react';

export default function VerifyEmailScreen() {
  const { fetchStatus, signUp } = useSignUp();
  const { user } = useUser();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('Enter the code we sent to your email.');
  const [createUser] = useMutation(CREATE_USER);

  const disabled = useMemo(() => {
    return !code.trim() || isSubmitting || fetchStatus === 'fetching';
  }, [code, isSubmitting, fetchStatus]);

  const onVerifyCodePress = async () => {
    if (disabled) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (verifyError) {
        setErrorMessage(verifyError.longMessage ?? verifyError.message ?? 'Invalid code. Please try again.');
        return;
      }

      if (signUp.status === 'complete') {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          setErrorMessage(finalizeResult.error.longMessage ?? finalizeResult.error.message ?? 'Unable to finalize sign-up. Please try again.');
          return;
        }
        const username = user?.username ?? '';
        const email = user?.primaryEmailAddress?.emailAddress ?? '';
        await createUser({
          variables: {
            username: username.trim(),
            email: email.trim(),  
          },
        });
        router.replace('/(tabs)');
        return;
      }

      setInfoMessage('Verification is still pending. Double-check your code and try again.');
    } catch (error: unknown) {
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? 'Unable to verify code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendCodePress = async () => {
    if (fetchStatus === 'fetching') return;

    setErrorMessage('');

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setErrorMessage(error.longMessage ?? error.message ?? 'Unable to resend code right now.');
        return;
      }
      setInfoMessage('A new verification code was sent to your email.');
    } catch (error: unknown) {
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? 'Unable to resend code right now.');
    }
  };

  return (
    <AuthScreenShell
      title="Verify your email"
    >
      <ThemedTextInput
        placeholder="Verification code"
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
      />

      {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
      {!!infoMessage && <ThemedText style={styles.infoText}>{infoMessage}</ThemedText>}

      <GradientButton
        title={isSubmitting ? 'Verifying...' : 'Verify Email'}
        onPress={onVerifyCodePress}
        disabled={disabled}
      />

      <View style={styles.linksRow}>
        <Pressable onPress={onResendCodePress}>
          <ThemedText type="link">Resend code</ThemedText>
        </Pressable>
      </View>

      <View style={styles.footerRow}>
        <ThemedText>Already verified? </ThemedText>
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
