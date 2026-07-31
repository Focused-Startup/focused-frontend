import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useUser } from '@clerk/expo';
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

type Answer = {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorImageUrl: string | null;
  content: string;
  createdAt: number;
};

type QuestionDetail = {
  question: {
    id: string;
    authorId: string;
    authorName: string;
    authorImageUrl: string | null;
    content: string;
    createdAt: number;
    answerCount: number;
  };
  answers: Answer[];
};

const MOCK_DETAIL_MAP: Record<string, QuestionDetail> = {
  '1': {
    question: {
      id: '1',
      authorId: 'user_1',
      authorName: 'Alex Johnson',
      authorImageUrl: null,
      content: "What's the best book you've read this year?",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      answerCount: 3,
    },
    answers: [
      {
        id: 'a1',
        questionId: '1',
        authorId: 'user_2',
        authorName: 'Sam Rivera',
        authorImageUrl: null,
        content: 'Atomic Habits by James Clear — completely changed how I think about routines.',
        createdAt: Date.now() - 1000 * 60 * 90,
      },
      {
        id: 'a2',
        questionId: '1',
        authorId: 'user_3',
        authorName: 'Jordan Lee',
        authorImageUrl: null,
        content: 'The Almanack of Naval Ravikant. Short but incredibly dense with good ideas.',
        createdAt: Date.now() - 1000 * 60 * 45,
      },
      {
        id: 'a3',
        questionId: '1',
        authorId: 'user_4',
        authorName: 'Taylor Kim',
        authorImageUrl: null,
        content: 'Project Hail Mary by Andy Weir — couldn\'t put it down.',
        createdAt: Date.now() - 1000 * 60 * 20,
      },
    ],
  },
  '2': {
    question: {
      id: '2',
      authorId: 'user_2',
      authorName: 'Sam Rivera',
      authorImageUrl: null,
      content: 'If you could live anywhere in the world for a year, where would you go?',
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
      answerCount: 5,
    },
    answers: [
      {
        id: 'a4',
        questionId: '2',
        authorId: 'user_1',
        authorName: 'Alex Johnson',
        authorImageUrl: null,
        content: 'Lisbon, Portugal. Amazing food, great weather, affordable, and the people are so welcoming.',
        createdAt: Date.now() - 1000 * 60 * 60 * 20,
      },
      {
        id: 'a5',
        questionId: '2',
        authorId: 'user_3',
        authorName: 'Jordan Lee',
        authorImageUrl: null,
        content: 'Tokyo — I\'d love to spend a full year really exploring the different neighborhoods.',
        createdAt: Date.now() - 1000 * 60 * 60 * 18,
      },
    ],
  },
  '3': {
    question: {
      id: '3',
      authorId: 'user_3',
      authorName: 'Jordan Lee',
      authorImageUrl: null,
      content: 'What habit has made the biggest positive impact on your life?',
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      answerCount: 1,
    },
    answers: [
      {
        id: 'a6',
        questionId: '3',
        authorId: 'user_2',
        authorName: 'Sam Rivera',
        authorImageUrl: null,
        content: 'Morning walks without my phone. Even just 15 minutes sets the tone for the whole day.',
        createdAt: Date.now() - 1000 * 60 * 60 * 40,
      },
    ],
  },
  '4': {
    question: {
      id: '4',
      authorId: 'user_4',
      authorName: 'Taylor Kim',
      authorImageUrl: null,
      content: "What's something you're proud of that most people don't know about?",
      createdAt: Date.now() - 1000 * 60 * 60 * 72,
      answerCount: 0,
    },
    answers: [],
  },
};

function getMockDetail(id: string): QuestionDetail {
  return (
    MOCK_DETAIL_MAP[id] ?? {
      question: {
        id,
        authorId: 'user_1',
        authorName: 'Unknown',
        authorImageUrl: null,
        content: 'Question not found.',
        createdAt: Date.now(),
        answerCount: 0,
      },
      answers: [],
    }
  );
}

function AnswerCard({ answer, colorScheme }: { answer: Answer; colorScheme: 'light' | 'dark' | 'unspecified' }) {
  const colors = Colors[colorScheme];
  return (
    <ThemedView style={styles.answerCard}>
      <View style={styles.answerHeader}>
        {answer.authorImageUrl ? (
          <Image source={{ uri: answer.authorImageUrl }} style={styles.answerAvatar} />
        ) : (
          <View style={[styles.answerAvatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#2a2f35' : '#eef2f6' }]}>
            <Ionicons name="person" size={14} color={colors.iconLight} />
          </View>
        )}
        <View style={styles.answerMeta}>
          <ThemedText style={styles.answerAuthorName}>{answer.authorName}</ThemedText>
          <ThemedText style={styles.answerTimestamp}>
            {new Date(answer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.answerContent}>{answer.content}</ThemedText>
    </ThemedView>
  );
}

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswerModalVisible, setIsAnswerModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      // TODO: replace with real API call: await questionsApi.getDetail(id, token)
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!id) return;
      setDetail(getMockDetail(id));
    } catch (err) {
      console.error('Failed to fetch question detail:', err);
      setError('Could not load this question.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const submitAnswer = async () => {
    if (!answerText.trim() || isSubmitting || !id) return;
    try {
      setIsSubmitting(true);
      // TODO: replace with real API call: await questionsApi.createAnswer(id, answerText.trim(), token)
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newAnswer: Answer = {
        id: String(Date.now()),
        questionId: id,
        authorId: 'me',
        authorName: user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'You',
        authorImageUrl: user?.imageUrl ?? null,
        content: answerText.trim(),
        createdAt: Date.now(),
      };
      setDetail((prev) =>
        prev
          ? { ...prev, answers: [...prev.answers, newAnswer] }
          : prev
      );
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
            <TouchableOpacity onPress={fetchDetail} style={styles.retryButton}>
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
                  {detail.question.authorImageUrl ? (
                    <Image source={{ uri: detail.question.authorImageUrl }} style={styles.authorAvatar} />
                  ) : (
                    <View style={[styles.authorAvatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#2a2f35' : '#eef2f6' }]}>
                      <Ionicons name="person" size={22} color={colors.iconLight} />
                    </View>
                  )}
                  <View>
                    <ThemedText style={styles.questionAuthorName}>{detail.question.authorName}</ThemedText>
                    <ThemedText style={styles.questionTimestamp}>
                      {new Date(detail.question.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.questionContent}>{detail.question.content}</ThemedText>
                <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <ThemedText style={styles.answerCountLabel}>
                      {detail.answers.length} {detail.answers.length === 1 ? 'Answer' : 'Answers'}
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
              {detail.answers.length === 0 ? (
                <View style={styles.emptyAnswers}>
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.iconLight} />
                  <ThemedText style={styles.emptyText}>No answers yet. Be the first!</ThemedText>
                </View>
              ) : (
                detail.answers.map((answer) => (
                  <AnswerCard key={answer.id} answer={answer} colorScheme={colorScheme} />
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
                  {detail.question.content}
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
