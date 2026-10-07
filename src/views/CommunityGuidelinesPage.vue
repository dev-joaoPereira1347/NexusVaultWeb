<template>
    <ion-page>
        <ion-content :fullscreen="true" :scroll-y="true" class="guidelines-content">
            <SiteHeader />
            <!-- HERO SECTION -->
            <section class="nv-hero">
                <div class="nv-hero__content">
                    <span class="nv-hero__badge">SEGURANÇA E CONVÍVIO</span>
                    <h1 class="nv-hero__title">Diretrizes da Comunidade</h1>
                    <p class="nv-hero__description">
                        Bem-vindo ao NexusVault. Para garantir a preservação do conhecimento em um ambiente seguro,
                        confiável e colaborativo, estabelecemos regras essenciais que todos os membros devem seguir.
                    </p>
                </div>

                <div class="nv-hero__visual">
                    <img src="@/assets/illustrations/undraw_legal-counsel.svg"
                        alt="Ilustração de Diretrizes Legais NexusVault" class="nv-hero__image" />
                </div>
            </section>

            <!-- CORPO DAS DIRETRIZES E PRINCÍPIOS -->
            <div class="guidelines-page-body">
                <div class="guidelines-main-container nv-page-shell">
                    <!-- SEÇÃO: PRINCÍPIOS -->
                    <section class="principles-section">
                        <div class="section-heading">
                            <h2 class="section-title nv-page-title">Princípios</h2>
                            <p class="section-subtitle nv-page-description">Acreditamos que o acesso ao conhecimento deve ser:</p>
                        </div>

                        <div class="principles-grid">
                            <div v-for="principle in principles" :key="principle.title" class="principle-card nv-surface">
                                <div class="principle-icon-circle">
                                    <ion-icon :icon="principle.icon" aria-hidden="true" />
                                </div>
                                <h3 class="principle-title">{{ principle.title }}</h3>
                                <p class="principle-description">{{ principle.description }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- SEÇÃO: NOSSAS DIRETRIZES -->
                    <section class="rules-section">
                        <h2 class="section-title nv-page-title">Nossas Diretrizes</h2>

                        <div class="rules-list">
                            <div v-for="item in guidelines" :key="item.id" class="rule-card nv-surface">
                                <div class="rule-icon-circle">
                                    <ion-icon :icon="item.icon" aria-hidden="true" />
                                </div>
                                <div class="rule-content">
                                    <h3 class="rule-title">{{ item.id }}. {{ item.title }}</h3>
                                    <p class="rule-description">{{ item.description }}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- SEÇÃO: DÚVIDAS / AJUDA -->
                    <section class="help-section">
                        <div class="help-card nv-surface">
                            <div class="help-left">
                                <div class="help-icon-circle">
                                    <ion-icon :icon="chatbubbleEllipsesOutline" aria-hidden="true" />
                                </div>
                                <div class="help-text">
                                    <h3 class="help-title">Tem Dúvidas?</h3>
                                    <p class="help-description">
                                        Consulte nossas Centrais de Ajuda ou entre em contato conosco.
                                    </p>
                                </div>
                            </div>

                            <router-link to="/help" class="help-button">
                                Ir para central de ajuda
                            </router-link>
                        </div>
                    </section>
                </div>
            </div>
            <SiteFooter />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';

import { ref } from 'vue';
import {
    IonPage,
    IonContent,
    IonIcon
} from '@ionic/vue';
import {
    personOutline,
    shieldOutline,
    heartOutline,
    peopleOutline,
    checkmarkOutline,
    closeOutline,
    chatbubbleOutline,
    alertCircleOutline,
    chatbubbleEllipsesOutline
} from 'ionicons/icons';

interface PrincipleItem {
    title: string;
    description: string;
    icon: string;
}

interface GuidelineItem {
    id: number;
    title: string;
    description: string;
    icon: string;
}

const principles = ref<PrincipleItem[]>([
    {
        title: 'Livre e Aberto',
        description: 'Informação pública deve estar acessível a todos, sem barreiras.',
        icon: personOutline
    },
    {
        title: 'Ético e Legal',
        description: 'Respeitamos as leis, as políticas, os princípios éticos e todas as estabelecidas.',
        icon: shieldOutline
    },
    {
        title: 'Inclusivo',
        description: 'Valorizamos a diversidade e promovemos um ambiente respeitoso para todos.',
        icon: heartOutline
    },
    {
        title: 'Colaborativo',
        description: 'Acreditamos no poder da colaboração e do compartilhamento.',
        icon: peopleOutline
    }
]);

const guidelines = ref<GuidelineItem[]>([
    {
        id: 1,
        title: 'Conteúdo Permitido',
        description: 'Compartilhe tutoriais, textos, imagens, áudios, vídeos e outros materiais que você tenha direito de compartilhar.',
        icon: checkmarkOutline
    },
    {
        id: 2,
        title: 'Conteúdo Não Permitido',
        description: 'Não envie conteúdo que viole direitos autorais, promova fraude, violência, discriminação ou viole a privacidade de terceiros.',
        icon: closeOutline
    },
    {
        id: 3,
        title: 'Sua Responsabilidade',
        description: 'Você é responsável pelo conteúdo que envia. Certifique-se de que tem os direitos necessários.',
        icon: personOutline
    },
    {
        id: 4,
        title: 'Respeito à Comunidade',
        description: 'Seja respeitoso com todos os membros da comunidade. Evite comportamentos que causem desconforto ou que sejam ofensivos.',
        icon: chatbubbleOutline
    },
    {
        id: 5,
        title: 'Moderação e Aplicação',
        description: 'Reservamo-nos o direito de remover conteúdos que violem estas diretrizes.',
        icon: alertCircleOutline
    }
]);
</script>

<style scoped>
.guidelines-content {
    --background: var(--color-page-background);
}

/* CORPO DAS DIRETRIZES E PRINCÍPIOS */
.guidelines-page-body {
    width: 100%;
    background-color: var(--color-page-background);
}

.guidelines-main-container {
    --content-width: 960px;
}

/* TIPOGRAFIA DAS SEÇÕES */
.section-heading {
    margin-bottom: 24px;
}

.section-title {
    margin: 0;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.03em;
}

.section-subtitle {
    margin: 8px 0 0;
    line-height: 1.5;
}

/* SEÇÃO PRINCÍPIOS (GRID 2x2) */
.principles-section {
    margin-bottom: var(--section-gap);
}

.principles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
    margin-top: 24px;
}

