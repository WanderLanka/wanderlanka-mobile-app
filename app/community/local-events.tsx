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

interface LocalEvent {
  id: string;
  title: string;
  description: string;
  organizer: {
    id: string;
    name: string;
    avatar: string | null;
    verified: boolean;
  };
  category: 'cultural' | 'adventure' | 'food' | 'meetup' | 'festival' | 'workshop';
  date: string;
  time: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  price: {
    currency: string;
    amount: number;
    type: 'free' | 'paid' | 'donation';
  };
  maxAttendees?: number;
  currentAttendees: number;
  attendees: Array<{ id: string; name: string; avatar: string | null }>;
  tags: string[];
  isAttending: boolean;
  isWishlisted: boolean;
  images: string[];
  createdAt: string;
  featured: boolean;
}

const MOCK_EVENTS: LocalEvent[] = [
  {
    id: 'event1',
    title: 'Traditional Sri Lankan Cooking Class',
    description: 'Learn to cook authentic Sri Lankan dishes with local spices and ingredients. Perfect for food lovers wanting to take a piece of Sri Lanka home!',
    organizer: {
      id: 'org1',
      name: 'Kumari\'s Kitchen',
      avatar: null,
      verified: true,
    },
    category: 'food',
    date: '2024-07-15',
    time: '10:00 AM - 2:00 PM',
    location: {
      name: 'Kumari\'s Kitchen',
      address: 'No. 45, Galle Road, Colombo 03',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    price: {
      currency: 'LKR',
      amount: 2500,
      type: 'paid',
    },
    maxAttendees: 12,
    currentAttendees: 8,
    attendees: [
      { id: 'att1', name: 'Sarah J.', avatar: null },
      { id: 'att2', name: 'Mark C.', avatar: null },
    ],
    tags: ['Cooking', 'Culture', 'Traditional', 'Food'],
    isAttending: false,
    isWishlisted: true,
    images: [],
    createdAt: '2024-07-01T10:00:00Z',
    featured: true,
  },
  {
    id: 'event2',
    title: 'Sunset Yoga at Galle Fort',
    description: 'Join us for a peaceful yoga session as the sun sets over the historic Galle Fort. All levels welcome!',
    organizer: {
      id: 'org2',
      name: 'Mindful Travels',
      avatar: null,
      verified: false,
    },
    category: 'meetup',
    date: '2024-07-12',
    time: '5:30 PM - 6:30 PM',
    location: {
      name: 'Galle Fort Ramparts',
      address: 'Galle Fort, Galle',
      coordinates: { lat: 6.0329, lng: 80.2168 },
    },
    price: {
      currency: 'LKR',
      amount: 0,
      type: 'free',
    },
    currentAttendees: 15,
    attendees: [
      { id: 'att3', name: 'Emma T.', avatar: null },
      { id: 'att4', name: 'Alex R.', avatar: null },
    ],
    tags: ['Yoga', 'Wellness', 'Sunset', 'Meditation'],
    isAttending: true,
    isWishlisted: false,
    images: [],
    createdAt: '2024-06-28T15:30:00Z',
    featured: false,
  },
  {
    id: 'event3',
    title: 'Kandy Perahera Festival Viewing',
    description: 'Experience the grand Kandy Esala Perahera with the best viewing spots and cultural insights from local guides.',
    organizer: {
      id: 'org3',
      name: 'Ceylon Cultural Tours',
      avatar: null,
      verified: true,
    },
    category: 'festival',
    date: '2024-08-20',
    time: '6:00 PM - 10:00 PM',
    location: {
      name: 'Temple of the Sacred Tooth Relic',
      address: 'Kandy, Central Province',
      coordinates: { lat: 7.2936, lng: 80.6417 },
    },
    price: {
      currency: 'LKR',
      amount: 1500,
      type: 'paid',
    },
    maxAttendees: 50,
    currentAttendees: 23,
    attendees: [
      { id: 'att5', name: 'Sofia R.', avatar: null },
      { id: 'att6', name: 'David K.', avatar: null },
    ],
    tags: ['Festival', 'Culture', 'Traditional', 'Kandy'],
    isAttending: false,
    isWishlisted: false,
    images: [],
    createdAt: '2024-06-15T09:00:00Z',
    featured: true,
  },
];

interface EventCardProps {
  event: LocalEvent;
  onAttend: (event: LocalEvent) => void;
  onWishlist: (event: LocalEvent) => void;
  onViewDetails: (event: LocalEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onAttend, onWishlist, onViewDetails }) => {
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'cultural':
        return { color: Colors.primary600, icon: 'library' };
      case 'adventure':
        return { color: Colors.success, icon: 'leaf' };
      case 'food':
        return { color: Colors.warning, icon: 'restaurant' };
      case 'meetup':
        return { color: Colors.info, icon: 'people' };
      case 'festival':
        return { color: Colors.error, icon: 'musical-notes' };
      case 'workshop':
        return { color: Colors.secondary600, icon: 'build' };
      default:
        return { color: Colors.primary600, icon: 'calendar' };
    }
  };

  const categoryConfig = getCategoryConfig(event.category);

  const formatPrice = () => {
    if (event.price.type === 'free') return 'Free';
    if (event.price.type === 'donation') return 'Donation';
    return `${event.price.currency} ${event.price.amount.toLocaleString()}`;
  };

  const formatDate = () => {
    const date = new Date(event.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short' 
    });
  };

  const getAvailabilityColor = () => {
    if (!event.maxAttendees) return Colors.success;
    const percentage = (event.currentAttendees / event.maxAttendees) * 100;
    if (percentage >= 90) return Colors.error;
    if (percentage >= 70) return Colors.warning;
    return Colors.success;
  };

  return (
    <TouchableOpacity
      style={[styles.eventCard, event.featured && styles.featuredCard]}
      onPress={() => onViewDetails(event)}
    >
      {event.featured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={12} color={Colors.white} />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}

      <View style={styles.eventHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate()}</Text>
          <Text style={styles.timeText}>{event.time}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + '20' }]}>
          <Ionicons name={categoryConfig.icon as keyof typeof Ionicons.glyphMap} size={14} color={categoryConfig.color} />
          <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>

      <View style={styles.organizerContainer}>
        <View style={styles.organizerAvatar}>
          <Ionicons name="business" size={16} color={Colors.secondary400} />
        </View>
        <View style={styles.organizerInfo}>
          <View style={styles.organizerName}>
            <Text style={styles.organizerText}>{event.organizer.name}</Text>
            {event.organizer.verified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary600} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location" size={16} color={Colors.info} />
        <Text style={styles.locationText}>{event.location.name}</Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceText, event.price.type === 'free' && styles.freeText]}>
            {formatPrice()}
          </Text>
        </View>
        <View style={styles.attendeesContainer}>
          <Ionicons name="people" size={14} color={getAvailabilityColor()} />
          <Text style={[styles.attendeesText, { color: getAvailabilityColor() }]}>
            {event.currentAttendees}
            {event.maxAttendees && ` / ${event.maxAttendees}`}
          </Text>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {event.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {event.tags.length > 3 && (
          <Text style={styles.moreTags}>+{event.tags.length - 3}</Text>
        )}
      </View>

      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onWishlist(event)}
        >
          <Ionicons
            name={event.isWishlisted ? "heart" : "heart-outline"}
            size={16}
            color={event.isWishlisted ? Colors.error : Colors.secondary400}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.attendButton, event.isAttending && styles.attendingButton]}
          onPress={() => onAttend(event)}
        >
          <Ionicons
            name={event.isAttending ? "checkmark" : "add"}
            size={16}
            color={event.isAttending ? Colors.success : Colors.primary600}
          />
          <Text style={[styles.attendButtonText, event.isAttending && styles.attendingButtonText]}>
            {event.isAttending ? 'Attending' : 'Join Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function LocalEventsScreen() {
  const [events, setEvents] = useState<LocalEvent[]>(MOCK_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Events', icon: 'calendar' },
    { id: 'cultural', name: 'Cultural', icon: 'library' },
    { id: 'adventure', name: 'Adventure', icon: 'leaf' },
    { id: 'food', name: 'Food & Drink', icon: 'restaurant' },
    { id: 'meetup', name: 'Meetups', icon: 'people' },
    { id: 'festival', name: 'Festivals', icon: 'musical-notes' },
    { id: 'workshop', name: 'Workshops', icon: 'build' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAttend = (event: LocalEvent) => {
    setEvents(prev => prev.map(e => 
      e.id === event.id 
        ? { 
            ...e, 
            isAttending: !e.isAttending,
            currentAttendees: e.isAttending ? e.currentAttendees - 1 : e.currentAttendees + 1
          }
        : e
    ));
    
    const action = event.isAttending ? 'left' : 'joined';
    Alert.alert('Success', `You have ${action} the event "${event.title}"`);
  };

  const handleWishlist = (event: LocalEvent) => {
    setEvents(prev => prev.map(e => 
      e.id === event.id ? { ...e, isWishlisted: !e.isWishlisted } : e
    ));
  };

  const handleViewDetails = (event: LocalEvent) => {
    Alert.alert(
      event.title,
      `${event.description}\n\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location.name}\nPrice: ${event.price.type === 'free' ? 'Free' : `${event.price.currency} ${event.price.amount}`}\n\nOrganized by: ${event.organizer.name}`
    );
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredEvents = filteredEvents.filter(event => event.featured);
  const regularEvents = filteredEvents.filter(event => !event.featured);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Events</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="options" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.secondary400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
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

      {/* Events List */}
      <FlatList
        data={[...featuredEvents, ...regularEvents]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onAttend={handleAttend}
            onWishlist={handleWishlist}
            onViewDetails={handleViewDetails}
          />
        )}
        contentContainerStyle={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.secondary400} />
            <Text style={styles.emptyStateText}>No events found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Check back later for upcoming events'
              }
            </Text>
          </View>
        }
        ListHeaderComponent={
          featuredEvents.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Featured Events</Text>
            </View>
          ) : null
        }
      />

      {/* Create Event FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/community/create-event' as any)}>
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>

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
            <Text style={styles.modalTitle}>Filter Events</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 8,
  },
  categoriesContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light100,
    marginRight: 8,
    height: 36,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary100,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary500,
    marginLeft: 6,
  },
  activeCategoryButtonText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  eventsContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  eventCard: {
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 8
  },
  dateContainer: {
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  timeText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  freeText: {
    color: Colors.primary600,
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 4,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
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
    marginLeft: 2,
    alignSelf: 'center',
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light100,
  },
  attendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary100,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  attendingButton: {
    backgroundColor: Colors.success + '15',
  },
  attendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },
  attendingButtonText: {
    color: Colors.success,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
