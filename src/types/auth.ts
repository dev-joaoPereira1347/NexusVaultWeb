export type AuthMode = 'login' | 'register' | 'forgot-password' | 'update-profile';

export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm extends LoginForm {
    fullName: string;
    username: string;
}

export interface ProfileForm {
    fullName: string;
    username: string;
    avatarUrl: string;
}

export interface ProfileData {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
}