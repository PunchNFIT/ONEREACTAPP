import React from 'react';
import { View, StyleSheet } from 'react-native';

const Skeleton = ({ style }) => {
  return <View style={[styles.skeleton, style]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});

export { Skeleton };
