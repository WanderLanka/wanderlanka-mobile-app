import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const photoSize = (width - 60) / 3; // 3 photos per row with padding

// Mock trip memories data
const MOCK_TRIP_MEMORIES = [
  {
    id: 'memory1',
    tripId: 'trip1',
    destination: 'Kandy Cultural Triangle',
    date: '2024-06-15',
    type: 'photo',
    thumbnail: null, // placeholder for image
    title: 'Temple of the Tooth',
    description: 'Beautiful golden temple in the heart of Kandy',
    likes: 24,
    isLiked: true,
  },
  {
    id: 'memory2',
    tripId: 'trip1',
    destination: 'Kandy Cultural Triangle',
    date: '2024-06-16',
    type: 'video',
    thumbnail: null,
    title: 'Cultural Dance Performance',
    description: 'Traditional Kandyan dance at the cultural center',
    likes: 18,
    isLiked: false,
    duration: '2:45',
  },
  {
    id: 'memory3',
    tripId: 'trip2',
    destination: 'Ella Hill Country',
    date: '2024-05-20',
    type: 'photo',
    thumbnail: null,
    title: 'Nine Arch Bridge',
    description: 'Iconic railway bridge surrounded by tea plantations',
    likes: 45,
    isLiked: true,
  },
  {
    id: 'memory4',
    tripId: 'trip2',
    destination: 'Ella Hill Country',
    date: '2024-05-21',
    type: 'photo',
    thumbnail: null,
    title: 'Little Adams Peak Sunrise',
    description: 'Breathtaking sunrise view from the peak',
    likes: 67,
    isLiked: true,
  },
  {
    id: 'memory5',
    tripId: 'trip3',
    destination: 'Galle Fort Heritage',
    date: '2024-04-10',
    type: 'photo',
    thumbnail: null,
    title: 'Dutch Fort Walls',
    description: 'Historic fortifications overlooking the ocean',
    likes: 32,
    isLiked: false,
  },
  {
    id: 'memory6',
    tripId: 'trip1',
    destination: 'Kandy Cultural Triangle',
    date: '2024-06-17',
    type: 'photo',
    thumbnail: null,
    title: 'Royal Botanical Gardens',
    description: 'Exotic flora and peaceful walkways',
    likes: 28,
    isLiked: true,
  },
  {
    id: 'memory7',
    tripId: 'trip2',
    destination: 'Ella Hill Country',
    date: '2024-05-22',
    type: 'video',
    thumbnail: null,
    title: 'Train Journey Through Hills',
    description: 'Scenic train ride through the hill country',
    likes: 41,
    isLiked: false,
    duration: '1:23',
  },
  {
    id: 'memory8',
    tripId: 'trip3',
    destination: 'Galle Fort Heritage',
    date: '2024-04-10',
    type: 'photo',
    thumbnail: null,
    title: 'Lighthouse at Sunset',
    description: 'Golden hour at the historic lighthouse',
    likes: 53,
    isLiked: true,
  },
];

interface MemoryItemProps {
  memory: typeof MOCK_TRIP_MEMORIES[0];
  onPress: () => void;
}

