<template>
    <IonPage>
        <IonContent :fullscreen="true" class="profile-content">
            <SiteHeader />

            <main class="public-profile nv-page-shell">
                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando perfil do colaborador...</span>
                </div>
                <section v-else-if="errorMessage" class="feedback error-message" role="alert">
                    {{ errorMessage }}
                </section>
                <template v-else-if="profile">
                    <section class="profile-card nv-surface">
                        <img
                            v-if="profile.avatar_url"
                            class="avatar"
                            :src="profile.avatar_url"
                            alt="Foto do colaborador"
                        />
                        <div v-else class="avatar avatar-fallback" aria-hidden="true">
                            <ion-icon :icon="personCircleOutline" />
                        </div>
                        <div>
                            <p class="nv-eyebrow nv-badge">COLABORADOR DO ACERVO</p>
                            <h1 class="nv-page-title">{{ profile.username || 'Colaborador do NexusVault' }}</h1>
                        </div>
                    </section>

                    <section class="contributions" aria-labelledby="contributions-title">
                        <h2 id="contributions-title" class="section-title">Livros enviados</h2>
                        <p v-if="items.length === 0" class="feedback nv-surface">
                            Este colaborador ainda não possui livros públicos no acervo.
                        </p>
                        <div v-else class="item-grid">
                            <article v-for="item in items" :key="item.id" class="library-card nv-surface">
                                <div class="cover">
                                    <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                                    <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                                </div>
                                <div class="item-details">
                                    <h3>
                                        <RouterLink :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                            {{ item.title }}
                                        </RouterLink>
                                    </h3>
                                    <p class="author">Por {{ item.author }}</p>
                                    <p class="metadata">{{ item.category }} · {{ item.content_type }}</p>
                                    <RouterLink class="details-link" :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                        Ver detalhes
                                    </RouterLink>
                                </div>
                            </article>
                        </div>
                    </section>
                </template>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/vue';
import { documentTextOutline, personCircleOutline } from 'ionicons/icons';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { getPublicProfile } from '@/services/authService';
import { listPublicLibraryItemsByUploader } from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import type { ProfileData } from '@/types/auth';
import type { PublicLibraryItem } from '@/types/library';

const route = useRoute();
const profile = ref<Pick<ProfileData, 'username' | 'avatar_url'> | null>(null);
const items = ref<PublicLibraryItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');

watch(
    () => route.params.id,
    async (id) => {
        profile.value = null;
        items.value = [];
        errorMessage.value = '';
        loading.value = true;

        if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
            errorMessage.value = 'Identificador do colaborador inválido.';
            loading.value = false;
            return;
        }

        try {
            const [profileResult, libraryItems] = await Promise.all([
                getPublicProfile(id),
                listPublicLibraryItemsByUploader(id)
            ]);
            if (!profileResult) {
                errorMessage.value = 'O perfil deste colaborador não foi encontrado.';
                return;
            }
            profile.value = profileResult;
            items.value = libraryItems;
        } catch (error) {
            errorMessage.value = error instanceof Error
                ? `Não foi possível carregar o perfil: ${error.message}`
                : 'Não foi possível carregar o perfil.';
        } finally {
            loading.value = false;
        }
    },
    { immediate: true }
);

const refreshItems = async () => {
    const id = route.params.id;
    if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return;

    try {
        items.value = await listPublicLibraryItemsByUploader(id);
    } catch (error) {
        console.error('Não foi possível atualizar os documentos do perfil.', error);
    }
};

useLibraryItemsSync(refreshItems);
</script>

<style scoped>
.profile-content {
    --background: var(--color-page-background);
}

.public-profile {
    --content-width: 1120px;
    min-height: 60vh;
}

.profile-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
    padding: var(--surface-padding);
}

.avatar {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-fallback {
    display: grid;
    place-items: center;
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: 3rem;
}

.profile-card .nv-eyebrow {
    margin-bottom: var(--space-xs);
}

.section-title {
    margin: 0 0 var(--space-md);
    color: var(--color-text-primary);
    font-size: 1.15rem;
}

.item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
    gap: var(--space-md);
}

.library-card {
    display: flex;
    gap: var(--space-md);
    min-width: 0;
    padding: var(--space-md);
}

.cover {
    display: grid;
    flex: 0 0 88px;
    width: 88px;
    height: 120px;
    overflow: hidden;
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: 2rem;
}

.cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-details {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.item-details h3 {
    margin: 0;
    font-size: 1.05rem;
}

.item-details h3 a {
    color: var(--color-text-primary);
    text-decoration: none;
}

.item-details h3 a:hover,
.details-link:hover {
    text-decoration: underline;
}

.author,
.metadata {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.details-link {
    margin-top: auto;
    padding-top: var(--space-sm);
    color: var(--color-brand-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-decoration: none;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 120px;
    padding: var(--space-md);
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}
</style>
