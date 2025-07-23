import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const RadioGroup = ({ children }) => <View>{children}</View>;

const RadioGroupItem = ({ value, selectedValue, onValueChange }) => {
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onValueChange(value)}>
      <View style={[styles.radio, isSelected && styles.radioSelected]} />
      <Text>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: '#007BFF',
  },
});

export { RadioGroup, RadioGroupItem };
