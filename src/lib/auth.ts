import { supabase } from './supabase';

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'mom' | 'seeker' | 'both',
  phone: string = '',
  zipCode: string = ''
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    display_name: displayName,
    role,
    phone,
    zip_code: zipCode,
  });
  if (profileError) throw profileError;

  if (role === 'mom' || role === 'both') {
    const { error: momError } = await supabase.from('mom_profiles').insert({
      user_id: data.user.id,
      bio: '',
      location_name: '',
      is_active: true,
      verified: false,
      zip_code: zipCode,
    });
    if (momError) throw momError;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile;
}
