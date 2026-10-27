import { supabase } from '@/services/supabase';
import type { ProfileData, ProfileForm, RegisterForm } from '@/types/auth';
import { convertImageToWebp } from '@/utils/convertImageToWebp';

const AVATAR_BUCKET = 'avatars';

const getAppBaseUrl = () => {
    const configuredBaseUrl = import.meta.env.VITE_APP_URL?.trim() || import.meta.env.VITE_SITE_URL?.trim();
    if (configuredBaseUrl) return configuredBaseUrl.replace(/\/+$/, '');

    const baseUrl = (import.meta.env.BASE_URL || '').replace(/\/+$/, '');
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

export const reauthenticate = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const signUp = (form: RegisterForm) =>
    supabase.auth.signUp({
        email: form.email,
        password: form.password || '',
        options: {
            emailRedirectTo: getAuthRedirectUrl('auth'),
            data: {
                full_name: form.fullName,
                username: form.username
            }
        }
    });

export const resendSignupConfirmation = (email: string) =>
    supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: getAuthRedirectUrl('auth')
        }
    });

export const verifySignupOtp = (email: string, token: string) =>
    supabase.auth.verifyOtp({ email, token, type: 'signup' });

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
        avatar_url: data.avatar_url || (typeof userData.user?.user_metadata?.avatar_url === 'string' ? userData.user.user_metadata.avatar_url : null)
    };
};

export const getPublicProfile = async (userId: string): Promise<Pick<ProfileData, 'username' | 'avatar_url'> | null> => {
    const { data, error } = await supabase
        .rpc('get_public_profile', { requested_user_id: userId })
        .maybeSingle();

    if (error) throw error;
    if (!data || typeof data !== 'object') return null;

    return {
        username: 'username' in data && typeof data.username === 'string' ? data.username : null,
        avatar_url: 'avatar_url' in data && typeof data.avatar_url === 'string' ? data.avatar_url : null
    };
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const activeUserId = session?.user?.id || userId;

    const webpFile = await convertImageToWebp(file);

    const filePath = `${activeUserId}/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, webpFile, {
        contentType: 'image/webp'
    });

    if (error) throw error;

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    if (!data.publicUrl) throw new Error('Não foi possível gerar a URL pública do avatar.');

    return data.publicUrl;
};

export const deleteStoredAvatar = async (userId: string, avatarUrl: string): Promise<void> => {
    if (!avatarUrl) return;

    const publicPathPrefix = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    let pathname: string;
    try {
        pathname = new URL(avatarUrl).pathname;
    } catch {
        return;
    }

    const prefixIndex = pathname.indexOf(publicPathPrefix);
    if (prefixIndex === -1) return;

    const objectPath = pathname.slice(prefixIndex + publicPathPrefix.length)
        .split('/')
        .map((segment) => decodeURIComponent(segment))
        .join('/');

    if (!objectPath.startsWith(`${userId}/`)) return;

    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([objectPath]);
    if (error) throw error;
};

export const saveProfile = async (userId: string, profile: ProfileForm): Promise<{ error: unknown | null; skipped: boolean }> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        return { error: sessionError, skipped: true };
    }

    if (!session?.user) {
        return { error: null, skipped: true };
    }

    const activeUserId = session.user.id || userId;

    const updateUserResponse = await supabase.auth.updateUser({
        data: {
            full_name: profile.fullName,
            username: profile.username,
            avatar_url: profile.avatarUrl
        }
    });
    const updateUserError = updateUserResponse?.error;
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
        id: activeUserId,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    return { error: result?.error ?? null, skipped: false };
};

export interface PendingAvatarData {
    email: string;
    userId?: string;
    fullName: string;
    username: string;
    dataUrl: string;
    fileName: string;
}

const PENDING_AVATAR_KEY = 'nexusvault_pending_avatar';

export const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

export const dataUrlToFile = (dataUrl: string, fileName: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
};

export const savePendingAvatar = async (
    email: string,
    userId: string,
    fullName: string,
    username: string,
    file: File
): Promise<void> => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const dataUrl = await fileToDataUrl(file);
        const payload: PendingAvatarData = {
            email: email.trim().toLowerCase(),
            userId,
            fullName,
            username,
            dataUrl,
            fileName: file.name || 'avatar.webp'
        };
        localStorage.setItem(PENDING_AVATAR_KEY, JSON.stringify(payload));
    } catch (err) {
        console.warn('Não foi possível armazenar o avatar pendente localmente:', err);
    }
};

export const checkAndSyncPendingAvatar = async (user?: { id: string; email?: string } | null): Promise<string | null> => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;

        const raw = localStorage.getItem(PENDING_AVATAR_KEY);
        if (!raw) return null;

        let activeUser = user;
        if (!activeUser?.id) {
            const { data: { session } } = await supabase.auth.getSession();
            activeUser = session?.user ?? null;
        }

        if (!activeUser?.id) return null;

        const pending: PendingAvatarData = JSON.parse(raw);
        const userEmail = (activeUser.email || '').trim().toLowerCase();
        const matchesUser = (pending.userId && pending.userId === activeUser.id) ||
                            (pending.email && pending.email === userEmail);

        if (!matchesUser) return null;

        const file = dataUrlToFile(pending.dataUrl, pending.fileName || 'avatar.webp');
        const avatarUrl = await uploadAvatar(activeUser.id, file);

        let username = pending.username;
        let fullName = pending.fullName;
        if (!username) {
            const existing = await getProfile(activeUser.id);
            username = existing?.username || '';
            fullName = fullName || existing?.full_name || '';
        }

        await saveProfile(activeUser.id, {
            fullName: fullName || '',
            username: username || '',
            avatarUrl
        });

        localStorage.removeItem(PENDING_AVATAR_KEY);
        return avatarUrl;
    } catch (err) {
        console.error('Erro ao sincronizar avatar pendente:', err);
        return null;
    }
};

export const requestPasswordReset = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('reset-password')
    });

export const updatePassword = (password: string) => supabase.auth.updateUser({ password });

export const updateEmail = (email: string) => supabase.auth.updateUser({ email });

export const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;

    return supabase.auth.signOut();
};

export const signOut = () => supabase.auth.signOut({ scope: 'local' });