import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface NoteModalProps {
  isVisible: boolean;
  onClose: () => void;
  /** When provided, the modal edits the note with this id instead of creating a new one. */
  noteId?: number;
  /** Existing content to prefill when editing a note. */
  initialContent?: string;
  onSave: (content: string, noteId?: number) => Promise<void>;
}

export default function NoteModal({ isVisible, onClose, noteId, initialContent = '', onSave }: NoteModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = noteId !== undefined;

  useEffect(() => {
    if (isVisible) {
      setContent(initialContent);
    }
  }, [isVisible, initialContent]);

  const handleSave = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(trimmedContent, noteId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <ThemedText style={styles.action}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">{isEditing ? 'Edit Note' : 'New Note'}</ThemedText>
            <TouchableOpacity onPress={handleSave} disabled={!content.trim() || isSaving}>
              <ThemedText style={[styles.action, (!content.trim() || isSaving) && styles.disabledAction]}>
                {isSaving ? 'Saving...' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your thoughts..."
            value={content}
            onChangeText={setContent}
            autoFocus
            editable={!isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  action: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledAction: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
});
