import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../components';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock data for unfinished drafts
const DRAFT_TRIPS = [
  {
    id: 'draft1',
    title: 'Western Province Explorer',
    destination: 'Colombo & Negombo',
    progress: 65,
    lastEdited: '2024-07-22',
    startDate: '2024-08-15',
    endDate: '2024-08-18',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    completedSteps: ['destination', 'dates', 'accommodation'],
    nextStep: 'transport',
    totalSteps: ['destination', 'dates', 'accommodation', 'transport', 'guides'],
    description: 'Urban adventure and beach relaxation combo',
    estimatedBudget: '$320',
    peopleCount: 2,
    autoSaved: true,
    draftType: 'planning',
  },
  {
    id: 'draft2',
    title: 'Northern Cultural Journey',
    destination: 'Jaffna & Mannar',
    progress: 30,
    lastEdited: '2024-07-20',
    startDate: '2024-09-10',
    endDate: '2024-09-14',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400',
    completedSteps: ['destination', 'dates'],
    nextStep: 'accommodation',
    totalSteps: ['destination', 'dates', 'accommodation', 'transport', 'guides'],
    description: 'Explore the unique Tamil culture and heritage',
    estimatedBudget: 'Not calculated',
    peopleCount: 4,
    autoSaved: false,
    draftType: 'planning',
  },
];

