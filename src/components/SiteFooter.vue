<template>
    <footer class="footer">
        <div class="footer-wrapper">
            <div class="container footer-container">
                <div class="footer-brand">
                    <SiteLogo variant="footer" />

                    <p class="subtitle">Sua biblioteca digital colaborativa.</p>
                    <p class="description">
                        Conectando leitores, compartilhando conhecimento e construindo histórias juntos.
                    </p>
                </div>

                <FooterLinkList title="LINKS ÚTEIS" :links="usefulLinks" />
                <SocialLinks title="SIGA-NOS" />
            </div>

            <div class="container">
                <div class="footer-divider"></div>

                <div class="footer-bottom">
                    <ion-note class="footer-copyright">
                        &copy; 2026 Umbrella Code. Todos os direitos reservados.
                    </ion-note>

                    <div class="footer-legal">
                        <RouterLink to="/terms">Termos</RouterLink>
                        <span>·</span>
                        <RouterLink to="/privacy">Privacidade</RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <nav class="bottom-nav" aria-label="Navegação inferior">
        <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            custom
            v-slot="{ navigate, href, isActive }"
        >
            <a :href="href" class="nav-item" :class="{ active: isActive }" @click="navigate">
                <img
                    v-if="item.label === 'Conta' && currentUser && avatarUrl"
                    :src="avatarUrl"
                    alt="Avatar do usuário"
                    class="nav-avatar"
                />
                <ion-icon v-else :icon="isActive && item.activeIcon ? item.activeIcon : item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
            </a>
        </RouterLink>
    </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonIcon, IonNote } from '@ionic/vue';
import {
    homeOutline,
    home,
    searchOutline,
    search,
    cloudUploadOutline,
    cloudUpload,
    logInOutline,
    personOutline,
    person
} from 'ionicons/icons';
import FooterLinkList from './FooterLinkList.vue';
import SocialLinks from './SocialLinks.vue';
import SiteLogo from './SiteLogo.vue';
import { checkAndSyncPendingAvatar, getCurrentSession, getProfile } from '@/services/authService';
import { supabase } from '@/services/supabase';

const usefulLinks = [
    { label: 'Gêneros', to: '/genres' },
    { label: 'Diretrizes', to: '/community-guidelines' },
    { label: 'Central de Ajuda', to: '/help' },
    { label: 'Contato', to: '/contact' },
    { label: 'Sobre Nós', to: '/about-us' }
];

const navItems = computed(() => [
    { label: 'Início', to: '/home', icon: homeOutline, activeIcon: home },
    { label: 'Descobrir', to: '/search', icon: searchOutline, activeIcon: search },
    { label: 'Upload', to: '/upload', icon: cloudUploadOutline, activeIcon: cloudUpload },
    currentUser.value
        ? { label: 'Conta', to: '/profile', icon: personOutline, activeIcon: person }
        : { label: 'Entrar', to: '/auth', icon: logInOutline }
]);

const currentUser = ref(false);
const avatarUrl = ref('');
let removeAuthListener: (() => void) | undefined;

const updateUserAvatar = async (userId?: string) => {
    const activeUserId = userId ?? (await getCurrentSession()).data.session?.user?.id;

    if (!activeUserId) {
        currentUser.value = false;
        avatarUrl.value = '';
        return;
    }

    try {
        const { data: { session } } = await getCurrentSession();
        if (session?.user) {
            await checkAndSyncPendingAvatar(session.user);
        }
        const profile = await getProfile(activeUserId);
        currentUser.value = true;
        avatarUrl.value = profile?.avatar_url || '';
    } catch {
        currentUser.value = false;
        avatarUrl.value = '';
    }
};

onMounted(async () => {
    const { data: { session } } = await getCurrentSession();
    await updateUserAvatar(session?.user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        void updateUserAvatar(session?.user.id);
    });

    removeAuthListener = () => subscription.unsubscribe();
});

onUnmounted(() => {
    removeAuthListener?.();
});
</script>

<style scoped>
.footer {
    width: 100%;
    flex: 0 0 auto;
    min-width: 0;
    overflow: visible;
    background-color: var(--color-background);
    border-top: 1px solid rgba(154, 140, 152, 0.25);
    padding-block: var(--space-3xl) var(--space-xl);
    font-family: var(--font-family);
}

.footer-wrapper {
    width: 100%;
}

.footer .container {
    width: min(100% - 48px, 1200px);
    margin-inline: auto;
}

.footer-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2xl);
    flex-wrap: wrap;
}

.footer-brand {
    flex: 1 1 360px;
    max-width: 420px;
    min-width: 0;
}

.subtitle {
    margin: 0 0 var(--space-xl);
    font-size: 1.15rem;
    font-weight: 500;
    color: var(--color-text-secondary);
}

.description {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.footer-divider {
    height: 1px;
    background: rgba(154, 140, 152, 0.2);
    margin-block: var(--space-xl);
}

.footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-md);
}

.footer-copyright {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
}

.footer-legal {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.footer-legal a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;
}

.footer-legal a:hover {
    color: var(--color-text-primary);
}

.footer-legal span {
    color: rgba(154, 140, 152, 0.5);
}

.bottom-nav {
    display: none;
}

@media (max-width: 700px) {
    .footer {
        display: none;
    }

    .bottom-nav {
        position: fixed;
        inset-inline: 0.5rem;
        bottom: 0;
        z-index: 30;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        gap: 0.25rem;
        padding: 0.625rem 0.75rem calc(0.625rem + env(safe-area-inset-bottom));
        border-radius: 14px;
        background: rgba(250, 249, 247, 0.96);
        border-top: 1px solid rgba(154, 140, 152, 0.22);
        box-shadow: 0 -6px 18px rgba(27, 28, 32, 0.08);
        backdrop-filter: blur(10px);
    }

    .nav-item {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.2rem;
        padding: 0.15rem 0;
        color: var(--color-text-secondary);
        text-decoration: none;
        font-family: var(--font-family);
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1.1;
        transition: color 0.2s ease;
    }

    .nav-item ion-icon {
        font-size: 2rem;
        --ionicon-stroke-width: 42;
    }

    .nav-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid rgba(154, 140, 152, 0.3);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .nav-item.active {
        color: var(--color-brand-primary, #53538f);
    }

    .nav-item.active .nav-avatar {
        border: 2px solid var(--color-brand-primary, #53538f);
        box-shadow: 0 0 0 2px var(--color-surface);
    }
}
</style>