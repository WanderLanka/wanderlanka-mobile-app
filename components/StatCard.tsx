import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, icon, onPress }) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component style={styles.container} onPress={onPress}>
      {icon && (
        <Ionicons name={icon} size={24} color={Colors.primary600} style={styles.icon} />
      )}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
});
