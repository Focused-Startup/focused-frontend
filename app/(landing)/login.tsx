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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = () => {
    // Add login logic here
    router.replace('/(tabs)');
  };

  const handleSignUp = () => {
    router.push('/(landing)/signup');
  };

  const handleForgotPassword = () => {
    router.push('/(landing)/forgotPassword');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
              <FocusedLogo width={250} height={80} x={50} y={100} />
            </ThemedView>

            <ThemedView style={styles.formContainer}>

              <ThemedView style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </ThemedView>

              <GradientButton
                title="Sign In"
                onPress={handleLogin}
                style={styles.loginButton}
              />

              <TouchableOpacity onPress={handleForgotPassword}>
                <ThemedText style={[styles.forgotText, { color: colors.tint }]}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              <ThemedView style={styles.signupContainer}>
                <ThemedText style={[styles.signupText, { color: colors.icon }]}>
                  Don't have an account?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleSignUp}>
                  <ThemedText style={[styles.signupLink, { color: colors.tint }]}>
                    Sign Up
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  loginButton: {
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});