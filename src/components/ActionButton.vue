<template>
  <ion-button
    :class="buttonClass"
    :fill="variant === 'secondary' ? 'outline' : undefined"
    expand="block"
  >
    <slot />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary';
  }>(),
  {
    variant: 'primary'
  }
);

const buttonClass = computed(() =>
  props.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
);
</script>

<style scoped>
.btn-primary {
  --background: var(--color-primary-dark);
  --background-hover: #1a1a1a;
  --color: var(--color-white);
  --border-radius: var(--radius-sm);
  --padding-start: 24px;
  --padding-end: 24px;
  font-weight: 700;
  font-size: 0.85rem;
  height: 44px;
  margin: 0;
}

.btn-secondary {
  --color: var(--color-text-primary);
  --border-color: var(--color-brand-primary);
  --border-width: 1px;
  --border-radius: var(--radius-sm);
  --padding-start: 24px;
  --padding-end: 24px;
  font-weight: 700;
  font-size: 0.85rem;
  height: 44px;
  margin: 0;
}

@media (max-width: 768px) {
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
