import { Platform, StyleSheet, ScrollView, StatusBar, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import FocusedLogo from '@/components/FocusedLogo';
import { GradientButton } from '@/components/ui/GradientButton';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth, useSignIn } from '@clerk/clerk-expo';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secondFactor, setSecondFactor] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  const handleSendEmail = async () => {
    await signIn?.create({
      strategy: 'reset_password_email_code',
      identifier: email,
    })
    .then((_) => {
      setIsEmailSent(true);
      setError('');
    })
    .catch((_) => {
      setError('Failed to send reset email. Please try again.');
      setIsEmailSent(false);
    });
  };

  const handleResetPassword = async () => {
    await signIn?.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code,
      password,
    })
    .then((result) => {
      if (result.status === 'needs_second_factor') {
        setSecondFactor(true);
        setError('');
      } else if (result.status === 'complete') {
        setActive({
          session: result.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }
            router.replace('/(tabs)')
          }
        })

      } else {

      }
    })
    .catch((_) => {
      setError('Failed to reset password. Please check the code and try again.');
    })
  }

  const handleResendEmail = () => {
    handleSendEmail();
  }

  const handleBackToLogin = () => {
    router.back();
  };


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={{flex: 1}}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={styles.logoContainer}>
              <FocusedLogo width={200} height={60} x={50} y={100} />
            </ThemedView>

            <ThemedView style={styles.formContainer}>
              {!isEmailSent ? (
                <>
                  <ThemedText style={[styles.subtitle, { marginBottom: 16 }]}>
                    No worries! Enter your email address and we'll send you a link to reset your password.
                  </ThemedText>

                  <ThemedView style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </ThemedView>

                  <GradientButton
                    title="Send Reset Link"
                    onPress={handleSendEmail}
                    style={styles.resetButton}
                    disabled={!email.trim()}
                  />
                </>
              ) : (
                <>
                  <ThemedText style={styles.subtitle}>
                    We've sent a password reset link to:
                  </ThemedText>
                  <ThemedText style={styles.emailText}>
                    {email}
                  </ThemedText>
                  {!!error && (
                    <ThemedText style={styles.errorText}>
                      {error}
                    </ThemedText>
                  )}
                  <ThemedView style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter reset code"
                      value={code}
                      onChangeText={setCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="default"
                      returnKeyType="done"
                    />
                  </ThemedView>
                  <ThemedView style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </ThemedView>
                  <ThemedView style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </ThemedView>
                  <GradientButton
                    title="Reset Password"
                    onPress={handleResetPassword}
                    style={styles.resetButton}
                    disabled={
                      !code.trim() ||
                      !password.trim() ||
                      !confirmPassword.trim() ||
                      password !== confirmPassword
                    }
                  />
                  <TouchableOpacity onPress={handleResendEmail}>
                    <ThemedText style={styles.resendText}>
                      Resend Email
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
                <ThemedText style={[styles.backText, { color: colors.tint }]}>
                  ← Back to Sign In
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  resetButton: {
    marginBottom: 24,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});