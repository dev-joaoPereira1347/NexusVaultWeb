<template>
  <ion-card class="stat-card">
    <div class="stat-icon-wrapper">
      <ion-icon :icon="icon" class="stat-icon" />
    </div>

    <div class="stat-info">
      <h2 class="stat-number">{{ value }}</h2>
      <p class="stat-label">{{ label }}</p>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  value: string;
  label: string;
}>();
</script>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--space-md) var(--surface-padding);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrapper {
  background: var(--color-surface-alt);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 24px;
  color: var(--color-text-primary);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 2px 0 0 0;
  font-weight: 500;
}
</style>
