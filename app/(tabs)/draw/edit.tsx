import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { desc, eq } from 'drizzle-orm';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Stroke = {
  path: string;
  color: string;
  size?: number;
};

const DRAW_COLORS = ['#2c3e50', '#ff3b30', '#007AFF', '#34C759', '#AF52DE', '#FF9500'];
const STROKE_SIZES = [2, 4, 8, 14];

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
              size: typeof segment.size === 'number' ? segment.size : 4,
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

export default function DrawEditScreen() {
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [drawingName, setDrawingName] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<schema.Drawing | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState(DRAW_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(STROKE_SIZES[1]);

  const activePathRef = useRef('');

  const drawingId = params.id ? Number(params.id) : null;

  const loadDrawing = useCallback(async () => {
    if (!drawingId || Number.isNaN(drawingId)) {
      setSelectedDrawing(null);
      setDrawingName('');
      setStrokes([]);
      setCurrentPath('');
      activePathRef.current = '';
      return;
    }

    try {
      const [drawing] = await drizzleDb
        .select()
        .from(schema.drawings)
        .where(eq(schema.drawings.id, drawingId))
        .limit(1);

      if (!drawing) {
        return;
      }

      setSelectedDrawing(drawing);
      setDrawingName(drawing.name ?? 'Untitled Drawing');
      setStrokes(parseDrawingJson(drawing.drawingJson));
      setCurrentPath('');
      activePathRef.current = '';
    } catch (error) {
      console.error('Error loading drawing:', error);
    }
  }, [drizzleDb, drawingId]);

  useEffect(() => {
    loadDrawing();
  }, [loadDrawing]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentPath('');
    activePathRef.current = '';
  };

  const undoLastStroke = () => {
    setStrokes((previousStrokes) => previousStrokes.slice(0, -1));
  };

  const saveDrawing = async () => {
    const trimmedName = drawingName.trim();
    if (!trimmedName || strokes.length === 0) {
      return;
    }

    try {
      if (selectedDrawing) {
        await drizzleDb
          .update(schema.drawings)
          .set({
            name: trimmedName,
            drawingJson: JSON.stringify(strokes),
          })
          .where(eq(schema.drawings.id, selectedDrawing.id));
      } else {
        const [lastDrawing] = await drizzleDb
          .select({ id: schema.drawings.id })
          .from(schema.drawings)
          .orderBy(desc(schema.drawings.id))
          .limit(1);

        const nextDrawingId = (lastDrawing?.id ?? 0) + 1;

        await drizzleDb.insert(schema.drawings).values({
          id: nextDrawingId,
          name: trimmedName,
          drawingJson: JSON.stringify(strokes),
          previewImage: null,
        });
      }

      router.replace('/(tabs)/draw');
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const newPath = `M ${locationX} ${locationY}`;
          activePathRef.current = newPath;
          setCurrentPath(newPath);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const updatedPath = `${activePathRef.current} L ${locationX} ${locationY}`;
          activePathRef.current = updatedPath;
          setCurrentPath(updatedPath);
        },
        onPanResponderRelease: () => {
          const finalizedPath = activePathRef.current;
          if (!finalizedPath) return;

          setStrokes((previousStrokes) => [...previousStrokes, { path: finalizedPath, color: selectedColor, size: selectedSize }]);
          activePathRef.current = '';
          setCurrentPath('');
        },
        onPanResponderTerminate: () => {
          const finalizedPath = activePathRef.current;
          if (!finalizedPath) return;

          setStrokes((previousStrokes) => [...previousStrokes, { path: finalizedPath, color: selectedColor, size: selectedSize }]);
          activePathRef.current = '';
          setCurrentPath('');
        },
      }),
    [selectedColor, selectedSize]
  );

  const handleBack = () => {
    router.replace('/(tabs)/draw');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <ThemedText style={styles.backText}>Back</ThemedText>
            </TouchableOpacity>

            <ThemedText type="subtitle" style={styles.titleText}>
              {selectedDrawing ? 'Edit Drawing' : 'New Drawing'}
            </ThemedText>

            <TouchableOpacity onPress={saveDrawing} disabled={!drawingName.trim() || strokes.length === 0}>
              <ThemedText
                style={[
                  styles.saveText,
                  (!drawingName.trim() || strokes.length === 0) && styles.disabledButton,
                ]}
              >
                Save
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.nameInput}
            placeholder="Drawing name"
            value={drawingName}
            onChangeText={setDrawingName}
            autoFocus={!selectedDrawing}
          />

          <View style={styles.canvasActionsRow}>
            <TouchableOpacity style={styles.canvasActionButton} onPress={undoLastStroke}>
              <ThemedText style={styles.canvasActionText}>Undo</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.canvasActionButton} onPress={clearCanvas}>
              <ThemedText style={styles.canvasActionText}>Clear</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.colorRow}>
            {DRAW_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedSwatch,
                ]}
              />
            ))}
          </View>

          <View style={styles.sizeRow}>
            {STROKE_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
                style={[
                  styles.sizeSwatch,
                  selectedSize === size && styles.selectedSizeSwatch,
                ]}
              >
                <View
                  style={[
                    styles.sizeDot,
                    {
                      width: size * 2,
                      height: size * 2,
                      borderRadius: size,
                      backgroundColor: selectedColor,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            <Svg width="100%" height="100%">
              {strokes.map((stroke, index) => (
                <Path
                  key={`stroke-${index}`}
                  d={stroke.path}
                  stroke={stroke.color}
                  strokeWidth={stroke.size ?? 4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke={selectedColor}
                  strokeWidth={selectedSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  backText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  canvasActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  canvasActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
  },
  canvasActionText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: '#111',
    transform: [{ scale: 1.08 }],
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sizeSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
  },
  selectedSizeSwatch: {
    borderColor: '#007AFF',
    backgroundColor: '#dceeff',
  },
  sizeDot: {
    // width/height/borderRadius set inline
  },
  canvasContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
});
