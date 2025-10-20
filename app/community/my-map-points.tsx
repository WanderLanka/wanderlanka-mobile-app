import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '@/utils/timeFormat';
import { mapPointsApi } from '@/services/mapPointsApi';
import { router } from 'expo-router';

const POINT_TYPES = [
  { id: 'attraction', name: 'Attraction', icon: 'star-outline', color: Colors.primary600 },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant-outline', color: Colors.warning },
  { id: 'hotel', name: 'Hotel', icon: 'bed-outline', color: Colors.info },
  { id: 'viewpoint', name: 'Viewpoint', icon: 'eye-outline', color: Colors.success },
  { id: 'beach', name: 'Beach', icon: 'water-outline', color: Colors.info },
  { id: 'temple', name: 'Temple', icon: 'home-outline', color: Colors.warning },
  { id: 'nature', name: 'Nature', icon: 'leaf-outline', color: Colors.success },
  { id: 'adventure', name: 'Adventure', icon: 'bicycle-outline', color: Colors.error },
  { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: Colors.primary600 },
  { id: 'nightlife', name: 'Nightlife', icon: 'moon-outline', color: Colors.secondary600 },
  { id: 'transport', name: 'Transport', icon: 'bus-outline', color: Colors.info },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', color: Colors.secondary600 },
];

interface MapPoint {
  _id: string;
  id: string;
  category: 'attraction' | 'restaurant' | 'hotel' | 'viewpoint' | 'beach' | 'temple' | 'nature' | 'adventure' | 'shopping' | 'nightlife' | 'transport' | 'other';
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  latitude: number; // For convenience
  longitude: number; // For convenience
  address?: string;
  placeName?: string;
  author: {
    userId: string;
    username: string;
    avatar?: string;
    role: string;
  };
  rating?: number;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  status: 'published' | 'draft' | 'archived';
  visibility: 'public' | 'private';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditPointModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (point: MapPoint) => void;
  point: MapPoint | null;
}

