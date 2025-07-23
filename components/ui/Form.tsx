import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Form = ({ children }) => <View>{children}</View>;

const FormItem = ({ children }) => <View style={styles.formItem}>{children}</View>;

const FormLabel = ({ children }) => <Text style={styles.formLabel}>{children}</Text>;

const FormControl = ({ children }) => <View>{children}</View>;

const FormMessage = ({ children }) => <Text style={styles.formMessage}>{children}</Text>;

const FormField = ({ render, ...rest }) => {
  return render({ field: rest });
};

const styles = StyleSheet.create({
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  formMessage: {
    color: 'red',
    marginTop: 4,
  },
});

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
};
