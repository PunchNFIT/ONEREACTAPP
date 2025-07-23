import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const Textarea = (props) => {
  return (
    <TextInput
      style={styles.textarea}
      multiline
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
});

export { Textarea };