const MemoryItem: React.FC<MemoryItemProps> = ({ memory, onPress }) => {
  const [isLiked, setIsLiked] = useState(memory.isLiked);
  const [likes, setLikes] = useState(memory.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <TouchableOpacity style={styles.memoryItem} onPress={onPress} activeOpacity={0.9}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {memory.thumbnail ? (
          <Image source={{ uri: memory.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons 
              name={memory.type === 'video' ? 'videocam' : 'camera'} 
              size={32} 
              color={Colors.secondary400} 
            />
          </View>
        )}
        
        {/* Video indicator */}
        {memory.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play-circle" size={24} color={Colors.white} />
            {memory.duration && (
              <Text style={styles.videoDuration}>{memory.duration}</Text>
            )}
          </View>
        )}

        {/* Like button */}
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={16} 
            color={isLiked ? Colors.error : Colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Memory Info */}
      <View style={styles.memoryInfo}>
        <Text style={styles.memoryTitle} numberOfLines={1}>{memory.title}</Text>
        <Text style={styles.memoryDescription} numberOfLines={2}>{memory.description}</Text>
        
        <View style={styles.memoryMeta}>
          <Text style={styles.memoryDestination}>{memory.destination}</Text>
          <View style={styles.memoryStats}>
            <Ionicons name="heart" size={12} color={Colors.error} />
            <Text style={styles.likesCount}>{likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TripMemoriesScreen() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');

  const filteredMemories = MOCK_TRIP_MEMORIES.filter(memory => {
    if (filterType === 'all') return true;
    return memory.type === filterType;
  });

  const totalPhotos = MOCK_TRIP_MEMORIES.filter(m => m.type === 'photo').length;
  const totalVideos = MOCK_TRIP_MEMORIES.filter(m => m.type === 'video').length;
  const totalLikes = MOCK_TRIP_MEMORIES.reduce((sum, m) => sum + m.likes, 0);

  const handleMemoryPress = (memory: typeof MOCK_TRIP_MEMORIES[0]) => {
    // Navigate to full screen memory viewer
    console.log('Open memory:', memory.title);
  };

  const renderGridItem = ({ item }: { item: typeof MOCK_TRIP_MEMORIES[0] }) => (
    <MemoryItem memory={item} onPress={() => handleMemoryPress(item)} />
  );

  const renderListItem = ({ item }: { item: typeof MOCK_TRIP_MEMORIES[0] }) => (
    <TouchableOpacity style={styles.listMemoryItem} onPress={() => handleMemoryPress(item)}>
      <View style={styles.listThumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.listThumbnail} />
        ) : (
          <View style={styles.listPlaceholderThumbnail}>
            <Ionicons 
              name={item.type === 'video' ? 'videocam' : 'camera'} 
              size={24} 
              color={Colors.secondary400} 
            />
          </View>
        )}
        {item.type === 'video' && (
          <View style={styles.listVideoIndicator}>
            <Ionicons name="play-circle" size={16} color={Colors.white} />
          </View>
        )}
      </View>

      <View style={styles.listMemoryInfo}>
        <Text style={styles.listMemoryTitle}>{item.title}</Text>
        <Text style={styles.listMemoryDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.listMemoryMeta}>
          <Text style={styles.listMemoryDate}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>
          <View style={styles.listMemoryStats}>
            <Ionicons name="heart" size={12} color={Colors.error} />
            <Text style={styles.listLikesCount}>{item.likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Memories</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color={Colors.primary600} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalPhotos}</Text>
          <Text style={styles.summaryLabel}>Photos</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalVideos}</Text>
          <Text style={styles.summaryLabel}>Videos</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalLikes}</Text>
          <Text style={styles.summaryLabel}>Total Likes</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'photo', 'video'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.activeFilterTab]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[
              styles.filterTabText,
              filterType === type && styles.activeFilterTabText
            ]}>
              {type === 'all' ? 'All' : type === 'photo' ? 'Photos' : 'Videos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Memories Grid/List */}
      <FlatList
        data={filteredMemories}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        contentContainerStyle={styles.memoriesContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="camera" size={24} color={Colors.white} />
      </TouchableOpacity>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerActions: {
    flexDirection: 'row',
  },
  viewModeButton: {
    padding: 4,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: Colors.primary600,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  memoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  memoryItem: {
    width: (width - 60) / 2,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnailContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDuration: {
    fontSize: 10,
    color: Colors.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
  },
  memoryInfo: {
    padding: 12,
  },
  memoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  memoryDescription: {
    fontSize: 12,
    color: Colors.secondary600,
    marginBottom: 8,
    lineHeight: 16,
  },
  memoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryDestination: {
    fontSize: 10,
    color: Colors.secondary500,
    flex: 1,
  },
  memoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCount: {
    fontSize: 10,
    color: Colors.secondary600,
    marginLeft: 2,
  },
  listMemoryItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listThumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  listThumbnail: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  listPlaceholderThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listVideoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  listMemoryInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listMemoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  listMemoryDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
    marginBottom: 8,
  },
  listMemoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listMemoryDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  listMemoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listLikesCount: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
