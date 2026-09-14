<template>
    <ion-page>
        <ion-content :fullscreen="true" :scroll-y="true" class="guidelines-content">
            <Header />
            <!-- HERO SECTION -->
            <section class="hero-section">
                <div class="hero-container">
                    <div class="hero-text">
                        <span class="category-chip">SEGURANÇA E CONVÍVIO</span>
                        <h1 class="hero-title">Diretrizes da Comunidade</h1>
                        <p class="hero-subtitle">
                            Bem-vindo ao NexusVault. Para garantir a preservação do conhecimento em um ambiente seguro,
                            confiável e colaborativo, estabelecemos regras essenciais que todos os membros devem seguir.
                        </p>
                    </div>

                    <div class="hero-visual">
                        <img src="@/assets/illustrations/undraw_legal-counsel.svg"
                            alt="Ilustração de Diretrizes Legais NexusVault" class="hero-svg" />
                    </div>
                </div>
            </section>

            <!-- LISTA DE DIRETRIZES -->
            <section class="guidelines-section">
                <div class="guidelines-container">
                    <div v-for="item in guidelines" :key="item.id" class="guideline-card">
                        <div class="icon-wrapper">
                            <ion-icon :icon="item.icon" aria-hidden="true" />
                        </div>
                        <div class="guideline-text">
                            <h3>{{ item.id }}. {{ item.title }}</h3>
                            <p>{{ item.description }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- FAQ / BANNER DA CENTRAL DE AJUDA -->
            <section class="faq-section">
                <div class="faq-container">
                    <div class="faq-box">
                        <div class="faq-left">
                            <div class="icon-circle">
                                <ion-icon :icon="helpCircleOutline" aria-hidden="true" />
                            </div>
                            <div class="faq-text">
                                <h4>Ficou com alguma dúvida sobre as regras?</h4>
                                <p>Nossa central possui artigos detalhados sobre direitos autorais e boas práticas.</p>
                            </div>
                        </div>
                        <ion-button router-link="/help" class="faq-btn" fill="clear">
                            Ir para Central de Ajuda
                        </ion-button>
                    </div>
                </div>
            </section>
            <Footer />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

import { ref } from 'vue';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonIcon,
    onIonViewDidEnter,
    onIonViewWillLeave
} from '@ionic/vue';
import {
    shieldCheckmarkOutline,
    documentTextOutline,
    sparklesOutline,
    ribbonOutline,
    lockClosedOutline,
    helpCircleOutline
} from 'ionicons/icons';

import { H } from 'vue-router/dist/index-BN0B0y8a';

// Interface das Diretrizes
interface GuidelineItem {
    id: number;
    title: string;
    description: string;
    icon: string;
}

// Lista reativa alinhada aos requisitos funcionais (RF02, RF03, RF04, RF08)
const guidelines = ref<GuidelineItem[]>([
    {
        id: 1,
        title: 'Autenticidade e Domínio Público',
        description: 'Todo documento enviado deve ser de domínio público ou possuir autorização expressa de licenciamento livre. Não são permitidos materiais protegidos por direitos autorais estritos sem a devida concessão legal.',
        icon: shieldCheckmarkOutline
    },
    {
        id: 2,
        title: 'Conteúdo Adequado e Respeito',
        description: 'É estritamente proibido o upload de arquivos que promovam discurso de ódio, violência, discriminação de qualquer natureza ou assédio. Mantemos um ambiente acadêmico, histórico e seguro.',
        icon: documentTextOutline
    },
    {
        id: 3,
        title: 'Integridade de Arquivos e Segurança',
        description: 'Garantimos a segurança digital da biblioteca. Documentos contendo scripts maliciosos, vírus, links suspeitos ou metadados corrompidos intencionalmente serão descartados e a conta suspensa após varredura automatizada.',
        icon: sparklesOutline
    },
    {
        id: 4,
        title: 'Precisão de Metadados',
        description: 'Ao catalogar um documento, forneça informações precisas como título, autoria e ano de publicação original. Metadados precisos ajudam pesquisadores e preservam a história do acervo.',
        icon: ribbonOutline
    },
    {
        id: 5,
        title: 'Moderação e Aplicação',
        description: 'Nossa equipe revisará as denúncias enviadas pela comunidade através do painel de moderação. O NexusVault reserva-se o direito de remover registros fora das conformidades sem aviso prévio.',
        icon: lockClosedOutline
    }
]);

