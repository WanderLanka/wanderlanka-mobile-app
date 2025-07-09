import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

const { width } = Dimensions.get('window');

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={48} color={Colors.error} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Delete Account</Text>

          {/* Warning Message */}
          <Text style={styles.message}>
            This action cannot be undone. All your data will be permanently deleted including:
          </Text>

          {/* Data List */}
          <View style={styles.dataList}>
            <View style={styles.dataItem}>
              <Ionicons name="person-outline" size={16} color={Colors.error} />
              <Text style={styles.dataText}>Personal profile information</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="map-outline" size={16} color={Colors.error} />
              <Text style={styles.dataText}>Trip history and timeline</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="images-outline" size={16} color={Colors.error} />
              <Text style={styles.dataText}>Photos and memories</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="gift-outline" size={16} color={Colors.error} />
              <Text style={styles.dataText}>Loyalty points and rewards</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="settings-outline" size={16} color={Colors.error} />
              <Text style={styles.dataText}>All app preferences</Text>
            </View>
          </View>

          {/* Confirmation Text */}
          <Text style={styles.confirmationText}>
            Are you absolutely sure you want to delete your WanderLanka account?
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={onConfirm}>
              <Text style={styles.deleteButtonText}>Delete Forever</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.secondary600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  dataList: {
    width: '100%',
    marginBottom: 16,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light100,
    borderRadius: 8,
    marginBottom: 8,
  },
  dataText: {
    fontSize: 13,
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
  },
  confirmationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light300,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
