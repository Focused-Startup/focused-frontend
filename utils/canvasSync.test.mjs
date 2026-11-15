import assert from 'node:assert/strict';
import test from 'node:test';
import { CanvasSync } from './canvasSync.ts';

const drawing = (x) => ({ version: 1, canvasSize: 4000, strokes: [{ color: '#000', width: 4, points: [{ x, y: 0 }] }] });
const snapshot = (revision, x) => ({ id: 1, updatedAt: `2026-01-01T00:00:00.00${revision}Z`, drawingData: drawing(x) });
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

test('serializes local edits and retains edits made while saving', async () => {
  const requests = [];
  let state;
  const sync = new CanvasSync(1, snapshot(0, 0), (data, revision) => {
    const request = deferred();
    requests.push({ data, revision, ...request });
    return request.promise;
  }, (next) => { state = next; });

  sync.change(drawing(1));
  sync.change(drawing(2));
  assert.equal(requests.length, 1);
  sync.receive(snapshot(1, 1));
  assert.equal(state.status, 'saving');
  requests[0].resolve({ applied: true, canvas: snapshot(1, 1) });
  await tick();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].revision, snapshot(1, 1).updatedAt);
  assert.deepEqual(requests[1].data, drawing(2));
  requests[1].resolve({ applied: true, canvas: snapshot(2, 2) });
  await tick();
  assert.equal(state.status, 'synced');
  assert.deepEqual(state.drawingData, drawing(2));
});

test('remote conflicts preserve local edits until explicitly discarded', async () => {
  const request = deferred();
  let state;
  const sync = new CanvasSync(1, snapshot(0, 0), () => request.promise, (next) => { state = next; });
  sync.change(drawing(1));
  sync.receive(snapshot(2, 9));
  assert.equal(state.status, 'conflict');
  assert.equal(state.canDiscard, false);
  sync.discardLocalChanges();
  assert.deepEqual(state.drawingData, drawing(1));
  request.resolve({ applied: false, canvas: snapshot(1, 8) });
  await tick();
  assert.equal(state.canDiscard, true);
  assert.deepEqual(state.drawingData, drawing(1));
  sync.discardLocalChanges();
  assert.equal(state.status, 'synced');
  assert.deepEqual(state.drawingData, drawing(9));
});

test('updates a clean canvas and keeps failed saves for retry', async () => {
  const requests = [];
  let state;
  const sync = new CanvasSync(1, snapshot(0, 0), (data, revision) => {
    const request = deferred();
    requests.push({ revision, ...request });
    return request.promise;
  }, (next) => { state = next; });
  sync.receive(snapshot(1, 4));
  assert.deepEqual(state.drawingData, drawing(4));
  sync.receive(snapshot(0, 8));
  assert.deepEqual(state.drawingData, drawing(4));
  sync.change(drawing(5));
  requests[0].reject(new Error('offline'));
  await tick();
  assert.equal(state.status, 'error');
  assert.deepEqual(state.drawingData, drawing(5));
  sync.retry();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].revision, snapshot(1, 4).updatedAt);
  requests[1].resolve({ applied: true, canvas: snapshot(2, 5) });
  await tick();
  assert.equal(state.status, 'synced');
});

test('a gesture applies to the latest remote data even before the view refreshes', () => {
  const request = deferred();
  let state;
  const sync = new CanvasSync(1, snapshot(0, 0), () => request.promise, (next) => { state = next; });
  sync.receive(snapshot(1, 4));
  const added = drawing(5).strokes[0];
  const strokes = sync.changeStrokes((previous) => [...previous, added]);
  assert.deepEqual(strokes, [...drawing(4).strokes, added]);
  assert.deepEqual(state.drawingData.strokes, strokes);
  sync.dispose();
});
