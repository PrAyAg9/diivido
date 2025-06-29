import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, Upload, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import cloudinaryAPI, { type CloudinaryConfig } from '@/services/cloudinary-api';

interface AvatarUploaderProps {
  currentImage?: string | null;
  userName: string;
  onImageUploaded: (imageUrl: string) => void;
  size?: number;
  showUploadButton?: boolean;
}

// Cloudinary configuration - these should be in environment variables
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'your-cloud-name', // Replace with your cloud name
  uploadPreset: 'divido-avatars', // Replace with your upload preset
  // Note: For production, handle API key/secret server-side
};

export default function AvatarUploader({
  currentImage,
  userName,
  onImageUploaded,
  size = 100,
  showUploadButton = true,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const generateInitialsAvatar = () => {
    return cloudinaryAPI.generateInitialsAvatar(userName, CLOUDINARY_CONFIG);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Photo library permission is needed to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      const uploadResult = await cloudinaryAPI.uploadImage(
        imageUri,
        CLOUDINARY_CONFIG,
        `avatar_${userName}_${Date.now()}`,
        'divido/avatars'
      );
      
      onImageUploaded(uploadResult.secure_url);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select your profile picture',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Photo Library', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getDisplayImage = () => {
    if (currentImage) {
      return { uri: currentImage };
    }
    // Generate initials avatar as fallback
    return { uri: generateInitialsAvatar() };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <Image
          source={getDisplayImage()}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
        
        {uploading && (
          <View style={[styles.uploadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
        
        {showUploadButton && (
          <TouchableOpacity
            style={[styles.uploadButton, { bottom: -size * 0.05, right: -size * 0.05 }]}
            onPress={showImagePicker}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Camera size={size * 0.2} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function generateUserInitials(name: string): string {
  if (!name) return 'U';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
}

export function UserAvatar({ 
  user, 
  size = 40, 
  showUpload = false, 
  onImageUploaded 
}: {
  user: { id: string; full_name?: string | null; avatar_url?: string | null };
  size?: number;
  showUpload?: boolean;
  onImageUploaded?: (url: string) => void;
}) {
  if (showUpload && onImageUploaded) {
    return (
      <AvatarUploader
        currentImage={user.avatar_url}
        userName={user.full_name || 'User'}
        onImageUploaded={onImageUploaded}
        size={size}
        showUploadButton={true}
      />
    );
  }

  const initials = generateUserInitials(user.full_name || 'User');
  
  if (user.avatar_url) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  // Generate initials avatar
  const avatarUrl = cloudinaryAPI.generateInitialsAvatar(user.full_name || 'User', CLOUDINARY_CONFIG);
  
  return (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#E5E7EB',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    backgroundColor: '#10B981',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
