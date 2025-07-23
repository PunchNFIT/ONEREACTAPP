import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClientAnalytics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Analytics</Text>
      <Text>Detailed client analytics will be displayed here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
