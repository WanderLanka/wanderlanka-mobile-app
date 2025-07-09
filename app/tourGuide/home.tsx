import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { ThemedText } from '../../components';
import * as React from 'react';
import { useState, useRef } from 'react';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  todayEarnings: number;
  totalBookings: number;
  completedTours: number;
  averageRating: number;
  upcomingTours: number;
}

interface TourSchedule {
  id: string;
  clientName: string;
  tourType: string;
  time: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface RecentBooking {
  id: string;
  clientName: string;
  tourType: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  amount: number;
}

interface PerformanceMetric {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: string;
  color: string;
}

export default function TourGuideHomeScreen() {
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [stats] = useState<DashboardStats>({
    todayEarnings: 15750,
    totalBookings: 24,
    completedTours: 18,
    averageRating: 4.8,
    upcomingTours: 3
  });
  
  const [todaySchedule] = useState<TourSchedule[]>([
    {
      id: '1',
      clientName: 'Sarah Johnson',
      tourType: 'Cultural Heritage',
      time: '9:00 AM',
      location: 'Kandy Temple',
      status: 'upcoming'
    },
    {
      id: '2',
      clientName: 'Mike Chen',
      tourType: 'Adventure Hiking',
      time: '2:00 PM',
      location: 'Ella Rock',
      status: 'upcoming'
    }
  ]);

  const [recentBookings] = useState<RecentBooking[]>([
    {
      id: '1',
      clientName: 'Emma Wilson',
      tourType: 'Beach & Wildlife',
      date: 'Dec 15, 2024',
      status: 'confirmed',
      amount: 12500
    },
    {
      id: '2',
      clientName: 'James Rodriguez',
      tourType: 'Mountain Adventure',
      date: 'Dec 14, 2024',
      status: 'pending',
      amount: 18000
    },
    {
      id: '3',
      clientName: 'Lisa Parker',
      tourType: 'Cultural Experience',
      date: 'Dec 13, 2024',
      status: 'confirmed',
      amount: 9500
    }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    {
      title: 'Average Rating',
      value: '4.9',
      trend: 'up',
      trendValue: '+0.2',
      icon: 'star',
      color: Colors.warning
    },
    {
      title: 'Total Reviews',
      value: '127',
      trend: 'up',
      trendValue: '+15',
      icon: 'chatbubble',
      color: Colors.primary600
    },
    {
      title: 'Completion Rate',
      value: '98%',
      trend: 'stable',
      trendValue: '0%',
      icon: 'checkmark-circle',
      color: Colors.success
    },
    {
      title: 'Response Time',
      value: '< 2h',
      trend: 'up',
      trendValue: '-30m',
      icon: 'time',
      color: Colors.info
    }
  ]);

  // Removed authentication check for coding purposes

  // Provide fallback user data for testing
  const displayUser = user || { username: 'Tour Guide', role: 'guide' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Animated.View 
        style={[
          styles.topBar,
          {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -25],
                  extrapolate: 'clamp',
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity style={styles.iconButton} onPress={() => { /* open menu */ }}>
          <Ionicons name="menu" size={28} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => { /* open notifications */ }}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={26} color={Colors.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View 
        style={[
          styles.darkTopBg,
          {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, -100],
                  extrapolate: 'clamp',
                })
              }
            ]
          }
        ]} 
      />
      <Animated.ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        <View style={styles.greetingSection}>
          <View style={styles.greetingContent}>
            <ThemedText variant="title" style={styles.greeting}>
              Welcome, {displayUser.username}!
            </ThemedText>
            <ThemedText variant="caption" style={styles.caption}>
              Ready to share Sri Lanka&apos;s wonders?
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {displayUser.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Today&apos;s Overview</ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet" size={20} color={Colors.success} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>Rs. {stats.todayEarnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={20} color={Colors.primary600} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.upcomingTours}</Text>
                <Text style={styles.statLabel}>Upcoming Tours</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={20} color={Colors.warning} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.averageRating}</Text>
                <Text style={styles.statLabel}>Average Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Matrix */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Performance Matrix</ThemedText>
          <View style={styles.performanceGrid}>
            {performanceMetrics.map((metric, index) => (
              <View key={index} style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <View style={[styles.performanceIcon, { backgroundColor: `${metric.color}15` }]}>
                    <Ionicons name={metric.icon as any} size={18} color={metric.color} />
                  </View>
                  <View style={styles.trendContainer}>
                    <Ionicons 
                      name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'remove'} 
                      size={14} 
                      color={metric.trend === 'up' ? Colors.success : metric.trend === 'down' ? Colors.error : Colors.secondary400} 
                    />
                    <Text style={[styles.trendText, { 
                      color: metric.trend === 'up' ? Colors.success : metric.trend === 'down' ? Colors.error : Colors.secondary400 
                    }]}>
                      {metric.trendValue}
                    </Text>
                  </View>
                </View>
                <Text style={styles.performanceValue}>{metric.value}</Text>
                <Text style={styles.performanceLabel}>{metric.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Today&apos;s Schedule</ThemedText>
            <TouchableOpacity onPress={() => router.push('/tourGuide/bookings')}>
              <View style={styles.navArrowbg}>
                <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scheduleContainer}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((tour) => (
                <TouchableOpacity key={tour.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.timeText}>{tour.time}</Text>
                    <View style={styles.statusDot} />
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.clientName}>{tour.clientName}</Text>
                    <Text style={styles.tourType}>{tour.tourType}</Text>
                    <Text style={styles.location}>📍 {tour.location}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.secondary400} />
                <Text style={styles.emptyStateText}>No tours scheduled for today</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Recent Bookings</ThemedText>
            <TouchableOpacity onPress={() => router.push('/tourGuide/bookings')}>
              <View style={styles.navArrowbg}>
                <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bookingsContainer}>
            {recentBookings.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingIcon}>
                  <Ionicons name="person" size={18} color={Colors.primary600} />
                </View>
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingClientName}>{booking.clientName}</Text>
                  <Text style={styles.bookingTourType}>{booking.tourType}</Text>
                  <Text style={styles.bookingDate}>{booking.date}</Text>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingAmount}>Rs. {booking.amount.toLocaleString()}</Text>
                  <View style={[styles.bookingStatus, { 
                    backgroundColor: booking.status === 'confirmed' ? Colors.primary100 : 
                                   booking.status === 'pending' ? '#fef3c7' : '#fecaca' 
                  }]}>
                    <Text style={[styles.bookingStatusText, { 
                      color: booking.status === 'confirmed' ? Colors.success : 
                             booking.status === 'pending' ? Colors.warning : Colors.error 
                    }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Recent Activity</ThemedText>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: Colors.primary100 }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Tour completed with Emma Davis</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: Colors.light200 }]}>
                <Ionicons name="star" size={20} color={Colors.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Received 5-star review</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: Colors.primary100 }]}>
                <Ionicons name="calendar" size={20} color={Colors.primary600} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New booking from Alex Thompson</Text>
                <Text style={styles.activityTime}>6 hours ago</Text>
              </View>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
    position: 'relative',
  },

  darkTopBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 210,
    backgroundColor: Colors.primary800,
    zIndex: 0,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 2,
  },

  iconButton: {
    padding: 8,
  },

  notificationContainer: {
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 0,
  },

  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  greetingContent: {
    flex: 1,
  },

  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    zIndex: 2,
  },
  
  caption: {
    color: Colors.primary100,
    fontSize: 16,
    fontWeight: '400',
    zIndex: 2,
  },

  profileButton: {
    marginLeft: 16,
    marginTop: 15,
  },

  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary700,
  },
  
  section: {
    marginBottom: 36,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  searchButtonArea: {
    alignItems: 'center',
    marginBottom: 30,
  },

  searchButton: {
    marginTop: 5,
    width: 200,
    backgroundColor: Colors.primary600,
  },

  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  statContent: {
    flex: 1,
  },

  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },

  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },

  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },

  scheduleContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  scheduleTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },

  timeText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '500',
    marginBottom: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary500,
  },

  scheduleDetails: {
    flex: 1,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },

  tourType: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 2,
  },

  location: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },

  emptyStateText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 12,
  },

  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  activityContent: {
    flex: 1,
  },

  activityText: {
    fontSize: 14,
    color: Colors.secondary700,
    marginBottom: 2,
  },

  activityTime: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  navArrowbg: {
    backgroundColor: Colors.primary100,
    borderRadius: 20,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary200,
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  logoutContainer: {
    marginTop: 20,
  },

  logoutButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.error,
  },

  // Performance Matrix styles
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  performanceCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  performanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },

  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 4,
  },

  performanceLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },

  // Recent Bookings styles
  bookingsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  bookingDetails: {
    flex: 1,
  },

  bookingClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },

  bookingTourType: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 2,
  },

  bookingDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  bookingRight: {
    alignItems: 'flex-end',
  },

  bookingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 6,
  },

  bookingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  bookingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});