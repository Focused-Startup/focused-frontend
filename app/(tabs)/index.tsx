import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
   <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.scrollContainer}>
        <ThemedView>
          <ThemedText type="title">Home</ThemedText>
          <ThemedText>Open up app/(tabs)/index.tsx to start working on your app!</ThemedText>
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