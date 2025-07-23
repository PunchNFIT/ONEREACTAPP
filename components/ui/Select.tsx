import React from 'react';
import RNPickerSelect from 'react-native-picker-select';

const Select = ({ onValueChange, items, placeholder }) => {
  return (
    <RNPickerSelect
      onValueChange={onValueChange}
      items={items}
      placeholder={placeholder}
    />
  );
};

const SelectItem = ({ label, value }) => {
  return { label, value };
};

export { Select, SelectItem };
