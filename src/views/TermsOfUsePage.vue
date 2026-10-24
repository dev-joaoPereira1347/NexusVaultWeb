<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="terms-content">
            <SiteHeader />

            <header class="terms-hero nv-page-shell">
                <span class="nv-eyebrow nv-badge">INFORMAÇÕES LEGAIS</span>
                <h1 class="nv-heading-h1">Termos de Uso</h1>
                <p class="nv-page-description">
                    Conheça as regras para utilizar a NexusVault e colaborar com a nossa biblioteca digital.
                </p>
                <p class="terms-updated">Última atualização: 23 de outubro de 2026</p>
            </header>

            <main class="terms-main nv-page-shell">
                <article class="terms-section nv-surface">
                    <h2>1. Aceitação e finalidade</h2>
                    <p>
                        Ao acessar ou utilizar a NexusVault, você concorda com estes Termos de Uso. A plataforma é
                        destinada à organização, preservação e descoberta colaborativa de documentos e materiais de
                        conhecimento. Se não concordar com estas condições, não utilize os serviços nem crie uma conta.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>2. Conta e segurança</h2>
                    <p>
                        Para utilizar recursos que exigem cadastro, forneça informações corretas e mantenha seus dados
                        atualizados. Você é responsável por proteger suas credenciais e pelas atividades realizadas
                        em sua conta. Avise a equipe da plataforma se suspeitar de acesso não autorizado.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>3. Uso aceitável</h2>
                    <p>Ao utilizar a plataforma, você se compromete a:</p>
                    <ul>
                        <li>respeitar a legislação aplicável, estes termos e as Diretrizes da Comunidade;</li>
                        <li>não interferir no funcionamento, na segurança ou no acesso de outras pessoas à plataforma;</li>
                        <li>não usar a plataforma para fraude, assédio, discriminação, distribuição de malware ou
                            qualquer atividade ilícita;</li>
                        <li>não enviar dados pessoais de terceiros sem uma base legítima para fazê-lo.</li>
                    </ul>
                </article>

                <article class="terms-section nv-surface">
                    <h2>4. Conteúdo enviado por usuários</h2>
                    <p>
                        Você é responsável pelo conteúdo que publica, incluindo arquivos, imagens, descrições e
                        metadados. Envie somente materiais que sejam de domínio público, que você tenha criado ou para
                        os quais possua as autorizações necessárias. Não publique conteúdo que viole direitos autorais,
                        outros direitos de terceiros ou a legislação aplicável.
                    </p>
                    <p>
                        A publicação de um material não transfere sua titularidade à NexusVault. Você declara que tem
                        os direitos necessários para disponibilizá-lo e que as informações fornecidas sobre ele são
                        corretas tanto quanto é do seu conhecimento.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>5. Permissão para disponibilizar conteúdo</h2>
                    <p>
                        Ao enviar conteúdo, você concede à NexusVault uma licença não exclusiva e gratuita para
                        armazená-lo, reproduzi-lo e exibi-lo na medida necessária para operar, preservar e apresentar a
                        plataforma, de acordo com as configurações de acesso e a finalidade do serviço. Essa permissão
                        não substitui nem amplia os direitos que você efetivamente possui sobre o material.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>6. Moderação e denúncias</h2>
                    <p>
                        A NexusVault pode analisar denúncias e restringir, remover ou tornar indisponível conteúdo que
                        aparente violar estes termos, as Diretrizes da Comunidade ou direitos de terceiros. Violações
                        também podem resultar na suspensão ou no encerramento de contas, considerando a natureza e a
                        gravidade do caso.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>7. Propriedade intelectual da plataforma</h2>
                    <p>
                        A plataforma, sua identidade visual, seus componentes e seus materiais próprios são protegidos
                        pelas normas aplicáveis de propriedade intelectual. Estes termos não concedem a você direitos
                        sobre esses elementos, exceto a permissão limitada de uso necessária para acessar os serviços.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>8. Privacidade e dados pessoais</h2>
                    <p>
                        O uso da plataforma pode envolver o tratamento de dados pessoais necessários para criar e
                        proteger contas, operar recursos e responder a solicitações. Esses dados devem ser tratados de
                        acordo com a legislação aplicável. Não envie dados pessoais de terceiros sem autorização ou
                        outra base legítima para fazê-lo.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>9. Disponibilidade e alterações</h2>
                    <p>
                        Buscamos manter a plataforma disponível e segura, mas recursos podem ser alterados,
                        interrompidos ou ficar temporariamente indisponíveis para manutenção ou por fatores fora do
                        nosso controle. Estes termos podem ser atualizados; a versão vigente será publicada nesta
                        página. O uso continuado após uma atualização representa a aceitação dos novos termos.
                    </p>
                </article>

                <article class="terms-section nv-surface">
                    <h2>10. Encerramento</h2>
                    <p>
                        Você pode deixar de utilizar a plataforma a qualquer momento. A NexusVault pode suspender ou
                        encerrar o acesso em caso de violação destes termos ou quando necessário para proteger a
                        comunidade, os usuários ou o funcionamento do serviço, sem afastar os direitos previstos na
                        legislação aplicável.
                    </p>
                </article>

                <p class="terms-note">
                    Estes termos devem ser interpretados em conjunto com as
                    <router-link to="/community-guidelines">Diretrizes da Comunidade</router-link>.
                </p>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';
</script>

<style scoped>
.terms-content {
    --background: var(--color-page-background);
}

.terms-hero {
    padding-block: var(--section-gap) var(--space-xl);
}

.terms-hero h1 {
    margin: 14px 0 10px;
}

.terms-hero p {
    max-width: 700px;
}

.terms-updated {
    margin-top: 18px;
    color: var(--color-text-muted);
    font-size: 0.85rem;
}

.terms-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: var(--section-gap);
}

.terms-section {
    padding: var(--surface-padding);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
}

.terms-section h2 {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 1.1rem;
    line-height: 1.35;
}

.terms-section p,
.terms-section li,
.terms-note {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.7;
}

.terms-section p {
    margin: 0;
}

.terms-section p + p {
    margin-top: 12px;
}

.terms-section ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 10px 0 0;
    padding-left: 22px;
}

.terms-section a,
.terms-note a {
    color: var(--color-brand-primary, #3B52F6);
}

.terms-note {
    margin: 0;
}
</style>
