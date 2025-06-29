// Example configuration for Cloudinary
// Create a .env file in your project root with these values:

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key

// Usage example in a component:
/*
import Avatar from '@/components/Avatar';
import { cloudinaryAPI } from '@/services/cloudinary-api';

const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
};

// In your component:
<Avatar
  imageUrl={user.avatar_url}
  name={user.full_name}
  size={80}
  editable={true}
  onImageChange={(imageUrl) => {
    // Update user avatar in your backend
    updateUserAvatar(imageUrl);
  }}
  cloudinaryConfig={cloudinaryConfig}
/>
*/
