import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Canvas from '@/components/Canvas';
import { ThemedText } from '@/components/ThemedText';

export default function FriendCanvasScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const id = Number(friendId);

  if (!friendId || !Number.isSafeInteger(id) || id <= 0) {
    return (
      <View style={styles.status}>
        <ThemedText>Invalid friend ID.</ThemedText>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <ThemedText style={styles.action}>Go back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return <Canvas friendId={id} onBack={() => router.back()} />;
}

const styles = StyleSheet.create({
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  action: { color: '#007AFF', fontWeight: '600' },
});
