import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native';

import { Colors } from '../constants/Colors';
import React from 'react';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  disabled,
  ...props
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.paddingHorizontal = 16;
        baseStyles.paddingVertical = 8;
        baseStyles.minHeight = 36;
        break;
      case 'large':
        baseStyles.paddingHorizontal = 24;
        baseStyles.paddingVertical = 16;
        baseStyles.minHeight = 56;
        break;
      default: // medium
        baseStyles.paddingHorizontal = 20;
        baseStyles.paddingVertical = 12;
        baseStyles.minHeight = 48;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.backgroundColor = Colors.secondary50;
        baseStyles.borderColor = Colors.secondary200;
        break;
      case 'outline':
        baseStyles.backgroundColor = Colors.white;
        baseStyles.borderColor = Colors.primary600;
        break;
      default: // primary
        baseStyles.backgroundColor = Colors.primary600;
        baseStyles.borderColor = Colors.primary600;
    }

    // Disabled styles
    if (disabled || loading) {
      baseStyles.opacity = 0.6;
    }

    return baseStyles;
  };

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontFamily: 'Poppins',
      fontWeight: '500',
      textAlign: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.fontSize = 14;
        break;
      case 'large':
        baseStyles.fontSize = 18;
        break;
      default: // medium
        baseStyles.fontSize = 16;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.color = Colors.secondary700;
        break;
      case 'outline':
        baseStyles.color = Colors.primary600;
        break;
      default: // primary
        baseStyles.color = Colors.white;
    }

    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary600}
          style={styles.spinner}
        />
      )}
      
      {!loading && leftIcon && (
        <>{leftIcon}</>
      )}
      
      <Text style={[getTextStyles(), leftIcon && !loading ? styles.textWithLeftIcon : null]}>
        {title}
      </Text>
      
      {!loading && rightIcon && (
        <>{rightIcon}</>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  spinner: {
    marginRight: 8,
  },
  textWithLeftIcon: {
    marginLeft: 8,
  },
});