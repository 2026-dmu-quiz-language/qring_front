// src/components/common/Input.tsx
import React from 'react';
import { View, StyleSheet, TextInputProps } from 'react-native';
import { TextInput } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface CustomInputProps extends TextInputProps {
  iconName: keyof typeof Ionicons.glyphMap;
  placeholder: string;
}

export const CustomInput = ({ iconName, placeholder, ...props }: CustomInputProps) => {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={20} color={theme.colors.textMuted} style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceAlt, 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 0, 
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: theme.colors.text,
  },
});