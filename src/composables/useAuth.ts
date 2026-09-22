import { computed, onMounted, onUnmounted, ref } from 'vue';
import { toastController } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import {
    getCurrentSession,
    requestPasswordReset,
    saveProfile,
    sendMagicLink,
    signIn,
    signUp,
    updatePassword,
    uploadAvatar
} from '@/services/authService';
import type { AuthMode, LoginForm, RegisterForm, ResetPasswordForm } from '@/types/auth';

const emptyLoginForm = (): LoginForm => ({ email: '', password: '' });
const emptyRegisterForm = (): RegisterForm => ({ fullName: '', username: '', email: '', password: '' });

export const useAuth = () => {
    const router = useRouter();
    const route = useRoute();
    const mode = ref<AuthMode>('login');
    const loading = ref(false);
    const loginForm = ref(emptyLoginForm());
    const registerForm = ref(emptyRegisterForm());
    const forgotEmail = ref('');
    const resetPasswordForm = ref<ResetPasswordForm>({ password: '' });
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');

    const subtitleText = computed(() => ({
        login: 'Acesse sua conta para continuar',
        register: 'Insira suas informações para se cadastrar',
        'forgot-password': 'Digite seu e-mail para redefinir sua senha',
        'reset-password': 'Defina uma nova senha para sua conta'
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

    const getRedirectPath = (fallback: string) =>
        typeof route.query.redirect === 'string' ? route.query.redirect : fallback;

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'object' && error !== null && 'message' in error) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string') return message;
        }
        return '';
    };

    const translateAuthError = (rawMessage: string, fallback: string): string => {
        const normalizedMessage = rawMessage.toLowerCase();

        if (normalizedMessage.includes('invalid login credentials')) return 'E-mail ou senha inválidos.';
        if (normalizedMessage.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
        if (normalizedMessage.includes('email rate limit exceeded')) {
            return 'Limite de envio de e-mails atingido. Aguarde alguns minutos antes de tentar novamente.';
        }
        if (normalizedMessage.includes('redirect_to') || normalizedMessage.includes('redirect url')) {
            return 'A URL de recuperação não está autorizada no Supabase.';
        }
        if (normalizedMessage.includes('profiles_username_key') || normalizedMessage.includes('duplicate key value violates unique constraint')) {
            return 'Este nome de usuário já está em uso. Escolha outro.';
        }
        if (normalizedMessage.includes('database error saving new user')) {
            return 'Não foi possível salvar o cadastro. Verifique se o nome de usuário já existe ou tente outro e-mail.';
        }
        if (normalizedMessage.includes('permission denied for table profiles')) {
            return 'Permissões da tabela profiles não configuradas no Supabase. Execute supabase/profiles-policies.sql no SQL Editor.';
        }

        return rawMessage || fallback;
    };

    const run = async (action: () => Promise<void>, fallback: string) => {
        loading.value = true;
        try {
            await action();
        } catch (error) {
            const rawMessage = getErrorMessage(error);
            await showToast(translateAuthError(rawMessage, fallback), 'danger');
        } finally {
            loading.value = false;
        }
    };

    const handleLogin = () => run(async () => {
        const { data, error } = await signIn(loginForm.value.email, loginForm.value.password);
        if (error) throw error;

        if (!data.user) throw new Error('Não foi possível identificar o usuário autenticado.');

        await showToast('Login realizado com sucesso!');
        await router.push(getRedirectPath('/home'));
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
        const { error: profileError, skipped } = await saveProfile(user.id, {
            fullName: registerForm.value.fullName,
            username: registerForm.value.username,
            avatarUrl
        });
        if (profileError && !skipped) throw profileError;

        registerForm.value = emptyRegisterForm();
        avatarFile.value = null;
        avatarPreviewUrl.value = '';
        await showToast('Conta criada com sucesso!');
        setMode('login');
        await router.push(getRedirectPath('/home'));
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

    onMounted(async () => {
        if (window.location.pathname === '/reset-password') {
            setMode('reset-password');
            return;
        }

        const { data: { session } } = await getCurrentSession();
        if (session?.user && route.name === 'Auth') {
            await router.replace(getRedirectPath('/profile'));
        }
    });

    onUnmounted(() => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    });

    return {
        mode, loading, loginForm, registerForm, forgotEmail, resetPasswordForm,
        avatarPreviewUrl, subtitleText, setMode, setAvatar,
        handleLogin, handleRegister, handleMagicLinkLogin, handleForgotPassword, handleResetPassword
    };
};
