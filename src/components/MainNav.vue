<template>
  <nav class="desktop-nav" aria-label="Navegação principal">
    <router-link to="/generos">
      Gêneros
    </router-link>

    <router-link to="/upload">
      Contribuir
    </router-link>

    <router-link to="/about-us">
      Sobre Nós
    </router-link>
  </nav>
</template>

<style scoped>
.desktop-nav {
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.2vw, 28px);
  margin-left: auto;
}

.desktop-nav a {
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.desktop-nav a:hover,
.desktop-nav a.router-link-active {
  color: var(--color-text-secondary);
}

@media (max-width: 1050px) {
  .desktop-nav {
    gap: 20px;
  }
}

@media (max-width: 900px) {
  .desktop-nav {
    display: none;
  }
}
</style>
