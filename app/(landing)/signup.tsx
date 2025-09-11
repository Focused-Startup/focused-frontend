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

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSignup = () => {
    // Add signup logic here
    router.replace('/(tabs)');
  };

  const handleLogin = () => {
    router.back();
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
              <FocusedLogo width={200} height={60} x={50} y={100} />
            </ThemedView>

            <ThemedView style={styles.formContainer}>

              <ThemedView style={styles.inputContainer}>
                <ThemedView style={styles.nameRow}>
                  <TextInput
                    style={[styles.nameInput, { borderColor: colors.icon, color: colors.text }]}
                    placeholder="First Name"
                    placeholderTextColor={colors.icon}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={[styles.nameInput, { borderColor: colors.icon, color: colors.text }]}
                    placeholder="Last Name"
                    placeholderTextColor={colors.icon}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </ThemedView>
                
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
                
                <TextInput
                  style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.icon}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </ThemedView>

              <GradientButton
                title="Create Account"
                onPress={handleSignup}
                style={styles.signupButton}
              />

              <ThemedView style={styles.loginContainer}>
                <ThemedText style={[styles.loginText, { color: colors.icon }]}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleLogin}>
                  <ThemedText style={[styles.loginLink, { color: colors.tint }]}>
                    Sign In
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
    marginBottom: 32,
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'transparent',
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
  signupButton: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});