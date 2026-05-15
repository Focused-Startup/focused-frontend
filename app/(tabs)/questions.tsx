import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function QuestionsScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.blank} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  blank: {
    flex: 1,
  },
});
