import { View, ViewProps } from 'react-native';

import { Colors } from '../constants/Colors';
import React from 'react';

interface ThemedViewProps extends ViewProps {
  backgroundColor?: keyof typeof Colors;
}

export function ThemedView({ 
//   backgroundColor = '#',
  style,
  ...props 
}: ThemedViewProps) {
  return (
    <View
      style={[
        {
        //   backgroundColor: Colors[backgroundColor],
        },
        style,
      ]}
      {...props}
    />
  );
}
