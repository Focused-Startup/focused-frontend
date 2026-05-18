import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ThemedTextInputProps extends Omit<TextInputProps, 'style'> {
  style?: TextInputProps['style'];
}

export function ThemedTextInput({ style, onFocus, onBlur, ...props }: ThemedTextInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.input,
        {
          borderColor: colors.iconLight,
          borderBottomColor: isFocused ? colors.tint : colors.iconLight,
          color: colors.text,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          marginBottom: isFocused ? 20 : 16,
        },
        style
      ]}
      placeholderTextColor={colors.iconLight}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',  
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
});
