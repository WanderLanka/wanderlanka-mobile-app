import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { UserRole } from '../types';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  error?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleSelect,
  error,
}) => {
  const roles = [
    {
      value: 'traveller' as UserRole,
      label: 'Traveller',
      description: 'Explore destinations and plan trips',
      icon: 'map' as keyof typeof Ionicons.glyphMap,
    },
    {
      value: 'guide' as UserRole,
      label: 'Guide',
      description: 'Share local knowledge and experiences',
      icon: 'person' as keyof typeof Ionicons.glyphMap,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose your role</Text>
      <View style={styles.roleContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleCard,
              selectedRole === role.value && styles.roleCardSelected,
              error && styles.roleCardError,
            ]}
            onPress={() => onRoleSelect(role.value)}
          >
            <View style={[
              styles.iconContainer,
              selectedRole === role.value && styles.iconContainerSelected,
            ]}>
              <Ionicons
                name={role.icon}
                size={24}
                color={selectedRole === role.value ? Colors.white : Colors.primary600}
              />
            </View>
            <Text style={[
              styles.roleLabel,
              selectedRole === role.value && styles.roleLabelSelected,
            ]}>
              {role.label}
            </Text>
            <Text style={[
              styles.roleDescription,
              selectedRole === role.value && styles.roleDescriptionSelected,
            ]}>
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  roleCardSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  roleCardError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: Colors.primary600,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  roleLabelSelected: {
    color: Colors.primary700,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  roleDescriptionSelected: {
    color: Colors.primary600,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 8,
    fontFamily: 'Inter',
  },
});
