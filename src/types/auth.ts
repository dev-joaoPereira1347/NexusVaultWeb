export type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    email: string;
    password?: string;
    fullName: string;
    username: string;
}

export interface ProfileForm {
    fullName: string;
    username: string;
    avatarUrl: string;
}

export interface ResetPasswordForm {
    password: string;
}

export interface ProfileData {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
}