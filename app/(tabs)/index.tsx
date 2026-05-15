import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';

type Stroke = {
  path: string;
  color: string;
  width: number;
};

const CANVAS_BACKGROUND_COLOR = '#ffffff';
const DRAW_COLORS = ['#2c3e50', '#ff3b30', '#007AFF', '#34C759', '#AF52DE', '#FF9500'];
const STROKE_SIZES = [2, 4, 8, 14];

export default function HomeScreen() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState(DRAW_COLORS[2]);
  const [selectedSize, setSelectedSize] = useState(STROKE_SIZES[1]);
  const [isErasing, setIsErasing] = useState(false);

  const activePathRef = useRef('');
  const activeStrokeColor = isErasing ? CANVAS_BACKGROUND_COLOR : selectedColor;

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentPath('');
    activePathRef.current = '';
  };

  const undoStroke = () => {
    setStrokes((previousStrokes) => previousStrokes.slice(0, -1));
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

          setStrokes((previousStrokes) => [
            ...previousStrokes,
            { path: finalizedPath, color: activeStrokeColor, width: selectedSize },
          ]);
          activePathRef.current = '';
          setCurrentPath('');
        },
        onPanResponderTerminate: () => {
          const finalizedPath = activePathRef.current;
          if (!finalizedPath) return;

          setStrokes((previousStrokes) => [
            ...previousStrokes,
            { path: finalizedPath, color: activeStrokeColor, width: selectedSize },
          ]);
          activePathRef.current = '';
          setCurrentPath('');
        },
      }),
    [activeStrokeColor, selectedSize]
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.canvasShell}>
          <View style={styles.canvas} {...panResponder.panHandlers}>
            <Svg width="100%" height="100%">
              {strokes.map((stroke, index) => (
                <Path
                  key={`stroke-${index}`}
                  d={stroke.path}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke={activeStrokeColor}
                  strokeWidth={selectedSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </View>

          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.toolbarCard}>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.modeButton, !isErasing && styles.modeButtonActive]}
                  onPress={() => setIsErasing(false)}
                >
                  <Ionicons name="brush" size={18} color={!isErasing ? '#fff' : '#1f2937'} />
                  <ThemedText style={[styles.modeText, !isErasing && styles.modeTextActive]}>Draw</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeButton, isErasing && styles.modeButtonActive]}
                  onPress={() => setIsErasing(true)}
                >
                  <Ionicons name="create-outline" size={18} color={isErasing ? '#fff' : '#1f2937'} />
                  <ThemedText style={[styles.modeText, isErasing && styles.modeTextActive]}>Erase</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={undoStroke}>
                  <Ionicons name="return-up-back-outline" size={20} color="#1f2937" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={clearCanvas}>
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionLabel}>Colors</ThemedText>
                <View style={styles.colorRow}>
                  {DRAW_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => {
                        setSelectedColor(color);
                        setIsErasing(false);
                      }}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        selectedColor === color && !isErasing && styles.selectedColorSwatch,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionLabel}>Thickness</ThemedText>
                <View style={styles.sizeRow}>
                  {STROKE_SIZES.map((size) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[styles.sizeButton, selectedSize === size && styles.selectedSizeButton]}
                    >
                      <View
                        style={[
                          styles.sizePreview,
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
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CANVAS_BACKGROUND_COLOR,
  },
  canvasShell: {
    flex: 1,
    backgroundColor: CANVAS_BACKGROUND_COLOR,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CANVAS_BACKGROUND_COLOR,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    padding: 12,
  },
  toolbarCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#eef2f7',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  modeTextActive: {
    color: '#fff',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#eef2f7',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorSwatch: {
    borderColor: '#111827',
    transform: [{ scale: 1.08 }],
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSizeButton: {
    borderColor: '#007AFF',
    backgroundColor: '#dceeff',
  },
  sizePreview: {
    opacity: 0.95,
  },
});