import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/CustomButton';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';

const vehicleData = [
  {
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Luxury Sedan',
    city: 'Colombo',
    price: '$60/day',
    capacity: 4,
    ac: true,
    type: 'Sedan',
    transmission: 'Automatic',
    fuel: 'Petrol',
    luggage: '2 Large, 2 Small',
    offroad: false,
    inclusions: ['Driver', 'Fuel', 'Insurance'],
    driver: {
      name: 'Nimal Silva',
      photo: 'https://randomuser.me/api/portraits/men/10.jpg',
      experience: 8,
      languages: ['English', 'Sinhala'],
      rating: 4.8,
      bio: 'Experienced driver with deep knowledge of Colombo and surrounding areas. Friendly and punctual.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1461435218581-ff0972867e90?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Family Van',
    city: 'Kandy',
    price: '$80/day',
    capacity: 7,
    ac: true,
    type: 'Van',
    transmission: 'Manual',
    fuel: 'Diesel',
    luggage: '4 Large, 4 Small',
    offroad: false,
    inclusions: ['Driver', 'Fuel', 'Insurance'],
    driver: {
      name: 'Ruwan Jayasuriya',
      photo: 'https://randomuser.me/api/portraits/men/12.jpg',
      experience: 12,
      languages: ['English', 'Sinhala', 'Tamil'],
      rating: 4.9,
      bio: 'Family-friendly driver, expert in long-distance routes and tourist attractions.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1622893288761-823ba60f17a6?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'SUV',
    city: 'Nuwara Eliya',
    price: '$90/day',
    capacity: 6,
    ac: true,
    type: 'SUV',
    transmission: 'Automatic',
    fuel: 'Petrol',
    luggage: '3 Large, 3 Small',
    offroad: true,
    inclusions: ['Driver', 'Fuel', 'Insurance'],
    driver: {
      name: 'Sunil Fernando',
      photo: 'https://randomuser.me/api/portraits/men/14.jpg',
      experience: 10,
      languages: ['English', 'Sinhala'],
      rating: 4.7,
      bio: 'SUV specialist, great for hill country and off-road adventures.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1617479625255-43666e3a3509?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Tourist Bus',
    city: 'Jaffna',
    price: '$150/day',
    capacity: 30,
    ac: true,
    type: 'Bus',
    transmission: 'Manual',
    fuel: 'Diesel',
    luggage: '10 Large, 10 Small',
    offroad: false,
    inclusions: ['Driver', 'Fuel', 'Insurance'],
    driver: {
      name: 'Kumar Rajapaksha',
      photo: 'https://randomuser.me/api/portraits/men/16.jpg',
      experience: 15,
      languages: ['English', 'Sinhala', 'Tamil'],
      rating: 4.6,
      bio: 'Tour bus expert, great for large groups and long journeys.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1655286692463-ab43ef87988f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Hatchback',
    city: 'Matara',
    price: '$40/day',
    capacity: 4,
    ac: false,
    type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Petrol',
    luggage: '1 Large, 2 Small',
    offroad: false,
    inclusions: ['Driver', 'Fuel', 'Insurance'],
    driver: {
      name: 'Chathura Perera',
      photo: 'https://randomuser.me/api/portraits/men/18.jpg',
      experience: 6,
      languages: ['English', 'Sinhala'],
      rating: 4.5,
      bio: 'Young and energetic driver, perfect for city rides.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1554223789-df81106a45ed?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Scooter',
    city: 'Ella',
    price: '$18/day',
    capacity: 2,
    ac: false,
    type: 'Scooter',
    transmission: 'Automatic',
    fuel: 'Petrol',
    luggage: 'Small',
    offroad: false,
    inclusions: ['Helmet', 'Insurance'],
    driver: {
      name: 'Self Drive',
      photo: '',
      experience: 0,
      languages: [],
      rating: '',
      bio: 'Scooter rental for self-drive.'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3c8b?auto=format&fit=crop&w=800&q=https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
    title: 'Budget Car',
    city: 'Galle',
    price: '$35/day',
    capacity: 4,
    ac: false,
    type: 'Budget',
    transmission: 'Manual',
    fuel: 'Petrol',
    luggage: '2 Small',
    offroad: false,
    inclusions: ['Driver', 'Insurance'],
    driver: {
      name: 'Kasun Wijesinghe',
      photo: 'https://randomuser.me/api/portraits/men/20.jpg',
      experience: 5,
      languages: ['English', 'Sinhala'],
      rating: 4.3,
      bio: 'Budget-friendly driver, ideal for short trips.'
    }
  },
];

export default function VehicleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { title } = useLocalSearchParams();
  const details = vehicleData.find(item => item.title === title) || vehicleData[0];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 5}]} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.primary300} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}> 
        <Image source={{ uri: details.image }} style={[styles.headerImage, { marginTop: 0 }]} />
        <View style={styles.infoRow}>
          <View style={styles.nameTypeCol}>
            <ThemedText variant="title" style={styles.title}>{details.title}</ThemedText>
            <View style={styles.typeRow}>
              <Ionicons name="car-outline" size={16} color={Colors.primary600} />
              <Text style={styles.type}>{details.type}</Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.warning || '#FFD700'} />
            <Text style={styles.rating}>{details.driver.rating}</Text>
          </View>
        </View>
        <View style={styles.basicDetailsRow}>
          <View style={styles.basicDetailChip}>
            <Ionicons name="people-outline" size={16} color={Colors.primary600} />
            <Text style={styles.basicDetailText}>{details.capacity} Seats</Text>
          </View>
          <View style={styles.basicDetailChip}>
            <Ionicons name="settings-outline" size={16} color={Colors.primary600} />
            <Text style={styles.basicDetailText}>{details.transmission}</Text>
          </View>
        </View>
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Features & Specs</ThemedText>
        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>Fuel: {details.fuel}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Luggage: {details.luggage}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>{details.ac ? 'AC' : 'Non-AC'}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>{details.offroad ? 'Off-road Capable' : 'City Only'}</Text></View>
        </View>
        {/* Driver Details section only if there is a driver with a name other than 'Self Drive' and photo */}
        {details.driver && details.driver.name !== 'Self Drive' && details.driver.photo && (
          <>
            <ThemedText variant="subtitle" style={styles.sectionHeading}>Driver Details</ThemedText>
            <View style={styles.driverSection}>
              <Image source={{ uri: details.driver.photo }} style={styles.driverPhoto} />
              <View style={styles.driverInfoCol}>
                <Text style={styles.driverName}>{details.driver.name}</Text>
                <Text style={styles.driverExp}>{details.driver.experience} yrs experience</Text>
                <View style={styles.driverLangRow}>
                  {details.driver.languages.map((lang, i) => (
                    <View key={i} style={styles.driverLangChip}><Text style={styles.driverLangText}>{lang}</Text></View>
                  ))}
                </View>
                <View style={styles.driverRatingRow}>
                  <Ionicons name="star" size={14} color={Colors.warning || '#FFD700'} />
                  <Text style={styles.driverRating}>{details.driver.rating}</Text>
                </View>
                <Text style={styles.driverBio}>{details.driver.bio}</Text>
              </View>
            </View>
          </>
        )}
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Pricing</ThemedText>
        <View style={styles.priceSection}>
          <Text style={styles.price}>{details.price}</Text>
          <View style={styles.inclusionsRow}>
            {details.inclusions.map((inc, i) => (
              <View key={i} style={styles.inclusionChip}><Text style={styles.inclusionText}>{inc}</Text></View>
            ))}
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}> 
        <CustomButton
          title="Book Now"
          variant="primary"
          size="large"
          style={styles.bookBtn}
          disabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
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
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: Colors.secondary50,
  },
  headerImage: {
    width: '100%',
    height: 250,
    marginTop: 50,
    marginBottom: 10,
    backgroundColor: Colors.secondary200,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  nameTypeCol: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 6,
    textAlign: 'left',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  type: {
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
  basicDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 16,
    marginBottom: 10,
  },
  basicDetailChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  basicDetailText: {
    color: Colors.primary800,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginLeft: 16,
  },
  chip: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  chipText: {
    color: Colors.primary800,
    fontWeight: '600',
    fontSize: 13,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 10,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary200,
    marginRight: 14,
  },
  driverInfoCol: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 2,
  },
  driverExp: {
    fontSize: 14,
    color: Colors.primary700,
    marginBottom: 2,
  },
  driverLangRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  driverLangChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  driverLangText: {
    color: Colors.primary800,
    fontWeight: '600',
    fontSize: 12,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 13,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  driverBio: {
    fontSize: 13,
    color: Colors.primary700,
    marginTop: 4,
  },
  priceSection: {
    marginLeft: 16,
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    color: Colors.primary600,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'left',
  },
  inclusionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  inclusionChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  inclusionText: {
    color: Colors.primary800,
    fontWeight: '600',
    fontSize: 12,
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
});
