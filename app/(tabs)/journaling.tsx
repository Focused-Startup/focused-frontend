import { Platform, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, View, KeyboardAvoidingView } from 'react-native';
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
import { desc, eq } from 'drizzle-orm';

export default function JournalingScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const [entries, setEntries] = useState<schema.JournalEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<schema.JournalEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.journalEntries).orderBy(desc(schema.journalEntries.createdAt));
      setEntries(results);
    } catch (e) {
      console.error('Error fetching journal entries:', e);
    }
  }, [drizzleDb]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = async () => {
    if (!newEntryContent.trim()) return;
    try {
      if (selectedEntry) {
        // Update existing entry
        await drizzleDb.update(schema.journalEntries)
          .set({ content: newEntryContent })
          .where(eq(schema.journalEntries.id, selectedEntry.id));
      } else {
        // Insert new entry
        await drizzleDb.insert(schema.journalEntries).values({
          content: newEntryContent,
          createdAt: Date.now(),
        });
      }
      setNewEntryContent('');
      setSelectedEntry(null);
      setIsModalVisible(false);
      fetchEntries();
    } catch (e) {
      console.error('Error saving journal entry:', e);
    }
  };

  const openNewEntryModal = () => {
    setSelectedEntry(null);
    setNewEntryContent('');
    setIsModalVisible(true);
  };

  const openEditModal = (entry: schema.JournalEntry) => {
    setSelectedEntry(entry);
    setNewEntryContent(entry.content);
    setIsModalVisible(true);
  };

  const renderHeaderRight = (
    <TouchableOpacity onPress={openNewEntryModal}>
      <Ionicons name="create-outline" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title="Journal" headerRight={renderHeaderRight} />
        <ScrollView 
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            {entries.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>No journal entries yet. Start writing!</ThemedText>
              </ThemedView>
            ) : (
              entries.map((entry) => (
                <TouchableOpacity key={entry.id} onPress={() => openEditModal(entry)}>
                  <ThemedView style={styles.entryCard}>
                    <ThemedText style={styles.entryDate}>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </ThemedText>
                    <ThemedText style={styles.entryContent} numberOfLines={3}>{entry.content}</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))
            )}
          </ThemedView>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">{selectedEntry ? 'Edit Entry' : 'New Entry'}</ThemedText>
                <TouchableOpacity onPress={saveEntry} disabled={!newEntryContent.trim()}>
                  <ThemedText style={[styles.modalButtonText, !newEntryContent.trim() && styles.disabledButton]}>Save</ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                multiline
                placeholder="Write your thoughts..."
                value={newEntryContent}
                onChangeText={setNewEntryContent}
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
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    color: '#95a5a6',
    fontSize: 16,
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxHeight: 150,
  },
  entryDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 8,
    fontWeight: '600',
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
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
  modalButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalInput: {
    fontSize: 18,
    lineHeight: 28,
    flex: 1,
    textAlignVertical: 'top',
  },
});