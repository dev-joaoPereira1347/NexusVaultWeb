<template>
  <section class="nv-hero">
    <div class="nv-hero__content">
      <div class="nv-hero__badge">
        {{ badge }}
      </div>

      <h1 class="nv-hero__title" v-html="title" />

      <p class="nv-hero__description">
        {{ description }}
      </p>

      <div class="nv-hero__actions">
        <ActionButton variant="primary" :to="primaryTo">
          {{ primaryLabel }}
        </ActionButton>
        <ActionButton variant="secondary" :to="secondaryTo">
          {{ secondaryLabel }}
        </ActionButton>
      </div>
    </div>

    <div class="nv-hero__visual">
      <img :src="imageSrc" :alt="imageAlt" class="nv-hero__image nv-hero__image--cover" />
    </div>
  </section>
</template>

<script setup lang="ts">
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
.nv-hero__actions :deep(ion-button) {
  min-width: min(100%, 180px);
}

@media (max-width: 700px) {
  .nv-hero__actions {
    flex-direction: column;
    align-items: stretch;
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
  font-family: var(--primitive-font-family-display);
  font-size: var(--hero-title-font-size);
  font-weight: var(--hero-title-font-weight);
  line-height: var(--hero-title-line-height);
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
  letter-spacing: var(--hero-title-letter-spacing);
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
  .hero-actions {
    flex-direction: column;
  }

  .text-container {
    padding-right: 0;
    margin-bottom: 24px;
  }
}
</style>
