import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View, Modal, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Header } from '@/components/ui/Header';
import type { CanvasData, Stroke, StrokePoint } from '@/utils/canvas';

/** Derives an SVG path string from a stroke's point array (render-time only). */
function pointsToPath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  // A single-point stroke (tap) needs a zero-length line so strokeLinecap="round"
  // renders it as a visible dot.
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_SIZE = 4000;
const DOT_SPACING = 28;
const DRAW_COLORS = ['#2c3e50', '#ff3b30', '#007AFF', '#34C759', '#AF52DE', '#FF9500'];
const STROKE_SIZES = [2, 4, 8, 14];
const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Touch helpers ────────────────────────────────────────────────────────────

function getTouchDistance(t: { pageX: number; pageY: number }[]): number {
  return Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
}
function getTouchMidpoint(t: { pageX: number; pageY: number }[]): { x: number; y: number } {
  return { x: (t[0].pageX + t[1].pageX) / 2, y: (t[0].pageY + t[1].pageY) / 2 };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type CanvasDrawingProps = {
  initialData?: CanvasData;
  data?: CanvasData;
  onChange?: (update: (previous: Stroke[]) => Stroke[]) => Stroke[];
  editable?: boolean;
  saving?: boolean;
  onSave?: (data: CanvasData) => void;
  onBack?: () => void;
};

export default function CanvasDrawing({
  initialData,
  data,
  onChange,
  editable = true,
  saving = false,
  onSave,
  onBack,
}: CanvasDrawingProps) {
  const canvasSize = data?.canvasSize ?? initialData?.canvasSize ?? CANVAS_SIZE;
  const initialX = (canvasSize - SW) / 2;
  const initialY = (canvasSize - SH) / 2;
  const canEdit = editable && !saving;
  const dotGridId = `dotGrid${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [strokes, setStrokes] = useState<Stroke[]>(data?.strokes ?? initialData?.strokes ?? []);
  const strokesRef = useRef(strokes);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [selectedColor, setSelectedColor] = useState(DRAW_COLORS[2]);
  const [selectedSize, setSelectedSize] = useState(STROKE_SIZES[1]);
  const [isErasing, setIsErasing] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [canvasBounds, setCanvasBounds] = useState({ width: SW, height: SH });
  const canvasViewRef = useRef<View>(null);
  const canvasOriginRef = useRef({ x: 0, y: 0 });
  const hasLayoutRef = useRef(false);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  /**
   * Viewport state — drives SVG viewBox. NOT part of CanvasData.
   * x/y = canvas-space coordinate of the screen's top-left corner.
   * scale = pixels-per-canvas-unit.
   */
  const [viewport, setViewport] = useState({ x: initialX, y: initialY, scale: 1 });

  // Toolbar animation
  const toolbarOpacity = useRef(new Animated.Value(1)).current;
  const toolbarSlide = useRef(new Animated.Value(0)).current;

  // Viewport refs — always current inside PanResponder closures
  const vxRef = useRef(initialX);
  const vyRef = useRef(initialY);
  const scaleRef = useRef(1);

  // Gesture tracking refs
  const activePointsRef = useRef<StrokePoint[]>([]);
  const isDrawingRef = useRef(false);
  const lastPinchDist = useRef<number | null>(null);
  const lastMidpoint = useRef<{ x: number; y: number } | null>(null);

  const activeStrokeColor = selectedColor;

  useEffect(() => {
    if (data && strokesRef.current !== data.strokes) {
      strokesRef.current = data.strokes;
      setStrokes(data.strokes);
    }
  }, [data]);

  const updateStrokes = useCallback((update: (previous: Stroke[]) => Stroke[]) => {
    const previous = strokesRef.current;
    const next = onChange ? onChange(update) : update(previous);
    if (next === previous) return;
    strokesRef.current = next;
    setStrokes(next);
  }, [onChange]);

  /** Sync viewport refs and trigger a viewBox re-render. */
  const applyViewport = (x: number, y: number, s: number) => {
    vxRef.current = x;
    vyRef.current = y;
    scaleRef.current = s;
    setViewport({ x, y, scale: s });
  };

  const onCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasBounds({ width, height });
    canvasViewRef.current?.measureInWindow((x, y) => {
      canvasOriginRef.current = { x, y };
    });
    if (!hasLayoutRef.current && width > 0 && height > 0) {
      hasLayoutRef.current = true;
      applyViewport((canvasSize - width) / 2, (canvasSize - height) / 2, 1);
    }
  };

  /**
   * Map a screen-space touch point to canvas-space coordinates.
   *
   * Subtract the view's window origin before mapping screen coordinates
   * through the SVG viewBox.
   */
  const toCanvasCoords = (pageX: number, pageY: number): StrokePoint => ({
    x: vxRef.current + (pageX - canvasOriginRef.current.x) / scaleRef.current,
    y: vyRef.current + (pageY - canvasOriginRef.current.y) / scaleRef.current,
  });

  const clearCanvas = () => {
    updateStrokes((previous) => previous.length ? [] : previous);
    setCurrentPoints([]);
    activePointsRef.current = [];
  };

  const undoStroke = () => updateStrokes((prev) => prev.length ? prev.slice(0, -1) : prev);

  const toggleToolbar = () => {
    const expanding = !isToolbarExpanded;
    setIsToolbarExpanded(expanding);
    Animated.parallel([
      Animated.timing(toolbarOpacity, { toValue: expanding ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(toolbarSlide, { toValue: expanding ? 0 : -12, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          const { touches } = evt.nativeEvent;
          if (touches.length === 1 && canEdit) {
            isDrawingRef.current = true;
            const point = toCanvasCoords(touches[0].pageX, touches[0].pageY);
            activePointsRef.current = [point];
            setCurrentPoints([point]);
          } else if (touches.length >= 2) {
            isDrawingRef.current = false;
            activePointsRef.current = [];
            setCurrentPoints([]);
            lastPinchDist.current = getTouchDistance(touches);
            lastMidpoint.current = getTouchMidpoint(touches);
          }
        },

        onPanResponderMove: (evt) => {
          const { touches } = evt.nativeEvent;

          if (touches.length === 1 && isDrawingRef.current) {
            const point = toCanvasCoords(touches[0].pageX, touches[0].pageY);
            if (isErasing) {
              const eraseRadius = selectedSize * 4;
              updateStrokes((prev) => {
                const remaining = prev.filter(
                  (stroke) =>
                    !stroke.points.some(
                      (p) => Math.hypot(p.x - point.x, p.y - point.y) < eraseRadius
                    )
                );
                return remaining.length === prev.length ? prev : remaining;
              });
              return;
            }
            const updated = [...activePointsRef.current, point];
            activePointsRef.current = updated;
            setCurrentPoints(updated);
            return;
          }

          if (touches.length >= 2) {
            // Transition from drawing to pan/zoom
            if (isDrawingRef.current) {
              isDrawingRef.current = false;
              activePointsRef.current = [];
              setCurrentPoints([]);
              lastPinchDist.current = getTouchDistance(touches);
              lastMidpoint.current = getTouchMidpoint(touches);
              return;
            }

            const newDist = getTouchDistance(touches);
            const newMid = getTouchMidpoint(touches);

            if (lastPinchDist.current !== null && lastMidpoint.current !== null) {
              const oldScale = scaleRef.current;
              const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * (newDist / lastPinchDist.current)));

              /**
               * Viewport math (no transform-origin ambiguity):
               *
               * The canvas point under lastMidpoint must remain under newMid after
               * both zoom and pan. In canvas-space:
               *
               *   canvasPointX = vx + lastMid.x / oldScale
               *
               * After the move, newMid should sit over the same canvas point:
               *
               *   newVX + newMid.x / newScale = canvasPointX
               *   newVX = vx + lastMid.x / oldScale - newMid.x / newScale
               */
              const origin = canvasOriginRef.current;
              const canvasX = vxRef.current + (lastMidpoint.current.x - origin.x) / oldScale;
              const canvasY = vyRef.current + (lastMidpoint.current.y - origin.y) / oldScale;
              const newVX = canvasX - (newMid.x - origin.x) / newScale;
              const newVY = canvasY - (newMid.y - origin.y) / newScale;

              applyViewport(newVX, newVY, newScale);
            }

            lastPinchDist.current = newDist;
            lastMidpoint.current = newMid;
          }
        },

        onPanResponderRelease: () => {
          const pts = activePointsRef.current;
          if (isDrawingRef.current && pts.length > 0 && !isErasing) {
            updateStrokes((prev) => [...prev, { points: pts, color: activeStrokeColor, width: selectedSize }]);
          }
          activePointsRef.current = [];
          setCurrentPoints([]);
          isDrawingRef.current = false;
          lastPinchDist.current = null;
          lastMidpoint.current = null;
        },

        onPanResponderTerminate: () => {
          const pts = activePointsRef.current;
          if (isDrawingRef.current && pts.length > 0 && !isErasing) {
            updateStrokes((prev) => [...prev, { points: pts, color: activeStrokeColor, width: selectedSize }]);
          }
          activePointsRef.current = [];
          setCurrentPoints([]);
          isDrawingRef.current = false;
          lastPinchDist.current = null;
          lastMidpoint.current = null;
        },
      }),
    [activeStrokeColor, selectedSize, isErasing, canEdit, updateStrokes]
  );

  /**
   * SVG viewBox string — maps the visible canvas region onto the screen.
   * With patternUnits="userSpaceOnUse", the dot Pattern tiles naturally
   * in canvas coordinates without any manual offset calculation.
   */
  const viewBox = `${viewport.x} ${viewport.y} ${canvasBounds.width / viewport.scale} ${canvasBounds.height / viewport.scale}`;

  const dotsButton = (
    <TouchableOpacity onPress={toggleToolbar} style={styles.dotsButton}>
      <Ionicons name="ellipsis-vertical" size={20} color="#1f2937" />

    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* ── SVG canvas ── */}
      <View ref={canvasViewRef} onLayout={onCanvasLayout} style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Svg width={canvasBounds.width} height={canvasBounds.height} viewBox={viewBox}>
          <Defs>
            {/*
              patternUnits="userSpaceOnUse" + viewBox = dots tile in canvas-space
              automatically — no manual offset needed.
              Dot radius is fixed in canvas units; they visually grow/shrink with zoom.
            */}
            <Pattern
              id={dotGridId}
              x="0"
              y="0"
              width={DOT_SPACING}
              height={DOT_SPACING}
              patternUnits="userSpaceOnUse"
            >
              <Circle cx="1.5" cy="1.5" r="1.5" fill="#c8cdd6" />
            </Pattern>
          </Defs>

          {/* Canvas background */}
          <Rect x="0" y="0" width={canvasSize} height={canvasSize} fill="white" />

          {/* Dot grid — rendered above background, below strokes */}
          <Rect x="0" y="0" width={canvasSize} height={canvasSize} fill={`url(#${dotGridId})`} />

          {/* Committed strokes */}
          {strokes.map((stroke, index) => (
            <Path
              key={`stroke-${index}`}
              d={pointsToPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* In-progress stroke (hidden while erasing — erase removes strokes directly) */}
          {!isErasing && currentPoints.length > 0 && (
            <Path
              d={pointsToPath(currentPoints)}
              stroke={activeStrokeColor}
              strokeWidth={selectedSize}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      {/* ── Header + toolbar float above the canvas ── */}
      <SafeAreaView style={styles.uiLayer} pointerEvents="box-none" edges={['top', 'bottom']}>
        <Header
          transparent
          headerLeft={onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.dotsButton} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={20} color="#1f2937" />
            </TouchableOpacity>
          ) : undefined}
          headerRight={editable ? dotsButton : undefined}
        />

        {editable && <Animated.View
          pointerEvents={isToolbarExpanded ? 'box-none' : 'none'}
          style={[
            styles.toolbarOverlay,
            { opacity: toolbarOpacity, transform: [{ translateY: toolbarSlide }] },
          ]}
        >
          <View style={styles.toolbarCard} pointerEvents={saving ? 'none' : 'auto'}>
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

              <TouchableOpacity style={styles.iconButton} onPress={openModal}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>

            <View>
              <ThemedText style={styles.sectionLabel}>Colors</ThemedText>
              <View style={styles.colorRow}>
                {DRAW_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => { setSelectedColor(color); setIsErasing(false); }}
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
              <View style={{ flexDirection: 'column' }}>
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
                          { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: selectedColor },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {onSave ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Save canvas"
                  style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
                  onPress={() => onSave({ version: 1, canvasSize, strokes })}
                >
                  <ThemedText style={styles.sectionLabel}>{saving ? 'Saving...' : 'Save'}</ThemedText>
                  <Ionicons name="save-outline" size={20} color="#1f2937" />
                </TouchableOpacity>
              ) : <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }} onPress={() => router.push('/(tabs)/home/friends')}>
                <ThemedText style={styles.sectionLabel}>
                  Friends
                </ThemedText>
                <Ionicons name="arrow-forward-circle" size={20} color="#1f2937" style={{ marginBottom: 1 }} />
              </TouchableOpacity>}
              </View>
          </View>
        </Animated.View>}
        {!editable && (
          <View style={styles.readOnlyNotice} pointerEvents="none">
            <ThemedText style={styles.sectionLabel}>Read-only canvas</ThemedText>
          </View>
        )}
      </SafeAreaView>

      {isModalVisible && (
        <Modal transparent animationType="fade" onRequestClose={closeModal}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
              <ThemedText style={{ fontSize: 16, marginBottom: 20 }}>Clear the canvas? This cannot be undone.</ThemedText>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity onPress={closeModal} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                  <ThemedText style={{ color: '#007AFF' }}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { clearCanvas(); closeModal(); }}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <ThemedText style={{ color: '#ff3b30' }}>Clear</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  uiLayer: {
    flex: 1,
  },
  toolbarOverlay: {
    position: 'absolute',
    top: 106,
    left: 12,
    right: 12,
  },
  dotsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  readOnlyNotice: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 10,
  },
  toolbarCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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