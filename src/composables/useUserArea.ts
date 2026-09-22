import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { alertController, toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import {
    deleteAccount,
    getCurrentUser,
    getProfile,
    saveProfile,
    signOut,
    updateEmail,
    updatePassword,
    uploadAvatar
} from '@/services/authService';
import { listLibraryCatalog, listMyContributions } from '@/services/libraryService';
import {
    createReadingProgress,
    deleteReadingProgress,
    listMyReadingProgress,
    updateReadingProgress
} from '@/services/readingProgressService';
import { createReview, deleteReview, listMyReviews, updateReview } from '@/services/reviewService';
import type {
    DocumentReview,
    LibraryCatalogItem,
    LibraryContribution,
    ProgressDraft,
    ReadingProgress,
    ReviewDraft,
    UserProfileForm
} from '@/types/userArea';

const emptyProfile = (): UserProfileForm => ({
    fullName: '',
    username: '',
    email: '',
    avatarUrl: ''
});

const emptyProgressDraft = (): ProgressDraft => ({
    documentId: '',
    page: 1,
    percent: 0,
    status: 'lendo'
});

const emptyReviewDraft = (): ReviewDraft => ({
    documentId: '',
    rating: 5,
    comment: ''
});

export const useUserArea = () => {
    const router = useRouter();
    const pageLoading = ref(true);
    const savingProfile = ref(false);
    const savingPassword = ref(false);
    const savingProgress = ref(false);
    const savingReview = ref(false);

    const profileForm = reactive<UserProfileForm>(emptyProfile());
    const newPassword = ref('');
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');
    const originalEmail = ref('');

    const contributions = ref<LibraryContribution[]>([]);
    const catalog = ref<LibraryCatalogItem[]>([]);
    const progressList = ref<ReadingProgress[]>([]);
    const reviews = ref<DocumentReview[]>([]);
    const progressDraft = reactive<ProgressDraft>(emptyProgressDraft());
    const reviewDraft = reactive<ReviewDraft>(emptyReviewDraft());

    const showToast = async (message: string, color: 'success' | 'warning' | 'danger' = 'success') => {
        const toast = await toastController.create({ message, duration: 3000, color, position: 'bottom' });
        await toast.present();
    };

    const getErrorMessage = (error: unknown, fallback: string): string => {
        if (error instanceof Error && error.message) return error.message;
        if (typeof error === 'object' && error !== null && 'message' in error) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string' && message) return message;
        }
        return fallback;
    };

    const translateError = (rawMessage: string, fallback: string): string => {
        const normalized = rawMessage.toLowerCase();
        if (normalized.includes('duplicate') || normalized.includes('unique')) {
            return 'Já existe um registro para este documento.';
        }
        if (normalized.includes('reading_progress') || normalized.includes('document_reviews')) {
            return 'Execute supabase/user-area-setup.sql no SQL Editor do Supabase para ativar esta seção.';
        }
        if (normalized.includes('profiles_username_key')) {
            return 'Este nome de usuário já está em uso. Escolha outro.';
        }
        if (normalized.includes('library_items')) {
            return 'A biblioteca ainda não está disponível. Envie um documento ou execute o script de upload.';
        }
        return rawMessage || fallback;
    };

    const run = async (flag: { value: boolean }, action: () => Promise<void>, fallback: string) => {
        flag.value = true;
        try {
            await action();
        } catch (error) {
            await showToast(translateError(getErrorMessage(error, fallback), fallback), 'danger');
        } finally {
            flag.value = false;
        }
    };

    const setAvatar = (file: File) => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
        avatarFile.value = file;
        avatarPreviewUrl.value = URL.createObjectURL(file);
    };

    const loadDashboard = async () => {
        const { data: { user }, error } = await getCurrentUser();
        if (error) throw error;
        if (!user) {
            await router.replace({ name: 'Auth', query: { redirect: '/profile' } });
            return;
        }

        const profile = await getProfile(user.id);
        profileForm.fullName = profile?.full_name || '';
        profileForm.username = profile?.username || '';
        profileForm.email = user.email || '';
        profileForm.avatarUrl = profile?.avatar_url || '';
        originalEmail.value = user.email || '';
        avatarPreviewUrl.value = profileForm.avatarUrl;

        const [myItems, catalogItems, myProgress, myReviews] = await Promise.allSettled([
            listMyContributions(user.id),
            listLibraryCatalog(),
            listMyReadingProgress(),
            listMyReviews()
        ]);

        contributions.value = myItems.status === 'fulfilled' ? myItems.value : [];
        catalog.value = catalogItems.status === 'fulfilled' ? catalogItems.value : [];
        progressList.value = myProgress.status === 'fulfilled' ? myProgress.value : [];
        reviews.value = myReviews.status === 'fulfilled' ? myReviews.value : [];

        const firstMissingTable = [myProgress, myReviews].find((result) => {
            if (result.status !== 'rejected') return false;
            const message = getErrorMessage(result.reason, '').toLowerCase();
            return message.includes('does not exist') || message.includes('schema cache') || message.includes('relation');
        });

        if (firstMissingTable) {
            await showToast('Progresso e avaliações precisam do script supabase/user-area-setup.sql.', 'warning');
        }
    };

    const handleSaveProfile = () => run(savingProfile, async () => {
        const { data: { user }, error } = await getCurrentUser();
        if (error) throw error;
        if (!user) throw new Error('Usuário não autenticado.');

        if (avatarFile.value) {
            profileForm.avatarUrl = await uploadAvatar(user.id, avatarFile.value);
        }

        const { error: profileError } = await saveProfile(user.id, {
            fullName: profileForm.fullName,
            username: profileForm.username,
            avatarUrl: profileForm.avatarUrl
        });
        if (profileError) throw profileError;

        const nextEmail = profileForm.email.trim();
        if (nextEmail && nextEmail !== originalEmail.value) {
            const { error: emailError } = await updateEmail(nextEmail);
            if (emailError) throw emailError;
            originalEmail.value = nextEmail;
            await showToast('Perfil salvo. Confirme o novo e-mail se o Supabase solicitar verificação.');
        } else {
            await showToast('Perfil atualizado com sucesso!');
        }

        avatarFile.value = null;
    }, 'Erro ao atualizar o perfil.');

    const handleChangePassword = () => run(savingPassword, async () => {
        if (newPassword.value.trim().length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        const { error } = await updatePassword(newPassword.value);
        if (error) throw error;
        newPassword.value = '';
        await showToast('Senha alterada com sucesso!');
    }, 'Erro ao alterar a senha.');

    const handleCreateProgress = () => run(savingProgress, async () => {
        if (!progressDraft.documentId) throw new Error('Selecione um documento.');
        await createReadingProgress({
            documentId: progressDraft.documentId,
            page: Number(progressDraft.page) || 0,
            percent: Math.min(100, Math.max(0, Number(progressDraft.percent) || 0)),
            status: progressDraft.status
        });
        progressList.value = await listMyReadingProgress();
        Object.assign(progressDraft, emptyProgressDraft());
        await showToast('Progresso de leitura salvo.');
    }, 'Erro ao salvar o progresso.');

    const handleUpdateProgress = (item: ReadingProgress) => run(savingProgress, async () => {
        await updateReadingProgress(item.id, {
            page: Number(item.page) || 0,
            percent: Math.min(100, Math.max(0, Number(item.percent) || 0)),
            status: item.status
        });
        await showToast('Progresso atualizado.');
    }, 'Erro ao atualizar o progresso.');

    const handleDeleteProgress = async (id: string) => {
        const alert = await alertController.create({
            header: 'Excluir progresso',
            message: 'Remover este registro de leitura?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Excluir', role: 'destructive' }
            ]
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        if (role !== 'destructive') return;

        await run(savingProgress, async () => {
            await deleteReadingProgress(id);
            progressList.value = progressList.value.filter((item) => item.id !== id);
            await showToast('Progresso excluído.');
        }, 'Erro ao excluir o progresso.');
    };

    const handleCreateReview = () => run(savingReview, async () => {
        if (!reviewDraft.documentId) throw new Error('Selecione um documento.');
        await createReview({
            documentId: reviewDraft.documentId,
            rating: Number(reviewDraft.rating) || 1,
            comment: reviewDraft.comment
        });
        reviews.value = await listMyReviews();
        Object.assign(reviewDraft, emptyReviewDraft());
        await showToast('Avaliação publicada.');
    }, 'Erro ao salvar a avaliação.');

    const handleUpdateReview = (item: DocumentReview) => run(savingReview, async () => {
        await updateReview(item.id, { rating: Number(item.rating) || 1, comment: item.comment });
        await showToast('Avaliação atualizada.');
    }, 'Erro ao atualizar a avaliação.');

    const handleDeleteReview = async (id: string) => {
        const alert = await alertController.create({
            header: 'Excluir avaliação',
            message: 'Esta avaliação será removida.',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Excluir', role: 'destructive' }
            ]
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        if (role !== 'destructive') return;

        await run(savingReview, async () => {
            await deleteReview(id);
            reviews.value = reviews.value.filter((item) => item.id !== id);
            await showToast('Avaliação excluída.');
        }, 'Erro ao excluir a avaliação.');
    };

    const handleSignOut = () => run(pageLoading, async () => {
        await signOut();
        await router.replace('/auth');
        await showToast('Você saiu da sua conta.');
    }, 'Erro ao sair da conta.');

    const handleDeleteAccount = async () => {
        const alert = await alertController.create({
            header: 'Excluir conta',
            message: 'Esta ação não pode ser desfeita. Seus dados de acesso serão removidos.',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Excluir', role: 'destructive' }
            ]
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        if (role !== 'destructive') return;

        await run(pageLoading, async () => {
            await deleteAccount();
            await router.replace('/auth');
            await showToast('Conta excluída.');
        }, 'Não foi possível excluir sua conta. Tente novamente.');
    };

    onMounted(async () => {
        try {
            await loadDashboard();
        } catch (error) {
            await showToast(getErrorMessage(error, 'Não foi possível carregar sua área.'), 'danger');
        } finally {
            pageLoading.value = false;
        }
    });

    onUnmounted(() => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    });

    return {
        pageLoading,
        savingProfile,
        savingPassword,
        savingProgress,
        savingReview,
        profileForm,
        newPassword,
        avatarPreviewUrl,
        contributions,
        catalog,
        progressList,
        reviews,
        progressDraft,
        reviewDraft,
        setAvatar,
        handleSaveProfile,
        handleChangePassword,
        handleCreateProgress,
        handleUpdateProgress,
        handleDeleteProgress,
        handleCreateReview,
        handleUpdateReview,
        handleDeleteReview,
        handleSignOut,
        handleDeleteAccount
    };
};
