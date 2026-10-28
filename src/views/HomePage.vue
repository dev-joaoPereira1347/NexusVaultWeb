<template>
  <IonPage>
    <IonContent class="page-container" :scroll-y="true">
      <SiteHeader />

      <HeroSection badge="MUSEU DIGITAL ABERTO" title="Preserve, organize e compartilhe<br />conhecimento."
        description="Explore milhares de documentos, contribua com novas coleções e ajude a preservar conhecimento de forma aberta e acessível para todos."
        primary-label="EXPLORAR ACERVO" secondary-label="CONTRIBUIR" :image-src="libraryImage"
        image-alt="Estante de madeira com luminárias" primary-to="/search" />

      <section class="stats-section">
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="4">
              <StatCard :icon="documentTextOutline" :value="documentCount" label="Documentos" />
            </ion-col>

            <ion-col size="12" size-md="4">
              <StatCard :icon="peopleOutline" :value="contributorCount" label="Colaboradores" />
            </ion-col>

            <ion-col size="12" size-md="4">
              <StatCard :icon="lockOpenOutline" value="Acesso Livre" label="Para todos" />
            </ion-col>
          </ion-row>
        </ion-grid>
        <p v-if="statisticsError" class="statistics-error" role="alert">{{ statisticsError }}</p>
      </section>

      <FeaturedLibraryCarousel
        :items="featuredItems"
        :loading="featuredLoading"
        :error="featuredError"
      />

      <LibraryRankingsSection />

      <SiteFooter />
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonContent, IonGrid, IonRow, IonCol } from '@ionic/vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import HeroSection from '../components/HeroSection.vue';
import StatCard from '../components/StatCard.vue';
import FeaturedLibraryCarousel from '@/components/FeaturedLibraryCarousel.vue';
import LibraryRankingsSection from '@/components/LibraryRankingsSection.vue';
import { getPublicLibraryStatistics } from '../services/statisticsService';
import { listFeaturedPublicLibraryItems } from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import type { PublicLibraryItem } from '@/types/library';
import libraryImage from '../assets/images/library.webp';

import {
  documentTextOutline,
  peopleOutline,
  lockOpenOutline
} from 'ionicons/icons';

const documentCount = ref('—');
const contributorCount = ref('—');
const statisticsError = ref('');
const featuredItems = ref<PublicLibraryItem[]>([]);
const featuredLoading = ref(true);
const featuredError = ref('');

const refreshHomeContent = async () => {
  const [statisticsResult, featuredResult] = await Promise.allSettled([
    getPublicLibraryStatistics(),
    listFeaturedPublicLibraryItems()
  ]);

  if (statisticsResult.status === 'fulfilled') {
    documentCount.value = statisticsResult.value.documentCount.toLocaleString('pt-BR');
    contributorCount.value = statisticsResult.value.contributorCount.toLocaleString('pt-BR');
    statisticsError.value = '';
  } else {
    const message = statisticsResult.reason instanceof Error
      ? statisticsResult.reason.message
      : '';
    statisticsError.value = message
      ? `Não foi possível carregar as estatísticas: ${message}`
      : 'Não foi possível carregar as estatísticas.';
  }

  if (featuredResult.status === 'fulfilled') {
    featuredItems.value = featuredResult.value;
    featuredError.value = '';
  } else {
    featuredError.value = featuredResult.reason instanceof Error
      ? `Não foi possível carregar os destaques: ${featuredResult.reason.message}`
      : 'Não foi possível carregar os destaques.';
  }
  featuredLoading.value = false;
};

useLibraryItemsSync(refreshHomeContent);
</script>

<style scoped>
.page-container {
  --background: var(--color-page-background);
}

.stats-section {
  width: min(calc(100% - var(--page-gutter) - var(--page-gutter)), var(--content-width));
  margin: 0 auto var(--section-gap);
}

.statistics-error {
  margin: 8px 0 0;
  color: var(--color-danger, #b42318);
  text-align: center;
}
</style>