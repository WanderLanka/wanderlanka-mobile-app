import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function CreatePostScreen() {
  const [postContent, setPostContent] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleImagePicker = () => {
    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos to your post',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Gallery', onPress: () => console.log('Open gallery') },
      ]
    );
  };

  const handlePost = () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please write something about your travel experience');
      return;
    }

    // TODO: Submit to backend
    Alert.alert(
      'Post Created!',
      'Your travel story has been shared with the community.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Story</Text>
        <TouchableOpacity onPress={handlePost}>
          <Text style={styles.postText}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.secondary400} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Your Name</Text>
            <Text style={styles.postVisibility}>Sharing publicly</Text>
          </View>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Share your travel experience... What did you discover? Any tips for fellow travelers?"
          placeholderTextColor={Colors.secondary400}
          multiline
          numberOfLines={8}
          value={postContent}
          onChangeText={setPostContent}
          textAlignVertical="top"
        />

        {/* Location Input */}
        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={20} color={Colors.primary600} />
          <TextInput
            style={styles.locationInput}
            placeholder="Add location (e.g., Galle Fort, Sri Lanka)"
            placeholderTextColor={Colors.secondary400}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Photo Section */}
        <TouchableOpacity style={styles.photoSection} onPress={handleImagePicker}>
          <View style={styles.photoHeader}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary600} />
            <Text style={styles.photoText}>Add Photos</Text>
          </View>
          {selectedImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImages(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={32} color={Colors.secondary400} />
              <Text style={styles.photoPlaceholderText}>Tap to add photos</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Post Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.optionsTitle}>Post Options</Text>
          
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="people-outline" size={20} color={Colors.primary600} />
              <Text style={styles.optionText}>Allow comments</Text>
            </View>
            <TouchableOpacity style={styles.toggle}>
              <View style={styles.toggleActive} />
            </TouchableOpacity>
          </View>

          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="share-outline" size={20} color={Colors.primary600} />
              <Text style={styles.optionText}>Allow sharing</Text>
            </View>
            <TouchableOpacity style={styles.toggle}>
              <View style={styles.toggleActive} />
            </TouchableOpacity>
          </View>

          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="location-outline" size={20} color={Colors.primary600} />
              <Text style={styles.optionText}>Show exact location</Text>
            </View>
            <TouchableOpacity style={styles.toggleInactive}>
              <View style={styles.toggleKnob} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for a great post</Text>
          <Text style={styles.tip}>• Share specific details about your experience</Text>
          <Text style={styles.tip}>• Include helpful tips for other travelers</Text>
          <Text style={styles.tip}>• Add photos to make your story more engaging</Text>
          <Text style={styles.tip}>• Tag the location to help others find it</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  postVisibility: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  contentInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    minHeight: 150,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 12,
  },
  photoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginLeft: 8,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: Colors.light200,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: Colors.secondary400,
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  optionsSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: Colors.black,
    marginLeft: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignSelf: 'flex-end',
  },
  toggleInactive: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light200,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  tipsSection: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: Colors.primary700,
    lineHeight: 18,
    marginBottom: 4,
  },
});
