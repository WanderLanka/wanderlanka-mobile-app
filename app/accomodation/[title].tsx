import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { CustomButton } from '../../components/CustomButton';
import { CustomTextInput } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { UserReview } from '../../components/UserReview';

const mockData = [
  {
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
    ],
    title: 'Luxury Beach Resort',
    city: 'Galle',
    rating: 4.8,
    price: '$220/night',
    description: 'Experience the ultimate in relaxation and luxury at our beachfront resort. Enjoy spacious rooms, stunning ocean views, and world-class amenities including a pool, spa, and gourmet dining. Perfect for families, couples, and solo travelers seeking a memorable getaway.',
    amenities: ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Spa', 'Beach Access', 'Fitness Center'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    ],
    title: 'Mountain View Hotel',
    city: 'Kandy',
    rating: 4.7,
    price: '$180/night',
    description: 'Wake up to breathtaking mountain views in our cozy hotel. Enjoy hiking trails, local cuisine, and a peaceful atmosphere. Ideal for nature lovers and adventure seekers.',
    amenities: ['Free WiFi', 'Breakfast Included', 'Mountain View', 'Hiking Trails', 'Restaurant'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
    ],
    title: 'City Center Inn',
    city: 'Ella',
    rating: 4.5,
    price: '$120/night',
    description: 'Stay in the heart of Ella with easy access to shops, cafes, and attractions. Comfortable rooms and friendly service make this inn a great choice for urban explorers.',
    amenities: ['Free WiFi', 'Breakfast Included', 'Central Location', '24/7 Reception'],
  },
];

export default function AccomodationDetailsScreen() {
  const { title } = useLocalSearchParams();
  const details = mockData.find(item => item.title === title) || mockData[0];
  const screenWidth = Dimensions.get('window').width;
  const [currentImage, setCurrentImage] = useState(0);
  const scrollRef = useRef(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

interface ScrollEvent {
    nativeEvent: {
        contentOffset: {
            x: number;
        };
    };
}

const handleScroll = (event: ScrollEvent) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / screenWidth);
    setCurrentImage(idx);
};

const openBottomSheet = () => {
  bottomSheetRef.current?.expand();
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {details.images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={[styles.image, { width: screenWidth }]}
            />
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary300} />
        </TouchableOpacity>
        <View style={styles.imageMarkers}>
          {details.images.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.marker,
                currentImage === idx ? styles.markerActive : null,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.infoRow}>
          <View style={styles.nameAddressCol}>
            <ThemedText variant="title" style={styles.title}>{details.title}</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary600} />
              <ThemedText variant='caption' style={styles.city}>{details.city}</ThemedText>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.warning || '#FFD700'} />
            <ThemedText  variant='caption' style={styles.rating}>{details.rating}</ThemedText>
          </View>
        </View>

        <Text style={styles.price}>{details.price}</Text>

        <ThemedText variant="subtitle" style={styles.sectionHeading}>Description</ThemedText>
        <ThemedText variant='caption' style={styles.description}>{details.description}</ThemedText>

        <ThemedText variant="subtitle" style={styles.sectionHeading}>Amenities</ThemedText>
        <View style={styles.amenitiesList}>
          {details.amenities.map((amenity, i) => (
            <View key={i} style={styles.amenityRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary600} />
              <ThemedText variant='caption' style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Location</ThemedText>
       <View style={styles.mapPlaceholder}>
          <ThemedText variant='caption' style={styles.mapText}>[Map will be shown here]</ThemedText>
      </View>
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Reviews</ThemedText>
        <View style={styles.reviewsList}>
          <UserReview
            name="John Doe"
            rating={4.8}
            review="Amazing stay! Highly recommended."
            profileImage="https://randomuser.me/api/portraits/men/1.jpg"
          />
          <UserReview
            name="Jane Smith"
            rating={4.7}
            review="Beautiful location and friendly staff."
            profileImage="https://randomuser.me/api/portraits/women/2.jpg"
          />
          <TouchableOpacity style={styles.seeMoreBtn} onPress={() => router.push('/accomodation/reviews')}>
            <ThemedText variant='caption' style={styles.seeMoreText}>See more</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <CustomButton
          title="Book Now"
          variant="primary"
          size="large"
          style={styles.bookBtn}
          onPress={openBottomSheet}
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: Colors.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{
          backgroundColor: Colors.secondary200,
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <View style={styles.sheetTitle}>
            <ThemedText variant="title" style={styles.sheetTitleText}>Booking Details</ThemedText>
          </View>
          <View style={styles.sheetBody}>
            <View style={styles.dateRow}>
              <CustomTextInput
                label="Check-in Date"
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                containerStyle={{ flex: 1, marginRight: 8, marginBottom: 0 }}
              />
              <CustomTextInput
                label="Check-out Date"
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                containerStyle={{ flex: 1, marginLeft: 8, marginBottom: 0 }}
              />
            </View>
            <View style={styles.peopleRow}>
              <View style={styles.peopleCol}>
                <ThemedText style={styles.peopleLabel}>Adults</ThemedText>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>1</Text>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.peopleCol}>
                <ThemedText style={styles.peopleLabel}>Children</ThemedText>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>0</Text>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.peopleCol}>
                <ThemedText style={styles.peopleLabel}>Rooms</ThemedText>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>0</Text>
                  <TouchableOpacity style={styles.counterBtn}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <CustomButton
              title="Confirm Booking"
              variant="primary"
              size="large"
              style={{ marginTop: 24, borderRadius: 16 }}
              onPress={() => {}}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 260,
    overflow: 'hidden',
  },
  imageScroll: {
    width: '100%',
    height: 260,
  },
  image: {
    height: 260,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: Colors.primary700,
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  imageMarkers: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  markerActive: {
    backgroundColor: Colors.primary500,
    opacity: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: Colors.secondary50,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  nameAddressCol: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 6,
    textAlign: 'left',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: 15,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  rating: {
    fontSize: 15,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  price: {
    fontSize: 22,
    color: Colors.primary600,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'left',
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary800,
    marginTop: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.primary700,
    marginBottom: 10,
    marginHorizontal: 16,
    textAlign: 'left',
  },
  amenitiesList: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 15,
    color: Colors.primary700,
    marginLeft: 8,
  },
  mapPlaceholder: {
    width: '92%',
    height: 120,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  mapText: {
    color: Colors.primary600,
    fontSize: 15,
  },
  reviewsList: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 10,
  },
  reviewUser: {
    fontWeight: '600',
    color: Colors.primary800,
    fontSize: 15,
  },
  reviewText: {
    color: Colors.primary700,
    fontSize: 14,
  },
  seeMoreBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  seeMoreText: {
    color: Colors.primary600,
    fontWeight: '600',
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.secondary50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    zIndex: 10,
  },
  bookBtn: {
    width: '100%',
    borderRadius: 16,
  },
  sheetContent: {
    alignItems: 'stretch',
    minHeight: 400,
    alignSelf: 'center',
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 24,
    width: '95%',
    backgroundColor: Colors.secondary50,
    overflow: 'hidden',
    position: 'relative',
  },
  sheetTitle: {
    width: '100%',
    backgroundColor: Colors.primary800,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  sheetTitleText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 0,
    alignSelf: 'center',
  },
  sheetBody: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: Colors.secondary50,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignItems: 'stretch',
    gap: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  peopleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    gap: 24,
  },
  peopleCol: {
    flex: 1,
    alignItems: 'center',
  },
  peopleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    padding: 4,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
    marginHorizontal: 8,
  },
});
