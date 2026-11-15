import assert from 'node:assert/strict';
import test from 'node:test';
import { canEditCanvas, isCanvasData } from './canvas.ts';

test('canvas edit permission follows visibility and private membership', () => {
  const users = [{ userId: 7 }];
  assert.equal(canEditCanvas({ visibility: 'friends', canvasUsers: [] }, 3), true);
  assert.equal(canEditCanvas({ visibility: 'public', canvasUsers: [] }, 3), true);
  assert.equal(canEditCanvas({ visibility: 'private', canvasUsers: users }, 7), true);
  assert.equal(canEditCanvas({ visibility: 'private', canvasUsers: users }, 3), false);
  assert.equal(canEditCanvas({ visibility: 'public', canvasUsers: [] }, undefined), false);
});

test('drawing data accepts the canvas format and rejects malformed data', () => {
  const drawing = {
    version: 1,
    canvasSize: 4000,
    strokes: [{ color: '#000', width: 4, points: [{ x: 10, y: 20 }] }],
  };
  assert.equal(isCanvasData(drawing), true);
  assert.equal(isCanvasData({ ...drawing, strokes: [] }), true);
  assert.equal(isCanvasData(null), false);
  assert.equal(isCanvasData({ ...drawing, version: 2 }), false);
  assert.equal(isCanvasData({ ...drawing, canvasSize: 0 }), false);
  assert.equal(isCanvasData({ ...drawing, strokes: [{ ...drawing.strokes[0], points: [{ x: '10', y: 20 }] }] }), false);
  assert.equal(isCanvasData({ ...drawing, strokes: [{ ...drawing.strokes[0], width: -1 }] }), false);
});
