<template>
  <ion-app>
    <BaseLayout>
      <router-view />
    </BaseLayout>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp } from '@ionic/vue';
import BaseLayout from './components/BaseLayout.vue';
</script>