<template>
  <div class="footer-social">
    <h3>{{ title }}</h3>

    <div class="social-icons">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="Acesse nosso GitHub">
        <ion-icon :icon="logoGithub" aria-hidden="true" />
      </a>

      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="Acesse nosso Instagram">
        <ion-icon :icon="logoInstagram" aria-hidden="true" />
      </a>

      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="Acesse nosso LinkedIn">
        <ion-icon :icon="logoLinkedin" aria-hidden="true" />
      </a>
    </div>

    <p class="social-description">
      Acompanhe nossas redes sociais e fique por dentro das novidades.
    </p>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import {
  logoGithub,
  logoInstagram,
  logoLinkedin
} from 'ionicons/icons';

defineProps<{
  title: string;
}>();
</script>

<style scoped>
.footer-social {
  flex: 1 1 280px;
}

.footer-social h3 {
  margin: 0 0 var(--space-lg);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.social-icons {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.social-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(154, 140, 152, 0.1);
  color: var(--color-text-primary);
  font-size: 1.3rem;
  transition: all 0.2s ease;
  text-decoration: none;
}

.social-circle:hover {
  background: var(--color-text-primary);
  color: var(--color-background);
  transform: translateY(-2px);
}

.social-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
