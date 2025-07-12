import {
  Alert,
  FlatList,
  Image,
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
import { router } from 'expo-router';

interface TravelBuddy {
  id: string;
  name: string;
  age: number;
  avatar: string | null;
  location: string;
  interests: string[];
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  languages: string[];
  bio: string;
  upcomingTrips: string[];
  matchPercentage: number;
  isOnline: boolean;
  verified: boolean;
  joinedDate: string;
  mutualConnections: number;
}

interface TravelBuddyRequest {
  id: string;
  buddy: TravelBuddy;
  destination: string;
  dates: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const MOCK_TRAVEL_BUDDIES: TravelBuddy[] = [
  {
    id: 'buddy1',
    name: 'Emma Thompson',
    age: 28,
    avatar: null,
    location: 'London, UK',
    interests: ['Photography', 'Hiking', 'Food', 'Culture'],
    travelStyle: 'mid-range',
    languages: ['English', 'Spanish'],
    bio: 'Adventurous photographer seeking travel companions for cultural immersion and hiking adventures.',
    upcomingTrips: ['Kandy', 'Ella', 'Sigiriya'],
    matchPercentage: 95,
    isOnline: true,
    verified: true,
    joinedDate: '2024-01-15',
    mutualConnections: 3,
  },
  {
    id: 'buddy2',
    name: 'Alex Chen',
    age: 32,
    avatar: null,
    location: 'Toronto, Canada',
    interests: ['Adventure', 'Nature', 'Wildlife', 'Surfing'],
    travelStyle: 'budget',
    languages: ['English', 'Mandarin'],
    bio: 'Nature enthusiast and surfer looking for fellow adventurers to explore Sri Lanka\'s beaches and wildlife.',
    upcomingTrips: ['Mirissa', 'Yala National Park'],
    matchPercentage: 88,
    isOnline: false,
    verified: true,
    joinedDate: '2023-12-20',
    mutualConnections: 1,
  },
  {
    id: 'buddy3',
    name: 'Sofia Rodriguez',
    age: 25,
    avatar: null,
    location: 'Madrid, Spain',
    interests: ['Art', 'History', 'Yoga', 'Meditation'],
    travelStyle: 'luxury',
    languages: ['Spanish', 'English', 'Portuguese'],
    bio: 'Art lover and wellness enthusiast seeking mindful travel experiences and cultural connections.',
    upcomingTrips: ['Anuradhapura', 'Dambulla'],
    matchPercentage: 82,
    isOnline: true,
    verified: false,
    joinedDate: '2024-02-10',
    mutualConnections: 0,
  },
];

const MOCK_REQUESTS: TravelBuddyRequest[] = [
  {
    id: 'req1',
    buddy: MOCK_TRAVEL_BUDDIES[0],
    destination: 'Ella',
    dates: 'July 15-20, 2024',
    message: 'Hi! I\'m planning a trip to Ella and would love to explore the tea plantations together. Are you interested?',
    status: 'pending',
    createdAt: '2024-07-08T10:30:00Z',
  },
];

interface TravelBuddyCardProps {
  buddy: TravelBuddy;
  onConnect: (buddy: TravelBuddy) => void;
  onViewProfile: (buddy: TravelBuddy) => void;
}

const TravelBuddyCard: React.FC<TravelBuddyCardProps> = ({ buddy, onConnect, onViewProfile }) => {
  const getTravelStyleColor = (style: string) => {
    switch (style) {
      case 'budget': return Colors.success;
      case 'mid-range': return Colors.warning;
      case 'luxury': return Colors.error;
      default: return Colors.secondary500;
    }
  };

  const getTravelStyleIcon = (style: string) => {
    switch (style) {
      case 'budget': return 'wallet-outline';
      case 'mid-range': return 'card-outline';
      case 'luxury': return 'diamond-outline';
      default: return 'card-outline';
    }
  };

  return (
    <View style={styles.buddyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Colors.secondary400} />
          </View>
          {buddy.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.buddyInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.buddyName}>{buddy.name}</Text>
            {buddy.verified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary600} />
            )}
          </View>
          <Text style={styles.buddyLocation}>{buddy.location} • {buddy.age} years old</Text>
          <View style={styles.matchContainer}>
            <View style={styles.matchBar}>
              <View style={[styles.matchFill, { width: `${buddy.matchPercentage}%` }]} />
            </View>
            <Text style={styles.matchText}>{buddy.matchPercentage}% match</Text>
          </View>
        </View>
      </View>

      <Text style={styles.buddyBio} numberOfLines={2}>{buddy.bio}</Text>

      <View style={styles.interestsContainer}>
        <Text style={styles.interestsLabel}>Interests:</Text>
        <View style={styles.interestsTags}>
          {buddy.interests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
          {buddy.interests.length > 3 && (
            <Text style={styles.moreInterests}>+{buddy.interests.length - 3} more</Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons 
            name={getTravelStyleIcon(buddy.travelStyle) as keyof typeof Ionicons.glyphMap} 
            size={14} 
            color={getTravelStyleColor(buddy.travelStyle)} 
          />
          <Text style={[styles.detailText, { color: getTravelStyleColor(buddy.travelStyle) }]}>
            {buddy.travelStyle.charAt(0).toUpperCase() + buddy.travelStyle.slice(1)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="language" size={14} color={Colors.info} />
          <Text style={styles.detailText}>{buddy.languages.join(', ')}</Text>
        </View>
        {buddy.mutualConnections > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color={Colors.secondary500} />
            <Text style={styles.detailText}>{buddy.mutualConnections} mutual</Text>
          </View>
        )}
      </View>

      {buddy.upcomingTrips.length > 0 && (
        <View style={styles.tripsContainer}>
          <Text style={styles.tripsLabel}>Upcoming trips:</Text>
          <Text style={styles.tripsText}>{buddy.upcomingTrips.join(' • ')}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewProfile(buddy)}
        >
          <Ionicons name="person-outline" size={16} color={Colors.secondary600} />
          <Text style={styles.actionButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.connectButton]}
          onPress={() => onConnect(buddy)}
        >
          <Ionicons name="add-circle" size={16} color={Colors.primary600} />
          <Text style={[styles.actionButtonText, styles.connectButtonText]}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ConnectionRequestCardProps {
  request: TravelBuddyRequest;
  onAccept: (request: TravelBuddyRequest) => void;
  onDecline: (request: TravelBuddyRequest) => void;
  onViewProfile: (buddy: TravelBuddy) => void;
}

const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({ 
  request, 
  onAccept, 
  onDecline, 
  onViewProfile 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return Colors.success;
      case 'declined': return Colors.error;
      default: return Colors.warning;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return 'checkmark-circle';
      case 'declined': return 'close-circle';
      default: return 'time';
    }
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestBuddyInfo}>
          <View style={styles.smallAvatar}>
            <Ionicons name="person" size={16} color={Colors.secondary400} />
          </View>
          <View style={styles.requestDetails}>
            <Text style={styles.requestBuddyName}>{request.buddy.name}</Text>
            <Text style={styles.requestDestination}>{request.destination} • {request.dates}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(request.status) as keyof typeof Ionicons.glyphMap} 
            size={12} 
            color={getStatusColor(request.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.requestMessage}>{request.message}</Text>

      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestActionButton, styles.declineButton]}
            onPress={() => onDecline(request)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestActionButton, styles.acceptButton]}
            onPress={() => onAccept(request)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.viewProfileButton}
        onPress={() => onViewProfile(request.buddy)}
      >
        <Text style={styles.viewProfileButtonText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function TravelBuddiesScreen() {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'connections'>('discover');
  const [buddies, setBuddies] = useState<TravelBuddy[]>(MOCK_TRAVEL_BUDDIES);
  const [requests, setRequests] = useState<TravelBuddyRequest[]>(MOCK_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<TravelBuddy | null>(null);
  const [connectMessage, setConnectMessage] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleConnect = (buddy: TravelBuddy) => {
    setSelectedBuddy(buddy);
    setShowConnectModal(true);
  };

  const handleSendConnectionRequest = () => {
    if (!selectedBuddy || !connectMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    const newRequest: TravelBuddyRequest = {
      id: `req_${Date.now()}`,
      buddy: selectedBuddy,
      destination: 'Various destinations',
      dates: 'Flexible',
      message: connectMessage.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setRequests(prev => [newRequest, ...prev]);
    setShowConnectModal(false);
    setSelectedBuddy(null);
    setConnectMessage('');
    Alert.alert('Success', 'Connection request sent!');
  };

  const handleViewProfile = (buddy: TravelBuddy) => {
    Alert.alert(
      buddy.name,
      `${buddy.bio}\n\nInterests: ${buddy.interests.join(', ')}\nUpcoming trips: ${buddy.upcomingTrips.join(', ')}`
    );
  };

  const handleAcceptRequest = (request: TravelBuddyRequest) => {
    setRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: 'accepted' } : r
    ));
    Alert.alert('Success', `Connection request from ${request.buddy.name} accepted!`);
  };

  const handleDeclineRequest = (request: TravelBuddyRequest) => {
    setRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: 'declined' } : r
    ));
    Alert.alert('Request Declined', `Connection request from ${request.buddy.name} declined.`);
  };

  const filteredBuddies = buddies.filter(buddy => 
    buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buddy.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buddy.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderDiscoverTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.secondary400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, location, or interests..."
          placeholderTextColor={Colors.secondary400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.secondary400} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredBuddies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TravelBuddyCard
            buddy={item}
            onConnect={handleConnect}
            onViewProfile={handleViewProfile}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.secondary400} />
            <Text style={styles.emptyStateText}>No travel buddies found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new members'}
            </Text>
          </View>
        }
      />
    </View>
  );

  const renderRequestsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConnectionRequestCard
            request={item}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onViewProfile={handleViewProfile}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color={Colors.secondary400} />
            <Text style={styles.emptyStateText}>No connection requests</Text>
            <Text style={styles.emptyStateSubtext}>
              Received requests will appear here
            </Text>
          </View>
        }
      />
    </View>
  );

  const renderConnectionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <Ionicons name="people" size={48} color={Colors.secondary400} />
        <Text style={styles.emptyStateText}>No connections yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Start connecting with fellow travelers to build your network
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Buddies</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: 'discover', label: 'Discover', icon: 'search' },
          { id: 'requests', label: 'Requests', icon: 'mail', badge: requests.filter(r => r.status === 'pending').length },
          { id: 'connections', label: 'My Connections', icon: 'people' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={activeTab === tab.id ? Colors.primary600 : Colors.secondary500}
              />
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'discover' && renderDiscoverTab()}
      {activeTab === 'requests' && renderRequestsTab()}
      {activeTab === 'connections' && renderConnectionsTab()}

      {/* Connect Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowConnectModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Connect with {selectedBuddy?.name}</Text>
            <TouchableOpacity onPress={handleSendConnectionRequest}>
              <Text style={styles.modalSendText}>Send</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Message (optional)</Text>
            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={4}
              placeholder="Hi! I'd love to connect and explore Sri Lanka together..."
              placeholderTextColor={Colors.secondary400}
              value={connectMessage}
              onChangeText={setConnectMessage}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{connectMessage.length}/500</Text>
          </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary600,
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary500,
  },
  activeTabText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 8,
  },
  buddyCard: {
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
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  buddyInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  buddyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 6,
  },
  buddyLocation: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 8,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light200,
    borderRadius: 2,
    marginRight: 8,
  },
  matchFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 2,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary600,
  },
  buddyBio: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    marginBottom: 12,
  },
  interestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary500,
    marginBottom: 6,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  interestTag: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 4,
  },
  tripsContainer: {
    marginBottom: 16,
  },
  tripsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary500,
    marginBottom: 4,
  },
  tripsText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    backgroundColor: Colors.light100,
  },
  connectButton: {
    backgroundColor: Colors.primary100,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 6,
  },
  connectButtonText: {
    color: Colors.primary600,
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestBuddyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestBuddyName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  requestDestination: {
    fontSize: 12,
    color: Colors.secondary600,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  requestMessage: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  requestActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: Colors.error + '15',
  },
  acceptButton: {
    backgroundColor: Colors.success + '15',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  viewProfileButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewProfileButtonText: {
    fontSize: 13,
    color: Colors.primary600,
    fontWeight: '500',
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
  modalSendText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  modalTextInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.light200,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'right',
    marginTop: 8,
  },
});
