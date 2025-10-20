/**
 * INTEGRATION GUIDE FOR CROWDSOURCE MAP REVIEWS
 * 
 * This file shows how to integrate the review system into the crowdsource-map.tsx screen.
 * Follow the steps below to add review functionality to map points.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { ReviewList } from '../../components/ReviewList';
import { AddReviewModal } from '../../components/AddReviewModal';
import { StarRating } from '../../components/StarRating';

/**
 * STEP 1: Add state variables to your crowdsource-map.tsx component
 * Add these inside your component function:
 */

const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

/**
 * STEP 2: Create a MapPointDetailModal component
 * This modal will show when a user taps on a map marker.
 * It displays the map point information along with reviews.
 */

interface MapPointDetailModalProps {
  visible: boolean;
  mapPoint: MapPoint | null;
  onClose: () => void;
}

const MapPointDetailModal: React.FC<MapPointDetailModalProps> = ({
  visible,
  mapPoint,
  onClose,
}) => {
  const [showAddReview, setShowAddReview] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(0);

  if (!mapPoint) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.flex1}>
              <Text style={styles.modalTitle}>{mapPoint.name || 'Map Point'}</Text>
              <Text style={styles.modalSubtitle}>{mapPoint.type}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {mapPoint.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{mapPoint.description}</Text>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.infoText}>📍 Added by: {mapPoint.addedBy || 'Anonymous'}</Text>
            <Text style={styles.infoText}>
              📅 Added on: {new Date(mapPoint.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {/* Write Review Button */}
          <View style={styles.reviewButtonContainer}>
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => setShowAddReview(true)}
            >
              <Text style={styles.writeReviewButtonText}>✍️ Write a Review</Text>
            </TouchableOpacity>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <ReviewList
              mapPointId={mapPoint.id}
              refreshTrigger={reviewRefresh}
            />
          </View>
        </View>
      </Modal>

      {/* Add Review Modal */}
      <AddReviewModal
        visible={showAddReview}
        mapPointId={mapPoint.id}
        mapPointName={mapPoint.name || 'This location'}
        onClose={() => setShowAddReview(false)}
        onReviewAdded={() => {
          setShowAddReview(false);
          setReviewRefresh(prev => prev + 1); // Trigger review list refresh
        }}
      />
    </>
  );
};

/**
 * STEP 3: Add map marker press handler
 * Update your existing map marker onPress handler to show the detail modal:
 */

const [selectedMapPoint, setSelectedMapPoint] = useState<MapPoint | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);

// In your MapView, update the Marker component:
<Marker
  coordinate={{
    latitude: point.latitude,
    longitude: point.longitude,
  }}
  title={point.name}
  description={point.description}
  onPress={() => {
    setSelectedMapPoint(point);
    setShowDetailModal(true);
  }}
>
  {/* Your marker icon */}
</Marker>

/**
 * STEP 4: Render the detail modal in your component JSX
 * Add this at the end of your return statement, after the map:
 */

return (
  <View style={styles.container}>
    {/* Your existing MapView and other components */}
    
    {/* Add this at the end */}
    <MapPointDetailModal
      visible={showDetailModal}
      mapPoint={selectedMapPoint}
      onClose={() => {
        setShowDetailModal(false);
        setSelectedMapPoint(null);
      }}
    />
  </View>
);

/**
 * STEP 5: Add these styles to your StyleSheet
 */

const styles = StyleSheet.create({
  // ... your existing styles ...

  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  flex1: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#4B5563',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  reviewButtonContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  writeReviewButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  writeReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reviewsSection: {
    flex: 1,
    padding: 20,
  },
});

/**
 * ALTERNATIVE: Simpler Integration (Show reviews inline on existing detail view)
 * 
 * If you already have a detail view/modal for map points, you can simply add:
 */

// Inside your existing map point detail view:
<View style={styles.reviewsContainer}>
  <View style={styles.reviewHeader}>
    <Text style={styles.reviewTitle}>Reviews</Text>
    <TouchableOpacity
      style={styles.addReviewButton}
      onPress={() => setShowAddReview(true)}
    >
      <Text style={styles.addReviewButtonText}>+ Add Review</Text>
    </TouchableOpacity>
  </View>

  {/* Review List */}
  <ReviewList 
    mapPointId={selectedMapPoint.id} 
    refreshTrigger={reviewRefreshTrigger}
  />
</View>

// And add the AddReviewModal:
<AddReviewModal
  visible={showAddReview}
  mapPointId={selectedMapPoint.id}
  mapPointName={selectedMapPoint.name || 'This location'}
  onClose={() => setShowAddReview(false)}
  onReviewAdded={() => {
    setShowAddReview(false);
    setReviewRefreshTrigger(prev => prev + 1); // Refresh reviews
  }}
/>

/**
 * COMPLETE EXAMPLE: Minimal Integration
 * Copy this directly into your crowdsource-map.tsx
 */

// At the top of your component:
import { ReviewList } from '../../components/ReviewList';
import { AddReviewModal } from '../../components/AddReviewModal';

// Add state:
const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewRefresh, setReviewRefresh] = useState(0);
const [selectedPointForReview, setSelectedPointForReview] = useState<MapPoint | null>(null);

// When marker is pressed (or in your existing detail view):
<TouchableOpacity
  style={styles.viewReviewsButton}
  onPress={() => {
    setSelectedPointForReview(mapPoint);
    // Show reviews in your existing modal/sheet
  }}
>
  <Text>View Reviews</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.addReviewButton}
  onPress={() => {
    setSelectedPointForReview(mapPoint);
    setShowReviewModal(true);
  }}
>
  <Text>Write Review</Text>
</TouchableOpacity>

// In your render (where you show reviews):
<ReviewList 
  mapPointId={selectedPointForReview?.id || ''} 
  refreshTrigger={reviewRefresh}
/>

// Add review modal:
<AddReviewModal
  visible={showReviewModal}
  mapPointId={selectedPointForReview?.id || ''}
  mapPointName={selectedPointForReview?.name || 'This location'}
  onClose={() => setShowReviewModal(false)}
  onReviewAdded={() => {
    setShowReviewModal(false);
    setReviewRefresh(prev => prev + 1);
  }}
/>

/**
 * NOTES:
 * 
 * 1. Make sure you have the map point ID available. Your MapPoint interface should have:
 *    interface MapPoint {
 *      id: string;  // MongoDB _id from backend
 *      name?: string;
 *      type: string;
 *      latitude: number;
 *      longitude: number;
 *      description?: string;
 *      addedBy?: string;
 *      createdAt?: string;
 *    }
 * 
 * 2. The backend API expects the MongoDB _id field, so make sure your map points
 *    include this when fetching from the API.
 * 
 * 3. Users must be authenticated to write reviews. The review components handle
 *    authentication automatically using the stored access token.
 * 
 * 4. Reviews are paginated (10 per page) and load more as user scrolls.
 * 
 * 5. Users can only write one review per map point (enforced by backend).
 * 
 * 6. Users can delete their own reviews but not others'.
 * 
 * 7. The helpful button is available to all authenticated users.
 */

export default {};
