import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dceqsuwdxfmitfjhkrsj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ODsBQPTgYIQBJ4P_dIp2CA_VUYJsod8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Fetch properties from Supabase table
 */
export async function fetchPropertiesFromSupabase(params = {}) {
  if (!supabase) return null;
  try {
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' });

    if (params.property_id) {
      query = query.ilike('property_id', `%${params.property_id}%`);
    }
    if (params.village) {
      query = query.ilike('village', `%${params.village}%`);
    }
    if (params.pincode) {
      query = query.eq('pincode', params.pincode);
    }
    if (params.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((params.page - 1) * (params.pageSize || 50), params.page * (params.pageSize || 50) - 1);

    if (error) {
      console.warn('[Supabase] Fetch error:', error.message);
      return null;
    }

    return {
      data,
      count,
    };
  } catch (err) {
    console.warn('[Supabase] Request failed:', err.message);
    return null;
  }
}

/**
 * Upsert / Insert property into Supabase
 */
export async function upsertPropertyToSupabase(property) {
  if (!supabase) return null;
  try {
    const payload = {
      property_id: property.property_id,
      village: property.village,
      block: property.block,
      district: property.district,
      state: property.state,
      pincode: property.pincode,
      latitude: property.latitude,
      longitude: property.longitude,
      area_sq_m: property.area_sq_m,
      confidence_score: property.confidence_score,
      status: property.status || 'PENDING',
      property_type: property.property_type,
      build_material: property.build_material,
      floors: property.floors || 1,
      roof_type: property.roof_type,
      condition: property.condition || 'Good',
      owner_name: property.owner_name,
      owner_phone: property.owner_phone,
      owner_email: property.owner_email,
      field_worker: property.field_worker,
      verification_step: property.verification_step || 'UNDER_REVIEW',
      site_photos: typeof property.site_photos === 'object' ? JSON.stringify(property.site_photos) : property.site_photos,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('properties')
      .upsert(payload, { onConflict: 'property_id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Upsert error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] Sync error:', err.message);
    return null;
  }
}

/**
 * Subscribe to live changes on the properties table
 */
export function subscribeToProperties(callback) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('properties-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'properties' },
      (payload) => {
        if (callback) callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
