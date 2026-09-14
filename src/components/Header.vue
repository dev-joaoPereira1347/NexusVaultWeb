<template>
    <header class="site-header">
        <div class="header-container">
            <SiteLogo variant="header" />

            <MainNav />

            <div class="header-actions">
                <router-link to="/auth" class="register-button">
                    REGISTRAR
                </router-link>

                <SearchBar />

                <button class="mobile-menu-button" type="button" :aria-expanded="isMobileMenuOpen"
                    :aria-label="isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'" @click="toggleMobileMenu">
                    <span class="material-symbols-rounded">
                        {{ isMobileMenuOpen ? 'close' : 'menu' }}
                    </span>
                </button>
            </div>

        </div>

        <nav v-if="isMobileMenuOpen" class="mobile-nav" aria-label="Navegação móvel">
            <router-link to="/generos" @click="closeMobileMenu">Gêneros</router-link>
            <router-link to="/contribuir" @click="closeMobileMenu">Contribuir</router-link>
            <router-link to="/sobre" @click="closeMobileMenu">Sobre Nós</router-link>
            <router-link to="/auth" @click="closeMobileMenu">Registrar</router-link>
        </nav>
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainNav from './MainNav.vue';
import SearchBar from './SearchBar.vue';
import SiteLogo from './SiteLogo.vue';

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};
</script>

<style scoped>
.site-header {
    width: 100%;
    height: 78px;

    background: var(--color-background);
}

.header-container {
    width: min(100% - 32px, 1280px);
    max-width: 1280px;
    height: 100%;
    margin: 0 auto;

    display: flex;
    align-items: center;

    gap: 24px;
}

/* =========================
   AÇÕES
========================= */

.header-actions {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-left: 24px;

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
    white-space: nowrap;

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

.mobile-nav {
    display: none;
}

/* =========================
   RESPONSIVIDADE
========================= */

@media (max-width: 1050px) {
    .header-actions {
        gap: 16px;
    }
}

@media (max-width: 900px) {
    .header-container {
        gap: 16px;
    }

    .desktop-nav {
        display: none;
    }

    .header-actions {
        margin-left: auto;
    }

    .mobile-menu-button {
        display: flex;
    }

    .mobile-nav {
        position: absolute;
        z-index: 10;
        top: 78px;
        right: 16px;
        left: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-md);
        background: var(--color-white);
        box-shadow: var(--shadow-medium);
    }

    .mobile-nav a {
        padding: 13px 14px;
        border-radius: var(--radius-sm);
        color: var(--color-text-primary);
        font-family: var(--font-family);
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
    }

    .mobile-nav a:hover,
    .mobile-nav a.router-link-active {
        background: var(--color-surface-alt);
    }
}

@media (max-width: 600px) {
    .site-header {
        height: 70px;
    }

    .mobile-nav {
        top: 70px;
    }

    .header-container {
        width: calc(100% - 32px);
        gap: 12px;
    }

    .header-actions {
        gap: 12px;
        min-width: 0;
    }

    .register-button {
        display: none;
    }
}
</style>