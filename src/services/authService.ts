import { supabase } from '@/services/supabase';
import type { ProfileData, ProfileForm, RegisterForm } from '@/types/auth';

const AVATAR_BUCKET = 'avatars';

export const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const signUp = (form: RegisterForm) =>
    supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
            data: {
                full_name: form.fullName,
                username: form.username
            }
        }
    });

export const getCurrentSession = () => supabase.auth.getSession();

export const getCurrentUser = () => supabase.auth.getUser();

export const getProfile = async (userId: string): Promise<ProfileData | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', userId)
        .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw error;

    return data;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, file, { upsert: true });

    if (error) throw error;

    return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath).data.publicUrl;
};

export const saveProfile = (userId: string, profile: ProfileForm) =>
    supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.fullName,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        updated_at: new Date()
    });

export const requestPasswordReset = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
    });

export const signOut = () => supabase.auth.signOut();