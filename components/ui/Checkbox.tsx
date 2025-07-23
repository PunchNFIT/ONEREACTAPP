import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Checkbox = ({ checked, onCheckedChange }) => {
  return (
    <TouchableOpacity onPress={() => onCheckedChange(!checked)} style={[styles.checkboxBase, checked && styles.checkboxChecked]}>
      {checked && <Feather name="check" size={16} color="white" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007BFF',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#007BFF',
  },
});

export { Checkbox };
