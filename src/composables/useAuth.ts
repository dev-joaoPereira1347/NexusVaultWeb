import { computed, onMounted, onUnmounted, ref } from 'vue';
import { toastController } from '@ionic/vue';
import {
    getCurrentSession,
    getCurrentUser,
    getProfile,
    requestPasswordReset,
    saveProfile,
    signIn,
    signOut,
    signUp,
    uploadAvatar
} from '@/services/authService';
import type { AuthMode, LoginForm, ProfileForm, RegisterForm } from '@/types/auth';

const emptyLoginForm = (): LoginForm => ({ email: '', password: '' });
const emptyRegisterForm = (): RegisterForm => ({ fullName: '', username: '', email: '', password: '' });
const emptyProfileForm = (): ProfileForm => ({ fullName: '', username: '', avatarUrl: '' });

export const useAuth = () => {
    const mode = ref<AuthMode>('login');
    const loading = ref(false);
    const loginForm = ref(emptyLoginForm());
    const registerForm = ref(emptyRegisterForm());
    const forgotEmail = ref('');
    const profileForm = ref(emptyProfileForm());
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');

    const subtitleText = computed(() => ({
        login: 'Acesse sua conta para continuar',
        register: 'Insira suas informações para se cadastrar',
        'forgot-password': 'Digite seu e-mail para redefinir sua senha',
        'update-profile': 'Gerencie e atualize seus dados de perfil'
    })[mode.value]);

    const showToast = async (message: string, color: 'success' | 'danger' = 'success') => {
        const toast = await toastController.create({ message, duration: 3000, color, position: 'bottom' });
        await toast.present();
    };

    const setMode = (newMode: AuthMode) => {
        mode.value = newMode;
    };

    const setAvatar = (file: File) => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
        avatarFile.value = file;
        avatarPreviewUrl.value = URL.createObjectURL(file);
    };

    const loadProfile = async (userId: string) => {
        const profile = await getProfile(userId);
        if (!profile) return;

        profileForm.value = {
            fullName: profile.full_name || '',
            username: profile.username || '',
            avatarUrl: profile.avatar_url || ''
        };
        avatarPreviewUrl.value = profileForm.value.avatarUrl;
    };

    const run = async (action: () => Promise<void>, fallback: string) => {
        loading.value = true;
        try {
            await action();
        } catch (error) {
            const message = error instanceof Error ? error.message : fallback;
            await showToast(message || fallback, 'danger');
        } finally {
            loading.value = false;
        }
    };

    const handleLogin = () => run(async () => {
        const { data, error } = await signIn(loginForm.value.email, loginForm.value.password);
        if (error) throw error;
        await loadProfile(data.user.id);
        await showToast('Login realizado com sucesso!');
        setMode('update-profile');
    }, 'Erro ao realizar login.');

    const handleRegister = () => run(async () => {
        const { data, error } = await signUp(registerForm.value);
        if (error) throw error;
        if (!data.user) throw new Error('Falha ao criar conta.');

        const avatarUrl = avatarFile.value ? await uploadAvatar(data.user.id, avatarFile.value) : '';
        profileForm.value = {
            fullName: registerForm.value.fullName,
            username: registerForm.value.username,
            avatarUrl
        };
        const { error: profileError } = await saveProfile(data.user.id, profileForm.value);
        if (profileError) throw profileError;

        await showToast('Conta criada com sucesso!');
        setMode('update-profile');
    }, 'Erro ao criar conta.');

    const handleForgotPassword = () => run(async () => {
        const { error } = await requestPasswordReset(forgotEmail.value);
        if (error) throw error;
        await showToast('Link de recuperação enviado para seu e-mail!');
        setMode('login');
    }, 'Erro ao solicitar recuperação de senha.');

    const handleUpdateProfile = () => run(async () => {
        const { data: { user } } = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado.');

        if (avatarFile.value) {
            profileForm.value.avatarUrl = await uploadAvatar(user.id, avatarFile.value);
        }
        const { error } = await saveProfile(user.id, profileForm.value);
        if (error) throw error;
        avatarFile.value = null;
        await showToast('Perfil atualizado com sucesso!');
    }, 'Erro ao atualizar dados.');

    const handleSignOut = () => run(async () => {
        await signOut();
        loginForm.value = emptyLoginForm();
        profileForm.value = emptyProfileForm();
        avatarFile.value = null;
        avatarPreviewUrl.value = '';
        setMode('login');
        await showToast('Você saiu da sua conta.');
    }, 'Erro ao sair da conta.');

    onMounted(async () => {
        const { data: { session } } = await getCurrentSession();
        if (!session?.user) return;
        try {
            await loadProfile(session.user.id);
            setMode('update-profile');
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
        }
    });

    onUnmounted(() => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    });

    return {
        mode, loading, loginForm, registerForm, forgotEmail, profileForm,
        avatarPreviewUrl, subtitleText, setMode, setAvatar,
        handleLogin, handleRegister, handleForgotPassword, handleUpdateProfile, handleSignOut
    };
};