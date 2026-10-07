<template>
    <header class="site-header">
        <div class="header-container">
            <SiteLogo variant="header" />

            <MainNav />

            <div class="header-actions">
                <router-link v-if="!currentUser" to="/auth" class="register-button">
                    REGISTRAR
                </router-link>

                <div v-else class="user-menu">
                    <button
                        type="button"
                        class="user-menu-button"
                        :aria-expanded="isUserMenuOpen"
                        aria-label="Abrir menu do usuário"
                        @click="toggleUserMenu"
                    >
                        <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar do usuário" class="user-avatar" />
                        <ion-icon v-else :icon="personOutline" class="user-avatar-icon" aria-hidden="true" />
                        <ion-icon :icon="chevronDownOutline" class="user-menu-chevron" aria-hidden="true" />
                    </button>

                    <div v-if="isUserMenuOpen" class="user-dropdown">
                        <span class="user-name">{{ username || 'Minha conta' }}</span>
                        <router-link to="/profile" @click="closeUserMenu">Página do usuário</router-link>
                        <button type="button" @click="handleSignOut">Sair</button>
                        <button type="button" class="delete-account-button" @click="handleDeleteAccount">Excluir conta</button>
                    </div>
                </div>

                <SearchBar />

                <button class="mobile-menu-button" type="button" :aria-expanded="isMobileMenuOpen"
                    :aria-label="isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'" @click="toggleMobileMenu">
                    <ion-icon :icon="isMobileMenuOpen ? closeOutline : menuOutline" aria-hidden="true" class="mobile-menu-icon" />
                </button>
            </div>

        </div>

        <nav v-if="isMobileMenuOpen" class="mobile-nav" aria-label="Navegação móvel">
            <router-link to="/home" @click="closeMobileMenu">Início</router-link>
            <router-link to="/generos" @click="closeMobileMenu">Acervo</router-link>
            <router-link to="/community-guidelines" @click="closeMobileMenu">Diretrizes</router-link>
            <router-link to="/upload" @click="closeMobileMenu">Contribuir</router-link>
            <router-link to="/about-us" @click="closeMobileMenu">Sobre Nós</router-link>

            <router-link v-if="currentUser" to="/profile" class="mobile-user-link" @click="closeMobileMenu">
                <span class="mobile-user-identity">
                    <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar do usuário" class="mobile-user-avatar" />
                    <ion-icon v-else :icon="personOutline" class="mobile-user-icon" aria-hidden="true" />
                    <span>Área do usuário</span>
                </span>
            </router-link>

            <router-link v-else to="/auth" @click="closeMobileMenu">Registrar</router-link>
        </nav>
    </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { alertController, IonIcon, toastController } from '@ionic/vue';
import { chevronDownOutline, closeOutline, menuOutline, personOutline } from 'ionicons/icons';
import MainNav from './MainNav.vue';
import SearchBar from './SearchBar.vue';
import SiteLogo from './SiteLogo.vue';
import { deleteAccount, getCurrentSession, getProfile, signOut } from '@/services/authService';
import { supabase } from '@/services/supabase';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const currentUser = ref(false);
const avatarUrl = ref('');
const username = ref('');
let removeAuthListener: (() => void) | undefined;

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};

const toggleUserMenu = () => {
    isUserMenuOpen.value = !isUserMenuOpen.value;
};

const closeUserMenu = () => {
    isUserMenuOpen.value = false;
};

const showToast = async (message: string) => {
    const toast = await toastController.create({
        message,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
    });

    await toast.present();
};

