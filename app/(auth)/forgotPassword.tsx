import { Platform, StyleSheet, ScrollView, StatusBar, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import FocusedLogo from '@/components/FocusedLogo';
import { GradientButton } from '@/components/ui/GradientButton';
import { useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleResetPassword = () => {
    // Add password reset logic here
    setIsEmailSent(true);
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleResendEmail = () => {
    // Add resend logic here
    console.log('Resending email...');
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
                  <ThemedText style={styles.subtitle}>
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
                    onPress={handleResetPassword}
                    style={styles.resetButton}
                    disabled={!email.trim()}
                  />
                </>
              ) : (
                <>
                  <ThemedText style={styles.title}>
                    Check Your Email
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    We've sent a password reset link to:
                  </ThemedText>
                  <ThemedText style={styles.emailText}>
                    {email}
                  </ThemedText>
                  <ThemedText style={styles.instructionText}>
                    Click the link in your email to reset your password. If you don't see the email, check your spam folder.
                  </ThemedText>

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
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
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
});