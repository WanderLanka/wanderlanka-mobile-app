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

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock coupons data
const MOCK_COUPONS = [
  {
    id: 'coupon1',
    title: '25% Off Adventure Tours',
    description: 'Save big on all adventure activities including hiking, water sports, and wildlife safaris',
    discount: '25%',
    code: 'ADVENTURE25',
    validUntil: '2024-12-31',
    minSpend: 5000,
    category: 'Adventure',
    status: 'active',
    usageLimit: 1,
    usedCount: 0,
    terms: [
      'Valid for bookings over LKR 5,000',
      'Cannot be combined with other offers',
      'One use per customer',
      'Valid for adventure tours only'
    ],
  },
  {
    id: 'coupon2',
    title: '15% Off Cultural Heritage Tours',
    description: 'Explore Sri Lanka\'s rich cultural heritage with special discounts',
    discount: '15%',
    code: 'CULTURE15',
    validUntil: '2024-11-30',
    minSpend: 3000,
    category: 'Culture',
    status: 'active',
    usageLimit: 2,
    usedCount: 0,
    terms: [
      'Valid for bookings over LKR 3,000',
      'Applicable to cultural site visits',
      'Up to 2 uses per customer',
      'Valid until November 30, 2024'
    ],
  },
  {
    id: 'coupon3',
    title: '30% Off Beach Getaways',
    description: 'Relax and unwind with amazing discounts on beach destinations',
    discount: '30%',
    code: 'BEACH30',
    validUntil: '2024-08-15',
    minSpend: 8000,
    category: 'Beach',
    status: 'expiring_soon',
    usageLimit: 1,
    usedCount: 0,
    terms: [
      'Valid for bookings over LKR 8,000',
      'Beach destinations only',
      'Expires August 15, 2024',
      'Subject to availability'
    ],
  },
  {
    id: 'coupon4',
    title: '20% Off Hill Country Retreats',
    description: 'Experience the beauty of Sri Lanka\'s hill country with special savings',
    discount: '20%',
    code: 'HILLS20',
    validUntil: '2024-10-31',
    minSpend: 4000,
    category: 'Hill Country',
    status: 'used',
    usageLimit: 1,
    usedCount: 1,
    terms: [
      'Valid for bookings over LKR 4,000',
      'Hill country destinations only',
      'Already used - no longer available'
    ],
  },
];

const COUPON_STATS = {
  total: MOCK_COUPONS.length,
  active: MOCK_COUPONS.filter(c => c.status === 'active').length,
  expiring: MOCK_COUPONS.filter(c => c.status === 'expiring_soon').length,
  used: MOCK_COUPONS.filter(c => c.status === 'used').length,
  totalSavings: 12500, // Total amount saved
};

