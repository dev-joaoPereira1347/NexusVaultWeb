<template>
    <ion-page>
        <ion-content :fullscreen="true" class="library-content">
            <SiteHeader />

            <main class="library-page nv-page-shell">
                <header class="page-header nv-page-heading">
                    <p class="nv-eyebrow">ACERVO DIGITAL</p>
                    <h1 class="nv-page-title">Explore o acervo</h1>
                    <p class="nv-page-description">Encontre documentos e obras compartilhados pela comunidade.</p>
                </header>

                <label class="search-field">
                    <span class="visually-hidden">Pesquisar no acervo</span>
                    <ion-icon :icon="searchOutline" aria-hidden="true" />
                    <input v-model="searchQuery" type="search" placeholder="Pesquisar por título, autor ou categoria" />
                </label>

                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando o acervo...</span>
                </div>
                <p v-else-if="errorMessage" class="feedback error-message" role="alert">{{ errorMessage }}</p>
                <p v-else-if="filteredItems.length === 0" class="feedback">
                    {{ items.length ? 'Nenhum documento corresponde à pesquisa.' : 'O acervo ainda não possui documentos.' }}
                </p>

                <section v-else class="item-grid" aria-label="Documentos do acervo">
                    <article v-for="item in filteredItems" :key="item.id" class="library-card nv-surface">
                        <div class="cover">
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </div>
                        <div class="item-details">
                            <h2>
                                <router-link :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                    {{ item.title }}
                                </router-link>
                            </h2>
                            <p class="author">{{ item.author }}</p>
                            <p v-if="item.description" class="description">{{ item.description }}</p>
                            <p class="metadata">
                                {{ item.category }} · {{ item.content_type }}<span v-if="item.year"> · {{ item.year }}</span>
                            </p>
                            <ion-button :href="item.download_url" target="_blank" rel="noopener noreferrer">
                                <ion-icon slot="start" :icon="downloadOutline" />
                                Abrir documento
                            </ion-button>
                            <router-link class="details-link" :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                Ver detalhes
                            </router-link>
                        </div>
                    </article>
                </section>
            </main>

            <SiteFooter />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/vue';
import { documentTextOutline, downloadOutline, searchOutline } from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { listPublicLibraryItems } from '@/services/libraryService';
import type { PublicLibraryItem } from '@/types/library';

const items = ref<PublicLibraryItem[]>([]);
const searchQuery = ref('');
const loading = ref(true);
const errorMessage = ref('');

const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase();
    if (!query) return items.value;

    return items.value.filter((item) =>
        [item.title, item.author, item.category, item.content_type]
            .some((value) => value.toLocaleLowerCase().includes(query))
    );
});

onMounted(async () => {
    try {
        items.value = await listPublicLibraryItems();
    } catch (error) {
        errorMessage.value = error instanceof Error
            ? `Não foi possível carregar o acervo: ${error.message}`
            : 'Não foi possível carregar o acervo.';
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.library-content {
    --background: var(--color-page-background);
}

.library-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.search-field {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(100%, 520px);
    min-height: var(--control-height);
    margin-bottom: 24px;
    padding: 0 14px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control, var(--radius-sm));
    background: var(--color-surface);
    color: var(--color-text-secondary);
}

.search-field input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-text-primary);
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 120px;
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}

.item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
    gap: var(--space-md);
}

.library-card {
    display: flex;
    gap: 16px;
    min-width: 0;
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
}

.cover {
    display: grid;
    flex: 0 0 88px;
    place-items: center;
    width: 88px;
    height: 120px;
    overflow: hidden;
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

.item-details h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.05rem;
}

.item-details h2 a {
    color: inherit;
    text-decoration: none;
}

.item-details h2 a:hover,
.details-link:hover {
    text-decoration: underline;
}

.details-link {
    margin-top: 8px;
    color: var(--color-brand-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-decoration: none;
}

.author,
.description,
.metadata {
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: 0.88rem;
}

.description {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

.metadata {
    margin-top: auto;
    padding-top: 10px;
    font-size: 0.78rem;
}

.item-details ion-button {
    margin: 12px 0 0;
    text-transform: none;
}
</style>
