import { photoService } from '../lib/supabase';

/**
 * Upload a photo to the system with proper metadata
 * This function should be called whenever a photo is generated
 */
export const uploadGeneratedPhoto = async (imageBlob, seasonId, metadata = {}) => {
  try {
    // Convert blob to file if needed
    const file = imageBlob instanceof File ? imageBlob : 
      new File([imageBlob], `generated-${Date.now()}.png`, { type: 'image/png' });

    // Add generation metadata
    const fullMetadata = {
      ...metadata,
      generatedAt: new Date().toISOString(),
      source: 'photo-booth',
      version: '1.0'
    };

    const { data, error } = await photoService.uploadPhoto(file, seasonId, fullMetadata);
    
    if (error) {
      console.error('Failed to upload photo:', error);
      return { success: false, error };
    }

    console.log('Photo uploaded successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to convert canvas to blob
 */
export const canvasToBlob = (canvas, quality = 0.9) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', quality);
  });
};

/**
 * Helper function to convert data URL to blob
 */
export const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};