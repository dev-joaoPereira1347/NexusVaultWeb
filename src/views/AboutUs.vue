<template>
    <ion-page>
        <ion-content :fullscreen="true" class="about-content">
            <SiteHeader />

            <UmbrellaHero badge="MUSEU DIGITAL LIVRE" title="Preservando o conhecimento<br />da humanidade"
                description="A NexusVault nasce para guardar, organizar e compartilhar documentos, obras e saberes em domínio público com uma experiência acessível, segura e inspirada por uma comunidade de colaboração constante."
                image-src="/src/assets/images/Logo Umbrella Code.svg" image-alt="Logo da Umbrella Code" />

            <main class="about-main">
                <section class="section-block">
                    <div class="section-header">
                        <span class="eyebrow">NOSSA MISSÃO</span>
                        <h2>O que movemos</h2>
                    </div>

                    <div class="cards-grid">
                        <article class="pillar-card">
                            <div class="icon-wrapper primary">
                                <ion-icon :icon="libraryOutline" aria-hidden="true" />
                            </div>
                            <h3>Curadoria & preservação</h3>
                            <p>
                                Organizamos acervos em diferentes formatos e garantimos que materiais históricos,
                                literários e acadêmicos sejam mantidos com clareza, acesso e integridade.
                            </p>
                        </article>

                        <article class="pillar-card">
                            <div class="icon-wrapper accent">
                                <ion-icon :icon="lockClosedOutline" aria-hidden="true" />
                            </div>
                            <h3>Segurança & integridade</h3>
                            <p>
                                Aplicamos boas práticas de revisão, validação de arquivos e controle de segurança para
                                manter um ambiente confiável e responsável para toda a comunidade.
                            </p>
                        </article>

                        <article class="pillar-card">
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

                <section class="section-block developer-block">
                    <div class="developer-card">
                        <div class="developer-brand">
                            <img src="@/assets/images/Logo Umbrella Code.svg" alt="Logo da Umbrella Code"
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

                <section class="section-block team-section">
                    <div class="section-header team-header">
                        <span class="eyebrow">EQUIPE</span>
                        <h2>Quem constrói a experiência</h2>
                    </div>

                    <div class="team-grid">
                        <article v-for="member in teamMembers" :key="member.name" class="team-card">
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
        </ion-content>
    </ion-page>
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
    width: min(100% - 32px, 1100px);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 72px) 0 clamp(36px, 6vw, 80px);
}

.section-block {
    margin-bottom: clamp(24px, 4vw, 48px);
}

.section-header {
    margin-bottom: 20px;
}

.eyebrow {
    display: inline-flex;
    align-items: center;
    padding: 7px 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(154, 140, 152, 0.28);
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin-bottom: 14px;
}

.section-header h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    line-height: 1.2;
    letter-spacing: -0.04em;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
}

.pillar-card {
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: 24px;
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
    background: rgba(59, 82, 246, 0.1);
    color: var(--color-brand-primary);
}

.icon-wrapper.accent {
    background: rgba(221, 161, 94, 0.15);
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
    padding: 28px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(238, 229, 222, 0.8));
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
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
    background: linear-gradient(180deg, rgba(45, 57, 83, 0.98), rgba(35, 42, 63, 0.98));
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 30px;
    padding: 22px 18px 20px;
    box-shadow: 0 18px 40px rgba(17, 20, 32, 0.18);
    color: var(--color-white);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    overflow: hidden;
}

.team-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 45%, transparent 100%);
    pointer-events: none;
}

.team-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 46px rgba(17, 20, 32, 0.22);
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
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 12px 24px rgba(0, 0, 0, 0.12);
    animation: floatGlow 4s ease-in-out infinite;
}

.team-avatar ion-icon {
    font-size: 2.5rem;
    color: var(--color-white);
}

.team-card h3 {
    margin: 0;
    color: var(--color-white);
    font-size: clamp(1.7rem, 1.45vw, 2.3rem);
    line-height: 1.08;
    letter-spacing: -0.05em;
    text-align: left;
    font-weight: 700;
}

.team-role {
    margin: 18px 0 14px;
    color: rgba(255, 255, 255, 0.96);
    font-size: 0.8rem;
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.team-bio {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.96rem;
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

    .team-card {
        padding: 20px 16px 18px;
    }

    .team-card h3 {
        font-size: 1.9rem;
    }
}
</style>