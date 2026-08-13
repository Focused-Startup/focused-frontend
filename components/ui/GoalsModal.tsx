import { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { DatePicker } from '@/components/ui/DatePicker';

interface GoalsModalProps {
	goalContent?: string;
	initialDueDate: Date | null;
	isVisible: boolean;
	onClose: () => void;
	onSave: (goalContent: string, dueDate: Date) => Promise<void>;
}

export default function GoalsModal({ goalContent, initialDueDate, isVisible, onClose, onSave }: GoalsModalProps) {
	const [goal, setGoal] = useState(goalContent ?? '');
	const [dueDate, setDueDate] = useState<Date | null>(initialDueDate ?? null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (isVisible) {
			setGoal(goalContent ?? '');
			setDueDate(initialDueDate ?? null);
		}
	}, [isVisible, goalContent, initialDueDate]);

	const handleSave = async () => {
		const trimmedGoal = goal.trim();
		if (!trimmedGoal || isSaving) {
			return;
		}

		try {
			setIsSaving(true);
			await onSave(trimmedGoal, dueDate ?? new Date());
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.backdrop}>
				<View style={styles.modalCard}>
					<ThemedText type="subtitle" style={styles.title}>
						Add Goal
					</ThemedText>

					<ThemedTextInput
						value={goal}
						onChangeText={setGoal}
						placeholder="Enter your goal"
						autoFocus
						returnKeyType="done"
						editable={!isSaving}
						style={styles.input}
					/>

					<DatePicker
						value={dueDate}
						onChange={setDueDate}
						placeholder="Select a due date"
						minimumDate={new Date()}
						disabled={isSaving}
					/>

					<View style={styles.actionRow}>
						<TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={isSaving}>
							<ThemedText style={styles.cancelText}>Cancel</ThemedText>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.actionButton, styles.saveButton, (!goal.trim() || isSaving) && styles.disabledButton]}
							onPress={handleSave}
							disabled={!goal.trim() || isSaving}
						>
							<ThemedText style={styles.saveText}>{isSaving ? 'Saving...' : 'Save'}</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	modalCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.12,
		shadowRadius: 10,
		elevation: 10,
	},
	title: {
		marginBottom: 12,
		fontSize: 20,
		fontWeight: '700',
	},
	input: {
		marginBottom: 12,
	},
	actionRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 10,
	},
	actionButton: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
	},
	cancelButton: {
		backgroundColor: '#f1f3f5',
	},
	saveButton: {
		backgroundColor: '#007AFF',
	},
	disabledButton: {
		opacity: 0.55,
	},
	cancelText: {
		color: '#333',
		fontWeight: '600',
	},
	saveText: {
		color: '#fff',
		fontWeight: '600',
	},
});
