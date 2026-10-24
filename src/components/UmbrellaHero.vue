<template>
  <section class="nv-hero">
    <div class="nv-hero__content">
      <div class="nv-hero__badge nv-badge">
        {{ badge }}
      </div>

      <h1 class="nv-hero__title" v-html="title" />

      <p class="nv-hero__description">
        {{ description }}
      </p>
    </div>

    <div class="nv-hero__visual">
      <img :src="imageSrc" :alt="imageAlt" class="nv-hero__image" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  badge: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}>();
</script>
