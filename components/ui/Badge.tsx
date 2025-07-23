import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = ({ variant, children, style }) => {
  const badgeStyle = [styles.base];
  const textStyle = [styles.textBase];

  switch (variant) {
    case 'secondary':
      badgeStyle.push(styles.secondary);
      textStyle.push(styles.secondaryText);
      break;
    case 'destructive':
      badgeStyle.push(styles.destructive);
      textStyle.push(styles.destructiveText);
      break;
    case 'outline':
      badgeStyle.push(styles.outline);
      textStyle.push(styles.outlineText);
      break;
    default:
      badgeStyle.push(styles.default);
      textStyle.push(styles.defaultText);
  }

  return (
    <View style={[badgeStyle, style]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  textBase: {
    fontSize: 12,
    fontWeight: '500',
  },
  default: {
    backgroundColor: '#E0E0E0',
  },
  defaultText: {
    color: '#333333',
  },
  secondary: {
    backgroundColor: '#F0F0F0',
  },
  secondaryText: {
    color: '#555555',
  },
  destructive: {
    backgroundColor: '#FFCCCC',
  },
  destructiveText: {
    color: '#CC0000',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  outlineText: {
    color: '#333333',
  },
});

export { Badge };
