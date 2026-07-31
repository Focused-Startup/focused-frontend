import { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = 'Select a date', minimumDate, disabled = false }: DatePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setIsPickerVisible(false);
      return;
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const openPicker = () => {
    if (disabled) return;

    if (Platform.OS === 'android') {
      // Android's picker must be opened imperatively. Rendering <DateTimePicker> declaratively
      // while nested inside a React Native <Modal> attaches its dialog to the wrong native
      // window, which makes it invisible even though state updates correctly.
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        minimumDate,
        onChange: handleChange,
      });
      return;
    }

    setIsPickerVisible(true);
  };

  return (
    <ThemedView>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: colors.iconLight,
            backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          },
          disabled && styles.disabled,
        ]}
        onPress={openPicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <ThemedText style={{ color: value ? colors.text : colors.iconLight }}>
          {value ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.datePickerContainer}>
        {Platform.OS === 'ios' && isPickerVisible && (
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={handleChange}
            style={[styles.iosPicker, { backgroundColor: colors.background }]}
          />
        )}

        {Platform.OS === 'ios' && isPickerVisible && (
          <TouchableOpacity style={styles.doneButton} onPress={() => setIsPickerVisible(false)}>
            <ThemedText style={[styles.doneText, { color: colors.tint }]}>Done</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  iosPicker: {
    height: 350,
    width: '50%',
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
