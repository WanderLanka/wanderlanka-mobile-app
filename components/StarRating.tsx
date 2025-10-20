import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Colors = {
  warning: '#FFA500',
};

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  interactive = false,
  onRatingChange,
}) => {
  const handlePress = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxStars)].map((_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= Math.floor(rating);
        const isHalfFilled = starNumber === Math.ceil(rating) && rating % 1 !== 0;

        return interactive ? (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(starNumber)}
            style={styles.star}
          >
            <Ionicons
              name={isFilled ? 'star' : isHalfFilled ? 'star-half' : 'star-outline'}
              size={size}
              color={Colors.warning}
            />
          </TouchableOpacity>
        ) : (
          <View key={index} style={styles.star}>
            <Ionicons
              name={isFilled ? 'star' : isHalfFilled ? 'star-half' : 'star-outline'}
              size={size}
              color={Colors.warning}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});
