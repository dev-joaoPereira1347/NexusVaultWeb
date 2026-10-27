<template>
    <IonPage>
        <IonContent :fullscreen="true" class="about-content">
            <SiteHeader />

            <UmbrellaHero badge="MUSEU DIGITAL LIVRE" title="Preservando o conhecimento<br />da humanidade"
                description="A NexusVault nasce para guardar, organizar e compartilhar documentos, obras e saberes em domínio público com uma experiência acessível, segura e inspirada por uma comunidade de colaboração constante."
                :image-src="umbrellaLogo" image-alt="Logo da Umbrella Code" />

            <main class="about-main nv-page-shell">
                <section class="section-block nv-section">
                    <header class="section-header">
                        <h2 class="nv-heading-h2">O que movemos</h2>
                        <p class="section-subtitle">Mais do que desenvolver, criamos soluções que fazem a diferença.</p>
                    </header>

                    <div class="cards-grid">
                        <article class="pillar-card pillar-card--curation">
                            <div class="icon-wrapper">
                                <ion-icon :icon="filterOutline" aria-hidden="true" />
                            </div>
                            <h3>Curadoria & preservação</h3>
                            <p>
                                Organizamos acervos em diferentes formatos e garantimos que materiais históricos,
                                literários e acadêmicos sejam mantidos com clareza, acesso e integridade.
                            </p>
                        </article>

                        <article class="pillar-card pillar-card--security">
                            <div class="icon-wrapper">
                                <ion-icon :icon="shieldOutline" aria-hidden="true" />
                            </div>
                            <h3>Segurança & integridade</h3>
                            <p>
                                Aplicamos boas práticas de revisão, validação de arquivos e controle de segurança para
                                manter um ambiente confiável e responsável para toda a comunidade.
                            </p>
                        </article>

                        <article class="pillar-card pillar-card--community">
                            <div class="icon-wrapper">
                                <ion-icon :icon="peopleOutline" aria-hidden="true" />
                            </div>
                            <h3>Guardiões do saber</h3>
                            <p>
                                Cada pessoa que participa do projeto contribui para preservar o conhecimento, ampliar o
                                acesso e manter viva a memória coletiva de forma colaborativa.
                            </p>
                        </article>
                    </div>
                </section>

                <section class="section-block developer-block nv-section">
                    <div class="developer-card nv-surface">
                        <div class="developer-copy">
                            <header class="developer-heading">
                                <span class="nv-eyebrow nv-badge developer-badge">PROJETO</span>
                                <h3>Desenvolvido por Umbrella Code</h3>
                            </header>
                            <p>
                                A NexusVault foi pensada e construída com foco em desempenho, acessibilidade e uma
                                experiência moderna, utilizando Ionic Vue e Supabase como base para a entrega de uma
                                plataforma robusta e escalável.
                            </p>
                        </div>
                    </div>
                </section>

                <section class="section-block team-section nv-section">
                    <header class="section-header team-header">
                        <span class="nv-eyebrow nv-badge">EQUIPE</span>
                        <h2 class="nv-heading-h2">Quem constrói a experiência</h2>
                    </header>

                    <ion-grid class="team-grid">
                        <ion-row>
                            <ion-col v-for="member in teamMembers" :key="member.name" size="12" size-md="6"
                                size-xl="4">
                                <article class="team-card nv-surface">
                                    <div class="team-avatar" aria-hidden="true">
                                        <ion-icon :icon="member.icon" />
                                    </div>
                                    <div class="team-member-heading">
                                        <h3>{{ member.name }}</h3>
                                        <p class="team-role">{{ member.role }}</p>
                                    </div>
                                    <p class="team-bio">{{ member.bio }}</p>
                                </article>
                            </ion-col>
                        </ion-row>
                    </ion-grid>
                </section>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import {
    IonPage,
    IonContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
} from '@ionic/vue';
import {
    filterOutline,
    shieldOutline,
    peopleOutline,
    laptopOutline,
    colorPaletteOutline,
    personCircleOutline,
    settingsOutline,
    serverOutline,
    sparklesOutline,
    clipboardOutline
} from 'ionicons/icons';

import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import UmbrellaHero from '@/components/UmbrellaHero.vue';
import umbrellaLogo from '@/assets/images/Logo Umbrella Code.svg';

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    icon: string;
}

