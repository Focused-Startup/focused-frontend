import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, StatusBar } from 'react-native';


import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function ExploreScreen() {
  return (
   <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.container}>
        <ThemedView>
          <ThemedText type="title">Explore</ThemedText>
          <ThemedText>Open up app/(tabs)/explore.tsx to start working on your app!</ThemedText>
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
    backgroundColor: '#fff',
  },
});