import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ResponseCard } from '@/components/ui/ResponseCard';
import type { Question } from '@/contexts/UserContext';
import { useAppUser } from '@/contexts/UserContext';
import { ADD_RESPONSE, GET_FRIENDS } from '@/graphql/queries';
import { useMutation, useLazyQuery } from '@apollo/client/react';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser: user } = useAppUser();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [addResponse] = useMutation(ADD_RESPONSE);
  const [getFriends] = useLazyQuery(GET_FRIENDS);
  const [detail, setDetail] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswerModalVisible, setIsAnswerModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const getQuestionDetails = useCallback(async () => {
    try {
      setError(null);
     
      if (!id) return;

      const question = user?.questions.find((q) => q.id === Number(id));
      const { data: friendsData } = await getFriends({
        variables: { id: user?.id ?? 0 },
      });

      let resolvedQuestion = question ?? null;
      if (question && friendsData && friendsData.friends) {
        const responses = question.responses.map((response) => {
          const friend = friendsData.friends.users.find((f: any) => f.id === response.authorId);
          const myself = user?.id === response.authorId ? user : null;
          const friendOrMyself = friend || myself;
          return {
            ...response,
            authorName: friendOrMyself ? friendOrMyself.username : 'Unknown',
          };
        });
        resolvedQuestion = { ...question, responses };
      }

      setDetail(resolvedQuestion);
    } catch (err) {
      console.error('Failed to fetch question detail:', err);
      setError('Could not load this question.');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, getFriends]);

  useEffect(() => {
    getQuestionDetails();
  }, [getQuestionDetails]);

  const submitAnswer = async () => {
    if (!answerText.trim() || isSubmitting || !id) return;
    try {
      if (!user) {
        throw new Error('User not found. Please log in again.');
      }
      setIsSubmitting(true);

      const { data, error } = await addResponse({
        variables: {
          authorId: user.id,
          questionId: Number(id),
          body: answerText.trim(),
        },
      });

      if (data) {
        const newAnswer = { ...data.addResponse, authorName: user.username };
        setDetail((prev) =>
          prev
            ? { ...prev, responses: [...prev.responses, newAnswer] }
            : prev
        );
      } else {
        throw new Error(error?.message || 'Failed to post answer. Please try again.');
      }
      setAnswerText('');
      setIsAnswerModalVisible(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Failed to post answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Nav header */}
        <View style={[styles.navHeader, { borderBottomColor: colorScheme === 'dark' ? '#2a2f35' : '#f0f0f0' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.tint} />
            <ThemedText style={[styles.backLabel, { color: colors.tint }]}>Questions</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={colors.tint} />
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity onPress={getQuestionDetails} style={styles.retryButton}>
              <ThemedText style={[styles.retryText, { color: colors.tint }]}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : detail ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Question block */}
              <ThemedView style={styles.questionBlock}>
                <View style={styles.questionAuthorRow}>
                  <View>
                    <ThemedText style={styles.questionAuthorName}>{detail.authorName}</ThemedText>
                    <ThemedText style={styles.questionTimestamp}>
                      {new Date(detail.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.questionContent}>{detail.body}</ThemedText>
                <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <ThemedText style={styles.answerCountLabel}>
                      {detail.responses.length} {detail.responses.length === 1 ? 'Answer' : 'Answers'}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={() => setIsAnswerModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={[styles.answerButtonText, { color: colors.tint }]}>Answer</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              {/* Answers list */}
              {detail.responses.length === 0 ? (
                <View style={styles.emptyAnswers}>
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.iconLight} />
                  <ThemedText style={styles.emptyText}>No answers yet. Be the first!</ThemedText>
                </View>
              ) : (
                detail.responses.map((answer) => (
                  <ResponseCard key={answer.id} response={answer} colorScheme={colorScheme} />
                ))
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}

        <Modal
          visible={isAnswerModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsAnswerModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1c2026' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => { setIsAnswerModalVisible(false); setAnswerText(''); }}>
                  <ThemedText style={[styles.modalAction, { color: colors.tint }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">Your Answer</ThemedText>
                <TouchableOpacity onPress={submitAnswer} disabled={!answerText.trim() || isSubmitting}>
                  <ThemedText
                    style={[
                      styles.modalAction,
                      { color: colors.tint },
                      (!answerText.trim() || isSubmitting) && styles.modalActionDisabled,
                    ]}
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {detail && (
                <ThemedText style={styles.modalQuestion} numberOfLines={2}>
                  {detail.body}
                </ThemedText>
              )}
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                multiline
                placeholder="Write your answer..."
                placeholderTextColor={colors.iconLight}
                value={answerText}
                onChangeText={setAnswerText}
                autoFocus
                maxLength={1000}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  navHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  loader: {
    marginTop: 60,
  },
  centerState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionBlock: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  questionAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f3f4f6',
  },
  authorAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionAuthorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  questionTimestamp: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  questionContent: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
  },
  answerCountLabel: {
    fontSize: 13,
    color: '#95a5a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyAnswers: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  answerButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  answerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
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
    marginBottom: 16,
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionDisabled: {
    opacity: 0.4,
  },
  modalQuestion: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
});
