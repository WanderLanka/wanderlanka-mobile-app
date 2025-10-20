import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl, Image, ScrollView } from 'react-native';
import { ThemedText } from '../../components'; // Assuming ThemedText is a custom component
import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Colors } from '../../constants/Colors'; // Assuming Colors is a constants file
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext exists
import { BookingService, TourPackageBookingItem } from '../../services/booking'; // Assuming services exist
import { StorageService } from '../../services/storage'; // Assuming services exist
import { API_CONFIG } from '../../services/config'; // Assuming services exist

// --- INTERFACES ---
interface DashboardStats {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  totalBookings: number;
  completedTours: number;
  pendingBookings: number;
  activeBookings: number;
  averageRating: number;
  upcomingTours: number;
}

interface GuideData {
  _id: string;
  userId: string;
  username: string;
  details: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  metrics: {
    rating: number;
    totalReviews: number;
    totalBookings: number;
    responseTimeMs: number;
  };
}

// --- HELPER FUNCTION for Booking Status ---
const getStatusStyle = (status: string) => {
    switch (status) {
        case 'confirmed':
        case 'completed':
            return { bg: Colors.success100, text: Colors.success };
        case 'approved':
            return { bg: '#d1fae5', text: Colors.success };
        case 'pending':
            return { bg: '#fef3c7', text: Colors.warning };
        case 'cancelled':
        case 'declined':
            return { bg: '#fecaca', text: Colors.error };
        default:
            return { bg: Colors.secondary100, text: Colors.secondary600 };
    }
};


