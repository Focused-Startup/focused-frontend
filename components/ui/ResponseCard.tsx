import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { View, StyleSheet } from 'react-native';
import type { Response } from '@/contexts/UserContext';

export function ResponseCard({ response, colorScheme }: { response: Response; colorScheme: 'light' | 'dark' | 'unspecified' }) {
  return (
    <ThemedView style={styles.answerCard}>
      <View style={styles.answerHeader}>
        <View style={styles.answerMeta}>
          <ThemedText style={styles.answerAuthorName}>{response.authorName}</ThemedText>
          <ThemedText style={styles.answerTimestamp}>
            {new Date(response.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.answerContent}>{response.body}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    answerCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  answerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerMeta: {
    flex: 1,
  },
  answerAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerTimestamp: {
    fontSize: 11,
    color: '#95a5a6',
  },
  answerContent: {
    fontSize: 15,
    lineHeight: 22,
  },
});