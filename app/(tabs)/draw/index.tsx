import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { useMemo, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { desc, eq } from 'drizzle-orm';
import Swipeable from '@/components/ui/CompatSwipeable';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';

type Stroke = {
  path: string;
  color: string;
};

function parseDrawingJson(drawingJson: string | null): Stroke[] {
  if (!drawingJson) return [];

  try {
    const parsed = JSON.parse(drawingJson);

    if (Array.isArray(parsed)) {
      return parsed
        .map((segment) => {
          if (typeof segment === 'string') {
            return { path: segment, color: '#2c3e50' };
          }

          if (typeof segment === 'object' && segment && typeof segment.path === 'string') {
            return {
              path: segment.path,
              color: typeof segment.color === 'string' ? segment.color : '#2c3e50',
            };
          }

          return null;
        })
        .filter((segment): segment is Stroke => segment !== null);
    }
  } catch {
    return [];
  }

  return [];
}

export default function DrawIndexScreen() {
  const { isHeaderVisible, handleScroll, scrollEventThrottle } = useScrollHeader();
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const router = useRouter();

  const [drawings, setDrawings] = useState<schema.Drawing[]>([]);

  const fetchDrawings = useCallback(async () => {
    try {
      const results = await drizzleDb.select().from(schema.drawings).orderBy(desc(schema.drawings.id));
      setDrawings(results);
    } catch (error) {
      console.error('Error fetching drawings:', error);
    }
  }, [drizzleDb]);

  useFocusEffect(
    useCallback(() => {
      fetchDrawings();
    }, [fetchDrawings])
  );

  const deleteDrawing = async (id: number) => {
    try {
      await drizzleDb.delete(schema.drawings).where(eq(schema.drawings.id, id));
      fetchDrawings();
    } catch (error) {
      console.error('Error deleting drawing:', error);
    }
  };

  const openCreateDrawing = () => {
    router.push('/(tabs)/draw/edit');
  };

  const openEditDrawing = (id: number) => {
    router.push({ pathname: '/(tabs)/draw/edit', params: { id: String(id) } });
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteDrawing(id)}>
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const renderHeaderRight = (
    <TouchableOpacity onPress={openCreateDrawing}>
      <Ionicons name="create-outline" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header isVisible={isHeaderVisible} title="Draw" headerRight={renderHeaderRight} />

        <ScrollView
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            <ThemedText style={styles.introText}>Sketch your ideas and save drawings to come back later.</ThemedText>

            {drawings.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>No drawings yet. Tap the pencil icon to create one.</ThemedText>
              </ThemedView>
            ) : (
              drawings.map((drawing) => {
                const previewStrokes = parseDrawingJson(drawing.drawingJson);

                return (
                  <Swipeable key={drawing.id} renderRightActions={() => renderRightActions(drawing.id)}>
                    <TouchableOpacity onPress={() => openEditDrawing(drawing.id)} activeOpacity={0.8}>
                      <ThemedView style={styles.entryCard}>
                        <ThemedText style={styles.entryDate}>Drawing #{drawing.id}</ThemedText>
                        <ThemedText style={styles.entryContent} numberOfLines={1}>
                          {drawing.name ?? 'Untitled Drawing'}
                        </ThemedText>
                        <View style={styles.previewContainer}>
                          <Svg width="100%" height="100%">
                            {previewStrokes.map((stroke, index) => (
                              <Path
                                key={`${drawing.id}-${index}`}
                                d={stroke.path}
                                stroke={stroke.color}
                                strokeWidth={3}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ))}
                          </Svg>
                        </View>
                      </ThemedView>
                    </TouchableOpacity>
                  </Swipeable>
                );
              })
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
  introText: {
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    color: '#95a5a6',
    fontSize: 16,
    textAlign: 'center',
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
    marginBottom: 10,
  },
  previewContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 16,
    borderRadius: 16,
  },
});
