import {
  Alert,
  Dimensions,
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

// Mock loyalty data
const MOCK_LOYALTY_DATA = {
  currentPoints: 2450,
  totalEarned: 5280,
  totalRedeemed: 2830,
  membershipTier: 'Gold',
  nextTier: 'Platinum',
  pointsToNextTier: 550,
  tierBenefits: {
    Gold: ['15% off bookings', 'Priority support', 'Free trip planning', 'Exclusive destinations'],
    Platinum: ['25% off bookings', 'VIP support', 'Free cancellations', 'Luxury upgrades'],
  },
};

const MOCK_REWARDS = [
  {
    id: 'reward1',
    title: '10% Off Next Booking',
    description: 'Valid for any trip booking',
    points: 500,
    category: 'Discount',
    validity: '30 days',
    image: 'pricetag',
  },
  {
    id: 'reward2',
    title: 'Free Local Guide',
    description: 'Get a complimentary local guide for half day',
    points: 800,
    category: 'Experience',
    validity: '60 days',
    image: 'person',
  },
  {
    id: 'reward3',
    title: 'Airport Transfer Voucher',
    description: 'Free airport pickup/drop for your next trip',
    points: 600,
    category: 'Transport',
    validity: '90 days',
    image: 'car',
  },
  {
    id: 'reward4',
    title: '25% Off Accommodation',
    description: 'Special discount on selected hotels',
    points: 1000,
    category: 'Discount',
    validity: '45 days',
    image: 'home',
  },
  {
    id: 'reward5',
    title: 'Cultural Experience Pass',
    description: 'Access to exclusive cultural sites',
    points: 1200,
    category: 'Experience',
    validity: '120 days',
    image: 'library',
  },
  {
    id: 'reward6',
    title: 'Adventure Activity Free',
    description: 'Complimentary adventure activity of choice',
    points: 1500,
    category: 'Experience',
    validity: '90 days',
    image: 'trail-sign',
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'trans1',
    type: 'earned',
    points: 150,
    description: 'Trip completion bonus - Kandy Cultural Triangle',
    date: '2024-06-16',
  },
  {
    id: 'trans2',
    type: 'redeemed',
    points: -500,
    description: 'Redeemed: 10% Off Next Booking',
    date: '2024-06-10',
  },
  {
    id: 'trans3',
    type: 'earned',
    points: 200,
    description: 'Review bonus - Ella Hill Country',
    date: '2024-05-21',
  },
  {
    id: 'trans4',
    type: 'earned',
    points: 100,
    description: 'Social media share bonus',
    date: '2024-05-15',
  },
  {
    id: 'trans5',
    type: 'redeemed',
    points: -800,
    description: 'Redeemed: Free Local Guide',
    date: '2024-05-10',
  },
];

interface RewardCardProps {
  reward: typeof MOCK_REWARDS[0];
  onRedeem: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, onRedeem }) => {
  const canAfford = MOCK_LOYALTY_DATA.currentPoints >= reward.points;
  
  return (
    <View style={[styles.rewardCard, !canAfford && styles.disabledCard]}>
      <View style={styles.rewardHeader}>
        <View style={[styles.rewardIcon, { backgroundColor: canAfford ? Colors.primary100 : Colors.light200 }]}>
          <Ionicons 
            name={reward.image as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color={canAfford ? Colors.primary600 : Colors.secondary400} 
          />
        </View>
        <View style={styles.rewardInfo}>
          <Text style={[styles.rewardTitle, !canAfford && styles.disabledText]}>{reward.title}</Text>
          <Text style={styles.rewardCategory}>{reward.category}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{reward.points}</Text>
          <Text style={styles.pointsBadgeLabel}>pts</Text>
        </View>
      </View>
      
      <Text style={styles.rewardDescription}>{reward.description}</Text>
      
      <View style={styles.rewardFooter}>
        <Text style={styles.validityText}>Valid for {reward.validity}</Text>
        <TouchableOpacity 
          style={[styles.redeemButton, !canAfford && styles.disabledButton]} 
          onPress={onRedeem}
          disabled={!canAfford}
        >
          <Text style={[styles.redeemButtonText, !canAfford && styles.disabledButtonText]}>
            {canAfford ? 'Redeem' : 'Not enough points'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface TransactionItemProps {
  transaction: typeof MOCK_TRANSACTIONS[0];
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => (
  <View style={styles.transactionItem}>
    <View style={[
      styles.transactionIcon,
      { backgroundColor: transaction.type === 'earned' ? Colors.primary100 : Colors.light100 }
    ]}>
      <Ionicons 
        name={transaction.type === 'earned' ? 'add' : 'remove'} 
        size={16} 
        color={transaction.type === 'earned' ? Colors.success : Colors.error} 
      />
    </View>
    
    <View style={styles.transactionInfo}>
      <Text style={styles.transactionDescription}>{transaction.description}</Text>
      <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
    </View>
    
    <Text style={[
      styles.transactionPoints,
      { color: transaction.type === 'earned' ? Colors.success : Colors.error }
    ]}>
      {transaction.type === 'earned' ? '+' : ''}{transaction.points}
    </Text>
  </View>
);

export default function LoyaltyPointsScreen() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

  const handleRedeem = (reward: typeof MOCK_REWARDS[0]) => {
    if (MOCK_LOYALTY_DATA.currentPoints >= reward.points) {
      Alert.alert(
        'Redeem Reward',
        `Are you sure you want to redeem "${reward.title}" for ${reward.points} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Redeem', 
            onPress: () => {
              Alert.alert('Success!', 'Reward redeemed successfully. Check your email for details.');
            }
          },
        ]
      );
    }
  };

  const progressPercentage = Math.min(
    (MOCK_LOYALTY_DATA.currentPoints / (MOCK_LOYALTY_DATA.currentPoints + MOCK_LOYALTY_DATA.pointsToNextTier)) * 100,
    100
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Points</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Points Overview */}
        <View style={styles.pointsOverview}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <View>
                <Text style={styles.pointsLabel}>Available Points</Text>
                <Text style={styles.pointsValue}>{MOCK_LOYALTY_DATA.currentPoints.toLocaleString()}</Text>
              </View>
              <View style={styles.tierBadge}>
                <Ionicons name="diamond" size={16} color={Colors.warning} />
                <Text style={styles.tierText}>{MOCK_LOYALTY_DATA.membershipTier}</Text>
              </View>
            </View>
            
            <View style={styles.pointsStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_LOYALTY_DATA.totalEarned.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_LOYALTY_DATA.totalRedeemed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Redeemed</Text>
              </View>
            </View>
          </View>

          {/* Tier Progress */}
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierTitle}>Progress to {MOCK_LOYALTY_DATA.nextTier}</Text>
              <Text style={styles.tierPoints}>{MOCK_LOYALTY_DATA.pointsToNextTier} points needed</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            
            <View style={styles.tierBenefits}>
              <Text style={styles.benefitsTitle}>Current Benefits:</Text>
              {MOCK_LOYALTY_DATA.tierBenefits.Gold.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
              Available Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Points History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'rewards' ? (
          <View style={styles.rewardsContainer}>
            {MOCK_REWARDS.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                onRedeem={() => handleRedeem(reward)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {MOCK_TRANSACTIONS.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </View>
        )}
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
    borderBottomWidth: 1,
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
  placeholder: {
    width: 32,
  },
  pointsOverview: {
    padding: 20,
  },
  pointsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary600,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 4,
  },
  pointsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  tierCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  tierPoints: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.secondary200,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 4,
  },
  tierBenefits: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary600,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary500,
  },
  activeTabText: {
    color: Colors.white,
  },
  rewardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rewardCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  disabledText: {
    color: Colors.secondary400,
  },
  rewardCategory: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  pointsBadge: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary600,
  },
  pointsBadgeLabel: {
    fontSize: 10,
    color: Colors.secondary500,
  },
  rewardDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 12,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validityText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  redeemButton: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: Colors.secondary200,
  },
  redeemButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButtonText: {
    color: Colors.secondary400,
  },
  historyContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '600',
  },
});
