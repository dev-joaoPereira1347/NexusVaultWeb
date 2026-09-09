<template>
    <div class="app-layout">
        <!-- Cada view controla seu próprio conteúdo e rolagem -->
        <main class="page-area">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    overflow: visible;
}

.page-area {
    position: relative;
    width: 100%;
    flex: 1 1 0;
    min-height: 0;
}

.page-area :deep(ion-router-outlet) {
    display: block;
    width: 100%;
    height: 100%;
}
</style>