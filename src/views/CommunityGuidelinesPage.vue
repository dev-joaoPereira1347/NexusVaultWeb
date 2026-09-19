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
    IonButton,
    IonContent,
    IonIcon
} from '@ionic/vue';
import {
    shieldCheckmarkOutline,
    documentTextOutline,
    sparklesOutline,
    ribbonOutline,
    lockClosedOutline,
    helpCircleOutline
} from 'ionicons/icons';

interface GuidelineItem {
    id: number;
    title: string;
    description: string;
    icon: string;
}

const guidelines = ref<GuidelineItem[]>([
    {
        id: 1,
        title: 'Autenticidade e domínio público',
        description: 'Todo documento enviado deve ser de domínio público ou possuir autorização expressa de licenciamento livre. Não são permitidos materiais protegidos por direitos autorais sem a devida concessão legal.',
        icon: shieldCheckmarkOutline
    },
    {
        id: 2,
        title: 'Conteúdo adequado e respeito',
        description: 'É proibido o upload de arquivos que promovam discurso de ódio, violência, discriminação, assédio ou qualquer forma de conteúdo prejudicial ao ambiente acadêmico e seguro do projeto.',
        icon: documentTextOutline
    },
    {
        id: 3,
        title: 'Integridade de arquivos e segurança',
        description: 'Garanta que os materiais carregados não contenham scripts maliciosos, vírus, links suspeitos ou metadados corrompidos. Arquivos inseguros serão descartados e a conta pode ser suspensa.',
        icon: sparklesOutline
    },
    {
        id: 4,
        title: 'Precisão de metadados',
        description: 'Ao catalogar um documento, informe dados precisos como título, autoria, ano de publicação e contexto histórico. Metadados bem estruturados ajudam pesquisadores e preservam o acervo.',
        icon: ribbonOutline
    },
    {
        id: 5,
        title: 'Moderação e aplicação',
        description: 'Nossa equipe revisará denúncias e manterá a comunidade alinhada aos padrões de convivência. O NexusVault reserva-se o direito de remover conteúdos fora das diretrizes sem aviso prévio.',
        icon: lockClosedOutline
    }
]);
</script>

<style scoped>
.guidelines-content {
    --background: var(--color-page-background);
}

.hero-section {
    width: 100%;
    background: linear-gradient(180deg, var(--color-background) 0%, rgba(247, 240, 233, 0.96) 100%);
    padding: clamp(32px, 5vw, 80px) 0 0;
}

.hero-container {
    width: min(100% - 32px, var(--content-width));
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(24px, 5vw, 72px);
}

.hero-text {
    flex: 1;
    max-width: 580px;
}

.category-chip {
    display: inline-flex;
    align-items: center;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(154, 140, 152, 0.28);
    color: var(--color-text-secondary);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin-bottom: 18px;
}

.hero-title {
    margin: 0 0 16px;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    line-height: 1.1;
    letter-spacing: -0.04em;
    color: var(--color-text-primary);
}

.hero-subtitle {
    margin: 0;
    max-width: 540px;
    font-size: 1.06rem;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

.hero-visual {
    flex: 1;
    display: flex;
    justify-content: flex-end;
}

.hero-svg {
    display: block;
    width: min(100%, 440px);
    height: auto;
    filter: drop-shadow(0 18px 30px rgba(34, 34, 59, 0.08));
}

.guidelines-section {
    padding: clamp(40px, 5vw, 80px) 0;
}

.guidelines-container {
    width: min(100% - 32px, 900px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.guideline-card {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 24px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid var(--color-border-soft);
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
    width: 52px;
    height: 52px;
    background: rgba(221, 161, 94, 0.14);
    color: var(--color-accent);
    border-radius: 14px;
    flex-shrink: 0;
}

.icon-wrapper ion-icon {
    font-size: 1.6rem;
}

.guideline-text {
    min-width: 0;
}

.guideline-text h3 {
    margin: 0 0 8px;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.35;
}

.guideline-text p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.98rem;
    line-height: 1.7;
}

.faq-section {
    padding: 0 0 56px;
}

.faq-container {
    width: min(100% - 32px, 900px);
    margin: 0 auto;
}

.faq-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 24px 28px;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
}

.faq-left {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
}

.icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-text-primary);
    color: var(--color-white);
    flex-shrink: 0;
}

.faq-left ion-icon {
    font-size: 1.6rem;
}

.faq-text {
    min-width: 0;
}

.faq-text h4 {
    margin: 0 0 6px;
    color: var(--color-text-primary);
    font-size: 1.05rem;
    font-weight: 700;
}

.faq-text p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.92rem;
    line-height: 1.6;
}

.faq-btn {
    --background: var(--color-accent);
    --color: var(--color-white);
    --border-radius: var(--radius-sm);
    --padding-start: 22px;
    --padding-end: 22px;
    --box-shadow: none;
    min-height: 46px;
    font-weight: 700;
    letter-spacing: 0.03em;
    flex-shrink: 0;
}

@media (max-width: 992px) {
    .hero-container {
        flex-direction: column-reverse;
        text-align: center;
    }

    .hero-text,
    .hero-subtitle {
        max-width: 100%;
    }

    .hero-visual {
        justify-content: center;
        width: 100%;
    }

    .hero-svg {
        max-width: 320px;
    }
}

@media (max-width: 768px) {
    .hero-section {
        padding-top: 28px;
    }

    .guideline-card {
        flex-direction: column;
        gap: 16px;
        padding: 20px 18px;
    }

    .faq-box {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        padding: 20px 18px;
    }

    .faq-left {
        flex-direction: column;
        justify-content: center;
    }

    .faq-btn {
        width: 100%;
    }
}
</style>