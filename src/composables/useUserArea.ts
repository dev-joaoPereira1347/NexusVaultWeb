import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { alertController, toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
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
import { listLibraryCatalog, listMyContributions, listMyUploadRequests } from '@/services/libraryService';
import { checkLibraryUploadRequest, deleteMyLibraryItem, updateMyLibraryItem } from '@/services/uploadService';
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
    LibraryUploadRequest,
    ProgressDraft,
    ReadingProgress,
    ReviewDraft,
    UserProfileForm
} from '@/types/userArea';
import type { UploadForm } from '@/types/upload';

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

const emptyUploadForm = (): UploadForm => ({
    title: '',
    author: '',
    category: '',
    year: String(new Date().getFullYear()),
    type: '',
    genre: '',
    language: '',
    description: '',
    cover: null
});

export const useUserArea = () => {
    const router = useRouter();
    const pageLoading = ref(true);
    const savingProfile = ref(false);
    const savingPassword = ref(false);
    const savingProgress = ref(false);
    const savingReview = ref(false);
    const savingContribution = ref(false);
    const checkingUploads = ref(false);

    const profileForm = reactive<UserProfileForm>(emptyProfile());
    const newPassword = ref('');
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');
    const originalEmail = ref('');

    const contributions = ref<LibraryContribution[]>([]);
    const uploadRequests = ref<LibraryUploadRequest[]>([]);
    const editingContribution = ref<LibraryContribution | null>(null);
    const contributionDraft = reactive<UploadForm>(emptyUploadForm());
    const replacementFile = ref<File | null>(null);
    const removeExistingCover = ref(false);
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

        const [myItems, myRequests, catalogItems, myProgress, myReviews] = await Promise.allSettled([
            listMyContributions(user.id),
            listMyUploadRequests(user.id),
            listLibraryCatalog(),
            listMyReadingProgress(),
            listMyReviews()
        ]);

        contributions.value = myItems.status === 'fulfilled' ? myItems.value : [];
        uploadRequests.value = myRequests.status === 'fulfilled' ? myRequests.value : [];
        catalog.value = catalogItems.status === 'fulfilled' ? catalogItems.value : [];
        progressList.value = myProgress.status === 'fulfilled' ? myProgress.value : [];
        reviews.value = myReviews.status === 'fulfilled' ? myReviews.value : [];

        if (myItems.status === 'rejected') {
            await showToast(
                translateError(getErrorMessage(myItems.reason, 'Não foi possível carregar seus documentos.'), 'Não foi possível carregar seus documentos.'),
                'danger'
            );
        }
        if (myRequests.status === 'rejected') {
            await showToast(
                translateError(getErrorMessage(myRequests.reason, 'Não foi possível carregar o status dos envios.'), 'Não foi possível carregar o status dos envios.'),
                'danger'
            );
        }
        if (catalogItems.status === 'rejected') {
            await showToast(
                translateError(getErrorMessage(catalogItems.reason, 'Não foi possível carregar o acervo.'), 'Não foi possível carregar o acervo.'),
                'danger'
            );
        }

        const firstMissingTable = [myProgress, myReviews].find((result) => {
            if (result.status !== 'rejected') return false;
            const message = getErrorMessage(result.reason, '').toLowerCase();
            return message.includes('does not exist') || message.includes('schema cache') || message.includes('relation');
        });

        if (firstMissingTable) {
            await showToast('Progresso e avaliações precisam do script supabase/user-area-setup.sql.', 'warning');
        }
    };

    const refreshLibraryData = async () => {
        const { data: { user }, error } = await getCurrentUser();
        if (error) throw error;
        if (!user) return;

        const [myItems, myRequests, catalogItems] = await Promise.allSettled([
            listMyContributions(user.id),
            listMyUploadRequests(user.id),
            listLibraryCatalog()
        ]);

        if (myItems.status === 'fulfilled') {
            contributions.value = myItems.value;
        } else {
            await showToast(
                translateError(getErrorMessage(myItems.reason, 'Não foi possível atualizar seus documentos.'), 'Não foi possível atualizar seus documentos.'),
                'danger'
            );
        }

        if (myRequests.status === 'fulfilled') {
            uploadRequests.value = myRequests.value;
        } else {
            await showToast(
                translateError(getErrorMessage(myRequests.reason, 'Não foi possível atualizar o status dos envios.'), 'Não foi possível atualizar o status dos envios.'),
                'danger'
            );
        }

        if (catalogItems.status === 'fulfilled') {
            catalog.value = catalogItems.value;
        } else {
            await showToast(
                translateError(getErrorMessage(catalogItems.reason, 'Não foi possível atualizar o acervo.'), 'Não foi possível atualizar o acervo.'),
                'danger'
            );
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

    const openContributionEditor = (item: LibraryContribution) => {
        editingContribution.value = item;
        Object.assign(contributionDraft, {
            title: item.title,
            author: item.author,
            category: item.category,
            year: item.year ? String(item.year) : '',
            type: item.content_type,
            genre: item.genre ?? '',
            language: item.language ?? '',
            description: item.description ?? '',
            cover: null
        });
        replacementFile.value = null;
        removeExistingCover.value = false;
    };

    const closeContributionEditor = () => {
        if (savingContribution.value) return;
        editingContribution.value = null;
        replacementFile.value = null;
        removeExistingCover.value = false;
        Object.assign(contributionDraft, emptyUploadForm());
    };

    const getAuthenticatedUserId = async () => {
        const { data: { user }, error } = await getCurrentUser();
        if (error) throw error;
        if (!user) throw new Error('Usuário não autenticado.');
        return user.id;
    };

    const handleUpdateContribution = async () => {
        if (!editingContribution.value || savingContribution.value) return;

        savingContribution.value = true;
        try {
            const userId = await getAuthenticatedUserId();
            const { cleanupErrors, uploadRequest } = await updateMyLibraryItem(
                userId,
                editingContribution.value.id,
                contributionDraft,
                replacementFile.value,
                removeExistingCover.value
            );

            try {
                contributions.value = await listMyContributions(userId);
                uploadRequests.value = await listMyUploadRequests(userId);
            } catch (error) {
                await showToast(
                    `Documento atualizado, mas a lista não pôde ser recarregada: ${getErrorMessage(error, 'erro desconhecido')}`,
                    'warning'
                );
            }

            try {
                catalog.value = await listLibraryCatalog();
            } catch (error) {
                await showToast(
                    `Documento atualizado, mas o catálogo não pôde ser atualizado: ${getErrorMessage(error, 'erro desconhecido')}`,
                    'warning'
                );
            }

            savingContribution.value = false;
            closeContributionEditor();
            if (uploadRequest) {
                await showToast('Alteração recebida. O arquivo continuará privado até a verificação antivírus terminar.');
            } else {
                await showToast(
                    cleanupErrors.length
                        ? `Documento atualizado, mas não foi possível remover arquivos antigos: ${cleanupErrors.join('; ')}`
                        : 'Documento atualizado com sucesso.',
                    cleanupErrors.length ? 'warning' : 'success'
                );
            }
        } catch (error) {
            await showToast(
                translateError(getErrorMessage(error, 'Erro ao atualizar o documento.'), 'Erro ao atualizar o documento.'),
                'danger'
            );
        } finally {
            savingContribution.value = false;
        }
    };

    const refreshUploadStatuses = () => run(checkingUploads, async () => {
        const userId = await getAuthenticatedUserId();
        const requests = await listMyUploadRequests(userId);
        const pendingRequests = requests.filter((item) =>
            item.status === 'pending' || item.status === 'scanning' || item.status === 'processing'
        );
        const failures: string[] = [];

        const requestToCheck = pendingRequests[pendingRequests.length - 1];
        if (requestToCheck) {
            try {
                await checkLibraryUploadRequest(requestToCheck.id);
            } catch (error) {
                failures.push(`${requestToCheck.title}: ${getErrorMessage(error, 'falha ao consultar o status')}`);
            }
        }

        uploadRequests.value = await listMyUploadRequests(userId);
        const [myItems, catalogItems] = await Promise.all([
            listMyContributions(userId),
            listLibraryCatalog()
        ]);
        contributions.value = myItems;
        catalog.value = catalogItems;

        await showToast(
            failures.length
                ? `Status atualizado com erros: ${failures.join('; ')}`
                : pendingRequests.length > 1
                    ? `Um status foi consultado. Ainda há ${pendingRequests.length - 1} envio(s) aguardando consulta.`
                    : 'Status dos envios atualizado.',
            failures.length ? 'warning' : 'success'
        );
    }, 'Não foi possível atualizar os status dos envios.');

    const handleDeleteContribution = async (item: LibraryContribution) => {
        const alert = await alertController.create({
            header: 'Excluir documento',
            message: `“${item.title}” será removido do acervo. Esta ação não pode ser desfeita.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Excluir', role: 'destructive' }
            ]
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        if (role !== 'destructive') return;

        await run(savingContribution, async () => {
            const userId = await getAuthenticatedUserId();
            const cleanupErrors = await deleteMyLibraryItem(userId, item.id);
            contributions.value = contributions.value.filter((contribution) => contribution.id !== item.id);

            try {
                catalog.value = await listLibraryCatalog();
            } catch (error) {
                await showToast(
                    `Documento excluído, mas o catálogo não pôde ser atualizado: ${getErrorMessage(error, 'erro desconhecido')}`,
                    'warning'
                );
            }

            await showToast(
                cleanupErrors.length
                    ? `Documento excluído, mas não foi possível remover arquivos: ${cleanupErrors.join('; ')}`
                    : 'Documento excluído com sucesso.',
                cleanupErrors.length ? 'warning' : 'success'
            );
        }, 'Erro ao excluir o documento.');
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

    useLibraryItemsSync(refreshLibraryData);

    onUnmounted(() => {
        if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    });

    return {
        pageLoading,
        savingProfile,
        savingPassword,
        savingProgress,
        savingReview,
        savingContribution,
        checkingUploads,
        profileForm,
        newPassword,
        avatarPreviewUrl,
        contributions,
        uploadRequests,
        editingContribution,
        contributionDraft,
        replacementFile,
        removeExistingCover,
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
        openContributionEditor,
        closeContributionEditor,
        handleUpdateContribution,
        refreshUploadStatuses,
        handleDeleteContribution,
        handleSignOut,
        handleDeleteAccount
    };
};
