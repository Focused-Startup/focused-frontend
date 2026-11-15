import { useMutation, useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import CanvasDrawing from '@/components/CanvasDrawing';
import { ThemedText } from '@/components/ThemedText';
import { CANVAS_UPDATED, GET_CANVAS, SAVE_CANVAS } from '@/graphql/queries';
import { isCanvasData, type Stroke } from '@/utils/canvas';
import { CanvasSync, type CanvasSnapshot, type CanvasSyncState } from '@/utils/canvasSync';

function snapshot(value: { id: number; drawingData: unknown; updatedAt: string }): CanvasSnapshot {
  if (!isCanvasData(value.drawingData) || !Number.isFinite(Date.parse(value.updatedAt))) {
    throw new Error('Unsupported canvas data or revision.');
  }
  return { ...value, drawingData: value.drawingData };
}

function CanvasSession({ initial }: { initial: CanvasSnapshot }) {
  const [initialSnapshot] = useState(initial);
  const [state, setState] = useState<CanvasSyncState>({
    drawingData: initial.drawingData,
    status: 'synced',
    canDiscard: false,
  });
  const [sync, setSync] = useState<CanvasSync | null>(null);
  const [connected, setConnected] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [saveCanvas] = useMutation(SAVE_CANVAS);

  useEffect(() => {
    const current = new CanvasSync(initialSnapshot.id, initialSnapshot, async (drawingData, expectedUpdatedAt) => {
      const result = await saveCanvas({ variables: { id: initialSnapshot.id, drawingData, expectedUpdatedAt } });
      if (!result.data?.saveCanvas) throw new Error('Canvas save returned no result.');
      return { applied: result.data.saveCanvas.applied, canvas: snapshot(result.data.saveCanvas.canvas) };
    }, setState);
    setSync(current);
    return () => current.dispose();
  }, [initialSnapshot, saveCanvas]);

  const subscription = useSubscription(CANVAS_UPDATED, {
    variables: { canvasId: initialSnapshot.id },
    skip: !sync,
    fetchPolicy: 'no-cache',
    onData: ({ data }) => {
      try {
        const canvas = data.data?.canvasUpdated;
        if (!canvas || !sync) throw new Error('Canvas subscription returned no data.');
        sync.receive(snapshot(canvas));
        setSubscriptionError(null);
        setConnected(true);
      } catch (error) {
        console.error('Invalid canvas subscription update:', error);
        setConnected(false);
        setSubscriptionError('Could not read live canvas updates.');
      }
    },
  });

  const change = useCallback((update: (previous: Stroke[]) => Stroke[]) => {
    if (!sync) throw new Error('Canvas is not ready for editing.');
    return sync.changeStrokes(update);
  }, [sync]);
  const liveError = subscriptionError ?? (subscription.error ? 'Live canvas updates disconnected.' : null);
  const reconnect = () => {
    setConnected(false);
    setSubscriptionError(null);
    subscription.restart();
  };

  return (
    <View style={styles.root}>
      <CanvasDrawing data={state.drawingData} onChange={change} editable={connected && !liveError} />
      {(!connected || liveError || state.status !== 'synced') && (
        <View style={styles.notice}>
          {liveError ? (
            <>
              <ThemedText style={styles.error}>{liveError}</ThemedText>
              <TouchableOpacity onPress={reconnect} accessibilityRole="button">
                <ThemedText style={styles.action}>Reconnect</ThemedText>
              </TouchableOpacity>
            </>
          ) : !connected ? (
            <ThemedText>Connecting to canvas...</ThemedText>
          ) : state.status === 'conflict' ? (
            <>
              <ThemedText style={styles.error}>Canvas changed elsewhere. Your local edits are preserved.</ThemedText>
              <TouchableOpacity onPress={() => sync?.discardLocalChanges()} disabled={!state.canDiscard} accessibilityRole="button">
                <ThemedText style={[styles.action, !state.canDiscard && styles.disabled]}>Discard local edits and reload</ThemedText>
              </TouchableOpacity>
            </>
          ) : state.status === 'error' ? (
            <>
              <ThemedText style={styles.error}>Could not save your canvas. Your edits are still here.</ThemedText>
              <TouchableOpacity onPress={() => sync?.retry()} accessibilityRole="button">
                <ThemedText style={styles.action}>Retry save</ThemedText>
              </TouchableOpacity>
            </>
          ) : <ThemedText>Saving canvas...</ThemedText>}
        </View>
      )}
    </View>
  );
}

export default function OwnCanvas({ ownerId }: { ownerId: number }) {
  const { data, loading, error, refetch } = useQuery(GET_CANVAS, {
    variables: { ownerId },
    fetchPolicy: 'no-cache',
  });

  if (loading) return <ActivityIndicator style={styles.status} />;
  if (error || !data?.canvas) {
    return (
      <View style={styles.status}>
        <ThemedText>Could not load your canvas.</ThemedText>
        <TouchableOpacity onPress={() => { void refetch().catch((err: unknown) => console.error('Failed to reload canvas:', err)); }}>
          <ThemedText style={styles.action}>Try again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  let initial: CanvasSnapshot;
  try {
    initial = snapshot(data.canvas);
  } catch (invalidData) {
    console.error('Invalid canvas:', invalidData);
    return <View style={styles.status}><ThemedText>Unsupported canvas data.</ThemedText></View>;
  }
  return <CanvasSession key={initial.id} initial={initial} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  status: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20 },
  notice: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, alignItems: 'center', gap: 8 },
  error: { color: '#b91c1c', textAlign: 'center' },
  action: { color: '#007AFF', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
