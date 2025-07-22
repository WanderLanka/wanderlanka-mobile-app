import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components';

interface PlanningPhase {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  route: string;
  estimatedTime: string;
}

const PLANNING_PHASES: PlanningPhase[] = [
  {
    id: 1,
    title: 'Route Selection',
    description: 'Choose your destinations and create the perfect travel route',
    icon: 'map',
    completed: false,
    route: '/planning/route-selection',
    estimatedTime: '5-10 min'
  },
  {
    id: 2,
    title: 'Accommodation Booking',
    description: 'Find and book the perfect places to stay',
    icon: 'bed',
    completed: false,
    route: '/planning/accommodation',
    estimatedTime: '10-15 min'
  },
  {
    id: 3,
    title: 'Transportation',
    description: 'Arrange your travel between destinations',
    icon: 'car',
    completed: false,
    route: '/planning/transportation',
    estimatedTime: '5-10 min'
  },
  {
    id: 4,
    title: 'Activity Planning',
    description: 'Discover and book amazing activities and experiences',
    icon: 'camera',
    completed: false,
    route: '/planning/activities',
    estimatedTime: '10-20 min'
  },
  {
    id: 5,
    title: 'Budget Planning',
    description: 'Plan your budget and track expenses',
    icon: 'wallet',
    completed: false,
    route: '/planning/budget',
    estimatedTime: '5-10 min'
  },
  {
    id: 6,
    title: 'Final Review',
    description: 'Review and finalize your travel plan',
    icon: 'checkmark-circle',
    completed: false,
    route: '/planning/review',
    estimatedTime: '5 min'
  }
];

export default function PlanningIndexScreen() {
  const params = useLocalSearchParams();
  const destination = params.destination as string;

  const handlePhasePress = (phase: PlanningPhase) => {
    if (phase.id === 1) {
      // Route Selection is available
      router.push(phase.route as any);
    } else {
      // Other phases coming soon
      Alert.alert(
        'Coming Soon',
        `${phase.title} will be available in the next update!`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          Plan Your Trip
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ThemedText variant="title" style={styles.welcomeTitle}>
            Let's Plan Your Perfect Trip! 🌟
          </ThemedText>
          {destination && (
            <ThemedText variant="default" style={styles.destinationText}>
              Destination: {destination}
            </ThemedText>
          )}
          <ThemedText variant="default" style={styles.welcomeDescription}>
            Follow these steps to create an amazing travel experience in Sri Lanka.
          </ThemedText>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>
            Planning Progress
          </ThemedText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
          <ThemedText variant="caption" style={styles.progressText}>
            0 of {PLANNING_PHASES.length} phases completed
          </ThemedText>
        </View>

        {/* Planning Phases */}
        <View style={styles.phasesSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>
            Planning Phases
          </ThemedText>
          
          {PLANNING_PHASES.map((phase, index) => (
            <TouchableOpacity
              key={phase.id}
              style={[
                styles.phaseCard,
                phase.completed && styles.completedPhaseCard,
                phase.id === 1 && styles.availablePhaseCard
              ]}
              onPress={() => handlePhasePress(phase)}
              disabled={phase.id !== 1 && !phase.completed}
            >
              <View style={styles.phaseHeader}>
                <View style={[
                  styles.phaseIconContainer,
                  phase.completed && styles.completedPhaseIcon,
                  phase.id === 1 && styles.availablePhaseIcon
                ]}>
                  <Ionicons
                    name={phase.icon as any}
                    size={24}
                    color={phase.completed ? Colors.white : phase.id === 1 ? Colors.primary600 : Colors.secondary400}
                  />
                </View>
                <View style={styles.phaseInfo}>
                  <ThemedText variant="subtitle" style={[
                    styles.phaseTitle,
                    phase.id !== 1 && !phase.completed && styles.disabledPhaseTitle
                  ]}>
                    Phase {phase.id}: {phase.title}
                  </ThemedText>
                  <ThemedText variant="caption" style={styles.estimatedTime}>
                    Estimated time: {phase.estimatedTime}
                  </ThemedText>
                </View>
                <View style={styles.phaseStatus}>
                  {phase.completed ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  ) : phase.id === 1 ? (
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary600} />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color={Colors.secondary400} />
                  )}
                </View>
              </View>
              <ThemedText variant="default" style={[
                styles.phaseDescription,
                phase.id !== 1 && !phase.completed && styles.disabledPhaseDescription
              ]}>
                {phase.description}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>
            Planning Tips 💡
          </ThemedText>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color={Colors.warning} />
            <ThemedText variant="default" style={styles.tipText}>
              Start with route selection to get personalized recommendations for accommodations and activities.
            </ThemedText>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={20} color={Colors.info} />
            <ThemedText variant="default" style={styles.tipText}>
              The entire planning process takes about 30-60 minutes to complete.
            </ThemedText>
          </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 8,
    textAlign: 'center',
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.secondary600,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light200,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  phasesSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  phaseCard: {
    backgroundColor: Colors.secondary50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  completedPhaseCard: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
  },
  availablePhaseCard: {
    backgroundColor: Colors.primary100,
    borderColor: Colors.primary300,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  completedPhaseIcon: {
    backgroundColor: Colors.success,
  },
  availablePhaseIcon: {
    backgroundColor: Colors.primary100,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  disabledPhaseTitle: {
    color: Colors.secondary400,
  },
  estimatedTime: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  phaseStatus: {
    marginLeft: 8,
  },
  phaseDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
  },
  disabledPhaseDescription: {
    color: Colors.secondary400,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginLeft: 12,
  },
});
