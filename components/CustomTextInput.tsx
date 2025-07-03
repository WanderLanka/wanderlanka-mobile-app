import React, { useState } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  View, 
  Text, 
  TouchableOpacity,
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  isPassword = false,
  leftIcon,
  style,
  ...props
}) => {
  const [isSecureTextEntry, setIsSecureTextEntry] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? Colors.error : isFocused ? Colors.primary600 : Colors.secondary400}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={isSecureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.secondary400}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecureTextEntry(!isSecureTextEntry)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isSecureTextEntry ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.secondary400}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary700,
    fontFamily: 'Inter',
    paddingVertical: 0,
  },
  leftIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontFamily: 'Inter',
  },
});