interface CouponCardProps {
  coupon: typeof MOCK_COUPONS[0];
  onUse: () => void;
  onViewDetails: () => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onUse, onViewDetails }) => {
  const getStatusColor = () => {
    switch (coupon.status) {
      case 'active': return Colors.success;
      case 'expiring_soon': return Colors.warning;
      case 'used': return Colors.secondary400;
      default: return Colors.secondary400;
    }
  };

  const getStatusText = () => {
    switch (coupon.status) {
      case 'active': return 'Active';
      case 'expiring_soon': return 'Expiring Soon';
      case 'used': return 'Used';
      default: return 'Inactive';
    }
  };

  const getCategoryIcon = () => {
    switch (coupon.category) {
      case 'Adventure': return 'trail-sign';
      case 'Culture': return 'library';
      case 'Beach': return 'sunny';
      case 'Hill Country': return 'mountain';
      default: return 'pricetag';
    }
  };

  const isUsable = coupon.status === 'active' || coupon.status === 'expiring_soon';
  const canUse = isUsable && coupon.usedCount < coupon.usageLimit;

  return (
    <View style={[styles.couponCard, !isUsable && styles.unusableCoupon]}>
      <View style={styles.couponHeader}>
        <View style={styles.couponLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: Colors.primary100 }]}>
            <Ionicons 
              name={getCategoryIcon() as keyof typeof Ionicons.glyphMap} 
              size={20} 
              color={Colors.primary600} 
            />
          </View>
          <View style={styles.couponInfo}>
            <Text style={[styles.couponTitle, !isUsable && styles.unusableText]}>{coupon.title}</Text>
            <Text style={styles.couponCategory}>{coupon.category}</Text>
          </View>
        </View>
        
        <View style={styles.couponRight}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{coupon.discount}</Text>
            <Text style={styles.discountLabel}>OFF</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.couponDescription}>{coupon.description}</Text>

      <View style={styles.couponDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="code-outline" size={14} color={Colors.secondary500} />
            <Text style={styles.detailText}>Code: {coupon.code}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
            <Text style={styles.detailText}>Until {new Date(coupon.validUntil).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.secondary500} />
            <Text style={styles.detailText}>Min spend: LKR {coupon.minSpend.toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="refresh-outline" size={14} color={Colors.secondary500} />
            <Text style={styles.detailText}>{coupon.usedCount}/{coupon.usageLimit} used</Text>
          </View>
        </View>
      </View>

      <View style={styles.couponActions}>
        <TouchableOpacity 
          style={styles.detailsButton} 
          onPress={onViewDetails}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.useButton, 
            !canUse && styles.disabledButton
          ]} 
          onPress={onUse}
          disabled={!canUse}
        >
          <Text style={[
            styles.useButtonText, 
            !canUse && styles.disabledButtonText
          ]}>
            {coupon.status === 'used' ? 'Used' : canUse ? 'Use Coupon' : 'Expired'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function DiscountCouponsScreen() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expiring' | 'used'>('all');

  const filteredCoupons = MOCK_COUPONS.filter(coupon => {
    switch (activeFilter) {
      case 'active': return coupon.status === 'active';
      case 'expiring': return coupon.status === 'expiring_soon';
      case 'used': return coupon.status === 'used';
      default: return true;
    }
  });

  const handleUseCoupon = (coupon: typeof MOCK_COUPONS[0]) => {
    if (coupon.status === 'used') {
      Alert.alert('Coupon Used', 'This coupon has already been used.');
      return;
    }

    if (coupon.status !== 'active' && coupon.status !== 'expiring_soon') {
      Alert.alert('Coupon Expired', 'This coupon is no longer valid.');
      return;
    }

    Alert.alert(
      'Use Coupon',
      `Are you sure you want to use "${coupon.title}"? The discount code "${coupon.code}" will be applied to your next booking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Coupon', 
          onPress: () => {
            Alert.alert(
              'Coupon Applied!', 
              `Coupon code "${coupon.code}" has been copied to your clipboard. You can paste it during checkout to get ${coupon.discount} off!`
            );
          }
        },
      ]
    );
  };

  const handleViewDetails = (coupon: typeof MOCK_COUPONS[0]) => {
    const termsText = coupon.terms.join('\n• ');
    Alert.alert(
      'Coupon Details',
      `${coupon.title}\n\nCode: ${coupon.code}\nDiscount: ${coupon.discount}\nValid until: ${new Date(coupon.validUntil).toLocaleDateString()}\nMinimum spend: LKR ${coupon.minSpend.toLocaleString()}\n\nTerms & Conditions:\n• ${termsText}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discount Coupons</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Your Savings</Text>
              <Ionicons name="trophy" size={20} color={Colors.warning} />
            </View>
            
            <Text style={styles.totalSavings}>LKR {COUPON_STATS.totalSavings.toLocaleString()}</Text>
            <Text style={styles.savingsLabel}>Total saved with coupons</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{COUPON_STATS.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{COUPON_STATS.expiring}</Text>
                <Text style={styles.statLabel}>Expiring</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{COUPON_STATS.used}</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{COUPON_STATS.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All Coupons' },
              { key: 'active', label: 'Active' },
              { key: 'expiring', label: 'Expiring Soon' },
              { key: 'used', label: 'Used' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  activeFilter === filter.key && styles.activeFilterTab
                ]}
                onPress={() => setActiveFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterTabText,
                  activeFilter === filter.key && styles.activeFilterTabText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Coupons List */}
        <View style={styles.couponsContainer}>
          {filteredCoupons.length > 0 ? (
            filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onUse={() => handleUseCoupon(coupon)}
                onViewDetails={() => handleViewDetails(coupon)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={64} color={Colors.secondary400} />
              <Text style={styles.emptyTitle}>No coupons found</Text>
              <Text style={styles.emptyDescription}>
                {activeFilter === 'all' 
                  ? 'You don\'t have any coupons yet. Complete trips to earn more!'
                  : `No ${activeFilter} coupons available.`
                }
              </Text>
            </View>
          )}
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
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  totalSavings: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  savingsLabel: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  couponsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  couponCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unusableCoupon: {
    opacity: 0.7,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  unusableText: {
    color: Colors.secondary400,
  },
  couponCategory: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  couponRight: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  discountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  discountLabel: {
    fontSize: 10,
    color: Colors.secondary500,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  couponDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 16,
  },
  couponDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  couponActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.primary600,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary600,
  },
  useButton: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: Colors.secondary200,
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButtonText: {
    color: Colors.secondary400,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
