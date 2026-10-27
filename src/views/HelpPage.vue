<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="help-content">
            <SiteHeader />

            <header class="help-heading nv-page-shell">
                <span class="nv-eyebrow nv-badge">CENTRAL DE AJUDA</span>
                <h1 class="nv-heading-h1">Como podemos ajudar?</h1>
                <p class="nv-page-description">
                    Encontre orientações sobre sua conta, leitura, coleções e contribuições para o acervo.
                </p>
            </header>

            <main class="help-main nv-page-shell">
                <section class="help-topics nv-section" aria-labelledby="topics-title">
                    <header class="help-section-heading">
                        <h2 id="topics-title" class="nv-heading-h2">Acesso rápido</h2>
                        <p>Consulte as páginas mais úteis da plataforma.</p>
                    </header>
                    <nav class="topic-grid" aria-label="Tópicos de ajuda">
                        <RouterLink to="/search" class="topic-card nv-surface">
                            <span class="topic-icon"><IonIcon :icon="searchOutline" aria-hidden="true" /></span>
                            <span>
                                <strong>Encontrar livros</strong>
                                <small>Pesquise e explore o acervo.</small>
                            </span>
                            <IonIcon class="topic-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                        </RouterLink>
                        <RouterLink to="/profile?tab=collections" class="topic-card nv-surface">
                            <span class="topic-icon"><IonIcon :icon="albumsOutline" aria-hidden="true" /></span>
                            <span>
                                <strong>Gerenciar coleções</strong>
                                <small>Organize livros em listas pessoais.</small>
                            </span>
                            <IonIcon class="topic-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                        </RouterLink>
                        <RouterLink to="/community-guidelines" class="topic-card nv-surface">
                            <span class="topic-icon"><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" /></span>
                            <span>
                                <strong>Diretrizes da comunidade</strong>
                                <small>Saiba como contribuir com segurança.</small>
                            </span>
                            <IonIcon class="topic-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                        </RouterLink>
                        <RouterLink to="/terms" class="topic-card nv-surface">
                            <span class="topic-icon"><IonIcon :icon="documentTextOutline" aria-hidden="true" /></span>
                            <span>
                                <strong>Termos de uso</strong>
                                <small>Consulte as condições da plataforma.</small>
                            </span>
                            <IonIcon class="topic-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                        </RouterLink>
                    </nav>
                </section>

                <section class="faq-section nv-section" aria-labelledby="faq-title">
                    <header class="help-section-heading">
                        <h2 id="faq-title" class="nv-heading-h2">Perguntas frequentes</h2>
                        <p>Respostas para começar a usar a NexusVault.</p>
                    </header>

                    <div class="faq-list">
                        <details v-for="item in frequentlyAskedQuestions" :key="item.question" class="faq-item nv-surface">
                            <summary>
                                <span>{{ item.question }}</span>
                                <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
                            </summary>
                            <p>{{ item.answer }}</p>
                            <RouterLink v-if="item.link" :to="item.link.to" class="faq-link">
                                {{ item.link.label }}
                                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
                            </RouterLink>
                        </details>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
    albumsOutline,
    arrowForwardOutline,
    chevronDownOutline,
    chevronForwardOutline,
    documentTextOutline,
    searchOutline,
    shieldCheckmarkOutline
} from 'ionicons/icons';
import { RouterLink } from 'vue-router';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';

const frequentlyAskedQuestions = [
    {
        question: 'Preciso de uma conta para ler?',
        answer: 'Você pode explorar o acervo público sem entrar. Para salvar o progresso, criar coleções ou enviar materiais, entre na sua conta.'
    },
    {
        question: 'Como encontro um livro?',
        answer: 'Acesse Descobrir para pesquisar por título, autor ou outros termos e use os filtros disponíveis para refinar os resultados.',
        link: { label: 'Explorar o acervo', to: '/search' }
    },
    {
        question: 'Como funciona o progresso de leitura?',
        answer: 'Quando você lê um documento no leitor da NexusVault com a sessão iniciada, o progresso é salvo automaticamente. Você pode consultar ou excluir esses registros na aba Progresso da sua conta.',
        link: { label: 'Abrir minha conta', to: '/profile?tab=progress' }
    },
    {
        question: 'Como crio uma coleção?',
        answer: 'Na aba Coleções da sua conta, selecione Nova coleção, informe um nome e escolha se ela ficará visível no seu perfil público. Depois, use a ação de salvar nos livros para adicioná-los.',
        link: { label: 'Gerenciar coleções', to: '/profile?tab=collections' }
    },
    {
        question: 'Posso enviar qualquer arquivo para o acervo?',
        answer: 'Envie somente materiais que você criou, que estejam em domínio público ou para os quais tenha autorização. Os envios passam por análise antes de serem publicados.',
        link: { label: 'Ler as diretrizes da comunidade', to: '/community-guidelines' }
    },
    {
        question: 'Onde vejo o estado do meu envio?',
        answer: 'Acompanhe solicitações e contribuições na aba Meus Envios da sua conta. A disponibilidade de um material depende da conclusão das etapas de verificação e análise.',
        link: { label: 'Consultar meus envios', to: '/profile?tab=uploads' }
    }
];
</script>

<style scoped>
.help-content {
    --background: var(--color-page-background);
}

.help-heading {
    display: grid;
    justify-items: start;
    gap: var(--space-md);
}

.help-heading .nv-page-description {
    max-width: 62ch;
    margin: 0;
}

.help-main {
    --content-width: 1000px;
}

.help-section-heading {
    display: grid;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
}

.help-section-heading p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
}

.topic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: var(--space-md);
}

.topic-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 20px;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    padding: var(--space-md);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.topic-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.topic-card > span:nth-child(2) {
    display: grid;
    gap: var(--space-xs);
    min-width: 0;
}

.topic-card strong {
    font-size: var(--typography-body-sm-font-size);
}

.topic-card small {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.4;
}

.topic-icon {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-brand-primary) 12%, var(--color-surface));
    color: var(--color-brand-primary);
    font-size: 1.25rem;
}

.topic-chevron {
    color: var(--color-text-muted);
}

.faq-list {
    display: grid;
    gap: var(--space-sm);
}

.faq-item {
    padding: 0 var(--space-md);
}

.faq-item summary {
    display: flex;
    min-height: 60px;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--primitive-font-family-display);
    font-size: var(--typography-body-md-font-size);
    font-weight: var(--primitive-font-weight-medium);
    list-style: none;
}

.faq-item summary::-webkit-details-marker {
    display: none;
}

.faq-item summary ion-icon {
    flex: 0 0 auto;
    color: var(--color-brand-primary);
    transition: transform 0.2s ease;
}

.faq-item[open] summary ion-icon {
    transform: rotate(180deg);
}

.faq-item > p {
    max-width: 78ch;
    margin: 0 0 var(--space-md);
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
}

.faq-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    margin: 0 0 var(--space-md);
    color: var(--color-brand-primary);
    font-size: var(--typography-body-sm-font-size);
    font-weight: var(--primitive-font-weight-semibold);
    text-decoration: none;
}

.topic-card:focus-visible,
.faq-link:focus-visible,
.faq-item summary:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}
</style>
