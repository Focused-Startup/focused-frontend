import { Platform, StyleSheet, ScrollView, StatusBar } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

export default function GoalsScreen() {
  return (
   <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollContainer}>
        <ThemedView>
          <ThemedText type="title">Goals</ThemedText>
          <ThemedText>Open up app/(tabs)/goals.tsx to start working on your app!</ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  }
});