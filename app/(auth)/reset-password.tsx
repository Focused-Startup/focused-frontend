import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useSignIn } from '@clerk/expo';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { GradientButton } from '@/components/ui/GradientButton';

export default function ResetPasswordScreen() {
  const { fetchStatus, signIn } = useSignIn();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('Enter the reset code and a new password.');

  const disabled = useMemo(() => {
    return !code.trim() || !newPassword.trim() || isSubmitting || fetchStatus === 'fetching';
  }, [code, newPassword, isSubmitting, fetchStatus]);

  const onResetPasswordPress = async () => {
    if (disabled) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error: codeError } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (codeError) {
        setErrorMessage(codeError.longMessage ?? codeError.message ?? 'Invalid reset code.');
        return;
      }

      const { error: pwError } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });
      if (pwError) {
        setErrorMessage(pwError.longMessage ?? pwError.message ?? 'Unable to set new password.');
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace('/(tabs)');
        return;
      }

      setInfoMessage('Password reset is still pending. Check your code and try again.');
    } catch (error: unknown) {
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? 'Unable to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendCodePress = async () => {
    if (fetchStatus === 'fetching') return;

    setErrorMessage('');

    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        setErrorMessage(error.longMessage ?? error.message ?? 'Unable to resend reset code right now.');
        return;
      }
      setInfoMessage('A new reset code has been sent to your email.');
    } catch (error: unknown) {
      const clerkError = error as { message?: string };
      setErrorMessage(clerkError?.message ?? 'Unable to resend reset code right now.');
    }
  };

  return (
    <AuthScreenShell
      title="Set a new password"
      subtitle={email ? `Resetting password for ${email}` : 'Use the code sent to your email.'}
    >
      <ThemedTextInput
        placeholder="Reset code"
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
      />
      <ThemedTextInput
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
      {!!infoMessage && <ThemedText style={styles.infoText}>{infoMessage}</ThemedText>}

      <GradientButton
        title={isSubmitting ? 'Updating...' : 'Reset Password'}
        onPress={onResetPasswordPress}
        disabled={disabled}
      />

      <View style={styles.linksRow}>
        <Pressable onPress={onResendCodePress}>
          <ThemedText type="link">Resend reset code</ThemedText>
        </Pressable>
      </View>

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
  infoText: {
    color: '#2e7d32',
    marginBottom: 12,
  },
  linksRow: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  footerRow: {
    marginTop: 20,
    alignItems: 'center',
  },
});
