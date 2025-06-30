// components/Avatar.tsx

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { cloudinaryAPI, CloudinaryConfig } from '@/services/cloudinary-api';

interface AvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
  editable?: boolean;
  onImageChange?: (imageUrl: string) => void;
  backgroundColor?: string;
  textColor?: string;
  cloudinaryConfig?: CloudinaryConfig;
}

export default function Avatar({
  imageUrl,
  name = '',
  size = 60,
  editable = false,
  onImageChange,
  backgroundColor = '#10B981',
  textColor = '#FFFFFF',
  cloudinaryConfig,
}: AvatarProps) {
  const [loading, setLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'U';

    const words = fullName.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Pick image from gallery or camera
  const pickImage = async () => {
    if (!editable || !cloudinaryConfig) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to change your avatar.'
        );
        return;
      }

      Alert.alert(
        'Change Avatar',
        'Choose how you want to update your avatar',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: openCamera },
          { text: 'Gallery', onPress: openGallery },
        ]
      );
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!cloudinaryConfig) return;

    try {
      setLoading(true);
      const result = await cloudinaryAPI.uploadImage(
        imageUri,
        cloudinaryConfig,
        `avatar_${Date.now()}.jpg`,
        'avatars'
      );

      setCurrentImageUrl(result.secure_url);
      onImageChange?.(result.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(name || '');
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };

  if (loading) {
    return (
      <View style={[styles.container, avatarSize, { backgroundColor }]}>
        <ActivityIndicator size="small" color={textColor} />
      </View>
    );
  }

  if (currentImageUrl) {
    return (
      <TouchableOpacity
        style={[styles.container, avatarSize]}
        onPress={editable ? pickImage : undefined}
        disabled={!editable}
      >
        <Image source={{ uri: currentImageUrl }} style={avatarSize} />
        {editable && (
          <View style={styles.editOverlay}>
            <Camera size={size * 0.3} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, avatarSize, { backgroundColor }]}
      onPress={editable ? pickImage : undefined}
      disabled={!editable}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.4,
            color: textColor,
          },
        ]}
      >
        {initials}
      </Text>
      {editable && (
        <View style={styles.editOverlay}>
          <Camera size={size * 0.25} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
