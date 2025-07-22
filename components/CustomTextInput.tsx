import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View
} from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: View['props']['style'];
}

export const CustomTextInput: React.FC<CustomTextInputProps> = React.memo(({
  label,
  error,
  isPassword = false,
  leftIcon,
  style,
  containerStyle,
  ...props
}) => {
  const [isSecureTextEntry, setIsSecureTextEntry] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>

      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputContainer,
        isFocused && { borderColor: Colors.primary600 },
        error && { borderColor: Colors.error }
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
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
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          textContentType="none"
          clearButtonMode="while-editing"
          keyboardType="default"
          editable={true}
          selectTextOnFocus={false}
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
      
      {/* Step 3: Add back error with Colors */}
      {error && error.length > 0 && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

CustomTextInput.displayName = 'CustomTextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
    fontFamily: 'Inter', // Adding back fontFamily - TEST THIS
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
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary700,
    fontFamily: 'Inter', // Adding back fontFamily - TEST THIS
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
    fontFamily: 'Inter', // Adding back fontFamily - TEST THIS
  },
});