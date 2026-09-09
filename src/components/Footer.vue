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
</template>

<script setup lang="ts">
import { IonNote } from '@ionic/vue';
import FooterLinkList from './FooterLinkList.vue';
import SocialLinks from './SocialLinks.vue';
import SiteLogo from './SiteLogo.vue';

const usefulLinks = [
    { label: 'Gêneros', to: '/genres' },
    { label: 'Diretrizes', to: '/guidelines' },
    { label: 'Central de Ajuda', to: '/help' },
    { label: 'Contato', to: '/contact' },
    { label: 'Sobre Nós', to: '/about-us' }
];
</script>

<style scoped>
.footer {
    width: 100%;
    flex: 0 0 auto;
    position: static;
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
    gap: var(--space-2xl);
    flex-wrap: wrap;
}

.footer-brand {
    flex: 1 1 360px;
    max-width: 420px;
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
</style>