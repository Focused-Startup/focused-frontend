import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from '@/components/ui/CompatSwipeable';
import { eq } from 'drizzle-orm';
import GoalsModal from '@/components/ui/GoalsModal';

const SUGGESTED_GOALS = [
  "Drink 8 glasses of water",
  "Read 10 pages",
  "Exercise for 30 minutes",
  "Meditate for 10 minutes",
  "Sleep 8 hours",
  "Eat a healthy breakfast",
  "Walk 10,000 steps",
  "Learn something new",
  "No sugar today",
  "Call a friend/family member"
];

export default function GoalsScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const [activeGoals, setActiveGoals] = useState<schema.Goal[]>([]);
  const [completedGoalIds, setCompletedGoalIds] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.goals).where(eq(schema.goals.isActive, true));
      setActiveGoals(results);
    } catch (e) {
      console.error('Error fetching goals:', e);
    }
  }, [drizzleDb]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (content: string) => {
    // Check if already active
    if (activeGoals.some(g => g.content === content)) return;

    try {
      await drizzleDb.insert(schema.goals).values({
        content,
        isActive: true,
        createdAt: Date.now(),
      });
      fetchGoals();
    } catch (e) {
      console.error('Error adding goal:', e);
    }
  };

  const removeGoal = async (id: number) => {
    try {
      await drizzleDb.delete(schema.goals).where(eq(schema.goals.id, id));
      setCompletedGoalIds((previousIds) => previousIds.filter((goalId) => goalId !== id));
      fetchGoals();
    } catch (e) {
      console.error('Error removing goal:', e);
    }
  };

  const toggleGoalComplete = (id: number) => {
    setCompletedGoalIds((previousIds) => {
      if (previousIds.includes(id)) {
        return previousIds.filter((goalId) => goalId !== id);
      }

      return [...previousIds, id];
    });
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => removeGoal(id)}>
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const openGoalsModal = () => {
    setIsModalVisible(true);
  };

  const saveCustomGoal = async (goalContent: string) => {
    await addGoal(goalContent);
  };

  const renderHeaderRight = (
    <TouchableOpacity onPress={openGoalsModal} activeOpacity={0.8}>
      <Ionicons name="add-outline" size={36} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title="Goals" headerRight={renderHeaderRight} />
        <ScrollView 
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            
            {/* Active Goals Section */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>My Goals</ThemedText>
              {activeGoals.length === 0 ? (
                <ThemedText style={styles.emptyText}>No active goals. Pick one below!</ThemedText>
              ) : (
                activeGoals.map((goal) => (
                  <Swipeable key={goal.id} renderRightActions={() => renderRightActions(goal.id)}>
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
            </ThemedView>

            {/* Suggested Goals Section */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Suggested Goals</ThemedText>
              <ThemedView style={styles.suggestionsGrid}>
                {SUGGESTED_GOALS.map((suggestion, index) => {
                  const isAdded = activeGoals.some(g => g.content === suggestion);
                  if (isAdded) return null; // Hide if already added

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.suggestionCard}
                      onPress={() => addGoal(suggestion)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                      <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>
            </ThemedView>
          {isModalVisible && (
            <GoalsModal
              isVisible={isModalVisible}
              onClose={() => setIsModalVisible(false)}
              onSave={saveCustomGoal}
            />
          )}
          </ThemedView>
        </ScrollView>
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
    paddingTop: 80,
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
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
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
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
    borderRadius: 16,
  },
});