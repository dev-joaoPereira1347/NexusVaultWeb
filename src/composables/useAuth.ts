import { computed, onMounted, onUnmounted, ref } from 'vue';
import { toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import {
    getCurrentSession,
    getCurrentUser,
    getProfile,
    requestPasswordReset,
    saveProfile,
    sendMagicLink,
    signIn,
    signOut,
    signUp,
    updatePassword,
    uploadAvatar
} from '@/services/authService';
import type { AuthMode, LoginForm, ProfileForm, RegisterForm, ResetPasswordForm } from '@/types/auth';

const emptyLoginForm = (): LoginForm => ({ email: '', password: '' });
const emptyRegisterForm = (): RegisterForm => ({ fullName: '', username: '', email: '', password: '' });
const emptyProfileForm = (): ProfileForm => ({ fullName: '', username: '', avatarUrl: '' });

export const useAuth = () => {
    const router = useRouter();
    const mode = ref<AuthMode>('login');
    const loading = ref(false);
    const loginForm = ref(emptyLoginForm());
    const registerForm = ref(emptyRegisterForm());
    const forgotEmail = ref('');
    const resetPasswordForm = ref<ResetPasswordForm>({ password: '' });
    const profileForm = ref(emptyProfileForm());
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');

    const subtitleText = computed(() => ({
        login: 'Acesse sua conta para continuar',
        register: 'Insira suas informações para se cadastrar',
        'forgot-password': 'Digite seu e-mail para redefinir sua senha',
        'reset-password': 'Defina uma nova senha para sua conta',
        'update-profile': 'Gerencie e atualize seus dados de perfil'
    })[mode.value]);

    const showToast = async (message: string, color: 'success' | 'warning' | 'danger' = 'success') => {
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
            const rawMessage = error instanceof Error ? error.message : '';
            const normalizedMessage = rawMessage.toLowerCase();
            const message = normalizedMessage.includes('invalid login credentials')
                ? 'E-mail ou senha inválidos.'
                : normalizedMessage.includes('email not confirmed')
                    ? 'Confirme seu e-mail antes de entrar.'
                    : normalizedMessage.includes('email rate limit exceeded')
                        ? 'Limite de envio de e-mails atingido. Aguarde alguns minutos antes de tentar novamente.'
                    : normalizedMessage.includes('redirect_to') || normalizedMessage.includes('redirect url')
                        ? 'A URL de recuperação não está autorizada no Supabase.'
                    : rawMessage || fallback;
            await showToast(message || fallback, 'danger');
        } finally {
            loading.value = false;
        }
    };

    const handleLogin = () => run(async () => {
        const { data, error } = await signIn(loginForm.value.email, loginForm.value.password);
        if (error) throw error;

        if (!data.user) throw new Error('Não foi possível identificar o usuário autenticado.');

        try {
            await loadProfile(data.user.id);
        } catch (profileError) {
            await showToast('Login realizado, mas não foi possível carregar seu perfil.', 'warning');
        }

        await showToast('Login realizado com sucesso!');
        await router.push('/home');
    }, 'Erro ao realizar login.');

    const handleRegister = () => run(async () => {
        const { data, error } = await signUp(registerForm.value);
        if (error) throw error;

        const user = data.user;
        if (!user) throw new Error('Falha ao criar a conta.');

        if (!data.session) {
            registerForm.value = emptyRegisterForm();
            avatarFile.value = null;
            avatarPreviewUrl.value = '';
            await showToast('Cadastro realizado! Verifique seu e-mail e confirme a conta para ativá-la.', 'success');
            setMode('login');
            return;
        }

        const avatarUrl = avatarFile.value ? await uploadAvatar(user.id, avatarFile.value) : '';
        profileForm.value = {
            fullName: registerForm.value.fullName,
            username: registerForm.value.username,
            avatarUrl
        };

        const { error: profileError, skipped } = await saveProfile(user.id, profileForm.value);
        if (profileError && !skipped) throw profileError;

        registerForm.value = emptyRegisterForm();
        avatarFile.value = null;
        avatarPreviewUrl.value = '';
        await showToast('Conta criada com sucesso!');
        setMode('login');
        await router.push('/home');
    }, 'Erro ao criar a conta.');

    const handleMagicLinkLogin = () => run(async () => {
        const email = loginForm.value.email.trim();
        if (!email) {
            throw new Error('Informe seu e-mail para receber o Magic Link.');
        }

        const { error } = await sendMagicLink(email);
        if (error) throw error;

        await showToast('Magic Link enviado para o seu e-mail.');
    }, 'Erro ao enviar o Magic Link.');

    const handleForgotPassword = () => run(async () => {
        const { error } = await requestPasswordReset(forgotEmail.value);
        if (error) throw error;
        await showToast('Link de recuperação enviado para seu e-mail!');
        setMode('login');
    }, 'Erro ao solicitar recuperação de senha.');

    const handleResetPassword = () => run(async () => {
        const { error } = await updatePassword(resetPasswordForm.value.password);
        if (error) throw error;
        resetPasswordForm.value.password = '';
        window.history.replaceState({}, '', '/auth');
        await showToast('Senha alterada com sucesso!');
        setMode('login');
    }, 'Erro ao alterar senha.');

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
        if (window.location.pathname === '/reset-password') {
            setMode('reset-password');
            return;
        }

        const { data: { session } } = await getCurrentSession();
        if (!session?.user) return;
        try {
            await loadProfile(session.user.id);
            setMode('update-profile');
        } catch (error) {
            await showToast('Não foi possível carregar seu perfil.', 'danger');
        }
    });

    onUnmounted(() => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    });

    return {
        mode, loading, loginForm, registerForm, forgotEmail, resetPasswordForm, profileForm,
        avatarPreviewUrl, subtitleText, setMode, setAvatar,
        handleLogin, handleRegister, handleMagicLinkLogin, handleForgotPassword, handleResetPassword, handleUpdateProfile, handleSignOut
    };
};