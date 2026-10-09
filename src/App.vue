<template>
  <IonApp>
    <div v-if="isPageLoading" class="loading-overlay">
      <PageLoading />
    </div>
    <IonRouterOutlet v-else />
  </IonApp>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import PageLoading from './components/PageLoading.vue';

const isPageLoading = ref(true);

onMounted(() => {
  // Simula um tempo de carregamento inicial
  setTimeout(() => {
    isPageLoading.value = false;
  }, 2000);
});
</script>

<style>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-background);
  z-index: 9999;
}
</style>