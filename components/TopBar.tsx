import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface TopBarProps {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  profileImage?: string; // URL or local image path
}

export const TopBar: React.FC<TopBarProps> = ({
  onProfilePress,
  onNotificationsPress,
  profileImage,
}) => {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.profileContainer} onPress={onProfilePress}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person" size={22} color={Colors.primary700} />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
        <Ionicons name="notifications-outline" size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 0,
    backgroundColor: Colors.primary800,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 8,
  },
});
