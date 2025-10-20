import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface ItemCardProps {
  image: string;
  title: string;
  price?: string;
  city?: string;
  rating?: number;
  buttonText?: string;
  type: 'accommodation' | 'vehicle' | 'guide';
  id?: string; // Add ID prop for navigation
  onPress?: () => void; 
  style?: any;
}

export const ItemCard: React.FC<ItemCardProps> = ({ image, title, price, city, rating, onPress, buttonText = 'View Details', type, id, style }: ItemCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    // Use ID if available, otherwise fall back to encoded title
    const identifier = id || encodeURIComponent(title);
    let route = '';
    if (type === 'accommodation') {
      route = `/accomodation/${identifier}`;
    } else if (type === 'vehicle') {
      route = `/transportation/${identifier}`;
    } else if (type === 'guide') {
      route = `/tour_guides/${identifier}`;
    }
    router.push(route as any);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={handlePress} activeOpacity={0.5}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}> {title.trim() || ' '}</Text>
        {city && <Text style={styles.city} numberOfLines={1}>{city.trim()}</Text>}      
        <View style={styles.row}>
          {typeof rating === 'number' ? (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.primary500} />
              <Text style={styles.rating}>
                {rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
          
          {price ? (
            <Text style={styles.price}>
              {price.trim()}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity style={styles.detailsBtn} onPress={handlePress}>
        <Text style={styles.detailsText}>{buttonText.trim()}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondary50,
    borderRadius: 14,
    marginRight: 16,
    marginBottom: 10,
    width: 220,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.primary800,
  },
  city: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
    color: Colors.primary700,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 14,
    color: Colors.primary700,
    marginLeft: 2,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary600,
    marginLeft: 'auto',
  },
  detailsBtn: {
    backgroundColor: Colors.primary600,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  detailsText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});