.principle-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--surface-padding);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.principle-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(83, 83, 143, 0.08);
}

.principle-icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-brand-primary, #53538F);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    flex-shrink: 0;
}

.principle-icon-circle ion-icon {
    font-size: 1.55rem;
}

.principle-title {
    margin: 0 0 10px;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-primary);
}

.principle-description {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--color-text-secondary);
}

/* SEÇÃO NOSSAS DIRETRIZES (LISTA VERTICAL) */
.rules-section {
    margin-bottom: var(--section-gap);
}

.rules-section .section-title {
    margin-bottom: 24px;
}

.rules-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.rule-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--space-md) var(--surface-padding);
    display: flex;
    align-items: center;
    gap: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rule-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(83, 83, 143, 0.06);
}

.rule-icon-circle {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background-color: var(--color-brand-primary, #53538F);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.rule-icon-circle ion-icon {
    font-size: 1.45rem;
}

.rule-content {
    flex: 1;
    min-width: 0;
}

.rule-title {
    margin: 0 0 4px;
    font-size: 1.02rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--color-text-primary);
}

.rule-description {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.5;
    color: var(--color-text-secondary);
}

/* SEÇÃO AJUDA / DÚVIDAS */
.help-section {
    margin-top: var(--section-gap);
}

.help-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--space-md) var(--surface-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.help-card:hover {
    box-shadow: 0 6px 16px rgba(83, 83, 143, 0.06);
}

.help-left {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
}

.help-icon-circle {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background-color: var(--color-brand-primary, #53538F);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.help-icon-circle ion-icon {
    font-size: 1.45rem;
}

.help-text {
    min-width: 0;
}

.help-title {
    margin: 0 0 4px;
    font-size: 1.02rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--color-text-primary);
}

.help-description {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.5;
    color: var(--color-text-secondary);
}

.help-button {
    background-color: var(--color-brand-primary);
    color: #FFFFFF;
    padding: 12px 20px;
    border-radius: var(--radius-control);
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}

.help-button:hover {
    background-color: var(--color-accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(83, 83, 143, 0.25);
}

/* RESPONSIVIDADE */
@media (max-width: 680px) {
    .principles-grid {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    .principle-card {
        padding: 20px 18px;
    }

    .rule-card {
        padding: 16px 18px;
        gap: 16px;
    }

    .help-card {
        flex-direction: column;
        align-items: stretch;
        padding: 20px 18px;
        gap: 18px;
    }

    .help-left {
        gap: 16px;
    }

    .help-button {
        width: 100%;
        text-align: center;
    }
}
</style>