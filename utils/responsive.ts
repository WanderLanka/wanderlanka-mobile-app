import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screenWidth = width;
export const screenHeight = height;

/**
 * Get responsive width based on screen size
 */
export const getResponsiveWidth = (percentage: number): number => {
  return (screenWidth * percentage) / 100;
};

/**
 * Get responsive height based on screen size
 */
export const getResponsiveHeight = (percentage: number): number => {
  return (screenHeight * percentage) / 100;
};

/**
 * Get responsive font size based on screen width
 */
export const getResponsiveFontSize = (baseFontSize: number): number => {
  const scale = screenWidth / 375; // iPhone 6/7/8 width as base
  return Math.max(baseFontSize * scale, baseFontSize * 0.8);
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return screenWidth >= 768;
};

/**
 * Check if device is small screen
 */
export const isSmallScreen = (): boolean => {
  return screenWidth < 375;
};
