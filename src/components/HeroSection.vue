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

            <div class="hero-actions">
              <ActionButton variant="primary" :to="primaryTo">
                {{ primaryLabel }}
              </ActionButton>
              <ActionButton variant="secondary" :to="secondaryTo">
                {{ secondaryLabel }}
              </ActionButton>
            </div>
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
import ActionButton from './ActionButton.vue';

withDefaults(
  defineProps<{
    badge: string;
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
    imageSrc: string;
    imageAlt: string;
    primaryTo?: string;
    secondaryTo?: string;
  }>(),
  {
    primaryTo: '/generos',
    secondaryTo: '/upload'
  }
);
</script>

<style scoped>
.hero-section {
  padding: 40px 16px 20px 16px;
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
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 480px;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: var(--shadow-hero);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.1rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .text-container {
    padding-right: 0;
    margin-bottom: 24px;
  }
}
</style>

<style scoped>
.hero-section {
  padding: 40px 16px 20px 16px;
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
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 480px;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: var(--shadow-hero);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.1rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .text-container {
    padding-right: 0;
    margin-bottom: 24px;
  }
}
</style>
