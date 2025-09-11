import { Platform, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';

export default function HomeScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} />
        <ScrollView 
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 80, 
    paddingBottom: 20,
  },
  item: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  }
});