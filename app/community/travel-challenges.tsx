import {
  Alert,
  FlatList,
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
import React, { useState } from 'react';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '@/utils/timeFormat';
import { router } from 'expo-router';

interface TravelChallenge {
  id: string;
  title: string;
  description: string;
  category: 'photo' | 'adventure' | 'cultural' | 'sustainability' | 'social' | 'exploration';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  reward: {
    type: 'points' | 'badge' | 'discount' | 'achievement';
    value: string;
    description: string;
  };
  startDate: string;
  endDate: string;
  participants: number;
  maxParticipants?: number;
  isParticipating: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
  requirements: string[];
  tags: string[];
  organizer: {
    id: string;
    name: string;
    type: 'wanderlanka' | 'partner' | 'community';
  };
  featured: boolean;
  trending: boolean;
  submissions?: Array<{
    id: string;
    participant: string;
    content: string;
    timestamp: string;
    verified: boolean;
  }>;
}

const MOCK_CHALLENGES: TravelChallenge[] = [
  {
    id: 'challenge1',
    title: 'Capture Sri Lanka\'s Sunrise',
    description: 'Take stunning sunrise photos from 5 different iconic locations across Sri Lanka. Share your golden hour moments and discover the island\'s most beautiful dawns.',
    category: 'photo',
    difficulty: 'medium',
    duration: '2 weeks',
    reward: {
      type: 'badge',
      value: 'Golden Hour Master',
      description: 'Exclusive sunrise photographer badge + featured gallery spot',
    },
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    participants: 156,
    maxParticipants: 200,
    isParticipating: true,
    isCompleted: false,
    progress: 60,
    requirements: [
      'Visit 5 different sunrise locations',
      'Upload photos with location tags',
      'Include brief story about each experience',
    ],
    tags: ['Photography', 'Sunrise', 'Landscapes', 'Golden Hour'],
    organizer: {
      id: 'org1',
      name: 'WanderLanka',
      type: 'wanderlanka',
    },
    featured: true,
    trending: true,
    submissions: [
      {
        id: 'sub1',
        participant: 'PhotoEnthusiast_LK',
        content: 'Amazing sunrise at Sigiriya Rock! The mist rolling over the jungle was magical.',
        timestamp: '2024-07-08T06:30:00Z',
        verified: true,
      },
    ],
  },
  {
    id: 'challenge2',
    title: 'Eco-Warrior Challenge',
    description: 'Join our sustainability mission! Complete eco-friendly activities like beach cleanups, supporting local businesses, and using public transport.',
    category: 'sustainability',
    difficulty: 'easy',
    duration: '1 month',
    reward: {
      type: 'discount',
      value: '20% off eco-tours',
      description: 'Discount on partner eco-tourism experiences',
    },
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    participants: 89,
    isParticipating: false,
    isCompleted: false,
    progress: 0,
    requirements: [
      'Participate in 1 beach cleanup',
      'Visit 3 local sustainable businesses',
      'Use public transport for 5 trips',
      'Share your eco-actions on social media',
    ],
    tags: ['Sustainability', 'Environment', 'Local Business', 'Green Travel'],
    organizer: {
      id: 'org2',
      name: 'Green Sri Lanka Foundation',
      type: 'partner',
    },
    featured: false,
    trending: true,
  },
  {
    id: 'challenge3',
    title: 'Cultural Heritage Explorer',
    description: 'Dive deep into Sri Lanka\'s rich cultural heritage. Visit ancient temples, learn traditional crafts, and connect with local artisans.',
    category: 'cultural',
    difficulty: 'hard',
    duration: '3 weeks',
    reward: {
      type: 'achievement',
      value: 'Cultural Ambassador',
      description: 'Special recognition + invitation to cultural events',
    },
    startDate: '2024-07-15',
    endDate: '2024-08-05',
    participants: 42,
    maxParticipants: 50,
    isParticipating: false,
    isCompleted: false,
    progress: 0,
    requirements: [
      'Visit 8 UNESCO World Heritage sites',
      'Learn 2 traditional crafts',
      'Interview 3 local artisans',
      'Create cultural experience blog post',
    ],
    tags: ['Culture', 'Heritage', 'UNESCO', 'Traditional Crafts'],
    organizer: {
      id: 'org3',
      name: 'Sri Lanka Tourism Board',
      type: 'partner',
    },
    featured: true,
    trending: false,
  },
];

interface ChallengeCardProps {
  challenge: TravelChallenge;
  onJoin: (challenge: TravelChallenge) => void;
  onViewDetails: (challenge: TravelChallenge) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoin, onViewDetails }) => {
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'photo':
        return { color: Colors.info, icon: 'camera', name: 'Photography' };
      case 'adventure':
        return { color: Colors.success, icon: 'leaf', name: 'Adventure' };
      case 'cultural':
        return { color: Colors.primary600, icon: 'library', name: 'Cultural' };
      case 'sustainability':
        return { color: Colors.success, icon: 'earth', name: 'Eco-Friendly' };
      case 'social':
        return { color: Colors.warning, icon: 'people', name: 'Social' };
      case 'exploration':
        return { color: Colors.error, icon: 'compass', name: 'Exploration' };
      default:
        return { color: Colors.secondary500, icon: 'trophy', name: 'Challenge' };
    }
  };

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: Colors.success, text: 'Easy' };
      case 'medium':
        return { color: Colors.warning, text: 'Medium' };
      case 'hard':
        return { color: Colors.error, text: 'Hard' };
      default:
        return { color: Colors.secondary500, text: 'Unknown' };
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points':
        return 'star';
      case 'badge':
        return 'medal';
      case 'discount':
        return 'pricetag';
      case 'achievement':
        return 'trophy';
      default:
        return 'gift';
    }
  };

  const categoryConfig = getCategoryConfig(challenge.category);
  const difficultyConfig = getDifficultyConfig(challenge.difficulty);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getParticipationStatus = () => {
    if (challenge.isCompleted) return { text: 'Completed', color: Colors.success, icon: 'checkmark-circle' };
    if (challenge.isParticipating) return { text: 'Joined', color: Colors.primary600, icon: 'checkmark' };
    return { text: 'Join Challenge', color: Colors.primary600, icon: 'add' };
  };

  const participationStatus = getParticipationStatus();

  return (
    <TouchableOpacity
      style={[
        styles.challengeCard,
        challenge.featured && styles.featuredCard,
      ]}
      onPress={() => onViewDetails(challenge)}
    >
      {/* Header Badges */}
      <View style={styles.cardBadges}>
        {challenge.featured && (
          <View style={[styles.badge, styles.featuredBadge]}>
            <Ionicons name="star" size={10} color={Colors.white} />
            <Text style={styles.badgeText}>Featured</Text>
          </View>
        )}
        {challenge.trending && (
          <View style={[styles.badge, styles.trendingBadge]}>
            <Ionicons name="trending-up" size={10} color={Colors.white} />
            <Text style={styles.badgeText}>Trending</Text>
          </View>
        )}
      </View>

      {/* Challenge Header */}
      <View style={styles.challengeHeader}>
        <View style={styles.challengeTitle}>
          <Text style={styles.titleText}>{challenge.title}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + '20' }]}>
              <Ionicons name={categoryConfig.icon as keyof typeof Ionicons.glyphMap} size={12} color={categoryConfig.color} />
              <Text style={[styles.categoryText, { color: categoryConfig.color }]}>{categoryConfig.name}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.color + '20' }]}>
              <Text style={[styles.difficultyText, { color: difficultyConfig.color }]}>{difficultyConfig.text}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.challengeDescription} numberOfLines={2}>
        {challenge.description}
      </Text>

      {/* Challenge Info */}
      <View style={styles.challengeInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={14} color={Colors.secondary500} />
          <Text style={styles.infoText}>{challenge.duration}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={14} color={Colors.secondary500} />
          <Text style={styles.infoText}>
            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people" size={14} color={Colors.secondary500} />
          <Text style={styles.infoText}>
            {challenge.participants}
            {challenge.maxParticipants && ` / ${challenge.maxParticipants}`} joined
          </Text>
        </View>
      </View>

      {/* Reward */}
      <View style={styles.rewardContainer}>
        <Ionicons name={getRewardIcon(challenge.reward.type) as keyof typeof Ionicons.glyphMap} size={16} color={Colors.warning} />
        <Text style={styles.rewardText}>{challenge.reward.value}</Text>
      </View>

      {/* Progress Bar (if participating) */}
      {challenge.isParticipating && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${challenge.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{challenge.progress}% complete</Text>
        </View>
      )}

      {/* Requirements Preview */}
      <View style={styles.requirementsPreview}>
        <Text style={styles.requirementsTitle}>Requirements:</Text>
        <Text style={styles.requirementsText}>
          {challenge.requirements.slice(0, 2).join(' • ')}
          {challenge.requirements.length > 2 && ` • +${challenge.requirements.length - 2} more`}
        </Text>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {challenge.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {challenge.tags.length > 3 && (
          <Text style={styles.moreTags}>+{challenge.tags.length - 3}</Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          challenge.isParticipating && styles.participatingButton,
          challenge.isCompleted && styles.completedButton,
        ]}
        onPress={() => !challenge.isCompleted && onJoin(challenge)}
        disabled={challenge.isCompleted}
      >
        <Ionicons 
          name={participationStatus.icon as keyof typeof Ionicons.glyphMap} 
          size={16} 
          color={challenge.isCompleted ? Colors.success : participationStatus.color} 
        />
        <Text style={[
          styles.actionButtonText,
          challenge.isParticipating && styles.participatingButtonText,
          challenge.isCompleted && styles.completedButtonText,
        ]}>
          {participationStatus.text}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function TravelChallengesScreen() {
  const [challenges, setChallenges] = useState<TravelChallenge[]>(MOCK_CHALLENGES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', icon: 'apps' },
    { id: 'photo', name: 'Photography', icon: 'camera' },
    { id: 'adventure', name: 'Adventure', icon: 'leaf' },
    { id: 'cultural', name: 'Cultural', icon: 'library' },
    { id: 'sustainability', name: 'Eco-Friendly', icon: 'earth' },
    { id: 'social', name: 'Social', icon: 'people' },
    { id: 'exploration', name: 'Exploration', icon: 'compass' },
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleJoinChallenge = (challenge: TravelChallenge) => {
    setChallenges(prev => prev.map(c => 
      c.id === challenge.id 
        ? { 
            ...c, 
            isParticipating: !c.isParticipating,
            participants: c.isParticipating ? c.participants - 1 : c.participants + 1
          }
        : c
    ));
    
    const action = challenge.isParticipating ? 'left' : 'joined';
    Alert.alert('Success', `You have ${action} the challenge "${challenge.title}"`);
  };

  const handleViewDetails = (challenge: TravelChallenge) => {
    Alert.alert(
      challenge.title,
      `${challenge.description}\n\nDifficulty: ${challenge.difficulty}\nDuration: ${challenge.duration}\nReward: ${challenge.reward.value}\n\nRequirements:\n${challenge.requirements.map(req => `• ${req}`).join('\n')}`
    );
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const featuredChallenges = filteredChallenges.filter(c => c.featured);
  const trendingChallenges = filteredChallenges.filter(c => c.trending && !c.featured);
  const regularChallenges = filteredChallenges.filter(c => !c.featured && !c.trending);

  const allChallenges = [...featuredChallenges, ...trendingChallenges, ...regularChallenges];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Challenges</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="options" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{challenges.filter(c => c.isParticipating).length}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{challenges.filter(c => c.isCompleted).length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{challenges.reduce((sum, c) => sum + (c.isParticipating ? c.progress : 0), 0)}</Text>
          <Text style={styles.statLabel}>Total Progress</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryButton, selectedCategory === category.id && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={selectedCategory === category.id ? Colors.primary600 : Colors.secondary500}
            />
            <Text style={[styles.categoryButtonText, selectedCategory === category.id && styles.activeCategoryButtonText]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Challenges List */}
      <FlatList
        data={allChallenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            onJoin={handleJoinChallenge}
            onViewDetails={handleViewDetails}
          />
        )}
        contentContainerStyle={styles.challengesContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={Colors.secondary400} />
            <Text style={styles.emptyStateText}>No challenges found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or check back later for new challenges
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Challenges</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.filterOption}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={styles.filterOptionLeft}>
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={selectedCategory === category.id ? Colors.primary600 : Colors.secondary500}
                  />
                  <Text style={[styles.filterOptionText, selectedCategory === category.id && styles.activeFilterOptionText]}>
                    {category.name}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary600} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>Difficulty</Text>
            {difficulties.map((difficulty) => (
              <TouchableOpacity
                key={difficulty.id}
                style={styles.filterOption}
                onPress={() => setSelectedDifficulty(difficulty.id)}
              >
                <Text style={[styles.filterOptionText, selectedDifficulty === difficulty.id && styles.activeFilterOptionText]}>
                  {difficulty.name}
                </Text>
                {selectedDifficulty === difficulty.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary600} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  filterButton: {
    padding: 4,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  categoriesContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light100,
    gap: 6,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary100,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary500,
  },
  activeCategoryButtonText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  challengesContainer: {
    padding: 20,
  },
  challengeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredCard: {
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  cardBadges: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  featuredBadge: {
    backgroundColor: Colors.warning,
  },
  trendingBadge: {
    backgroundColor: Colors.error,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
  },
  challengeHeader: {
    marginBottom: 12,
  },
  challengeTitle: {
    marginBottom: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    paddingRight: 60, // Space for badges
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.secondary600,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light200,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  requirementsPreview: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary500,
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 12,
    color: Colors.secondary600,
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 4,
  },
  tag: {
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: Colors.primary600,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 10,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary100,
    gap: 6,
  },
  participatingButton: {
    backgroundColor: Colors.info + '15',
  },
  completedButton: {
    backgroundColor: Colors.success + '15',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },
  participatingButtonText: {
    color: Colors.info,
  },
  completedButtonText: {
    color: Colors.success,
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
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  modalContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  activeFilterOptionText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
});
