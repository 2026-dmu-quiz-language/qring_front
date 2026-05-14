import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface InputProps extends TextInputProps {
  iconName: keyof typeof Ionicons.glyphMap;
}

export const CustomInput = ({ iconName, ...props }: InputProps) => {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={iconName} size={20} color="#A0A0A0" style={styles.icon} />
      <TextInput 
        style={styles.input} 
        placeholderTextColor="#A0A0A0"
        {...props} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
});