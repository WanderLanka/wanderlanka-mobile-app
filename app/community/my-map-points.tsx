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
import { router } from 'expo-router';

const POINT_TYPES = [
  { id: 'washroom', name: 'Restroom', icon: 'business-outline', color: Colors.primary600 },
  { id: 'wifi', name: 'WiFi Spot', icon: 'wifi-outline', color: Colors.info },
  { id: 'restaurant', name: 'Local Eatery', icon: 'restaurant-outline', color: Colors.warning },
  { id: 'poi', name: 'Point of Interest', icon: 'location-outline', color: Colors.success },
  { id: 'parking', name: 'Parking', icon: 'car-outline', color: Colors.secondary600 },
];

interface MapPoint {
  id: string;
  type: 'washroom' | 'wifi' | 'restaurant' | 'poi' | 'parking';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addedBy: string;
  addedDate: string;
  verified: boolean;
  rating: number;
  reviews: number;
  status: 'pending' | 'approved' | 'rejected';
  lastUpdated?: string;
}

interface EditPointModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (point: MapPoint) => void;
  point: MapPoint | null;
}

const EditPointModal: React.FC<EditPointModalProps> = ({ visible, onClose, onSubmit, point }) => {
  const [selectedType, setSelectedType] = useState<string>('washroom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (point) {
      setSelectedType(point.type);
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
      type: selectedType as MapPoint['type'],
      title: title.trim(),
      description: description.trim(),
      lastUpdated: new Date().toISOString(),
    };

    onSubmit(updatedPoint);
  };

  const resetForm = () => {
    setSelectedType('washroom');
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
  const pointType = POINT_TYPES.find(type => type.id === point.type);
  
  const getStatusConfig = (status: MapPoint['status']) => {
    switch (status) {
      case 'approved':
        return { 
          color: Colors.success, 
          icon: 'checkmark-circle' as const, 
          text: 'Approved',
          bgColor: Colors.success + '15'
        };
      case 'rejected':
        return { 
          color: Colors.error, 
          icon: 'close-circle' as const, 
          text: 'Rejected',
          bgColor: Colors.error + '15'
        };
      default:
        return { 
          color: Colors.warning, 
          icon: 'time' as const, 
          text: 'Pending Review',
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
          <Text style={styles.statText}>{point.rating || '0.0'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={14} color={Colors.info} />
          <Text style={styles.statText}>{point.reviews} reviews</Text>
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
          Added {formatTimeAgo(new Date(point.addedDate))}
        </Text>
        {point.lastUpdated && (
          <Text style={styles.timestampText}>
            Updated {formatTimeAgo(new Date(point.lastUpdated))}
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

// Mock data for demonstration
const MOCK_USER_POINTS: MapPoint[] = [
  {
    id: 'user_point_1',
    type: 'washroom',
    title: 'Clean Public Restroom - Galle Fort',
    description: 'Well-maintained restroom facility near the lighthouse. Accessible and clean with proper amenities.',
    latitude: 6.0535,
    longitude: 80.2210,
    addedBy: 'You',
    addedDate: '2024-01-15',
    verified: true,
    rating: 4.2,
    reviews: 8,
    status: 'approved',
    lastUpdated: '2024-01-20',
  },
  {
    id: 'user_point_2',
    type: 'wifi',
    title: 'Free WiFi - Beach Cafe Unawatuna',
    description: 'Strong WiFi connection available for customers. Password provided with purchase.',
    latitude: 6.0108,
    longitude: 80.2492,
    addedBy: 'You',
    addedDate: '2024-01-10',
    verified: false,
    rating: 0,
    reviews: 0,
    status: 'pending',
  },
  {
    id: 'user_point_3',
    type: 'restaurant',
    title: 'Local Rice & Curry - Mirissa',
    description: 'Authentic Sri Lankan rice and curry. Great portions and very affordable.',
    latitude: 5.9467,
    longitude: 80.4682,
    addedBy: 'You',
    addedDate: '2024-01-05',
    verified: false,
    rating: 0,
    reviews: 0,
    status: 'rejected',
  },
];

export default function MyMapPointsScreen() {
  const [myPoints, setMyPoints] = useState<MapPoint[]>(MOCK_USER_POINTS);
  const [editingPoint, setEditingPoint] = useState<MapPoint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleEdit = (point: MapPoint) => {
    setEditingPoint(point);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedPoint: MapPoint) => {
    setMyPoints(prev => prev.map(p => p.id === updatedPoint.id ? updatedPoint : p));
    setShowEditModal(false);
    setEditingPoint(null);
    Alert.alert('Success', 'Map point updated successfully!');
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
          onPress: () => {
            setMyPoints(prev => prev.filter(p => p.id !== point.id));
            Alert.alert('Deleted', 'Map point has been removed.');
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
        filter: point.type,
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
          { key: 'approved', label: 'Approved', count: getStatusCount('approved') },
          { key: 'pending', label: 'Pending', count: getStatusCount('pending') },
          { key: 'rejected', label: 'Rejected', count: getStatusCount('rejected') },
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
