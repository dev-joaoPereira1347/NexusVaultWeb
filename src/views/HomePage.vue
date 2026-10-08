<template>
  <ion-page>
    <ion-content class="page-container" :scroll-y="true">
      <SiteHeader />

      <HeroSection badge="MUSEU DIGITAL ABERTO" title="Preserve, organize e compartilhe<br />conhecimento."
        description="Explore milhares de documentos, contribua com novas coleções e ajude a preservar conhecimento de forma aberta e acessível para todos."
        primary-label="EXPLORAR ACERVO" secondary-label="CONTRIBUIR" :image-src="libraryImage"
        image-alt="Estante de madeira com luminárias" />

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

      <SiteFooter />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonPage, IonContent, IonGrid, IonRow, IonCol } from '@ionic/vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import HeroSection from '../components/HeroSection.vue';
import StatCard from '../components/StatCard.vue';
import { getPublicLibraryStatistics } from '../services/statisticsService';
import libraryImage from '../assets/images/library.webp';

import {
  documentTextOutline,
  peopleOutline,
  lockOpenOutline
} from 'ionicons/icons';

const documentCount = ref('—');
const contributorCount = ref('—');
const statisticsError = ref('');

onMounted(async () => {
  try {
    const statistics = await getPublicLibraryStatistics();
    documentCount.value = statistics.documentCount.toLocaleString('pt-BR');
    contributorCount.value = statistics.contributorCount.toLocaleString('pt-BR');
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        && typeof error.message === 'string'
        ? error.message
        : '';
    statisticsError.value = message
      ? `Não foi possível carregar as estatísticas: ${message}`
      : 'Não foi possível carregar as estatísticas.';
  }
});
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