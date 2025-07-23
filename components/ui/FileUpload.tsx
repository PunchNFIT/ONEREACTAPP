import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const FileUpload = ({ onFileSelect, accept, label, allowedTypes, maxSize }) => {
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept.split(','),
        copyToCacheDirectory: false,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        // Basic validation (more robust validation can be added)
        if (allowedTypes && !allowedTypes.some(type => file.mimeType.includes(type.replace('.', '')))) {
          alert(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
          return;
        }
        if (maxSize && file.size > maxSize) {
          alert(`File too large. Max size: ${maxSize / (1024 * 1024)} MB`);
          return;
        }
        onFileSelect(file);
      }
    } catch (err) {
      console.log('Document picking cancelled or error', err);
    }
  };

  return (
    <TouchableOpacity onPress={pickDocument} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export { FileUpload };
