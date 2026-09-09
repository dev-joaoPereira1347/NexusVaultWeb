<template>
  <div class="footer-links">
    <h3>{{ title }}</h3>

    <nav class="footer-links-list" :aria-label="title">
      <RouterLink v-for="link in links" :key="link.label" :to="link.to" class="footer-link">
        <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { chevronForwardOutline } from 'ionicons/icons';

defineProps<{
  title: string;
  links: Array<{
    label: string;
    to: string;
  }>;
}>();
</script>

<style scoped>
.footer-links {
  flex: 1 1 200px;
}

.footer-links h3 {
  margin: 0 0 var(--space-lg);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.footer-links-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.footer-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-text-primary);
}

.footer-link ion-icon {
  font-size: 0.9rem;
}
</style>
