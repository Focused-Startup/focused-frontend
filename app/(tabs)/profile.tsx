import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/expo';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/ui/GradientButton';
import GoalsModal from '@/components/ui/GoalsModal';
import Swipeable from '@/components/ui/CompatSwipeable';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as schema from '@/db/schema';
import { useScrollHeader } from '@/hooks/useScrollHeader';

const SUGGESTED_GOALS = [
  'Drink 8 glasses of water',
  'Read 10 pages',
  'Exercise for 30 minutes',
  'Meditate for 10 minutes',
  'Sleep 8 hours',
  'Eat a healthy breakfast',
  'Walk 10,000 steps',
  'Learn something new',
  'No sugar today',
  'Call a friend/family member',
];

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.profileField}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <ThemedText style={styles.fieldValue}>{value}</ThemedText>
    </ThemedView>
  );
}

export default function ProfileScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();

  const [notesData, setNotesData] = useState<schema.Note[]>([]);
  const [activeGoals, setActiveGoals] = useState<schema.Goal[]>([]);
  const [completedGoalIds, setCompletedGoalIds] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.notes).orderBy(desc(schema.notes.createdAt));
      setNotesData(results);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, [drizzleDb]);

  const fetchGoals = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.goals).where(eq(schema.goals.isActive, true));
      setActiveGoals(results);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  }, [drizzleDb]);

  useEffect(() => {
    fetchNotes();
    fetchGoals();
  }, [fetchNotes, fetchGoals]);

  const saveNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      await drizzleDb.insert(schema.notes).values({
        content: newNoteContent,
        createdAt: Date.now(),
      });
      setNewNoteContent('');
      setIsNoteModalVisible(false);
      fetchNotes();
    } catch (error) {
      console.error('Error inserting note:', error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await drizzleDb.delete(schema.notes).where(eq(schema.notes.id, id));
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const addGoal = async (content: string) => {
    if (activeGoals.some((goal) => goal.content === content)) return;

    try {
      await drizzleDb.insert(schema.goals).values({
        content,
        isActive: true,
        createdAt: Date.now(),
      });
      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const removeGoal = async (id: number) => {
    try {
      await drizzleDb.delete(schema.goals).where(eq(schema.goals.id, id));
      setCompletedGoalIds((previousIds) => previousIds.filter((goalId) => goalId !== id));
      fetchGoals();
    } catch (error) {
      console.error('Error removing goal:', error);
    }
  };

  const toggleGoalComplete = (id: number) => {
    setCompletedGoalIds((previousIds) =>
      previousIds.includes(id) ? previousIds.filter((goalId) => goalId !== id) : [...previousIds, id]
    );
  };

  const handleSignOut = async () => {
    if (isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      const fallback = 'Unable to sign out right now. Please try again.';
      const authError = error as { message?: string };
      setErrorMessage(authError?.message ?? fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRightActions = (id: number) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNote(id)}>
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  const renderGoalActions = (id: number) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => removeGoal(id)}>
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  const headerRight = (
    <View style={styles.headerButtons}>
      <TouchableOpacity onPress={() => setIsPickerVisible(true)} activeOpacity={0.7}>
        <Ionicons name="add-outline" size={32} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7}>
        <Ionicons name="settings-outline" size={26} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title="Profile" headerRight={headerRight} />
        <ScrollView
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Account
              </ThemedText>

              {!isLoaded ? (
                <ThemedText style={styles.emptyText}>Loading user info...</ThemedText>
              ) : (
                <ThemedView style={styles.profileCard}>
                  <ProfileField label="First name" value={user?.firstName ?? '—'} />
                  <ProfileField label="Last name" value={user?.lastName ?? '—'} />
                  <ProfileField label="Username" value={user?.username ?? '—'} />

                  {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}

                  <GradientButton
                    title={isSubmitting ? 'Signing out...' : 'Sign Out'}
                    onPress={handleSignOut}
                    disabled={isSubmitting}
                  />
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Notes
              </ThemedText>

              {notesData.length === 0 && (
                <ThemedText style={styles.emptyText}>No notes yet. Tap + to add one.</ThemedText>
              )}

              {notesData.map((note) => (
                <Swipeable key={note.id} renderRightActions={() => renderRightActions(note.id)}>
                  <ThemedView style={styles.item}>
                    <ThemedText style={styles.noteContent}>{note.content}</ThemedText>
                    <ThemedText style={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                  </ThemedView>
                </Swipeable>
              ))}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Goals
              </ThemedText>

              {activeGoals.length === 0 ? (
                <ThemedText style={styles.emptyText}>No active goals. Pick one below!</ThemedText>
              ) : (
                activeGoals.map((goal) => (
                  <Swipeable key={goal.id} renderRightActions={() => renderGoalActions(goal.id)}>
                    <TouchableOpacity onPress={() => toggleGoalComplete(goal.id)} activeOpacity={0.8}>
                      <ThemedView style={styles.goalCard}>
                        <Ionicons
                          name={completedGoalIds.includes(goal.id) ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={completedGoalIds.includes(goal.id) ? '#4CAF50' : '#b0b7c3'}
                        />
                        <ThemedText style={styles.goalText}>{goal.content}</ThemedText>
                      </ThemedView>
                    </TouchableOpacity>
                  </Swipeable>
                ))
              )}

              <ThemedView style={styles.suggestionsGrid}>
                {SUGGESTED_GOALS.map((suggestion, index) => {
                  const isAdded = activeGoals.some((goal) => goal.content === suggestion);
                  if (isAdded) return null;

                  return (
                    <TouchableOpacity key={index} style={styles.suggestionCard} onPress={() => addGoal(suggestion)}>
                      <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                      <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>

        {/* Picker: choose note or goal */}
        <Modal visible={isPickerVisible} transparent animationType="fade" onRequestClose={() => setIsPickerVisible(false)}>
          <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setIsPickerVisible(false)}>
            <View style={styles.pickerCard}>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  setIsPickerVisible(false);
                  setNewNoteContent('');
                  setIsNoteModalVisible(true);
                }}
              >
                <Ionicons name="document-text-outline" size={22} color="#007AFF" />
                <ThemedText style={styles.pickerOptionText}>Add Note</ThemedText>
              </TouchableOpacity>

              <View style={styles.pickerDivider} />

              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  setIsPickerVisible(false);
                  setIsModalVisible(true);
                }}
              >
                <Ionicons name="flag-outline" size={22} color="#007AFF" />
                <ThemedText style={styles.pickerOptionText}>Add Goal</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Note entry modal */}
        <Modal
          visible={isNoteModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsNoteModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.noteModalContainer}>
            <View style={styles.noteModalContent}>
              <View style={styles.noteModalHeader}>
                <TouchableOpacity onPress={() => setIsNoteModalVisible(false)}>
                  <ThemedText style={styles.noteModalAction}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">New Note</ThemedText>
                <TouchableOpacity onPress={saveNote} disabled={!newNoteContent.trim()}>
                  <ThemedText style={[styles.noteModalAction, !newNoteContent.trim() && styles.disabledAction]}>Save</ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.noteModalInput}
                multiline
                placeholder="Write your thoughts..."
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {isModalVisible && (
          <GoalsModal
            isVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onSave={async (goalContent) => addGoal(goalContent)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 18,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileField: {
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95a5a6',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  quoteCard: {
    padding: 24,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#4facfe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    color: '#2c3e50',
  },
  input: {
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  item: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 16,
    borderRadius: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  pickerOptionText: {
    fontSize: 17,
    fontWeight: '500',
  },
  pickerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  noteModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  noteModalContent: {
    backgroundColor: '#fff',
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
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  noteModalAction: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledAction: {
    opacity: 0.4,
  },
  noteModalInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
