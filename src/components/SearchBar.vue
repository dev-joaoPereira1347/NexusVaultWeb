<template>
  <form class="search-box" role="search" aria-label="Pesquisar documentos" @submit.prevent="submitSearch">
    <button
      class="search-menu"
      type="button"
      aria-label="Abrir opções de pesquisa"
      aria-controls="search-options"
      :aria-expanded="isOptionsOpen"
      @click="toggleSearchOptions"
    >
      <ion-icon :icon="menuOutline" aria-hidden="true" />
    </button>

    <input v-model="searchQuery" type="search" placeholder="Pesquisar" aria-label="Pesquisar documentos" />

    <button class="search-button" type="submit" aria-label="Pesquisar">
      <ion-icon :icon="searchOutline" aria-hidden="true" />
    </button>

    <nav v-if="isOptionsOpen" id="search-options" class="search-options" aria-label="Opções de pesquisa">
      <router-link :to="{ name: 'Search' }" @click="closeSearchOptions">Pesquisar no acervo</router-link>
      <router-link :to="{ name: 'Generos' }" @click="closeSearchOptions">Explorar gêneros</router-link>
    </nav>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { menuOutline, searchOutline } from 'ionicons/icons';

const router = useRouter();
const searchQuery = ref('');
const isOptionsOpen = ref(false);

const toggleSearchOptions = () => {
  isOptionsOpen.value = !isOptionsOpen.value;
};

const closeSearchOptions = () => {
  isOptionsOpen.value = false;
};

const submitSearch = () => {
  const query = searchQuery.value.trim();
  closeSearchOptions();
  void router.push({ name: 'Search', query: query ? { q: query } : {} });
};
</script>

<style scoped>
.search-box {
  position: relative;
  width: 260px;
  max-width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
}

.search-options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  display: flex;
  min-width: 190px;
  flex-direction: column;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  box-shadow: var(--shadow-medium);
}

.search-options a {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
}

.search-options a:hover,
.search-options a:focus-visible {
  background: var(--color-surface-alt);
}

.search-box input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 8px;
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 14px;
}

.search-box input::placeholder {
  color: var(--color-border);
  opacity: 1;
}

.search-menu,
.search-button {
  width: 44px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
}

.search-menu ion-icon,
.search-button ion-icon {
  width: 21px;
  height: 21px;
  font-size: 21px;
}

.search-button:hover,
.search-menu:hover {
  color: var(--color-text-secondary);
}

@media (max-width: 1050px) {
  .search-box {
    width: clamp(180px, 21vw, 220px);
  }
}

@media (max-width: 600px) {
  .search-box {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    max-width: 100%;
  }

  .search-menu {
    display: none;
  }

  .search-box input {
    padding-left: 12px;
  }
}

@media (max-width: 400px) {
  .search-button {
    width: 40px;
  }
}
</style>
