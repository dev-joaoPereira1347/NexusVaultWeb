import { supabase } from '@/services/supabase';
import type { ProfileData, ProfileForm, RegisterForm } from '@/types/auth';

const AVATAR_BUCKET = 'avatars';

const getAppBaseUrl = () => {
    const configuredBaseUrl = import.meta.env.VITE_APP_URL?.trim() || import.meta.env.VITE_SITE_URL?.trim();
    if (configuredBaseUrl) return configuredBaseUrl.replace(/\/+$/, '');

    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
    return `${window.location.origin}${baseUrl}`;
};

const getAuthRedirectUrl = (path: string) => {
    const route = path.startsWith('/') ? path : `/${path}`;
    const configuredRedirectUrl =
        (path === 'reset-password' ? import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL : import.meta.env.VITE_AUTH_REDIRECT_URL)
            ?.trim();
    if (configuredRedirectUrl) return configuredRedirectUrl;

    return `${getAppBaseUrl()}${route}`;
};

export const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const signUp = (form: RegisterForm) =>
    supabase.auth.signUp({
        email: form.email,
        password: form.password || '',
        options: {
            data: {
                full_name: form.fullName,
                username: form.username
            }
        }
    });

export const sendMagicLink = (email: string) =>
    supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: getAuthRedirectUrl('auth')
        }
    });

export const getCurrentSession = () => supabase.auth.getSession();

export const getCurrentUser = () => supabase.auth.getUser();

export const getProfile = async (userId: string): Promise<ProfileData | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

    const httpStatus = (error as { status?: number } | null | undefined)?.status;
    if (error?.code === 'PGRST116' || error?.code === 'PGRST301' || httpStatus === 403) return null;
    if (error) throw error;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    return {
        full_name: typeof userData.user?.user_metadata?.full_name === 'string'
            ? userData.user.user_metadata.full_name
            : null,
        username: data.username,
        avatar_url: data.avatar_url
    };
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    if (file.type !== 'image/webp') {
        throw new Error('O avatar deve estar no formato WebP.');
    }

    const extension = 'webp';
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    if (!data.publicUrl) throw new Error('Não foi possível gerar a URL pública do avatar.');

    return data.publicUrl;
};

export const saveProfile = async (userId: string, profile: ProfileForm): Promise<{ error: unknown | null; skipped: boolean }> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        return { error: sessionError, skipped: true };
    }

    if (!session?.user) {
        return { error: null, skipped: true };
    }

    const { error: updateUserError } = await supabase.auth.updateUser({ data: { full_name: profile.fullName } });
    if (updateUserError) {
        const message = updateUserError.message?.toLowerCase() || '';
        const isExpectedSessionIssue = message.includes('auth token missing')
            || message.includes('not authenticated')
            || message.includes('user not found')
            || message.includes('jwt')
            || message.includes('session');

        if (!isExpectedSessionIssue) {
            return { error: updateUserError, skipped: false };
        }
    }

    const result = await supabase.from('profiles').upsert({
        id: userId,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    return { error: result.error ?? null, skipped: false };
};

export const requestPasswordReset = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('reset-password')
    });

export const updatePassword = (password: string) => supabase.auth.updateUser({ password });

export const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;

    return supabase.auth.signOut();
};

export const signOut = () => supabase.auth.signOut({ scope: 'local' });