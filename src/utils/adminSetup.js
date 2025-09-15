import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';

/**
 * Setup script to create the first admin user
 * This should be run once to initialize the admin system
 */
export const createAdminUser = async (email, password) => {
  try {
    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (authError) {
      throw authError;
    }

    // Insert into admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        password_hash: passwordHash,
        role: 'admin'
      })
      .select()
      .single();

    if (adminError) {
      throw adminError;
    }

    console.log('Admin user created successfully:', adminData);
    return { success: true, data: adminData };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to check if any admin users exist
 */
export const checkAdminExists = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Failed to check admin users:', error);
    return false;
  }
};