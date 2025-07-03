import { Text, TextProps } from 'react-native';

import { Colors } from '../constants/Colors';
import React from 'react';

interface ThemedTextProps extends TextProps {
  variant?: 'default' | 'title' | 'subtitle' | 'caption';
  color?: keyof typeof Colors;
}

export function ThemedText({ 
  variant = 'default', 
  color = 'secondary700',
  style,
  ...props 
}: ThemedTextProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return {
          fontSize: 24,
          fontWeight: '700' as const,
          fontFamily: 'Poppins',
        };
      case 'subtitle':
        return {
          fontSize: 18,
          fontWeight: '600' as const,
          fontFamily: 'Poppins',
        };
      case 'caption':
        return {
          fontSize: 12,
          fontWeight: '400' as const,
          fontFamily: 'Inter',
        };
      default:
        return {
          fontSize: 16,
          fontWeight: '400' as const,
          fontFamily: 'Inter',
        };
    }
  };

  return (
    <Text
      style={[
        {
          color: Colors[color],
          ...getVariantStyles(),
        },
        style,
      ]}
      {...props}
    />
  );
}
