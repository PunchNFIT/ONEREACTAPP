import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const buttonVariants = {
  default: {
    backgroundColor: '#007BFF',
    color: '#FFFFFF',
  },
  destructive: {
    backgroundColor: '#DC3545',
    color: '#FFFFFF',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#007BFF',
    backgroundColor: 'transparent',
    color: '#007BFF',
  },
  secondary: {
    backgroundColor: '#6C757D',
    color: '#FFFFFF',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#007BFF',
  },
  link: {
    backgroundColor: 'transparent',
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
};

const buttonSizes = {
  default: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    fontSize: 18,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const Button = ({ variant = 'default', size = 'default', style, children, ...props }) => {
  const buttonStyle = {
    ...styles.base,
    ...buttonVariants[variant],
    ...buttonSizes[size],
    ...style,
  };

  return (
    <TouchableOpacity style={buttonStyle} {...props}>
      <Text style={{ color: buttonStyle.color, fontSize: buttonStyle.fontSize }}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});

export { Button };
