import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import FocusedLogo from '@/components/FocusedLogo';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type AuthScreenShellProps = {
  logo?: boolean;
  title?: string;
  children: ReactNode;
};

export function AuthScreenShell({ logo = false, title = '', children }: AuthScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.container}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/focused.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            {logo && (
                <FocusedLogo x={60} />
            )}
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>

            <View>{children}</View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 20,
  },
  title: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
  }
});
