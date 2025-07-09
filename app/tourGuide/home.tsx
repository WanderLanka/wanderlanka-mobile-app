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
                  outputRange: [0, -35],
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
        
        <ThemedText variant="title" style={styles.greeting}>
          Welcome, {displayUser.username}!
        </ThemedText>
        <ThemedText variant="caption" style={styles.caption}>
          Ready to share Sri Lanka&apos;s wonders?
        </ThemedText>

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
    paddingTop: 30,
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

  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '300',
    color: Colors.white,
    zIndex: 2,
  },
  
  caption: {
    color: Colors.primary100,
    marginBottom: 30,
    zIndex: 2,
  },
  
  section: {
    marginBottom: 32,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
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
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
});