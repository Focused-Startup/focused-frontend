export type StrokePoint = { x: number; y: number };
export type Stroke = { points: StrokePoint[]; color: string; width: number };
export type CanvasData = { version: 1; canvasSize: number; strokes: Stroke[] };
export type CanvasVisibility = 'private' | 'friends' | 'public';

type CanvasAccess = {
  visibility: CanvasVisibility;
  canvasUsers: { userId: number }[];
};

export function canEditCanvas(canvas: CanvasAccess, userId: number | undefined): boolean {
  return userId !== undefined && (
    canvas.visibility === 'friends' ||
    canvas.visibility === 'public' ||
    (canvas.visibility === 'private' && canvas.canvasUsers.some((user) => user.userId === userId))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isCanvasData(value: unknown): value is CanvasData {
  return isRecord(value) &&
    value.version === 1 &&
    isFiniteNumber(value.canvasSize) && value.canvasSize > 0 &&
    Array.isArray(value.strokes) &&
    value.strokes.every((stroke: unknown) =>
      isRecord(stroke) &&
      typeof stroke.color === 'string' &&
      isFiniteNumber(stroke.width) && stroke.width > 0 &&
      Array.isArray(stroke.points) &&
      stroke.points.every((point: unknown) =>
        isRecord(point) && isFiniteNumber(point.x) && isFiniteNumber(point.y)
      )
    );
}
