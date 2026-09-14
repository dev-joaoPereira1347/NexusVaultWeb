<template>
  <div class="search-box">
    <button class="search-menu" type="button" aria-label="Abrir opções de pesquisa">
      <span class="material-symbols-rounded">menu</span>
    </button>

    <input type="search" placeholder="Pesquisar" aria-label="Pesquisar documentos" />

    <button class="search-button" type="button" aria-label="Pesquisar">
      <span class="material-symbols-rounded">search</span>
    </button>
  </div>
</template>

<style scoped>
.search-box {
  width: 260px;
  max-width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: transparent;
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

.search-menu span,
.search-button span {
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
    flex: 1;
    width: auto;
    max-width: 220px;
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
