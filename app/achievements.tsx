import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock achievements data
const MOCK_ACHIEVEMENTS = [
  {
    id: 'ach1',
    title: 'Explorer',
    description: 'Visit 5 different destinations',
    icon: 'compass-outline',
    category: 'Travel',
    unlocked: true,
    unlockedDate: '2024-03-15',
    progress: 8,
    target: 5,
    points: 100,
    rarity: 'common',
  },
  {
    id: 'ach2',
    title: 'Adventure Seeker',
    description: 'Complete 3 adventure activities',
    icon: 'mountain-outline',
    category: 'Activity',
    unlocked: true,
    unlockedDate: '2024-05-20',
    progress: 4,
    target: 3,
    points: 150,
    rarity: 'uncommon',
  },
  {
    id: 'ach3',
    title: 'Culture Enthusiast',
    description: 'Visit 10 cultural sites',
    icon: 'library-outline',
    category: 'Culture',
    unlocked: true,
    unlockedDate: '2024-06-10',
    progress: 12,
    target: 10,
    points: 200,
    rarity: 'rare',
  },
  {
    id: 'ach4',
    title: 'Photo Master',
    description: 'Upload 50 travel photos',
    icon: 'camera-outline',
    category: 'Social',
    unlocked: false,
    unlockedDate: null,
    progress: 35,
    target: 50,
    points: 250,
    rarity: 'rare',
  },
  {
    id: 'ach5',
    title: 'Early Bird',
    description: 'Complete 5 sunrise activities',
    icon: 'sunny-outline',
    category: 'Activity',
    unlocked: false,
    unlockedDate: null,
    progress: 2,
    target: 5,
    points: 300,
    rarity: 'epic',
  },
  {
    id: 'ach6',
    title: 'Social Butterfly',
    description: 'Share 20 trip memories',
    icon: 'share-social-outline',
    category: 'Social',
    unlocked: false,
    unlockedDate: null,
    progress: 8,
    target: 20,
    points: 180,
    rarity: 'uncommon',
  },
  {
    id: 'ach7',
    title: 'Local Expert',
    description: 'Visit 15 local restaurants',
    icon: 'restaurant-outline',
    category: 'Food',
    unlocked: false,
    unlockedDate: null,
    progress: 6,
    target: 15,
    points: 220,
    rarity: 'rare',
  },
  {
    id: 'ach8',
    title: 'Legend',
    description: 'Complete 25 trips',
    icon: 'trophy-outline',
    category: 'Travel',
    unlocked: false,
    unlockedDate: null,
    progress: 12,
    target: 25,
    points: 500,
    rarity: 'legendary',
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return Colors.secondary500;
    case 'uncommon': return Colors.success;
    case 'rare': return Colors.primary600;
    case 'epic': return Colors.warning;
    case 'legendary': return '#9333ea'; // Purple
    default: return Colors.secondary400;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'travel': return 'airplane-outline';
    case 'activity': return 'fitness-outline';
    case 'culture': return 'library-outline';
    case 'social': return 'people-outline';
    case 'food': return 'restaurant-outline';
    default: return 'star-outline';
  }
};

interface AchievementCardProps {
  achievement: typeof MOCK_ACHIEVEMENTS[0];
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const progressPercentage = (achievement.progress / achievement.target) * 100;
  const isUnlocked = achievement.unlocked;

  return (
    <TouchableOpacity 
      style={[
        styles.achievementCard,
        !isUnlocked && styles.lockedCard
      ]}
      activeOpacity={0.8}
    >
      {/* Achievement Icon */}
      <View style={[
        styles.achievementIcon,
        { backgroundColor: getRarityColor(achievement.rarity) + '20' }
      ]}>
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={32}
          color={isUnlocked ? getRarityColor(achievement.rarity) : Colors.secondary400}
        />
      </View>

      {/* Achievement Content */}
      <View style={styles.achievementContent}>
        <View style={styles.achievementHeader}>
          <Text style={[
            styles.achievementTitle,
            !isUnlocked && styles.lockedText
          ]}>
            {achievement.title}
          </Text>
          <View style={[
            styles.rarityBadge,
            { backgroundColor: getRarityColor(achievement.rarity) }
          ]}>
            <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={[
          styles.achievementDescription,
          !isUnlocked && styles.lockedText
        ]}>
          {achievement.description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: isUnlocked ? getRarityColor(achievement.rarity) : Colors.secondary200
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.target}
          </Text>
        </View>

        {/* Achievement Footer */}
        <View style={styles.achievementFooter}>
          <View style={styles.categorySection}>
            <Ionicons
              name={getCategoryIcon(achievement.category) as keyof typeof Ionicons.glyphMap}
              size={14}
              color={Colors.secondary500}
            />
            <Text style={styles.categoryText}>{achievement.category}</Text>
          </View>
          
          <View style={styles.pointsSection}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.pointsText}>{achievement.points} pts</Text>
          </View>
        </View>

        {/* Unlocked Date */}
        {isUnlocked && achievement.unlockedDate && (
          <Text style={styles.unlockedDate}>
            Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        )}
      </View>

      {/* Unlocked Indicator */}
      {isUnlocked && (
        <View style={styles.unlockedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AchievementsScreen() {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const categories = ['all', 'travel', 'activity', 'culture', 'social', 'food'];
  
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter(achievement => {
    const categoryMatch = filterCategory === 'all' || achievement.category.toLowerCase() === filterCategory;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'unlocked' && achievement.unlocked) ||
      (filterStatus === 'locked' && !achievement.unlocked);
    return categoryMatch && statusMatch;
  });

  const unlockedCount = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{unlockedCount}/{MOCK_ACHIEVEMENTS.length}</Text>
          <Text style={styles.summaryLabel}>Unlocked</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalPoints}</Text>
          <Text style={styles.summaryLabel}>Points Earned</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {Math.round((unlockedCount / MOCK_ACHIEVEMENTS.length) * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>Complete</Text>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
          style={styles.categoryScrollView}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                filterCategory === category && styles.activeCategoryTab,
                index === categories.length - 1 && styles.lastCategoryTab
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryTabText,
                  filterCategory === category && styles.activeCategoryTabText
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilter}>
        {(['all', 'unlocked', 'locked'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusTab,
              filterStatus === status && styles.activeStatusTab
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.statusTabText,
              filterStatus === status && styles.activeStatusTabText
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AchievementCard achievement={item} />}
        contentContainerStyle={styles.achievementsList}
        showsVerticalScrollIndicator={false}
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
  headerButton: {
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
  categoryFilter: {
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingVertical: 10,
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingRight: 10, // Extra padding for last item
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.light100,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastCategoryTab: {
    marginRight: 20,
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary600,
  },
  categoryTabText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 0,
  },
  activeCategoryTabText: {
    color: Colors.white,
    fontWeight: '600',
  },
  statusFilter: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: Colors.light100,
  },
  activeStatusTab: {
    backgroundColor: Colors.primary600,
  },
  statusTabText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  activeStatusTabText: {
    color: Colors.white,
  },
  achievementsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    marginRight: 8,
  },
  lockedText: {
    color: Colors.secondary400,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light200,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '600',
    minWidth: 40,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 4,
    fontWeight: '600',
  },
  unlockedDate: {
    fontSize: 11,
    color: Colors.success,
    fontStyle: 'italic',
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