// Ganchos de Ciclo de Vida Móvel do Ionic (Evita falhas de estado ao navegar entre views)
onIonViewDidEnter(() => {
    // Lógica de Analytics ou log de navegação se necessário
});

onIonViewWillLeave(() => {
    // Limpeza de subscrições ou estados locais se aplicável
});
</script>

<style scoped>
/* ==========================================================
NAVBAR CUSTOMIZADA
========================================================== */
.custom-toolbar {
    --background: var(--color-background);
    --padding-start: var(--space-md);
    --padding-end: var(--space-md);
}

.brand-container {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.brand-logo {
    height: 32px;
    width: auto;
}

.brand-name {
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--color-text-primary);
    letter-spacing: 0.5px;
}

.btn-register {
    --background: var(--color-primary-dark);
    --color: var(--color-white);
    --border-radius: var(--radius-sm);
    font-weight: 700;
    font-size: 0.85rem;
}

/* ==========================================================
HERO SECTION
========================================================== */
.guidelines-content {
    --background: var(--color-page-background);
}

.hero-section {
    background-color: var(--color-background);
    padding-block: var(--space-3xl);
    width: 100%;
}

.hero-container {
    max-width: var(--content-width);
    margin: 0 auto;
    padding-inline: var(--space-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2xl);
}

.hero-text {
    flex: 1;
    max-width: 560px;
}

.category-chip {
    display: inline-block;
    padding: 6px 14px;
    border-radius: var(--radius-xl);
    margin-bottom: var(--space-md);
    background-color: var(--color-white);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-soft);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
}

.hero-title {
    font-size: 2.75rem;
    font-weight: 800;
    line-height: 1.15;
    color: var(--color-text-primary);
    margin-bottom: var(--space-md);
}

.hero-subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0;
}

.hero-visual {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.hero-svg {
    width: 100%;
    max-width: 440px;
    height: auto;
    object-fit: contain;
}

/* ==========================================================
GUIDELINES LIST
========================================================== */
.guidelines-section {
    padding-block: var(--space-3xl);
}

.guidelines-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 800px;
    margin: 0 auto;
    padding-inline: var(--space-md);
}

.guideline-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    box-shadow: var(--shadow-soft);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.guideline-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background-color: rgba(221, 161, 94, 0.15);
    /* Accent translúcido */
    color: var(--color-accent);
    border-radius: var(--radius-md);
    flex-shrink: 0;
}

.icon-wrapper ion-icon {
    font-size: 24px;
}

.guideline-text h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
}

.guideline-text p {
    font-size: 0.98rem;
    line-height: 1.55;
    color: var(--color-text-secondary);
    margin: 0;
}

/* ==========================================================
FAQ SECTION
========================================================== */
.faq-section {
    padding-bottom: var(--space-3xl);
}

.faq-container {
    max-width: 800px;
    margin: 0 auto;
    padding-inline: var(--space-md);
}

.faq-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xl);
    background: var(--color-white);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    padding: var(--space-xl);
}

.faq-left {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
}

.faq-left .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--color-text-primary);
    color: var(--color-white);
    border-radius: var(--radius-xl);
    flex-shrink: 0;
}

.faq-left ion-icon {
    font-size: 24px;
}

.faq-text h4 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
}

.faq-text p {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    margin: 0;
}

.faq-btn {
    --color: var(--color-white);
    --background: var(--color-accent);
    --border-radius: var(--radius-sm);
    --padding-start: var(--space-lg);
    --padding-end: var(--space-lg);
    font-weight: 600;
    height: 44px;
    margin: 0;
    flex-shrink: 0;
}

/* ==========================================================
RESPONSIVIDADE (MEDIA QUERIES)
========================================================== */
@media (max-width: 992px) {
    .hero-container {
        flex-direction: column-reverse;
        text-align: center;
        gap: var(--space-xl);
    }

    .hero-text {
        max-width: 100%;
    }

    .hero-visual {
        justify-content: center;
        width: 100%;
    }

    .hero-svg {
        max-width: 300px;
    }
}

@media (max-width: 768px) {
    .hero-title {
        font-size: 2.1rem;
    }

    .faq-box {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
    }

    .faq-left {
        flex-direction: column;
    }

    .faq-btn {
        width: 100%;
    }

    .guideline-card {
        flex-direction: column;
        gap: var(--space-md);
    }
}
</style>