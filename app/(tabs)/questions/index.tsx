import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useAppUser } from '@/contexts/UserContext';
import { ADD_QUESTION } from '@/graphql/queries';
import { useMutation } from '@apollo/client/react';
import type { Question } from '@/contexts/UserContext';

export default function QuestionsScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { appUser, refetchUser } = useAppUser();
  const [addQuestion] = useMutation(ADD_QUESTION);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (appUser) {
      setQuestions(appUser.questions ?? []);
    } else {
      setQuestions([]);
    }
    setIsLoading(false);
  }, [appUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    try {
      refetchUser();
    } finally {
      setRefreshing(false);
    }
  };

  const postQuestion = async () => {
    if (!newQuestion.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      
      if (!appUser) {
        throw new Error('User not found. Please log in again.');
      }

      const { data } = await addQuestion({
        variables: {
          authorId: appUser?.id,
          body: newQuestion.trim(),
        },
      });

      if (!data || !data.addQuestion) {
        throw new Error('Failed to post question. Please try again.');
      }

      setQuestions((prevQuestions) => [...prevQuestions, data.addQuestion]);
      setNewQuestion('');
      setIsPostModalVisible(false);
    } catch (err) {
      console.error('Failed to post question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerRight = (
    <TouchableOpacity onPress={() => setIsPostModalVisible(true)} activeOpacity={0.7}>
      <Ionicons name="add-outline" size={32} color={colors.tint} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title="Questions" headerRight={headerRight} />
        <ScrollView
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.tint} />}
        >
          <View style={styles.content}>
            {isLoading ? (
              <ActivityIndicator style={styles.loader} size="large" color={colors.tint} />
            ) : error ? (
              <View style={styles.centerState}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity onPress={refetchUser} style={styles.retryButton}>
                  <ThemedText style={[styles.retryText, { color: colors.tint }]}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : questions.length === 0 ? (
              <View style={styles.centerState}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.iconLight} />
                <ThemedText style={styles.emptyText}>No questions yet. Tap + to ask one!</ThemedText>
              </View>
            ) : (
              questions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={styles.questionCard}
                  onPress={() => router.push({ pathname: '/(tabs)/questions/[id]', params: { id: question.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.questionHeader}>
                    <View style={styles.questionMeta}>
                      <ThemedText style={styles.authorName}>{question.authorName}</ThemedText>
                      <ThemedText style={styles.timestamp}>
                        {new Date(question.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.questionContent}>{question.body}</ThemedText>
                  <View style={styles.questionFooter}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.iconLight} />
                    <ThemedText style={styles.answerCount}>
                      {question.responses.length} {question.responses.length === 1 ? 'answer' : 'answers'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        <Modal
          visible={isPostModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsPostModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1c2026' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsPostModalVisible(false)}>
                  <ThemedText style={[styles.modalAction, { color: colors.tint }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">Ask a Question</ThemedText>
                <TouchableOpacity onPress={postQuestion} disabled={!newQuestion.trim() || isSubmitting}>
                  <ThemedText
                    style={[
                      styles.modalAction,
                      { color: colors.tint },
                      (!newQuestion.trim() || isSubmitting) && styles.disabledAction,
                    ]}
                  >
                    Post
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                multiline
                placeholder="What do you want to ask your friends?"
                placeholderTextColor={colors.iconLight}
                value={newQuestion}
                onChangeText={setNewQuestion}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 60,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 60,
  },
  centerState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontWeight: '600',
    fontSize: 15,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 10,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
  },
  questionContent: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  questionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerCount: {
    fontSize: 13,
    color: '#95a5a6',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledAction: {
    opacity: 0.4,
  },
  modalInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
});
