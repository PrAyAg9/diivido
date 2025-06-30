// components/ReceiptUpload.tsx

import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X, Upload, Trash2 } from 'lucide-react-native';
import { cloudinaryAPI, CloudinaryConfig } from '@/services/cloudinary-api';

const { width, height } = Dimensions.get('window');

interface ReceiptUploadProps {
  receiptUrl?: string | null;
  onReceiptChange?: (receiptUrl: string | null) => void;
  cloudinaryConfig?: CloudinaryConfig;
  disabled?: boolean;
}

export default function ReceiptUpload({
  receiptUrl,
  onReceiptChange,
  cloudinaryConfig,
  disabled = false,
}: ReceiptUploadProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState(receiptUrl);

  const pickImage = async () => {
    if (disabled || !cloudinaryConfig) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload receipts.'
        );
        return;
      }

      Alert.alert('Add Receipt', 'Choose how you want to add a receipt', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
      ]);
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9, // Higher quality for receipts
      });

      if (!result.canceled && result.assets[0]) {
        uploadReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        uploadReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const uploadReceipt = async (imageUri: string) => {
    if (!cloudinaryConfig) return;

    try {
      setLoading(true);
      const result = await cloudinaryAPI.uploadImage(
        imageUri,
        cloudinaryConfig,
        `receipt_${Date.now()}.jpg`,
        'receipts'
      );

      setCurrentReceiptUrl(result.secure_url);
      onReceiptChange?.(result.secure_url);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload receipt. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCurrentReceiptUrl(null);
            onReceiptChange?.(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.uploadContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.uploadingText}>Uploading receipt...</Text>
      </View>
    );
  }

  if (currentReceiptUrl) {
    return (
      <>
        <View style={styles.receiptContainer}>
          <TouchableOpacity
            style={styles.receiptPreview}
            onPress={() => setShowPreview(true)}
          >
            <Image
              source={{ uri: currentReceiptUrl }}
              style={styles.receiptImage}
            />
            <View style={styles.receiptOverlay}>
              <ImageIcon size={20} color="#FFFFFF" />
              <Text style={styles.receiptText}>Tap to view</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.receiptActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickImage}
              disabled={disabled}
            >
              <Upload size={16} color="#10B981" />
              <Text style={styles.actionText}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={removeReceipt}
              disabled={disabled}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Receipt Preview Modal */}
        <Modal
          visible={showPreview}
          transparent={true}
          animationType="fade"
          statusBarTranslucent
        >
          <SafeAreaView style={styles.previewModal}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Receipt</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPreview(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewContent}>
              <Image
                source={{ uri: currentReceiptUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.uploadContainer, disabled && styles.disabled]}
      onPress={pickImage}
      disabled={disabled}
    >
      <Camera size={32} color="#9CA3AF" />
      <Text style={styles.uploadText}>Add Receipt</Text>
      <Text style={styles.uploadSubtext}>Tap to upload photo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  uploadContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  disabled: {
    opacity: 0.5,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  uploadingText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
  },
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptPreview: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginLeft: 4,
  },
  removeText: {
    color: '#EF4444',
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: width - 40,
    height: height - 200,
  },
});
