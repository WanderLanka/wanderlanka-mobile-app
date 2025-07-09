import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface SuccessMessageProps {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  icon = 'checkmark-circle',
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.success} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