const teamMembers: TeamMember[] = [
    {
        name: 'Sergio',
        role: 'Desenvolvedor Front-end',
        bio: 'Cria interfaces modernas, responsivas e intuitivas com foco em clareza visual, navegação fluida e experiências memoráveis para o usuário.',
        icon: laptopOutline
    },
    {
        name: 'Daniela',
        role: 'Desenvolvedora Front-end',
        bio: 'Transforma conceitos em interfaces funcionais e elegantes, unindo usabilidade, identidade visual e atenção aos detalhes em cada fluxo da plataforma.',
        icon: colorPaletteOutline
    },
    {
        name: 'Mateus',
        role: 'Tech Lead',
        bio: 'Coordena a arquitetura e a evolução técnica do projeto, orientando a equipe para entregas mais consistentes, escaláveis e alinhadas à visão do produto.',
        icon: settingsOutline
    },
    {
        name: 'João Vitor',
        role: 'Desenvolvedor Back-end',
        bio: 'Responsável pela lógica da aplicação, integração entre serviços e robustez do sistema, garantindo performance, segurança e continuidade da experiência.',
        icon: personCircleOutline
    },
    {
        name: 'Pablo',
        role: 'Desenvolvedor Back-end',
        bio: 'Foca na estrutura interna da plataforma, regras de negócio e otimização de processos para manter a solução estável, eficiente e preparada para crescer.',
        icon: serverOutline
    },
    {
        name: 'Etelvina',
        role: 'Desenvolvedora Front-end',
        bio: 'Refina a camada visual do produto, valorizando consistência, estética e acessibilidade para fortalecer a identidade e a percepção da marca.',
        icon: sparklesOutline
    },
    {
        name: 'João Henrique',
        role: 'Desenvolvedor Back-end',
        bio: 'Apoia a base técnica da aplicação com foco em organização, robustez e qualidade de implementação, contribuindo para a confiabilidade do sistema.',
        icon: clipboardOutline
    }
];
</script>

<style scoped>
.about-content {
    --background: var(--color-page-background);
}

.about-main {
    --content-width: 1200px;
}

.section-header {
    margin-bottom: var(--space-md);
}

.section-header h2 {
    max-width: 38ch;
}

.section-subtitle {
    max-width: 52ch;
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: var(--space-lg);
}

.pillar-card {
    --pillar-color: var(--color-brand-primary);
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: start;
    column-gap: var(--space-sm);
    row-gap: var(--space-xs);
}

.icon-wrapper {
    display: grid;
    grid-row: 1 / span 2;
    width: 44px;
    height: 44px;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pillar-color) 12%, var(--color-surface));
    color: var(--pillar-color);
    font-size: 1.4rem;
}

.pillar-card h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--primitive-font-family-display);
    font-size: var(--card-title-font-size);
    font-weight: var(--card-title-font-weight);
    line-height: var(--card-title-line-height);
}

.pillar-card p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
}

.developer-card {
    display: block;
    padding: clamp(var(--space-lg), 5vw, var(--space-2xl));
}

.developer-copy {
    display: grid;
    justify-items: start;
    gap: var(--space-md);
}

.developer-heading {
    display: grid;
    justify-items: start;
    gap: var(--space-md);
}

.developer-badge {
    padding: var(--space-xs) var(--space-lg);
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-brand-primary) 16%, var(--color-surface));
    color: var(--color-brand-primary);
    font-size: var(--typography-body-sm-font-size);
    letter-spacing: 0.04em;
}

.developer-copy h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--primitive-font-family-display);
    font-size: var(--typography-heading-h3-font-size);
    font-weight: var(--typography-heading-h3-font-weight);
    line-height: var(--typography-heading-h3-line-height);
}

.developer-copy p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-md-font-size);
    line-height: var(--typography-body-md-line-height);
    letter-spacing: 0.04em;
}

.team-section {
    min-width: 0;
}

.team-header {
    margin-bottom: var(--space-md);
}

.team-grid {
    width: 100%;
    padding: 0;
}

.team-grid ion-row {
    row-gap: var(--space-md);
}

.team-grid ion-col {
    display: flex;
}

.team-card {
    --member-accent: var(--color-brand-primary);
    position: relative;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    width: 100%;
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-left: 4px solid var(--member-accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    color: var(--color-text-primary);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.team-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.team-avatar {
    display: grid;
    grid-row: 1;
    width: 64px;
    height: 64px;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--member-accent) 16%, var(--color-surface));
    color: var(--member-accent);
}

.team-avatar ion-icon {
    font-size: 2rem;
}

.team-member-heading {
    display: grid;
    gap: var(--space-2xs, 4px);
    min-width: 0;
}

.team-card h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--primitive-font-family-display);
    font-size: var(--typography-heading-h4-font-size);
    font-weight: var(--typography-heading-h4-font-weight);
    line-height: var(--typography-heading-h4-line-height);
}

.team-role {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
}

.team-bio {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-body-sm-font-size);
    line-height: var(--typography-body-sm-line-height);
    letter-spacing: 0.02em;
}

@media (max-width: 640px) {
    .developer-card {
        padding: var(--space-md);
    }

    .developer-copy {
        gap: var(--space-sm);
    }

    .developer-heading {
        gap: var(--space-sm);
    }

    .developer-copy h3 {
        font-size: var(--typography-heading-h4-font-size);
        line-height: var(--typography-heading-h4-line-height);
    }

    .developer-copy p {
        font-size: var(--typography-body-sm-font-size);
        line-height: var(--typography-body-sm-line-height);
        letter-spacing: normal;
    }

    .team-card {
        grid-template-columns: 56px minmax(0, 1fr);
        gap: var(--space-sm) var(--space-md);
    }

    .team-avatar {
        width: 56px;
        height: 56px;
    }

}
</style>