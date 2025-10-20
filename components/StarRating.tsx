import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
  color?: string;
  emptyColor?: string;
  style?: any;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  showNumber = false,
  showCount = false,
  reviewCount = 0,
  interactive = false,
  onRatingChange,
  maxRating = 5,
  color = Colors.warning,
  emptyColor = Colors.secondary400,
  style,
}) => {
  const handleStarPress = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= Math.round(rating);
      const isHalfFilled = i - 0.5 <= rating && rating < i;
      
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          disabled={!interactive}
          style={styles.starContainer}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Ionicons
            name={
              isHalfFilled 
                ? "star-half" 
                : isFilled 
                  ? "star" 
                  : "star-outline"
            }
            size={size}
            color={isFilled || isHalfFilled ? color : emptyColor}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
      {(showNumber || showCount) && (
        <View style={styles.textContainer}>
          {showNumber && (
            <Text style={[styles.ratingText, { fontSize: size * 0.8 }]}>
              {rating.toFixed(1)}
            </Text>
          )}
          {showCount && reviewCount > 0 && (
            <Text style={[styles.countText, { fontSize: size * 0.7 }]}>
              ({reviewCount})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  ratingText: {
    fontWeight: '600',
    color: Colors.black,
  },
  countText: {
    color: Colors.secondary500,
    marginLeft: 2,
  },
});