const confirmDeleteAccount = async () => {
    const alert = await alertController.create({
        header: 'Excluir conta',
        message: 'Esta ação não pode ser desfeita.',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel'
            },
            {
                text: 'Excluir',
                role: 'destructive'
            }
        ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    return result.role === 'destructive';
};

const updateUserMenu = async (userId?: string) => {
    const activeUserId = userId ?? (await getCurrentSession()).data.session?.user?.id;

    if (!activeUserId) {
        currentUser.value = false;
        avatarUrl.value = '';
        username.value = '';
        closeUserMenu();
        return;
    }

    try {
        currentUser.value = true;
        const profile = await getProfile(activeUserId);
        avatarUrl.value = profile?.avatar_url || '';
        username.value = profile?.username || '';
    } catch {
        currentUser.value = false;
        avatarUrl.value = '';
        username.value = '';
        closeUserMenu();
    }
};

const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
        await showToast('Não foi possível sair da conta. Tente novamente.');
        return;
    }

    currentUser.value = false;
    avatarUrl.value = '';
    username.value = '';
    closeUserMenu();
    await router.replace('/auth');
};

const handleDeleteAccount = async () => {
    const confirmed = await confirmDeleteAccount();
    if (!confirmed) return;

    try {
        await deleteAccount();
        await updateUserMenu();
        await router.replace('/auth');
    } catch (error) {
        await showToast('Não foi possível excluir sua conta. Tente novamente.');
    }
};

onMounted(async () => {
    const { data: { session } } = await getCurrentSession();
    await updateUserMenu(session?.user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        void updateUserMenu(session?.user.id);
    });
    removeAuthListener = () => subscription.unsubscribe();
});

onUnmounted(() => {
    removeAuthListener?.();
});
</script>

<style scoped>
.site-header {
    width: 100%;
    height: 78px;

    background: var(--color-background);
}

.header-container {
    width: min(100% - 24px, 1280px);
    max-width: 1280px;
    height: 100%;
    margin: 0 auto;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-inline: 4px;
}

/* =========================
   AÇÕES
========================= */

.header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-left: auto;
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

.user-menu {
    position: relative;
}

.user-menu-button {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 42px;
    padding: 3px 7px 3px 3px;
    border: 1px solid var(--color-border);
    border-radius: 24px;
    background: var(--color-white);
    color: var(--color-text-primary);
    cursor: pointer;
}

.user-avatar,
.user-avatar-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
}

.user-avatar-icon,
.user-menu-chevron,
.mobile-menu-icon {
    width: 20px;
    height: 20px;
    display: block;
}

.user-avatar {

    object-fit: cover;
}

.user-avatar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-alt);
    font-size: 22px;
}

.user-menu-chevron {
    font-size: 18px;
}

.user-dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 10px);
    right: 0;
    display: flex;
    flex-direction: column;
    min-width: 170px;
    padding: 8px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-white);
    box-shadow: var(--shadow-medium);
}

.user-name,
.user-dropdown a,
.user-dropdown button {
    padding: 10px 12px;
    color: var(--color-text-primary);
    font-family: var(--font-family);
    font-size: 14px;
    text-align: left;
    text-decoration: none;
}

.user-name {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 700;
}

.user-dropdown a:hover,
.user-dropdown button:hover {
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
}

.user-dropdown button {
    border: 0;
    background: transparent;
    cursor: pointer;
}

.user-dropdown .delete-account-button {
    color: #b42318;
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
        gap: 8px;
        width: calc(100% - 20px);
        padding-inline: 0;
    }

    .desktop-nav {
        display: none;
    }

    .user-menu,
    .register-button {
        display: none;
    }

    .header-actions {
        margin-left: 0;
        gap: 8px;
        flex: 1;
        justify-content: flex-end;
    }

    .mobile-menu-button {
        display: flex;
        flex-shrink: 0;
    }

    .mobile-nav {
        position: absolute;
        z-index: 10;
        top: 78px;
        right: 10px;
        left: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px;
        border: 1px solid var(--color-border-soft);
        border-radius: 14px;
        background: var(--color-white);
        box-shadow: var(--shadow-medium);
    }

    .mobile-nav a {
        padding: 12px 14px;
        border-radius: 10px;
        color: var(--color-text-primary);
        font-family: var(--font-family);
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
    }

    .mobile-user-link {
        display: block;
    }

    .mobile-user-identity {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .mobile-user-avatar,
    .mobile-user-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .mobile-user-avatar {
        object-fit: cover;
        border: 1px solid var(--color-border-soft);
    }

    .mobile-user-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface-alt);
        color: var(--color-text-primary);
        font-size: 16px;
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