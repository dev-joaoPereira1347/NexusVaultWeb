<template>
  <template v-if="variant === 'header'">
    <router-link to="/" class="logo-link" aria-label="NexusVault - Página inicial">
      <img src="@/assets/images/NexusVault.svg" alt="NexusVault" class="logo" />
    </router-link>
  </template>

  <template v-else>
    <div class="brand-title">
      <ion-icon :icon="bookOutline" aria-hidden="true" />
      <h2>NexusVault</h2>
    </div>
  </template>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { bookOutline } from 'ionicons/icons';

defineProps<{
  variant?: 'header' | 'footer';
}>();
</script>

<style scoped>
.logo-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;
}

.logo {
  display: block;
  width: 108px;
  height: auto;
  object-fit: contain;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.brand-title ion-icon {
  font-size: 2.5rem;
  color: var(--color-text-primary);
}

.brand-title h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

@media (max-width: 600px) {
  .logo {
    width: 92px;
  }
}

@media (max-width: 400px) {
  .logo {
    width: 82px;
  }
}
</style>
