import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface ServicesTopBarProps {
  onBackPress?: () => void;
  onProfilePress?: () => void;
  profileImage?: string; // URL or local image path
}

export const ServicesTopBar: React.FC<ServicesTopBarProps> = ({
  onBackPress,
  onProfilePress,
  profileImage,
}) => {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/bookNow')}>
        <Ionicons name="arrow-back" size={26} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.profileContainer} onPress={onProfilePress}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={22} color={Colors.primary700} />
            </View>
          )}
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 0,
    backgroundColor: Colors.primary800,
  },
  iconButton: {
    padding: 8,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
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
});
