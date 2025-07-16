import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface DestinationCardProps {
  title: string;
  desc: string;
  img: string;
  onPress?: () => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ title, desc, img, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.imageWrap}>
      <Image source={{ uri: img }} style={styles.image} />
      <View style={styles.gradientOverlay} />
      <View style={styles.textOverlay}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.desc}>{desc}</ThemedText>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    marginRight: 18,
    width: 140,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingBottom: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.secondary200,
    height: 120,
    width: 140,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  image: {
    height: 120,
    width: 140,
    borderRadius: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 2,
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    zIndex: 3,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: Colors.white,
    marginBottom: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  desc: {
    fontSize: 13,
    color: Colors.primary100,
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
