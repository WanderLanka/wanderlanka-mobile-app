import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

export type UserReviewProps = {
  name: string;
  rating: number;
  review: string;
  profileImage?: string;
};

export function UserReview({ name, rating, review, profileImage }: UserReviewProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: profileImage || 'https://randomuser.me/api/portraits/men/1.jpg' }}
        style={styles.profileImg}
      />
      <View style={styles.rightCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={Colors.warning || '#FFD700'} />
            <Text style={styles.rating}>{rating}</Text>
          </View>
        </View>
        <Text style={styles.review}>{review}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: Colors.secondary50,
    borderRadius: 10,
    padding: 10,
  },
  profileImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  rightCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontWeight: '600',
    color: Colors.primary800,
    fontSize: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  rating: {
    fontSize: 14,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  review: {
    color: Colors.primary700,
    fontSize: 14,
    marginTop: 4,
  },
});
