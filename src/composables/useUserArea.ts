import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { alertController, toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import {
    deleteAccount,
    deleteStoredAvatar,
    getCurrentUser,
    getProfile,
    reauthenticate,
    saveProfile,
    signOut,
    updateEmail,
    updatePassword,
    uploadAvatar
} from '@/services/authService';
import { listLibraryCatalog, listMyContributions, listMyUploadRequests } from '@/services/libraryService';
import { checkLibraryUploadRequest, deleteMyLibraryItem, updateMyLibraryItem } from '@/services/uploadService';
import {
    deleteReadingProgress,
    listMyReadingProgress
} from '@/services/readingProgressService';
import { createReview, deleteReview, listMyReviews, updateReview } from '@/services/reviewService';
import type {
    DocumentReview,
    LibraryCatalogItem,
    LibraryContribution,
    LibraryUploadRequest,
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

const emptyReviewDraft = (): ReviewDraft => ({
    documentId: '',
    rating: 5,
    comment: ''
});

const emptyUploadForm = (): UploadForm => ({
    title: '',
    author: '',
    category: '',
    year: '',
    type: '',
    genre: '',
    language: '',
    description: '',
    cover: null,
    rightsDeclarationAccepted: false
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
    const originalProfile = ref<UserProfileForm>(emptyProfile());
    const isEditingProfile = ref(false);
    const isChangingPassword = ref(false);
    const pendingEmail = ref('');
    const currentPassword = ref('');
    const newPassword = ref('');
    const passwordConfirmation = ref('');
    const avatarFile = ref<File | null>(null);
    const avatarPreviewUrl = ref('');
    const originalEmail = ref('');
    const emailNeedsReauthentication = computed(() => profileForm.email.trim() !== originalEmail.value);

    const contributions = ref<LibraryContribution[]>([]);
    const uploadRequests = ref<LibraryUploadRequest[]>([]);
    const editingContribution = ref<LibraryContribution | null>(null);
    const contributionDraft = reactive<UploadForm>(emptyUploadForm());
    const replacementFile = ref<File | null>(null);
    const removeExistingCover = ref(false);
    const catalog = ref<LibraryCatalogItem[]>([]);
    const progressList = ref<ReadingProgress[]>([]);
    const reviews = ref<DocumentReview[]>([]);
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
        if (normalized.includes('library_upload_requests')) {
            return 'A tabela de status dos envios não existe no Supabase. Execute supabase/migrations/20261014174000_async_virus_total_uploads.sql no SQL Editor.';
        }
        if (normalized.includes('profiles_username_key')) {
            return 'Este nome de usuário já está em uso. Escolha outro.';
        }
        if (normalized.includes('library_items')) {
            return 'A biblioteca ainda não está disponível. Envie um documento ou execute o script de upload.';
        }
        if (normalized.includes('violates row-level security policy') || normalized.includes('row-level security')) {
            return 'Permissão negada no Supabase (RLS). Execute supabase/avatars-storage-setup.sql e supabase/profiles-policies.sql no SQL Editor.';
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
        originalProfile.value = { ...profileForm };
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

        const nextEmail = profileForm.email.trim();
        const emailChanged = nextEmail !== originalEmail.value;
        if (emailChanged) {
            if (!currentPassword.value) throw new Error('Informe sua senha atual para alterar o e-mail.');
            const { error: reauthenticationError } = await reauthenticate(originalEmail.value, currentPassword.value);
            if (reauthenticationError) throw new Error('Senha atual incorreta. Confirme sua identidade para alterar o e-mail.');
        }

        const previousAvatarUrl = profileForm.avatarUrl;
        let uploadedAvatarUrl: string | null = null;
        if (avatarFile.value) {
            uploadedAvatarUrl = await uploadAvatar(user.id, avatarFile.value);
        }

        const { error: profileError, skipped } = await saveProfile(user.id, {
            fullName: profileForm.fullName,
            username: profileForm.username,
            avatarUrl: uploadedAvatarUrl ?? profileForm.avatarUrl
        });
        if (profileError) throw profileError;

        if (uploadedAvatarUrl && !skipped) {
            profileForm.avatarUrl = uploadedAvatarUrl;
            avatarPreviewUrl.value = uploadedAvatarUrl;
            try {
                if (previousAvatarUrl && previousAvatarUrl !== uploadedAvatarUrl) {
                    await deleteStoredAvatar(user.id, previousAvatarUrl);
                }
            } catch (cleanupError) {
                console.error('O perfil foi salvo, mas não foi possível remover o avatar antigo:', cleanupError);
                await showToast('Perfil salvo, mas não foi possível remover a foto antiga do armazenamento.', 'warning');
            }
        }

        if (emailChanged) {
            const { error: emailError } = await updateEmail(nextEmail);
            if (emailError) throw emailError;
            pendingEmail.value = nextEmail;
        }

        originalProfile.value = { ...profileForm, avatarUrl: uploadedAvatarUrl ?? profileForm.avatarUrl };
        isEditingProfile.value = false;
        currentPassword.value = '';
        await showToast(
            emailChanged
                ? `Perfil salvo. Confirme a alteração pelo e-mail enviado para ${nextEmail}.`
                : 'Perfil atualizado com sucesso!'
        );
        avatarFile.value = null;
    }, 'Erro ao atualizar o perfil.');

    const cancelProfileEdit = () => {
        Object.assign(profileForm, originalProfile.value);
        avatarPreviewUrl.value = originalProfile.value.avatarUrl;
        avatarFile.value = null;
        currentPassword.value = '';
        isEditingProfile.value = false;
    };

    const handleChangePassword = () => run(savingPassword, async () => {
        if (newPassword.value.trim().length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        if (newPassword.value !== passwordConfirmation.value) {
            throw new Error('A confirmação da nova senha não corresponde.');
        }
        if (!currentPassword.value) throw new Error('Informe sua senha atual para confirmar sua identidade.');

        const { error: reauthenticationError } = await reauthenticate(originalEmail.value, currentPassword.value);
        if (reauthenticationError) throw new Error('Senha atual incorreta. Confirme sua identidade para alterar a senha.');

        const { error } = await updatePassword(newPassword.value);
        if (error) throw error;
        newPassword.value = '';
        passwordConfirmation.value = '';
        currentPassword.value = '';
        isChangingPassword.value = false;
        await showToast('Senha alterada com sucesso!');
    }, 'Erro ao alterar a senha.');

    const cancelPasswordChange = () => {
        newPassword.value = '';
        passwordConfirmation.value = '';
        currentPassword.value = '';
        isChangingPassword.value = false;
    };

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
            cover: null,
            rightsDeclarationAccepted: false
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

        const requestToCheck = pendingRequests[0];
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
        isEditingProfile,
        isChangingPassword,
        pendingEmail,
        emailNeedsReauthentication,
        currentPassword,
        newPassword,
        passwordConfirmation,
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
        reviewDraft,
        setAvatar,
        cancelProfileEdit,
        cancelPasswordChange,
        handleSaveProfile,
        handleChangePassword,
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
