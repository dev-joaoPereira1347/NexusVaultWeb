<template>
    <header class="site-header">
        <div class="header-container">
            <SiteLogo variant="header" />

            <MainNav />

            <div class="header-actions">
                <router-link to="/registrar" class="register-button">
                    REGISTRAR
                </router-link>

                <SearchBar />

                <button class="mobile-menu-button" type="button" aria-label="Abrir menu">
                    <span class="material-symbols-rounded">
                        menu
                    </span>
                </button>
            </div>

        </div>
    </header>
</template>

<script setup lang="ts">
import MainNav from './MainNav.vue';
import SearchBar from './SearchBar.vue';
import SiteLogo from './SiteLogo.vue';
</script>

<style scoped>
.site-header {
    width: 100%;
    height: 78px;

    background: var(--color-background);
}

.header-container {
    width: 100%;
    max-width: 1280px;
    height: 100%;
    margin: 0 auto;

    display: flex;
    align-items: center;

    padding: 0 32px;
}

/* =========================
   AÇÕES
========================= */

.header-actions {
    display: flex;
    align-items: center;
    gap: 32px;

    flex-shrink: 0;
}

.register-button {
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0 20px;

    background: var(--color-primary-dark);
    color: var(--color-white);

    border-radius: var(--radius-sm);

    font-family: var(--font-family);
    font-size: 14px;
    font-weight: 600;

    letter-spacing: 0.4px;
    text-decoration: none;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.register-button:hover {
    background: var(--color-text-primary);
    transform: translateY(-1px);
}

/* =========================
   MOBILE
========================= */

.mobile-menu-button {
    display: none;

    width: 42px;
    height: 42px;

    align-items: center;
    justify-content: center;

    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    background: transparent;
    color: #22223b;

    cursor: pointer;
}

.mobile-menu-button span {
    font-size: 22px;
}

/* =========================
   RESPONSIVIDADE
========================= */

@media (max-width: 1050px) {
    .header-actions {
        gap: 16px;
    }
}

@media (max-width: 850px) {
    .header-container {
        padding: 0 24px;
    }

    .header-actions {
        margin-left: auto;
    }

    .mobile-menu-button {
        display: flex;
    }
}

@media (max-width: 600px) {
    .site-header {
        height: 70px;
    }

    .header-container {
        padding: 0 16px;
    }

    .register-button {
        display: none;
    }
}
</style>