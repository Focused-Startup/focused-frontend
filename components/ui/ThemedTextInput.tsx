import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ThemedTextInputProps extends Omit<TextInputProps, 'style'> {
  style?: TextInputProps['style'];
}

export function ThemedTextInput({ style, ...props }: ThemedTextInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TextInput
      style={[
        styles.input,
        { 
          borderColor: colors.icon, 
          color: colors.text,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
        },
        style
      ]}
      placeholderTextColor={colors.icon}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
});
