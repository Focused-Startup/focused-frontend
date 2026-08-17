import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ThemedText } from '@/components/ThemedText';
import { Header } from '@/components/ui/Header';
import { useAppUser } from '@/contexts/UserContext';

// ─── Canvas data model ────────────────────────────────────────────────────────

/** A single sampled point in canvas-space coordinates. */
export type StrokePoint = { x: number; y: number };

/** A single stroke — safe to JSON.stringify and store in the DB. */
export type Stroke = {
  points: StrokePoint[];
  color: string;
  width: number;
};

/**
 * Root canvas object stored in the database as JSON.
 * Viewport (pan/zoom) is transient UI state and is NOT included here.
 */
export type CanvasData = {
  version: 1;
  canvasSize: number;
  strokes: Stroke[];
};

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

// Initial viewport: canvas centered on screen (canvas-space origin of viewport)
const INITIAL_VX = (CANVAS_SIZE - SW) / 2;
const INITIAL_VY = (CANVAS_SIZE - SH) / 2;

const MY_CANVAS_QUERY = gql`
  query MyCanvasQuery($canvasId: Int!) {
    canvas(id: $canvasId) {
      id
      drawingData
      ownerId
      visibility
    }
}`

// ─── Touch helpers ────────────────────────────────────────────────────────────

function getTouchDistance(t: { pageX: number; pageY: number }[]): number {
  return Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
}
function getTouchMidpoint(t: { pageX: number; pageY: number }[]): { x: number; y: number } {
  return { x: (t[0].pageX + t[1].pageX) / 2, y: (t[0].pageY + t[1].pageY) / 2 };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [selectedColor, setSelectedColor] = useState(DRAW_COLORS[2]);
  const [selectedSize, setSelectedSize] = useState(STROKE_SIZES[1]);
  const [isErasing, setIsErasing] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { appUser } = useAppUser();

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  /**
   * Viewport state — drives SVG viewBox. NOT part of CanvasData.
   * x/y = canvas-space coordinate of the screen's top-left corner.
   * scale = pixels-per-canvas-unit.
   */
  const [viewport, setViewport] = useState({ x: INITIAL_VX, y: INITIAL_VY, scale: 1 });

  // Toolbar animation
  const toolbarOpacity = useRef(new Animated.Value(1)).current;
  const toolbarSlide = useRef(new Animated.Value(0)).current;

  // Viewport refs — always current inside PanResponder closures
  const vxRef = useRef(INITIAL_VX);
  const vyRef = useRef(INITIAL_VY);
  const scaleRef = useRef(1);

  // Gesture tracking refs
  const activePointsRef = useRef<StrokePoint[]>([]);
  const isDrawingRef = useRef(false);
  const lastPinchDist = useRef<number | null>(null);
  const lastMidpoint = useRef<{ x: number; y: number } | null>(null);

  const activeStrokeColor = selectedColor;

  /** Sync viewport refs and trigger a viewBox re-render. */
  const applyViewport = (x: number, y: number, s: number) => {
    vxRef.current = x;
    vyRef.current = y;
    scaleRef.current = s;
    setViewport({ x, y, scale: s });
  };

  /**
   * Map a screen-space touch point to canvas-space coordinates.
   *
   * SVG viewBox maps canvas rect (vx, vy, SW/scale, SH/scale) onto the screen,
   * so the inverse is simply: canvasX = vx + screenX / scale.
   */
  const toCanvasCoords = (pageX: number, pageY: number): StrokePoint => ({
    x: vxRef.current + pageX / scaleRef.current,
    y: vyRef.current + pageY / scaleRef.current,
  });

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentPoints([]);
    activePointsRef.current = [];
  };

  const undoStroke = () => setStrokes((prev) => prev.slice(0, -1));

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
          if (touches.length === 1) {
            isDrawingRef.current = true;
            const point = toCanvasCoords(touches[0].pageX, touches[0].pageY);
            activePointsRef.current = [point];
            setCurrentPoints([point]);
          } else {
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
              setStrokes((prev) =>
                prev.filter(
                  (stroke) =>
                    !stroke.points.some(
                      (p) => Math.hypot(p.x - point.x, p.y - point.y) < eraseRadius
                    )
                )
              );
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
              const canvasX = vxRef.current + lastMidpoint.current.x / oldScale;
              const canvasY = vyRef.current + lastMidpoint.current.y / oldScale;
              const newVX = canvasX - newMid.x / newScale;
              const newVY = canvasY - newMid.y / newScale;

              applyViewport(newVX, newVY, newScale);
            }

            lastPinchDist.current = newDist;
            lastMidpoint.current = newMid;
          }
        },

        onPanResponderRelease: () => {
          const pts = activePointsRef.current;
          if (isDrawingRef.current && pts.length > 0 && !isErasing) {
            setStrokes((prev) => [...prev, { points: pts, color: activeStrokeColor, width: selectedSize }]);
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
            setStrokes((prev) => [...prev, { points: pts, color: activeStrokeColor, width: selectedSize }]);
          }
          activePointsRef.current = [];
          setCurrentPoints([]);
          isDrawingRef.current = false;
          lastPinchDist.current = null;
          lastMidpoint.current = null;
        },
      }),
    [activeStrokeColor, selectedSize, isErasing]
  );

  /**
   * SVG viewBox string — maps the visible canvas region onto the screen.
   * With patternUnits="userSpaceOnUse", the dot Pattern tiles naturally
   * in canvas coordinates without any manual offset calculation.
   */
  const viewBox = `${viewport.x} ${viewport.y} ${SW / viewport.scale} ${SH / viewport.scale}`;

  const dotsButton = (
    <TouchableOpacity onPress={toggleToolbar} style={styles.dotsButton}>
      <Ionicons name="ellipsis-vertical" size={20} color="#1f2937" />

    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* ── Full-screen SVG canvas (outside SafeArea so touches map to pageX/Y correctly) ── */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Svg width={SW} height={SH} viewBox={viewBox}>
          <Defs>
            {/*
              patternUnits="userSpaceOnUse" + viewBox = dots tile in canvas-space
              automatically — no manual offset needed.
              Dot radius is fixed in canvas units; they visually grow/shrink with zoom.
            */}
            <Pattern
              id="dotGrid"
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
          <Rect x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} fill="white" />

          {/* Dot grid — rendered above background, below strokes */}
          <Rect x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#dotGrid)" />

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
        <Header transparent headerRight={dotsButton} />

        <Animated.View
          pointerEvents={isToolbarExpanded ? 'box-none' : 'none'}
          style={[
            styles.toolbarOverlay,
            { opacity: toolbarOpacity, transform: [{ translateY: toolbarSlide }] },
          ]}
        >
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

              <TouchableOpacity style={styles.iconButton} onPress={openModal}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
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
              <ThemedText style={styles.sectionLabel}>Thickness</ThemedText>
              <View>
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
              <TouchableOpacity onPress={() => {}}>
                <ThemedText>
                  Friends
                </ThemedText>
                <Ionicons name="arrow-forward-circle" size={20} color="#1f2937" />
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
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