const EditPointModal: React.FC<EditPointModalProps> = ({ visible, onClose, onSubmit, point }) => {
  const [selectedType, setSelectedType] = useState<string>('attraction');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (point) {
      setSelectedType(point.category);
      setTitle(point.title);
      setDescription(point.description);
    }
  }, [point]);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!point) return;

    const updatedPoint: MapPoint = {
      ...point,
      category: selectedType as MapPoint['category'],
      title: title.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(updatedPoint);
  };

  const resetForm = () => {
    setSelectedType('attraction');
    setTitle('');
    setDescription('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => { onClose(); resetForm(); }}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Map Point</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.modalSubmitText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Point Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeGrid}>
              {POINT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    selectedType === type.id && styles.selectedTypeOption
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={selectedType === type.id ? Colors.white : type.color}
                  />
                  <Text style={[
                    styles.typeOptionText,
                    selectedType === type.id && styles.selectedTypeOptionText
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Clean Public Restroom"
              placeholderTextColor={Colors.secondary400}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide helpful details for other travelers..."
              placeholderTextColor={Colors.secondary400}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* Location Info (Read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={20} color={Colors.secondary600} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>
                  {point?.latitude.toFixed(6)}, {point?.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationNote}>
                  📍 Location cannot be changed after creation
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface MyMapPointCardProps {
  point: MapPoint;
  onEdit: (point: MapPoint) => void;
  onDelete: (point: MapPoint) => void;
  onViewOnMap: (point: MapPoint) => void;
}

const MyMapPointCard: React.FC<MyMapPointCardProps> = ({ point, onEdit, onDelete, onViewOnMap }) => {
  const pointType = POINT_TYPES.find(type => type.id === point.category);
  
  const getStatusConfig = (status: MapPoint['status']) => {
    switch (status) {
      case 'published':
        return { 
          color: Colors.success, 
          icon: 'checkmark-circle' as const, 
          text: 'Published',
          bgColor: Colors.success + '15'
        };
      case 'archived':
        return { 
          color: Colors.error, 
          icon: 'archive' as const, 
          text: 'Archived',
          bgColor: Colors.error + '15'
        };
      default: // draft
        return { 
          color: Colors.warning, 
          icon: 'document-text' as const, 
          text: 'Draft',
          bgColor: Colors.warning + '15'
        };
    }
  };

  const statusConfig = getStatusConfig(point.status);

  return (
    <View style={styles.pointCard}>
      {/* Card Header */}
      <View style={styles.pointHeader}>
        <View style={styles.pointTypeContainer}>
          <View style={[styles.pointTypeIcon, { backgroundColor: pointType?.color + '20' }]}>
            <Ionicons
              name={pointType?.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={pointType?.color}
            />
          </View>
          <View style={styles.pointInfo}>
            <Text style={styles.pointTitle}>{point.title}</Text>
            <Text style={styles.pointType}>{pointType?.name}</Text>
          </View>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>
      </View>
      
      {/* Description */}
      <Text style={styles.pointDescription} numberOfLines={2}>
        {point.description}
      </Text>
      
      {/* Stats */}
      <View style={styles.pointStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={14} color={Colors.warning} />
          <Text style={styles.statText}>{point.rating?.toFixed(1) || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={14} color={Colors.info} />
          <Text style={styles.statText}>{point.commentsCount || 0} reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="location" size={14} color={Colors.primary600} />
          <Text style={styles.statText}>
            {point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}
          </Text>
        </View>
      </View>

      {/* Timestamps */}
      <View style={styles.pointTimestamps}>
        <Text style={styles.timestampText}>
          Added {formatTimeAgo(new Date(point.createdAt))}
        </Text>
        {point.updatedAt && point.updatedAt !== point.createdAt && (
          <Text style={styles.timestampText}>
            Updated {formatTimeAgo(new Date(point.updatedAt))}
          </Text>
        )}
      </View>
      
      {/* Actions */}
      <View style={styles.pointActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => onViewOnMap(point)}
        >
          <Ionicons name="eye" size={16} color={Colors.primary600} />
          <Text style={[styles.actionButtonText, { color: Colors.primary600 }]}>View on Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(point)}
        >
          <Ionicons name="pencil" size={16} color={Colors.info} />
          <Text style={[styles.actionButtonText, { color: Colors.info }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(point)}
        >
          <Ionicons name="trash" size={16} color={Colors.error} />
          <Text style={[styles.actionButtonText, { color: Colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function MyMapPointsScreen() {
  const [myPoints, setMyPoints] = useState<MapPoint[]>([]);
  const [editingPoint, setEditingPoint] = useState<MapPoint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  // Fetch user's map points
  const fetchMyMapPoints = async () => {
    try {
      console.log('📍 Fetching user\'s map points...');
      const response = await mapPointsApi.getMyMapPoints();
      
      if (response.success && response.data && response.data.mapPoints) {
        const points: MapPoint[] = response.data.mapPoints.map((point: any) => ({
          ...point,
          id: point._id,
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
        }));
        
        setMyPoints(points);
        console.log(`✅ Fetched ${points.length} map points`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching map points:', error);
      Alert.alert('Error', error.message || 'Failed to load your map points');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMapPoints();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyMapPoints();
    setRefreshing(false);
  };

  const handleEdit = (point: MapPoint) => {
    setEditingPoint(point);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedPoint: MapPoint) => {
    try {
      console.log('📝 Updating map point:', updatedPoint._id);
      
      const response = await mapPointsApi.updateMapPoint(updatedPoint._id, {
        title: updatedPoint.title,
        description: updatedPoint.description,
        type: updatedPoint.category,
      });

      if (response.success) {
        // Update local state
        setMyPoints(prev => prev.map(p => 
          p._id === updatedPoint._id ? { ...p, ...updatedPoint } : p
        ));
        
        setShowEditModal(false);
        setEditingPoint(null);
        Alert.alert('Success', 'Map point updated successfully!');
        
        // Refresh data
        await fetchMyMapPoints();
      }
    } catch (error: any) {
      console.error('❌ Error updating map point:', error);
      Alert.alert('Error', error.message || 'Failed to update map point');
    }
  };

  const handleDelete = (point: MapPoint) => {
    Alert.alert(
      'Delete Map Point',
      `Are you sure you want to delete "${point.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting map point:', point._id);
              
              const response = await mapPointsApi.deleteMapPoint(point._id);
              
              if (response.success) {
                setMyPoints(prev => prev.filter(p => p._id !== point._id));
                Alert.alert('Deleted', 'Map point has been removed.');
              }
            } catch (error: any) {
              console.error('❌ Error deleting map point:', error);
              Alert.alert('Error', error.message || 'Failed to delete map point');
            }
          },
        },
      ]
    );
  };

  const handleViewOnMap = (point: MapPoint) => {
    // Navigate to map with this point selected and in view mode
    router.push({
      pathname: '/community/crowdsource-map',
      params: { 
        filter: point.category,
        selectedPointId: point.id,
        lat: point.latitude.toString(),
        lng: point.longitude.toString(),
        viewMode: 'direct', // Indicates this is a direct view, not browsing
      }
    });
  };

  const getFilteredPoints = () => {
    if (filter === 'all') return myPoints;
    return myPoints.filter(point => point.status === filter);
  };

  const filteredPoints = getFilteredPoints();

  const getStatusCount = (status: MapPoint['status']) => {
    return myPoints.filter(point => point.status === status).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your map points...</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Map Points</Text>
        <TouchableOpacity 
          onPress={() => router.push('/community/add-map-point')} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>
      
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', count: myPoints.length },
          { key: 'published', label: 'Published', count: getStatusCount('published') },
          { key: 'draft', label: 'Draft', count: getStatusCount('draft') },
          { key: 'archived', label: 'Archived', count: getStatusCount('archived') },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
            onPress={() => setFilter(tab.key as typeof filter)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.activeFilterTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Points List */}
      <ScrollView
        style={styles.pointsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPoints.map((point) => (
          <MyMapPointCard
            key={point.id}
            point={point}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewOnMap={handleViewOnMap}
          />
        ))}

        {filteredPoints.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons 
              name={filter === 'all' ? 'location-outline' : 'filter-outline'} 
              size={48} 
              color={Colors.secondary400} 
            />
            <Text style={styles.emptyStateText}>
              {filter === 'all' 
                ? 'No map points yet' 
                : `No ${filter} points`
              }
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' 
                ? 'Start by adding your first map point!' 
                : `Filter showing only ${filter} points`
              }
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.addFirstPointButton}
                onPress={() => router.push('/community/add-map-point')}
              >
                <Text style={styles.addFirstPointButtonText}>Add Your First Point</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Point Modal */}
      <EditPointModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPoint(null);
        }}
        onSubmit={handleSaveEdit}
        point={editingPoint}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
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
  addButton: {
    padding: 4,
  },
  statsContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
    height: 60,
    maxHeight: 60,
    
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    height: 60
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.secondary50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  pointsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pointCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pointTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointInfo: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  pointType: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  pointStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  pointTimestamps: {
    marginBottom: 16,
    gap: 2,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.secondary400,
  },
  pointActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: Colors.primary100,
  },
  editButton: {
    backgroundColor: Colors.info + '15',
  },
  deleteButton: {
    backgroundColor: Colors.error + '15',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstPointButton: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addFirstPointButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomPadding: {
    height: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light200,
  },
  selectedTypeOption: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.black,
    marginTop: 8,
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'right',
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  locationDetails: {
    marginLeft: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationNote: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
});