export default function UnfinishedTripsScreen() {
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'date'>('recent');

  const sortedDrafts = [...DRAFT_TRIPS].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
      case 'progress':
        return b.progress - a.progress;
      case 'date':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      default:
        return 0;
    }
  });

  const handleContinueDraft = (draft: any) => {
    const nextStepRoutes: { [key: string]: string } = {
      'accommodation': '/planning/booking',
      'transport': '/planning/booking',
      'activities': '/planning/itinerary',
      'guides': '/planning/booking',
    };

    const route = nextStepRoutes[draft.nextStep] || '/planning';
    
    router.push({
      pathname: route as any,
      params: {
        draftId: draft.id,
        destination: draft.destination,
        startDate: draft.startDate,
        endDate: draft.endDate,
        resumeMode: 'true',
        activeTab: draft.nextStep,
      }
    });
  };

  const handleDeleteDraft = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Deleting draft:', draftId);
          }
        },
      ]
    );
  };

  const handleDuplicateDraft = (draft: any) => {
    Alert.alert(
      'Duplicate Draft',
      'Create a copy of this draft to continue planning?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Duplicate', 
          onPress: () => {
            router.push({
              pathname: '/planning/route-selection' as any,
              params: {
                duplicateFrom: draft.id,
                destination: draft.destination,
                startDate: draft.startDate,
                endDate: draft.endDate,
              }
            });
          }
        },
      ]
    );
  };

  const getStepIcon = (step: string) => {
    const icons: { [key: string]: string } = {
      destination: 'location',
      dates: 'calendar',
      accommodation: 'bed',
      transport: 'car',
      guides: 'person',
    };
    return icons[step] || 'checkmark-circle';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return Colors.success;
    if (progress >= 50) return Colors.warning;
    return Colors.error;
  };

  const renderDraftCard = ({ item: draft }: { item: any }) => (
    <TouchableOpacity 
      style={styles.draftCard}
      onPress={() => handleContinueDraft(draft)}
      activeOpacity={0.7}
    >
      <View style={styles.draftImageContainer}>
        <Image 
          source={{ uri: draft.thumbnail }} 
          style={styles.draftImage}
          resizeMode="cover"
        />
        <View style={styles.draftImageOverlay}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${draft.progress}%`,
                    backgroundColor: getProgressColor(draft.progress)
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText}>{draft.progress}%</ThemedText>
          </View>
          {draft.autoSaved && (
            <View style={styles.autoSavedBadge}>
              <Ionicons name="cloud-done" size={12} color={Colors.white} />
              <ThemedText style={styles.autoSavedText}>Auto-saved</ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.draftContent}>
        <View style={styles.draftHeader}>
          <View style={styles.draftTitleContainer}>
            <ThemedText style={styles.draftTitle} numberOfLines={1}>
              {draft.title}
            </ThemedText>
            <ThemedText style={styles.draftDestination} numberOfLines={1}>
              {draft.destination}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.draftOptionsButton}
            onPress={() => {
              Alert.alert(
                'Draft Options',
                'What would you like to do with this draft?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Duplicate', onPress: () => handleDuplicateDraft(draft) },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDeleteDraft(draft.id) },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={Colors.secondary500} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.draftDescription} numberOfLines={2}>
          {draft.description}
        </ThemedText>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <ThemedText style={styles.stepsTitle}>Planning Progress</ThemedText>
          <View style={styles.stepsRow}>
            {draft.totalSteps.map((step: string, index: number) => {
              const isCompleted = draft.completedSteps.includes(step);
              const isNext = step === draft.nextStep;
              
              return (
                <View key={step} style={styles.stepItem}>
                  <View style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isNext && styles.stepIconNext,
                  ]}>
                    <Ionicons 
                      name={isCompleted ? "checkmark" : getStepIcon(step) as any} 
                      size={12} 
                      color={
                        isCompleted ? Colors.white : 
                        isNext ? Colors.primary600 : 
                        Colors.secondary400
                      } 
                    />
                  </View>
                  <ThemedText style={[
                    styles.stepLabel,
                    isNext && styles.stepLabelNext
                  ]}>
                    {step}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.draftFooter}>
          <View style={styles.draftInfo}>
            <View style={styles.draftInfoItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
              <ThemedText style={styles.draftInfoText}>
                {new Date(draft.startDate).toLocaleDateString()} - {new Date(draft.endDate).toLocaleDateString()}
              </ThemedText>
            </View>
            <View style={styles.draftInfoItem}>
              <Ionicons name="people-outline" size={14} color={Colors.secondary500} />
              <ThemedText style={styles.draftInfoText}>{draft.peopleCount} travelers</ThemedText>
            </View>
          </View>
          
          <View style={styles.draftActions}>
            <ThemedText style={styles.lastEdited}>
              Edited {new Date(draft.lastEdited).toLocaleDateString()}
            </ThemedText>
            <CustomButton
              title="Continue"
              variant="primary"
              size="small"
              onPress={() => handleContinueDraft(draft)}
              style={styles.continueButton}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Unfinished Trips</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {sortedDrafts.length} drafts waiting to be completed
          </ThemedText>
        </View>
        <View style={styles.headerAction} />
      </View>

      {/* Sort Options */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortContainer}
        style={styles.sortScroll}
      >
        {[
          { id: 'recent', label: 'Recently Edited' },
          { id: 'progress', label: 'Most Progress' },
          { id: 'date', label: 'Trip Date' },
        ].map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortPill,
              sortBy === option.id && styles.sortPillActive
            ]}
            onPress={() => setSortBy(option.id as any)}
          >
            <ThemedText style={[
              styles.sortPillText,
              sortBy === option.id && styles.sortPillTextActive
            ]}>
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Drafts List */}
      <FlatList
        data={sortedDrafts}
        renderItem={renderDraftCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.draftsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={Colors.secondary400} />
            <ThemedText style={styles.emptyStateTitle}>No Unfinished Trips</ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              All your planning sessions are complete! Start a new trip to see drafts here.
            </ThemedText>
            <CustomButton
              title="Start Planning"
              variant="primary"
              size="medium"
              onPress={() => router.push('/planning')}
              style={styles.emptyStateButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
  },

  // Sort
  sortScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    height:  35,
    marginBottom: 8,
  },
  sortPillActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  sortPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  sortPillTextActive: {
    color: Colors.white,
  },

  // Drafts List
  draftsList: {
    padding: 20,
    gap: 16,
  },
  draftCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  draftImageContainer: {
    position: 'relative',
    height: 120,
  },
  draftImage: {
    width: '100%',
    height: '100%',
  },
  draftImageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  progressBackground: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  autoSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    gap: 4,
  },
  autoSavedText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '500',
  },

  // Draft Content
  draftContent: {
    padding: 16,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  draftTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 2,
  },
  draftDestination: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
  },
  draftOptionsButton: {
    padding: 4,
  },
  draftDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Steps
  stepsContainer: {
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepIconCompleted: {
    backgroundColor: Colors.success,
  },
  stepIconNext: {
    backgroundColor: Colors.primary100,
    borderWidth: 2,
    borderColor: Colors.primary600,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.secondary400,
    textAlign: 'center',
  },
  stepLabelNext: {
    color: Colors.primary600,
    fontWeight: '600',
  },

  // Footer
  draftFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    paddingTop: 12,
  },
  draftInfo: {
    marginBottom: 12,
  },
  draftInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  draftInfoText: {
    fontSize: 12,
    color: Colors.secondary600,
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastEdited: {
    fontSize: 12,
    color: Colors.secondary400,
  },
  continueButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
});
