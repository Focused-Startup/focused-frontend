import { Platform, StyleSheet, ScrollView, StatusBar, TextInput, TouchableOpacity } from 'react-native';
import { Header } from '@/components/ui/Header';
import { GradientButton } from '@/components/ui/GradientButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { quotes } from '@/constants/Quotes';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from '@/components/ui/CompatSwipeable';
import { eq } from 'drizzle-orm';

export default function HomeScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const [notesData, setNotesData] = useState<schema.Note[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [randomQuote, setRandomQuote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.notes);
      setNotesData(results);
    } catch (e) {
      console.error('Error fetching notes:', e);
    }
  }, [drizzleDb]);

  useEffect(() => {
    const randomQuote = pickRandomQuote();
    setRandomQuote(randomQuote);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addNote = async () => {
    if (!inputValue.trim()) return;
    try {
      await drizzleDb.insert(schema.notes).values({
        content: inputValue,
        createdAt: Date.now(),
      });
      setInputValue('');
      fetchData();
    } catch (e) {
      console.error('Error inserting note:', e);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await drizzleDb.delete(schema.notes).where(eq(schema.notes.id, id));
      fetchData();
    } catch (e) {
      console.error('Error deleting note:', e);
    }
  };

  const pickRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    const quoteParts = quote.split(' - ');
    const quoteWithQuotes = `"${quoteParts[0]}"`;
    return quoteWithQuotes + (quoteParts[1] ? ` - ${quoteParts[1]}` : '');
  };

  const renderRightActions = (progress: any, dragX: any, id: number) => {
    return (
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteNote(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} />
        <ScrollView 
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            <ThemedView style={styles.quote}>
              <ThemedText style={styles.quoteText}>{randomQuote}</ThemedText>
            </ThemedView>
            <TextInput 
              style={styles.input} 
              placeholder="What's on your mind?" 
              placeholderTextColor="#95a5a6"
              multiline
              value={inputValue}
              onChangeText={setInputValue}
            />
            <GradientButton 
              onPress={addNote}
              title="Save Note"
              style={{ marginBottom: 32 }}
            />
            
            {notesData.map((note) => (
              <Swipeable
                key={note.id}
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, note.id)}
              >
                <ThemedView style={styles.item}>
                  <ThemedText style={styles.noteContent}>{note.content}</ThemedText>
                  <ThemedText style={styles.noteDate}>
                    {new Date(note.createdAt).toLocaleDateString(undefined, { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </ThemedText>
                </ThemedView>
              </Swipeable>
            ))}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 120, 
    paddingBottom: 100,
  },
  item: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glass-like effect
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  quote: {
    padding: 24,
    marginBottom: 32,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#4facfe',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e1e4e8',
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
  }
});