import OwnCanvas from '@/components/OwnCanvas';
import { ThemedText } from '@/components/ThemedText';
import { useAppUser } from '@/contexts/UserContext';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { appUser, errorMessage, canvasReady, canvasError, retryCanvas } = useAppUser();

  return (
    <View style={styles.root}>
      {appUser && canvasReady ? <OwnCanvas key={appUser.id} ownerId={appUser.id} /> : (
        <View style={styles.status}>
          {canvasError || errorMessage ? (
            <ThemedText style={styles.errorText}>{canvasError ?? errorMessage}</ThemedText>
          ) : <ActivityIndicator />}
          {canvasError && (
          <TouchableOpacity onPress={retryCanvas} accessibilityRole="button">
            <ThemedText style={styles.retry}>Try again</ThemedText>
          </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retry: { color: '#007AFF', fontWeight: '600' },
});
