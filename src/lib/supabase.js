import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin authentication helpers
export const adminAuth = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Update last login
      if (data.user) {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();

    return adminUser;
  }
};

// Photo management helpers
export const photoService = {
  async uploadPhoto(file, seasonId, metadata = {}) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${seasonId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('generated-photos')
        .getPublicUrl(fileName);

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from('generated_photos')
        .insert({
          season_id: seasonId,
          file_path: uploadData.path,
          file_url: publicUrl,
          original_filename: file.name,
          file_size: file.size,
          image_width: dimensions.width,
          image_height: dimensions.height,
          mime_type: file.type,
          metadata
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return { data: photoData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPhotos(filters = {}) {
    try {
      let query = supabase
        .from('generated_photos')
        .select('*')
        .order('generation_timestamp', { ascending: false });

      if (filters.seasonId) {
        query = query.eq('season_id', filters.seasonId);
      }

      if (filters.startDate) {
        query = query.gte('generation_timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('generation_timestamp', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deletePhoto(photoId) {
    try {
      // Get photo data first
      const { data: photo } = await supabase
        .from('generated_photos')
        .select('file_path')
        .eq('id', photoId)
        .single();

      if (photo) {
        // Delete from storage
        await supabase.storage
          .from('generated-photos')
          .remove([photo.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('generated_photos')
        .delete()
        .eq('id', photoId);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  async downloadPhoto(photoId) {
    try {
      const { data: photo } = await supabase
        .from('generated_photos')
        .select('file_path, original_filename')
        .eq('id', photoId)
        .single();

      if (!photo) throw new Error('Photo not found');

      const { data, error } = await supabase.storage
        .from('generated-photos')
        .download(photo.file_path);

      if (error) throw error;

      return { data, filename: photo.original_filename, error: null };
    } catch (error) {
      return { data: null, filename: null, error };
    }
  }
};

// Helper function to get image dimensions
function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
}