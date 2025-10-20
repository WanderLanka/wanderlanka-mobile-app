import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './StarRating';
import { Colors } from '../constants/Colors';

interface RatingBreakdownProps {
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  averageRating: number;
  style?: any;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  ratingDistribution,
  totalReviews,
  averageRating,
  style,
}) => {
  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = getPercentage(count);
    
    return (
      <View key={stars} style={styles.ratingRow}>
        <View style={styles.starLabel}>
          <Text style={styles.starText}>{stars}</Text>
          <Ionicons name="star" size={12} color={Colors.warning} />
        </View>
        
        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <View 
              style={[
                styles.barFill, 
                { width: `${percentage}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with average rating */}
      <View style={styles.header}>
        <View style={styles.averageRating}>
          <Text style={styles.averageNumber}>{averageRating.toFixed(1)}</Text>
          <StarRating 
            rating={averageRating} 
            size={20} 
            color={Colors.warning}
            emptyColor={Colors.secondary400}
          />
        </View>
        <Text style={styles.totalReviews}>
          Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Rating distribution */}
      <View style={styles.distribution}>
        {[5, 4, 3, 2, 1].map((stars) => 
          renderRatingBar(stars, ratingDistribution[stars as keyof typeof ratingDistribution])
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  averageNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
    marginRight: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  distribution: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
    gap: 4,
  },
  starText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.black,
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.secondary100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  countContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
  },
});
