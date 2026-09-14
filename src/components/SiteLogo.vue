<template>
  <router-link to="/" class="logo-link" aria-label="NexusVault - Página inicial">
    <img src="@/assets/images/NexusVault.svg" alt="NexusVault" class="logo" />
  </router-link>
</template>

<script setup lang="ts">
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
