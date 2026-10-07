<template>
  <section class="hero-section">
    <ion-grid>
      <ion-row class="ion-align-items-center">
        <ion-col size="12" size-md="6">
          <div class="text-container">
            <div class="tagline-badge">
              {{ badge }}
            </div>

            <h1 class="hero-title" v-html="title" />

            <p class="hero-description">
              {{ description }}
            </p>
          </div>
        </ion-col>

        <ion-col size="12" size-md="6">
          <div class="image-wrapper">
            <img :src="imageSrc" :alt="imageAlt" class="hero-image" />
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </section>
</template>

<script setup lang="ts">
import { IonGrid, IonRow, IonCol } from '@ionic/vue';

defineProps<{
  badge: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}>();
</script>

<style scoped>
.hero-section {
  padding: 40px 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.text-container {
  padding-right: 20px;
}

.tagline-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(154, 140, 152, 0.28);
  color: var(--color-text-secondary, #4A4E69);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 24px;
}

.hero-title {
  font-family: var(--font-family);
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-text-primary);
  margin: 0 0 20px;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 520px;
  margin: 0;
}

.image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-image {
  width: min(100%, 500px);
  max-height: 360px;
  object-fit: contain;
  border-radius: 24px;
  filter: drop-shadow(0 10px 30px rgba(18, 20, 33, 0.08));
}

@media (max-width: 768px) {
  .text-container {
    padding-right: 0;
    text-align: center;
    margin-bottom: 24px;
  }

  .hero-description {
    max-width: 100%;
  }

  .hero-image {
    max-width: 300px;
  }
}
</style>
