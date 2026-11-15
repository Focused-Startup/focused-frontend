import type { CanvasData, Stroke } from './canvas';

export type CanvasSnapshot = { id: number; drawingData: CanvasData; updatedAt: string };
export type CanvasSyncState = {
  drawingData: CanvasData;
  status: 'synced' | 'saving' | 'error' | 'conflict';
  canDiscard: boolean;
};

type SaveResult = { applied: boolean; canvas: CanvasSnapshot };

export class CanvasSync {
  private readonly id: number;
  private readonly save: (data: CanvasData, revision: string) => Promise<SaveResult>;
  private readonly notify: (state: CanvasSyncState) => void;
  private revision: string;
  private drawingData: CanvasData;
  private dirty = false;
  private generation = 0;
  private inFlight: CanvasData | null = null;
  private remote: CanvasSnapshot | null = null;
  private failed = false;
  private disposed = false;

  constructor(
    id: number,
    initial: CanvasSnapshot,
    save: (data: CanvasData, revision: string) => Promise<SaveResult>,
    notify: (state: CanvasSyncState) => void,
  ) {
    this.id = id;
    this.save = save;
    this.notify = notify;
    this.revision = initial.updatedAt;
    this.drawingData = initial.drawingData;
  }

  private recordConflict(snapshot: CanvasSnapshot) {
    if (!this.remote || Date.parse(snapshot.updatedAt) > Date.parse(this.remote.updatedAt)) {
      this.remote = snapshot;
    }
  }

  private emit() {
    if (this.disposed) return;
    this.notify({
      drawingData: this.drawingData,
      status: this.remote ? 'conflict' : this.failed ? 'error' : this.inFlight ? 'saving' : 'synced',
      canDiscard: !!this.remote && !this.inFlight,
    });
  }

  change(data: CanvasData) {
    this.drawingData = data;
    this.dirty = true;
    this.generation += 1;
    this.emit();
    void this.flush();
  }

  changeStrokes(update: (previous: Stroke[]) => Stroke[]): Stroke[] {
    const previous = this.drawingData.strokes;
    const strokes = update(previous);
    if (strokes !== previous) this.change({ ...this.drawingData, strokes });
    return strokes;
  }

  receive(snapshot: CanvasSnapshot) {
    if (this.disposed || snapshot.id !== this.id ||
        Date.parse(snapshot.updatedAt) <= Date.parse(this.revision)) return;
    if (this.inFlight && JSON.stringify(snapshot.drawingData) === JSON.stringify(this.inFlight)) return;
    if (this.dirty) {
      this.recordConflict(snapshot);
    } else {
      this.revision = snapshot.updatedAt;
      this.drawingData = snapshot.drawingData;
    }
    this.emit();
  }

  retry() {
    this.failed = false;
    this.emit();
    void this.flush();
  }

  discardLocalChanges() {
    if (!this.remote || this.inFlight) return;
    this.revision = this.remote.updatedAt;
    this.drawingData = this.remote.drawingData;
    this.remote = null;
    this.dirty = false;
    this.failed = false;
    this.emit();
  }

  dispose() {
    this.disposed = true;
  }

  private async flush() {
    if (this.disposed || this.inFlight || !this.dirty || this.remote || this.failed) return;
    const data = this.drawingData;
    const generation = this.generation;
    this.inFlight = data;
    this.emit();
    try {
      const result = await this.save(data, this.revision);
      if (this.disposed) return;
      if (!result.applied) {
        this.recordConflict(result.canvas);
      } else {
        this.revision = result.canvas.updatedAt;
        if (generation === this.generation) this.dirty = false;
      }
    } catch (error) {
      if (this.disposed) return;
      console.error('Failed to save canvas:', error);
      this.failed = true;
    } finally {
      this.inFlight = null;
      this.emit();
    }
    if (!this.disposed) void this.flush();
  }
}
