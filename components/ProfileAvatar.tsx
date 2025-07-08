import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface ProfileAvatarProps {
  imageUri?: string | null;
  size?: number;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUri,
  size = 80,
  onEdit,
  showEditButton = true,
}) => {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };
  const editButtonSize = size * 0.35;
  const editButtonPosition = {
    width: editButtonSize,
    height: editButtonSize,
    borderRadius: editButtonSize / 2,
    bottom: 0,
    right: 0,
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.avatar, avatarSize]} />
      ) : (
        <View style={[styles.avatarPlaceholder, avatarSize]}>
          <Ionicons name="person" size={size * 0.5} color={Colors.secondary400} />
        </View>
      )}
      
      {showEditButton && onEdit && (
        <TouchableOpacity
          style={[styles.editButton, editButtonPosition]}
          onPress={onEdit}
        >
          <Ionicons name="camera" size={editButtonSize * 0.6} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
