<!-- App.vue atualizado -->
<template>

  <ion-app>
    <BaseLayout>


      <ion-router-outlet />

    </BaseLayout>
  </ion-app>

</template>
<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import BaseLayout from './components/BaseLayout.vue'
</script>