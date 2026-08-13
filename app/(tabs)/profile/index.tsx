import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import GoalsModal from '@/components/ui/GoalsModal';
import NoteModal from '@/components/ui/NoteModal';
import Swipeable from '@/components/ui/CompatSwipeable';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useAppUser, Note, Goal, GoalStatus } from '@/contexts/UserContext';
import { ADD_NOTE, UPDATE_NOTE, DELETE_NOTE, ADD_GOAL, DELETE_GOAL, UPDATE_GOAL, UPDATE_USER } from '@/graphql/queries';
import { useMutation } from '@apollo/client/react';
import { SUGGESTED_GOALS } from '@/constants/Goals';

const shuffleOneLiner = (arr: string[]) => arr
  .map(value => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value);

function ProfileField({ value }: { value: string }) {
  return (
    <ThemedView style={styles.profileField}>
      <ThemedText style={styles.fieldValue}>{value}</ThemedText>
    </ThemedView>
  );
}

export default function ProfileScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const { user, isLoaded } = useUser();
  const { appUser } = useAppUser();
  const colorScheme = useColorScheme();
  const [addNote] = useMutation(ADD_NOTE);
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [deleteNoteMutation] = useMutation(DELETE_NOTE);
  const [addGoal] = useMutation(ADD_GOAL);
  const [deleteGoal] = useMutation(DELETE_GOAL);
  const [updateGoal] = useMutation(UPDATE_GOAL);
  const [updateUser] = useMutation(UPDATE_USER);
  const [notesData, setNotesData] = useState<Note[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [completedGoalIds, setCompletedGoalIds] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | undefined>(undefined);
  const [feeling, setFeeling] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'goals'>('notes');
  const [shuffledGoals, setShuffledGoals] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [goalContent, setGoalContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setShuffledGoals(shuffleOneLiner(SUGGESTED_GOALS).slice(0, 5));
  }, []);

  useEffect(() => {
    if (appUser) {
      setFeeling(appUser.feeling ?? '');
      setNotesData(appUser.notes ?? []);
      setActiveGoals(appUser.goals?.filter((goal) => goal.dueDate && new Date(goal.dueDate) > new Date()).map(goal => ({ ...goal, createdAt: new Date(goal.createdAt), updatedAt: new Date(goal.updatedAt) })) ?? []);
      setCompletedGoalIds(appUser.goals?.filter((goal) => goal.status === 'completed').map((goal) => goal.id) ?? []);
    }
  }, [appUser]);

  const saveNote = async (content: string, noteId?: number) => {
    try {
      if (noteId !== undefined) {
        const { data } = await updateNote({
          variables: {
            updateNoteId: noteId,
            content,
          },
        });
        if (data?.updateNote) {
          setNotesData((prevNotes) => prevNotes.map((n) => (n.id === data.updateNote.id ? data.updateNote : n)));
        }
      } else if (appUser?.id) {
        const { data } = await addNote({
          variables: {
            authorId: appUser?.id,
            content,
          },
        });
        if (data?.addNote) {
          setNotesData((prevNotes) => [...prevNotes, data.addNote]);
        }
      } else {
        setErrorMessage('User not found. Please try again later.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save note.');
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const { data } = await deleteNoteMutation({
        variables: {
          deleteNoteId: id,
        },
      });
      if (data?.deleteNote?.success) {
        setNotesData((prevNotes) => prevNotes.filter((n) => n.id !== id));
      } else {
        setErrorMessage(data?.deleteNote?.message ?? 'Failed to delete note.');
      }
    } catch (error) {
      console.log('Error deleting note:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete note.');
    }
  };

  const addGoalHandler = async (content: string, dueDate: Date) => {
    try {
      if (appUser?.id) {
        const { data } = await addGoal({
          variables: {
            userId: appUser.id,
            content,
            dueDate,
          },
        });
        if (data?.addGoal) {
          setActiveGoals((prevGoals) => [...prevGoals, { ...data.addGoal, status: data.addGoal.status as GoalStatus, userId: appUser.id }]);
        }
      } else {
        setErrorMessage('User not found. Please try again later.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add goal.');
    }
  };

  const updateFeelingHandler = async (newFeeling: string) => {
    try {
      if (appUser?.id) {
        const { data } = await updateUser({
          variables: {
            id: appUser.id,
            feeling: newFeeling,
          },
        });
        if (data?.updateUser) {
          setFeeling(data.updateUser.feeling as string);
        }
        setIsEditing(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update feeling.');
    }
  };

  const removeGoalHandler = async (id: number) => {
    try {
      const { data } = await deleteGoal({
        variables: {
          deleteGoalId: id,
        },
      });
      if (data?.deleteGoal?.success) {
        setActiveGoals((prevGoals) => prevGoals.filter((g) => g.id !== id));
      } else {
        setErrorMessage(data?.deleteGoal?.message ?? 'Failed to delete goal.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete goal.');
    }
  };

  const handleSuggestedGoal = async (suggestion: string) => {
    setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Set due date to one week from now
    setGoalContent(suggestion);
    setIsModalVisible(true);
  };

  const toggleGoalComplete = async (id: number) => {
    try {
      const { data } = await updateGoal({
        variables: {
          updateGoalId: id,
          status: completedGoalIds.includes(id) ? 'active' : 'completed',
        },
      });
      if (data?.updateGoal) {
        setActiveGoals((prevGoals) => prevGoals.map((g) => (g.id === data.updateGoal.id ? { ...g, ...data.updateGoal, status: data.updateGoal.status as GoalStatus } : g)));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update goal status.');
    }
  };

  const renderRightActions = (id: number) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNote(id)}>
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  const renderLeftActions = (id: number) => (
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => {
        setEditingNoteId(id);
        setIsNoteModalVisible(true);
      }}
    >
      <Ionicons name="pencil-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  const renderGoalActions = (id: number) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => removeGoalHandler(id)}>
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  const headerRight = (
    <TouchableOpacity onPress={() => router.push(('/(tabs)/profile/settings'))} activeOpacity={0.7}>
      <Ionicons name="settings-outline" size={26} color="#007AFF" />
    </TouchableOpacity>
  );

  const headerLeft= (
    <TouchableOpacity onPress={() => setIsPickerVisible(true)} activeOpacity={0.7}>
      <Ionicons name="add-outline" size={32} color="#007AFF" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title={user?.username ?? 'Profile'} headerRight={headerRight} headerLeft={headerLeft} />
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            <ThemedView style={styles.section}>

              {!isLoaded ? (
                <ThemedText style={styles.emptyText}>Loading user info...</ThemedText>
              ) : (
                <ThemedView style={styles.profileCard}>
                  <ThemedView style={styles.profileSummaryRow}>
                    {user?.imageUrl ? (
                      <Image source={{ uri: user.imageUrl }} style={styles.profileAvatar} />
                    ) : (
                      <ThemedView style={styles.profileAvatarPlaceholder}>
                        <Ionicons name="person" size={34} color="#b0b7c3" />
                      </ThemedView>
                    )}
                  <ThemedView style={styles.nameAndFeeling}>
                  <ThemedView></ThemedView>
                    <ThemedView style={styles.profileFieldsColumn}>
                      <ProfileField value={user?.firstName ?? '—'} />
                      <ProfileField value={user?.lastName ?? '—'} />
                    </ThemedView>
                    <ThemedView style={{padding: 4, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      <ThemedText>I am feeling: </ThemedText>
                      {isEditing ? (
                        <TextInput
                          value={feeling}
                          onChangeText={setFeeling}
                          onBlur={() => updateFeelingHandler(feeling)}
                          style={{borderBottomWidth: 1, borderBottomColor: '#007AFF', flex: 1, paddingVertical: 2}}
                          autoFocus
                        />
                      ) : (
                        <ThemedText>{feeling ?? '—'}</ThemedText>
                      )}
                      <Ionicons name="pencil-outline" size={16} color="#007AFF" onPress={() => setIsEditing(!isEditing)} />
                    </ThemedView>
                  </ThemedView>
                  </ThemedView>

                  {!!errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedView style={styles.tabSwitcher}>
                <TouchableOpacity
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'notes' && styles.activeTabButton),
                    borderBottomColor: activeTab === 'notes' ? Colors[colorScheme ?? 'light'].tint : '#b0b9c0',
                  }}
                  onPress={() => setActiveTab('notes')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={{...styles.tabButtonText, color: activeTab === 'notes' ? Colors[colorScheme ?? 'light'].tint : '#b0b9c0'}}>
                    Notes
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'goals' && styles.activeTabButton),
                    borderBottomColor: activeTab === 'goals' ? Colors[colorScheme ?? 'light'].tint : '#b0b9c0',
                  }}
                  onPress={() => setActiveTab('goals')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={{...styles.tabButtonText, color: activeTab === 'goals' ? Colors[colorScheme ?? 'light'].tint : '#b0b9c0'}}>
                    Goals
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {activeTab === 'notes' && (
                <>
                  {notesData.length === 0 && (
                    <ThemedText style={styles.emptyText}>No notes yet. Tap + to add one.</ThemedText>
                  )}

                  {notesData.map((note) => (
                    <Swipeable key={note.id} renderRightActions={() => renderRightActions(note.id)} renderLeftActions={() => renderLeftActions(note.id)}>
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
                </>
              )}

              {activeTab === 'goals' && (
                <>
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
                    {shuffledGoals.map((suggestion, index) => {
                      const isAdded = activeGoals.some((goal) => goal.content === suggestion);
                      if (isAdded) return null;

                      return (
                        <TouchableOpacity key={index} style={styles.suggestionCard} onPress={() => handleSuggestedGoal(suggestion)} activeOpacity={0.8}>
                          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                          <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </ThemedView>
                </>
              )}
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
                  setEditingNoteId(undefined);
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
        {isNoteModalVisible && (
          <NoteModal
            isVisible={isNoteModalVisible}
            onClose={() => {
              setIsNoteModalVisible(false);
              setEditingNoteId(undefined);
            }}
            noteId={editingNoteId}
            initialContent={notesData.find((n) => n.id === editingNoteId)?.content ?? ''}
            onSave={saveNote}
          />
        )}

        {isModalVisible && (
          <GoalsModal
            isVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onSave={async (goalContent, dueDate) => addGoalHandler(goalContent, dueDate)}
            goalContent={goalContent}
            initialDueDate={dueDate}
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
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
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    marginBottom: 4,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7a8794',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  profileCard: {
    paddingBottom: 16,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
  },
  profileAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f6',
  },
  profileFieldsColumn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  profileField: {
    padding: 2,
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
  editButton: {
    backgroundColor: '#007AFF',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameAndFeeling: {
    flex: 1,
    flexDirection: 'column',
  }
});
