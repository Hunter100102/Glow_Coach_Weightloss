import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'meal-photos';

export const storageEnabled = Boolean(supabaseUrl && serviceKey);
export const supabase = storageEnabled ? createClient(supabaseUrl, serviceKey) : null;

export async function uploadMealPhoto({ userId, buffer, mimetype }) {
  if (!storageEnabled) throw new Error('Supabase storage is not configured');
  const ext = mimetype?.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mimetype || 'image/jpeg',
    upsert: false
  });
  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path, expiresIn = 3600) {
  if (!path || !storageEnabled) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl || null;
}
