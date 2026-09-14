<template>
  <ion-page>
    <ion-content class="page-container" :scroll-y="true">
      <Header />

      <HeroSection badge="MUSEU DIGITAL ABERTO" title="Preserve, organize e compartilhe<br />conhecimento."
        description="Explore milhares de documentos, contribua com novas coleções e ajude a preservar conhecimento de forma aberta e acessível para todos."
        primary-label="EXPLORAR ACERVO" secondary-label="CONTRIBUIR" image-src="./src/assets/images/library.webp"
        image-alt="Estante de madeira com luminárias" />

      <section class="stats-section">
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="4">
              <StatCard :icon="documentTextOutline" value="2.000+" label="Documentos" />
            </ion-col>

            <ion-col size="12" size-md="4">
              <StatCard :icon="peopleOutline" value="50" label="Colaboradores" />
            </ion-col>

            <ion-col size="12" size-md="4">
              <StatCard :icon="lockOpenOutline" value="Acesso Livre" label="Para todos" />
            </ion-col>
          </ion-row>
        </ion-grid>
      </section>

      <Footer />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonGrid, IonRow, IonCol } from '@ionic/vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import HeroSection from '../components/HeroSection.vue';
import StatCard from '../components/StatCard.vue';

import {
  documentTextOutline,
  peopleOutline,
  lockOpenOutline
} from 'ionicons/icons';
</script>

<style scoped>
.page-container {
  --background: var(--color-page-background);
}

.stats-section {
  max-width: 1200px;
  margin: 20px auto 40px auto;
  padding: 0 16px;
}
</style>