export default function TourGuideHomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const fetchingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [bookings, setBookings] = useState<TourPackageBookingItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0, totalEarnings: 0,
    totalBookings: 0, completedTours: 0, pendingBookings: 0, activeBookings: 0,
    averageRating: 0, upcomingTours: 0
  });

  // --- DATA FETCHING & CALCULATIONS ---
  const calculateStats = useCallback((bookingsList: TourPackageBookingItem[], guideMetrics?: GuideData['metrics']) => {
    const now = new Date(); const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const todayEarnings = bookingsList.filter(b => { const d = new Date(b.createdAt); return (b.status === 'confirmed' || b.status === 'completed') && d >= today && d <= todayEnd; }).reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const weeklyEarnings = bookingsList.filter(b => { const d = new Date(b.createdAt); return (b.status === 'confirmed' || b.status === 'completed') && d >= weekStart; }).reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const monthlyEarnings = bookingsList.filter(b => { const d = new Date(b.createdAt); return (b.status === 'confirmed' || b.status === 'completed') && d >= monthStart; }).reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const totalEarnings = bookingsList.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const totalBookings = bookingsList.length;
    const completedTours = bookingsList.filter(b => b.status === 'completed').length;
    const pendingBookings = bookingsList.filter(b => b.status === 'pending').length;
    const activeBookings = bookingsList.filter(b => (b.status === 'approved' || b.status === 'confirmed') && new Date(b.startDate) >= now).length;
    const upcomingTours = activeBookings;
    const averageRating = guideMetrics?.rating || 0;
    setStats({ todayEarnings, weeklyEarnings, monthlyEarnings, totalEarnings, totalBookings, completedTours, pendingBookings, activeBookings, averageRating, upcomingTours });
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (fetchingRef.current) return;
    try {
      fetchingRef.current = true;
      const storedUser = await StorageService.getUserData();
      if (!storedUser) throw new Error('User not logged in');
      const userId = storedUser.id || storedUser._id;
      const username = storedUser.username;
      if (!userId && !username) throw new Error('User identifier not found');
      const accessToken = await StorageService.getAccessToken();
      const endpoint = userId ? `${API_CONFIG.BASE_URL}/api/listing/service/tourguide-listing/guide/me?userId=${encodeURIComponent(userId)}` : `${API_CONFIG.BASE_URL}/api/listing/service/tourguide-listing/guide/${encodeURIComponent(username)}`;
      const guideResponse = await fetch(endpoint, { headers: { 'Accept': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), }});
      if (!guideResponse.ok) throw new Error('Failed to fetch guide profile');
      const guideResult = await guideResponse.json();
      if (guideResult.success && guideResult.data) {
        setGuideData(guideResult.data);
        const bookingsResult = await BookingService.listTourPackageBookings({ guideId: guideResult.data._id });
        if (bookingsResult.success && bookingsResult.data) {
          setBookings(bookingsResult.data);
          calculateStats(bookingsResult.data, guideResult.data.metrics);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false); setRefreshing(false); fetchingRef.current = false;
    }
  }, [calculateStats]);
  
  useFocusEffect(useCallback(() => { if (!loading && !refreshing) { fetchDashboardData(); } }, [fetchDashboardData, loading, refreshing]));
  useEffect(() => { 
    fetchDashboardData(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboardData(); }, [fetchDashboardData]);

  // --- DERIVED DATA & FORMATTERS ---
  const todaySchedule = bookings.filter(booking => { const startDate = new Date(booking.startDate); const today = new Date(); today.setHours(0, 0, 0, 0); const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999); return (booking.status === 'approved' || booking.status === 'confirmed') && startDate >= today && startDate <= todayEnd; }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const formatTime = (isoDate: string) => new Date(isoDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatResponseTime = (ms: number) => { if (ms < 3600000) return '<1h'; if (ms < 7200000) return '<2h'; return `<${Math.round(ms / 3600000)}h`; };
  const completionRate = stats.totalBookings > 0 ? Math.round((stats.completedTours / stats.totalBookings) * 100) : 0;
  const displayUser = user || guideData || { username: 'Tour Guide', role: 'guide' };
  const firstName = guideData?.details?.firstName || displayUser.username;
  const avatarUrl = guideData?.details?.avatar;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading Dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="light" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.push('/tourGuide/profile')}>
          <Image 
              source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} 
              style={styles.avatar} 
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeTitle}>Welcome, {firstName}!</Text>
           <Text style={styles.welcomeSubtitle}>Here&apos;s your daily summary.</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton} onPress={() => { /* open notifications */ }}>
            <Ionicons name="notifications-outline" size={26} color={Colors.white} />
            <View style={styles.notificationBadge}><Text style={styles.badgeText}>3</Text></View>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 200, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary600]}
            tintColor={Colors.primary600}
          />
        }
      >
        {/* --- All screen content goes here --- */}
        <View style={styles.contentContainer}>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Earnings Overview</ThemedText>
              <View style={styles.earningsGrid}>
                <View style={[styles.card, styles.earningsCardPrimary]}>
                  <View style={styles.earningsHeader}><Ionicons name="trending-up" size={24} color={Colors.white} /><View style={styles.earningsBadge}><Text style={styles.earningsBadgeText}>Today</Text></View></View>
                  <Text style={styles.earningsValue}>${stats.todayEarnings.toLocaleString()}</Text>
                   <Text style={styles.earningsLabel}>Today&apos;s Earnings</Text>
                </View>
                <View style={{ flex: 1, gap: 16 }}>
                  <View style={[styles.card, styles.earningsCardSecondary]}><Ionicons name="calendar-outline" size={20} color={Colors.primary700} /><Text style={styles.earningsSmallValue}>${stats.weeklyEarnings.toLocaleString()}</Text><Text style={styles.earningsSmallLabel}>This Week</Text></View>
                  <View style={[styles.card, styles.earningsCardSecondary]}><Ionicons name="stats-chart-outline" size={20} color={Colors.primary700} /><Text style={styles.earningsSmallValue}>${stats.monthlyEarnings.toLocaleString()}</Text><Text style={styles.earningsSmallLabel}>This Month</Text></View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Bookings Status</ThemedText>
              <View style={[styles.card, styles.bookingStatusContainer]}>
                <View style={styles.bookingStatusItem}><View style={[styles.statusIconContainer, { backgroundColor: Colors.primary100 }]}><Ionicons name="calendar-outline" size={22} color={Colors.primary700} /></View><View><Text style={styles.statusValue}>{stats.totalBookings}</Text><Text style={styles.statusLabel}>Total Bookings</Text></View></View>
                 <View style={styles.bookingStatusItem}><View style={[styles.statusIconContainer, { backgroundColor: '#fef3c7' }]}><Ionicons name="time-outline" size={22} color={Colors.warning} /></View><View><Text style={styles.statusValue}>{stats.pendingBookings}</Text><Text style={styles.statusLabel}>Pending</Text></View></View>
                 <View style={styles.bookingStatusItem}><View style={[styles.statusIconContainer, { backgroundColor: Colors.success100 }]}><Ionicons name="checkmark-done-outline" size={22} color={Colors.success} /></View><View><Text style={styles.statusValue}>{stats.activeBookings}</Text><Text style={styles.statusLabel}>Active</Text></View></View>
                 <View style={styles.bookingStatusItem}><View style={[styles.statusIconContainer, { backgroundColor: '#e0e7ff' }]}><Ionicons name="flag-outline" size={22} color={Colors.info} /></View><View><Text style={styles.statusValue}>{stats.completedTours}</Text><Text style={styles.statusLabel}>Completed</Text></View></View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Performance Matrix</ThemedText>
              <View style={[styles.card, styles.performanceListContainer]}>
                 <View style={styles.performanceItem}><View style={styles.performanceItemLeft}><View style={[styles.performanceIcon, { backgroundColor: '#fef3c7' }]}><Ionicons name="star-outline" size={20} color={Colors.warning} /></View><Text style={styles.performanceLabel}>Average Rating</Text></View><Text style={styles.performanceValue}>{(stats.averageRating || 0).toFixed(1)}</Text></View>
                 <View style={styles.performanceItem}><View style={styles.performanceItemLeft}><View style={[styles.performanceIcon, { backgroundColor: Colors.primary100 }]}><Ionicons name="chatbubbles-outline" size={20} color={Colors.primary600} /></View><Text style={styles.performanceLabel}>Total Reviews</Text></View><Text style={styles.performanceValue}>{guideData?.metrics?.totalReviews || 0}</Text></View>
                 <View style={styles.performanceItem}><View style={styles.performanceItemLeft}><View style={[styles.performanceIcon, { backgroundColor: Colors.success100 }]}><Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} /></View><Text style={styles.performanceLabel}>Completion Rate</Text></View><Text style={styles.performanceValue}>{completionRate}%</Text></View>
                 <View style={[styles.performanceItem, { borderBottomWidth: 0 }]}><View style={styles.performanceItemLeft}><View style={[styles.performanceIcon, { backgroundColor: '#e0e7ff' }]}><Ionicons name="flash-outline" size={20} color={Colors.info} /></View><Text style={styles.performanceLabel}>Response Time</Text></View><Text style={styles.performanceValue}>{guideData?.metrics?.responseTimeMs ? formatResponseTime(guideData.metrics.responseTimeMs) : 'N/A'}</Text></View>
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Today&apos;s Schedule</ThemedText><TouchableOpacity onPress={() => router.push('/tourGuide/bookings')}><ThemedText style={styles.viewAllText}>View All</ThemedText></TouchableOpacity></View>
              <View style={styles.listContainer}>
                {todaySchedule.length > 0 ? todaySchedule.map((booking) => (
                  <TouchableOpacity key={booking._id} style={styles.scheduleItem} onPress={() => router.push(`/tourGuide/bookings`)}><Text style={styles.scheduleTime}>{formatTime(booking.startDate)}</Text><View style={styles.scheduleDivider} /><View style={styles.scheduleDetails}><Text style={styles.listTitle} numberOfLines={1}>{booking.packageTitle}</Text><Text style={styles.listSubtitle}>{booking.peopleCount} {booking.peopleCount === 1 ? 'person' : 'people'}</Text></View><Ionicons name="chevron-forward" size={22} color={Colors.secondary400} /></TouchableOpacity>
                )) : <View style={styles.emptyState}><Ionicons name="today-outline" size={48} color={Colors.secondary400} /><Text style={styles.emptyStateText}>No tours scheduled for today.</Text></View>}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Recent Bookings</ThemedText><TouchableOpacity onPress={() => router.push('/tourGuide/bookings')}><ThemedText style={styles.viewAllText}>View All</ThemedText></TouchableOpacity></View>
              <View style={styles.listContainer}>
                {recentBookings.length > 0 ? recentBookings.map((booking) => {
                  const statusStyle = getStatusStyle(booking.status);
                  return (
                      <TouchableOpacity key={booking._id} style={styles.bookingItem} onPress={() => router.push('/tourGuide/bookings')}><View style={styles.bookingDetails}><Text style={styles.listTitle}>{booking.packageTitle}</Text><Text style={styles.listSubtitle}>{formatDate(booking.createdAt)} · {booking.peopleCount} {booking.peopleCount === 1 ? 'person' : 'people'}</Text></View><View style={styles.bookingRight}><Text style={styles.bookingAmount}>${booking.pricing?.totalAmount.toLocaleString()}</Text><View style={[styles.bookingStatus, { backgroundColor: statusStyle.bg }]}><Text style={[styles.bookingStatusText, { color: statusStyle.text }]}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Text></View></View></TouchableOpacity>
                  );
                }) : <View style={styles.emptyState}><Ionicons name="file-tray-outline" size={48} color={Colors.secondary400} /><Text style={styles.emptyStateText}>You have no recent bookings.</Text></View>}
              </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.secondary600, },
  
  // Static Header Styles
  header: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0,
    height: 200,
    backgroundColor: Colors.primary800, 
    zIndex: 100,
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: Colors.primary100,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.primary100,
    opacity: 0.9,
    marginTop: 4,
  },
  notificationButton: { 
    padding: 8, 
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.error, borderRadius: 9,
    width: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary800,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold', },
  
  // ScrollView & Content
  contentContainer: {
    paddingTop: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
   sectionTitle: {
     fontSize: 20,
     fontWeight: '700',
     color: Colors.secondary700,
     marginBottom: 16,
   },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },

  // Card Styles
  card: {
    backgroundColor: 'white', borderRadius: 20,
    shadowColor: '#171717', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 5,
  },

  // Earnings Section
  earningsGrid: { flexDirection: 'row', gap: 16, },
  earningsCardPrimary: { flex: 1.5, backgroundColor: Colors.primary700, justifyContent: 'center', padding: 16, },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, },
  earningsBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, },
  earningsBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '600', },
  earningsValue: { fontSize: 32, fontWeight: 'bold', color: Colors.white, marginBottom: 2, },
  earningsLabel: { fontSize: 13, color: Colors.primary100, },
  earningsCardSecondary: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, },
  earningsSmallValue: { fontSize: 18, fontWeight: 'bold', color: Colors.secondary700, },
  earningsSmallLabel: { fontSize: 12, color: Colors.secondary500, },

  // Booking Status Section
  bookingStatusContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 28,
  },
  bookingStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
   statusValue: {
     fontSize: 22,
     fontWeight: 'bold',
     color: Colors.secondary700,
   },
  statusLabel: {
    fontSize: 13,
    color: Colors.secondary500,
    marginTop: 2,
  },
  
  // Performance Matrix Section
  performanceListContainer: { paddingVertical: 8, paddingHorizontal: 0, },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  performanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },

  // List Styles (Schedule & Bookings)
  listContainer: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: '#171717', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, 
    shadowRadius: 10, 
    elevation: 5,
  },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.secondary100, },
  scheduleTime: { fontSize: 14, fontWeight: '600', color: Colors.primary700, minWidth: 80, },
  scheduleDivider: { width: 2, height: '70%', backgroundColor: Colors.primary100, borderRadius: 1, marginRight: 16, },
  scheduleDetails: { flex: 1, },
  listTitle: { fontSize: 15, fontWeight: '600', color: Colors.secondary700, marginBottom: 4, },
  listSubtitle: { fontSize: 13, color: Colors.secondary500, },
  bookingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.secondary100, },
  bookingDetails: { flex: 1, marginRight: 12, },
  bookingRight: { alignItems: 'flex-end', },
  bookingAmount: { fontSize: 16, fontWeight: '700', color: Colors.secondary700, marginBottom: 6, },
  bookingStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, },
  bookingStatusText: { fontSize: 12, fontWeight: '600', },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, },
  emptyStateText: { fontSize: 15, color: Colors.secondary500, marginTop: 12, textAlign: 'center', },
});