import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import CanvasDrawing from '@/components/CanvasDrawing';
import { ThemedText } from '@/components/ThemedText';
import { useAppUser } from '@/contexts/UserContext';
import { GET_CANVAS, SAVE_CANVAS, type Canvas as CanvasRecord } from '@/graphql/queries';
import { canEditCanvas, isCanvasData, type CanvasData } from '@/utils/canvas';

type CanvasProps = {
  friendId: number;
  onBack?: () => void;
};

export default function Canvas({ friendId, onBack }: CanvasProps) {
  const { appUser, loading: userLoading, errorMessage } = useAppUser();
  const { data, loading, error, refetch } = useQuery(GET_CANVAS, {
    variables: { ownerId: friendId },
    skip: !appUser,
    fetchPolicy: 'no-cache',
  });

  const status = (message: string, retry?: () => void) => (
    <View style={styles.status}>
      <ThemedText style={styles.message}>{message}</ThemedText>
      {retry && (
        <TouchableOpacity onPress={retry} accessibilityRole="button">
          <ThemedText style={styles.action}>Try again</ThemedText>
        </TouchableOpacity>
      )}
      {onBack && (
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <ThemedText style={styles.action}>Go back</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!appUser) {
    if (userLoading) return <ActivityIndicator style={styles.status} />;
    return status(errorMessage ?? 'Sign in to view this canvas.');
  }
  if (loading) return <ActivityIndicator style={styles.status} />;
  if (error) return status('Could not load this canvas.', () => {
    void refetch().catch((refetchError: unknown) => console.error('Failed to reload canvas:', refetchError));
  });

  const canvas = data?.canvas;
  if (!canvas) return status('This user does not have a canvas.');
  if (!isCanvasData(canvas.drawingData)) return status('This canvas has unsupported drawing data.');

  return (
    <FriendCanvasEditor
      key={canvas.id}
      canvas={canvas}
      drawingData={canvas.drawingData}
      editable={canEditCanvas(canvas, appUser.id)}
      onBack={onBack}
    />
  );
}

function FriendCanvasEditor({ canvas, drawingData, editable, onBack }: {
  canvas: CanvasRecord;
  drawingData: CanvasData;
  editable: boolean;
  onBack?: () => void;
}) {
  const [revision, setRevision] = useState(canvas.updatedAt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveCanvas, { loading: saving }] = useMutation(SAVE_CANVAS);
  const save = async (drawingData: CanvasData) => {
    if (!editable || saving) return;
    setSaveError(null);
    try {
      const result = await saveCanvas({ variables: { id: canvas.id, drawingData, expectedUpdatedAt: revision } });
      if (!result.data?.saveCanvas) {
        throw new Error('Canvas save returned no result.');
      } else if (!result.data.saveCanvas.applied) {
        setSaveError('Canvas changed elsewhere. Your edits are preserved; reopen the canvas to reload.');
      } else {
        setRevision(result.data.saveCanvas.canvas.updatedAt);
      }
    } catch (saveFailure) {
      console.error('Failed to save canvas:', saveFailure);
      setSaveError('Could not save this canvas. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <CanvasDrawing
        initialData={drawingData}
        editable={editable}
        saving={saving}
        onSave={save}
        onBack={onBack}
      />
      {saveError && (
        <View style={styles.error}>
          <ThemedText style={styles.errorText}>{saveError}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  status: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  message: { textAlign: 'center' },
  action: { color: '#007AFF', fontWeight: '600' },
  error: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
});
