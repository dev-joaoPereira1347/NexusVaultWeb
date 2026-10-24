<template>
    <IonPage>
        <IonContent :fullscreen="true" class="about-content">
            <SiteHeader />

            <UmbrellaHero badge="MUSEU DIGITAL LIVRE" title="Preservando o conhecimento<br />da humanidade"
                description="A NexusVault nasce para guardar, organizar e compartilhar documentos, obras e saberes em domínio público com uma experiência acessível, segura e inspirada por uma comunidade de colaboração constante."
                :image-src="umbrellaLogo" image-alt="Logo da Umbrella Code" />

            <main class="about-main nv-page-shell">
                <section class="section-block nv-section">
                    <div class="section-header">
                        <span class="nv-eyebrow nv-badge">NOSSA MISSÃO</span>
                        <h2 class="nv-heading-h2">O que movemos</h2>
                    </div>

                    <div class="cards-grid">
                        <article class="pillar-card nv-surface">
                            <div class="icon-wrapper primary">
                                <ion-icon :icon="libraryOutline" aria-hidden="true" />
                            </div>
                            <h3>Curadoria & preservação</h3>
                            <p>
                                Organizamos acervos em diferentes formatos e garantimos que materiais históricos,
                                literários e acadêmicos sejam mantidos com clareza, acesso e integridade.
                            </p>
                        </article>

                        <article class="pillar-card nv-surface">
                            <div class="icon-wrapper accent">
                                <ion-icon :icon="lockClosedOutline" aria-hidden="true" />
                            </div>
                            <h3>Segurança & integridade</h3>
                            <p>
                                Aplicamos boas práticas de revisão, validação de arquivos e controle de segurança para
                                manter um ambiente confiável e responsável para toda a comunidade.
                            </p>
                        </article>

                        <article class="pillar-card nv-surface">
                            <div class="icon-wrapper dark">
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
                        <div class="developer-brand">
                            <img :src="umbrellaLogo" alt="Logo da Umbrella Code"
                                class="developer-logo" />
                            <span>Umbrella Code</span>
                        </div>

                        <div class="developer-copy">
                            <h3>Desenvolvido por Umbrella Code</h3>
                            <p>
                                A NexusVault foi pensada e construída com foco em desempenho, acessibilidade e uma
                                experiência moderna, utilizando Ionic Vue e Supabase como base para a entrega de uma
                                plataforma robusta e escalável.
                            </p>
                        </div>
                    </div>
                </section>

                <section class="section-block team-section nv-section">
                    <div class="section-header team-header">
                        <span class="nv-eyebrow nv-badge">EQUIPE</span>
                        <h2 class="nv-heading-h2">Quem constrói a experiência</h2>
                    </div>

                    <div class="team-grid">
                        <article v-for="member in teamMembers" :key="member.name" class="team-card nv-surface">
                            <div class="team-avatar-wrap">
                                <div class="team-avatar">
                                    <ion-icon :icon="member.icon" aria-hidden="true" />
                                </div>
                            </div>

                            <h3>{{ member.name }}</h3>
                            <p class="team-role">{{ member.role }}</p>
                            <p class="team-bio">{{ member.bio }}</p>
                        </article>
                    </div>
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
    IonIcon
} from '@ionic/vue';
import {
    libraryOutline,
    lockClosedOutline,
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

.section-block {
    margin-bottom: 0;
}

.section-header {
    margin-bottom: 20px;
}

.section-header h2 {
    margin: 0;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
}

.pillar-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--surface-padding);
    box-shadow: var(--shadow-soft);
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    font-size: 1.5rem;
    margin-bottom: 16px;
}

.icon-wrapper.primary {
    background: rgba(83, 83, 143, 0.1);
    color: var(--color-brand-primary);
}

.icon-wrapper.accent {
    background: var(--color-surface-alt);
    color: var(--color-accent);
}

.icon-wrapper.dark {
    background: rgba(34, 34, 59, 0.08);
    color: var(--color-text-primary);
}

.pillar-card h3 {
    margin: 0 0 10px;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
}

.pillar-card p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.96rem;
    line-height: 1.7;
}

.developer-card {
    display: flex;
    align-items: center;
    gap: 28px;
    padding: var(--surface-padding);
}

.developer-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 200px;
    gap: 12px;
}

.developer-logo {
    display: block;
    width: 170px;
    height: auto;
    object-fit: contain;
}

.developer-brand span {
    color: var(--color-text-primary);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.developer-copy h3 {
    margin: 0 0 10px;
    color: var(--color-text-primary);
    font-size: clamp(1.4rem, 2vw, 2rem);
    line-height: 1.2;
}

.developer-copy p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
    font-size: 1rem;
}

.team-section {
    margin-top: 8px;
}

.team-header {
    margin-bottom: 28px;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 20px;
}

.team-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--surface-padding);
    box-shadow: var(--shadow-soft);
    color: var(--color-text-primary);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    overflow: hidden;
}

.team-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(83, 83, 143, 0.04), transparent 45%, transparent 100%);
    pointer-events: none;
}

.team-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-medium);
    border-color: rgba(255, 255, 255, 0.26);
}

.team-avatar-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 18px;
}

.team-avatar {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    animation: floatGlow 4s ease-in-out infinite;
}

.team-avatar ion-icon {
    font-size: 2.5rem;
    color: var(--color-brand-primary);
}

.team-card h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.25rem, 1.45vw, 1.5rem);
    line-height: 1.2;
    text-align: left;
    font-weight: 700;
}

.team-role {
    margin: 18px 0 14px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-eyebrow);
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.team-bio {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.7;
}

@keyframes floatGlow {

    0%,
    100% {
        transform: translateY(0);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 12px 20px rgba(0, 0, 0, 0.12);
    }

    50% {
        transform: translateY(-3px);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 26px rgba(0, 0, 0, 0.16);
    }
}

@media (max-width: 1400px) {
    .team-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }
}

@media (max-width: 1200px) {
    .team-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }

    .developer-card {
        flex-direction: column;
        text-align: center;
    }

    .developer-brand {
        min-width: auto;
    }

    .team-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .team-grid {
        grid-template-columns: 1fr;
    }

}
</style>