// services/cloudinary-api.ts

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
}

export const cloudinaryAPI = {
  // Upload image to Cloudinary
  uploadImage: async (
    imageUri: string, 
    config: CloudinaryConfig,
    fileName?: string,
    folder?: string
  ): Promise<CloudinaryUploadResult> => {
    const formData = new FormData();
    
    // Create file object from URI
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName || `image_${Date.now()}.jpg`,
    } as any;

    formData.append('file', imageFile);
    formData.append('upload_preset', config.uploadPreset);
    
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    return response.json();
  },

  // Generate avatar URL from initials
  generateAvatarUrl: (
    initials: string, 
    config: CloudinaryConfig,
    options?: {
      width?: number;
      height?: number;
      background?: string;
      color?: string;
    }
  ): string => {
    const {
      width = 100,
      height = 100,
      background = 'auto',
      color = 'white'
    } = options || {};

    // Use Cloudinary's text overlay feature to generate avatar
    const transformations = [
      `w_${width}`,
      `h_${height}`,
      `c_fill`,
      `b_${background}`,
      `co_${color}`,
      `l_text:Arial_${Math.floor(width * 0.4)}:${initials.toUpperCase()}`,
      `g_center`
    ].join(',');

    return `https://res.cloudinary.com/${config.cloudName}/image/upload/${transformations}/sample.jpg`;
  },

  // Generate placeholder avatar with initials
  generateInitialsAvatar: (name: string, config: CloudinaryConfig): string => {
    const initials = getInitials(name);
    return cloudinaryAPI.generateAvatarUrl(initials, config, {
      width: 100,
      height: 100,
      background: getColorFromName(name),
      color: 'white'
    });
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId: string, config: CloudinaryConfig): Promise<void> => {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('API key and secret required for deletion');
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = await generateSignature({
      public_id: publicId,
      timestamp,
    }, config.apiSecret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', config.apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },
};

// Helper functions
function getInitials(name: string): string {
  if (!name) return 'U';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
}

function getColorFromName(name: string): string {
  const colors = [
    '4F46E5', // Indigo
    '7C3AED', // Violet
    'DB2777', // Pink
    'DC2626', // Red
    'EA580C', // Orange
    'D97706', // Amber
    '059669', // Emerald
    '0891B2', // Cyan
    '2563EB', // Blue
    '7C2D12', // Brown
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}

async function generateSignature(params: Record<string, any>, apiSecret: string): Promise<string> {
  // This is a simplified version - in production, generate signature on server
  // For now, we'll use a placeholder
  return 'placeholder_signature';
}

export default cloudinaryAPI;
