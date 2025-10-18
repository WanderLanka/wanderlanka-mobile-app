import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { UserReview } from '../../components/UserReview';
import { Colors } from '../../constants/Colors';

const reviews = [
  {
    name: 'John Doe',
    rating: 4.8,
    review: 'Amazing stay! Highly recommended.',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    name: 'Jane Smith',
    rating: 4.7,
    review: 'Beautiful location and friendly staff.',
    profileImage: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    name: 'Alex Lee',
    rating: 4.6,
    review: 'Clean rooms and great amenities.',
    profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    name: 'Priya Kumar',
    rating: 4.9,
    review: 'Loved the food and the view!',
    profileImage: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
];

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: '4+ Stars', value: '4' },
  { label: '5 Stars', value: '5' },
  { label: 'Newest', value: 'newest' },
];

export default function AllReviewsScreen() {
  const { title } = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('all');

  let filteredReviews = reviews;
  if (selectedFilter === '4') {
    filteredReviews = reviews.filter(r => Math.floor(r.rating) === 4);
  } else if (selectedFilter === '5') {
    filteredReviews = reviews.filter(r => Math.floor(r.rating) === 5);
  } else if (selectedFilter === 'newest') {
    filteredReviews = [...reviews].reverse();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary700} />
        </TouchableOpacity>
        <ThemedText variant="title" style={styles.heading}>All Reviews</ThemedText>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.filterBar}>
          {filterOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.filterChip,
                selectedFilter === opt.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(opt.value)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === opt.value && styles.filterTextActive,
              ]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {filteredReviews.map((r, i) => (
          <UserReview key={i} {...r} rating={Math.floor(r.rating)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    backgroundColor: Colors.secondary50,
    marginTop: 30,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
    borderRadius: 20,
    backgroundColor: Colors.secondary50,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary800,
  },
  scrollContent: {
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.secondary200,
  },
  filterChipActive: {
    backgroundColor: Colors.primary600,
  },
  filterText: {
    color: Colors.primary700,
    fontWeight: '500',
    fontSize: 15,
  },
  filterTextActive: {
    color: '#fff',
  },
});
