<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="privacy-content">
            <SiteHeader />

            <header class="privacy-hero nv-page-shell">
                <span class="nv-eyebrow nv-badge">INFORMAÇÕES LEGAIS</span>
                <h1 class="nv-heading-h1">Política de Privacidade</h1>
                <p class="nv-page-description">
                    Esta política explica quais dados pessoais a NexusVault trata, para quais finalidades e como você
                    pode exercer seus direitos.
                </p>
                <p class="privacy-updated">Última atualização: 27 de outubro de 2026</p>
            </header>

            <main class="privacy-main nv-page-shell">
                <article class="privacy-section nv-surface">
                    <h2>1. Quem é responsável pelo tratamento</h2>
                    <p>
                        A Umbrella Code, responsável pela NexusVault, atua como controladora dos dados pessoais
                        tratados no serviço, nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD). O
                        encarregado pelo tratamento de dados pessoais é Mateus Gomes.
                    </p>
                    <address>
                        Rua Frederico Grotte, 322 - Jardim São Luís, São Paulo - SP, 05818-270<br />
                        Solicitações de privacidade/LGPD:
                        <a href="mailto:nexusvault.suporte@umbrellacode.com">nexusvault.suporte@umbrellacode.com</a>
                    </address>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>2. Dados tratados</h2>
                    <ul>
                        <li>
                            <strong>Conta:</strong> endereço de e-mail, senha de autenticação (validada e gerenciada
                            pelo Supabase Auth, sem ser armazenada nos campos de perfil), identificador da conta, nome
                            completo e nome de usuário.
                        </li>
                        <li>
                            <strong>Perfil:</strong> nome de usuário e foto de perfil. O e-mail é usado para autenticação
                            e comunicações da conta; não é exibido no perfil público.
                        </li>
                        <li>
                            <strong>Conteúdo enviado:</strong> arquivos, capas e metadados fornecidos, como título,
                            autoria, categoria, tipo, ano, idioma e descrição, além do nome, formato e tamanho do
                            arquivo.
                        </li>
                        <li>
                            <strong>Uso da conta:</strong> progresso de leitura, avaliações e comentários, coleções,
                            livros adicionados a elas e preferências de visibilidade pública.
                        </li>
                        <li>
                            <strong>Denúncias:</strong> motivo, detalhes que você decidir escrever, identificador de
                            quem denunciou e o item ou perfil denunciado, além do estado da análise pela moderação.
                        </li>
                        <li>
                            <strong>Dados no dispositivo:</strong> a sessão de autenticação é persistida para manter o
                            login. O leitor pode guardar localmente a última página consultada; durante a confirmação
                            de cadastro, uma foto escolhida pode ficar temporariamente no armazenamento local até ser
                            sincronizada.
                        </li>
                    </ul>
                    <p>
                        Evite inserir dados pessoais sensíveis seus ou de terceiros em comentários, denúncias,
                        descrições ou arquivos enviados, salvo quando estritamente necessário e permitido por lei.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>3. Finalidades e bases legais</h2>
                    <p>Os dados são tratados, conforme o recurso utilizado, para:</p>
                    <ul>
                        <li>criar e proteger contas, autenticar usuários e permitir alterações de perfil e senha;</li>
                        <li>armazenar e apresentar materiais enviados, organizar coleções e permitir a leitura;</li>
                        <li>salvar progresso de leitura e avaliações solicitadas pelo usuário;</li>
                        <li>verificar arquivos, prevenir abuso, analisar denúncias e proteger a comunidade;</li>
                        <li>responder a solicitações, cumprir obrigações legais e defender direitos em processos.</li>
                    </ul>
                    <p>
                        As bases legais podem incluir a execução de serviços solicitados, o cumprimento de obrigações
                        legais ou regulatórias, o exercício regular de direitos e o legítimo interesse em segurança,
                        prevenção a fraude e moderação, com respeito aos direitos e às expectativas dos titulares.
                        Quando uma funcionalidade depender de consentimento, ele será solicitado e poderá ser revogado
                        nos termos da lei.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>4. O que fica público</h2>
                    <p>
                        O acervo é colaborativo. Materiais aprovados para publicação, seus metadados e capas ficam
                        acessíveis publicamente. O nome de usuário e a foto podem aparecer no perfil público, em
                        avaliações ou junto a contribuições. Avaliações e comentários são visíveis a outras pessoas.
                    </p>
                    <p>
                        Coleções começam privadas; se você alterar a visibilidade para pública, o nome da coleção e os
                        livros incluídos poderão ser vistos no perfil público. O progresso de leitura e o endereço de
                        e-mail não são apresentados como conteúdo público. Considere que conteúdo público pode ser
                        copiado ou indexado por terceiros.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>5. Verificação de arquivos e compartilhamento</h2>
                    <p>
                        Para verificar a segurança dos envios, a NexusVault calcula hashes criptográficos dos arquivos
                        e consulta o VirusTotal. Se ainda não houver um resultado disponível para o hash, o arquivo ou
                        a capa pode ser enviado ao VirusTotal para análise. O fornecedor pode tratar o arquivo,
                        identificadores de análise e resultados de acordo com seus próprios termos e políticas. Não
                        envie conteúdo confidencial ou dados pessoais de terceiros sem autorização e base legal.
                    </p>
                    <p>
                        A plataforma também utiliza Supabase para autenticação, banco de dados, armazenamento e
                        funções de servidor. E-mails de confirmação, recuperação e segurança são enviados pelo serviço
                        de autenticação e pelo provedor de e-mail configurado pelo operador. Esses fornecedores tratam
                        dados para prestar os serviços contratados e podem processá-los em outras localidades,
                        conforme suas configurações e políticas.
                    </p>
                    <p>
                        Esses fornecedores também podem gerar registros técnicos de operação e segurança, como
                        endereço IP, horário de acesso e informações do navegador ou dispositivo, conforme a
                        configuração do serviço e as políticas próprias de cada fornecedor.
                    </p>
                    <p>
                        Dados podem ser fornecidos a autoridades quando houver obrigação legal ou solicitação válida,
                        e a pessoas responsáveis pela moderação quando necessário para analisar denúncias.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>6. Cookies e armazenamento local</h2>
                    <p>
                        A aplicação usa armazenamento local do navegador ou do dispositivo para manter a sessão de
                        autenticação e, em situações específicas, guardar o progresso local do leitor ou uma foto
                        pendente de sincronização. Esses dados ajudam a fornecer funções solicitadas e não são usados,
                        pela implementação atual, para publicidade comportamental. Você pode removê-los nas
                        configurações do navegador ou dispositivo, mas isso pode encerrar sua sessão ou apagar dados
                        locais que ainda não tenham sido sincronizados.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>7. Segurança</h2>
                    <p>
                        A plataforma utiliza controles de acesso, autenticação e políticas de acesso ao banco e aos
                        arquivos para limitar operações conforme a conta e a finalidade. Nenhuma transmissão ou
                        armazenamento eletrônico é totalmente livre de riscos. Mantenha sua senha em sigilo e avise o
                        responsável pelo serviço ao suspeitar de acesso indevido.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>8. Retenção e exclusão</h2>
                    <p>
                        Os dados de conta são mantidos enquanto a conta estiver ativa ou enquanto forem necessários
                        para as finalidades descritas, obrigações legais e exercício de direitos. A aplicação permite
                        solicitar a exclusão da conta e excluir alguns registros individualmente. A exclusão da conta
                        remove o usuário e os registros de banco relacionados por regras de dependência.
                    </p>
                    <p>
                        <strong>Atenção:</strong> o fluxo atual de exclusão de conta não remove explicitamente os
                        objetos dos buckets de armazenamento. Arquivos enviados e avatares podem permanecer acessíveis
                        por seus endereços diretos após a exclusão da conta até que sejam removidos do armazenamento.
                        O operador deve corrigir esse fluxo e definir os prazos de retenção aplicáveis antes de
                        apresentar a exclusão como remoção integral de todos os dados.
                    </p>
                    <p>
                        O progresso salvo exclusivamente no dispositivo pode continuar nele depois da exclusão da
                        conta; remova os dados locais do navegador ou aplicativo para apagá-lo.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>9. Seus direitos</h2>
                    <p>
                        Nos termos da LGPD, você pode solicitar confirmação e acesso ao tratamento, correção de dados
                        incompletos ou desatualizados, informação sobre compartilhamentos, anonimização, bloqueio ou
                        eliminação quando cabível, portabilidade, oposição e revisão de decisões automatizadas nos
                        casos previstos em lei, além de revogar consentimento quando essa for a base utilizada.
                    </p>
                    <p>
                        Você pode corrigir dados de perfil, excluir progresso, avaliações, coleções e contribuições
                        disponíveis na sua área de conta, ou solicitar a exclusão da conta. Para outros pedidos, use o
                        canal oficial de privacidade do controlador. Esse canal ainda precisa ser informado nesta
                        aplicação; não envie dados sensíveis em denúncias públicas ou redes sociais.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>10. Crianças e adolescentes</h2>
                    <p>
                        A plataforma não solicita dados de crianças como requisito próprio de uso. Se o tratamento de
                        dados de criança ou adolescente ocorrer, ele deverá observar as regras aplicáveis e o melhor
                        interesse da pessoa titular. O responsável deve entrar em contato pelo canal oficial de
                        privacidade para relatar uma situação desse tipo.
                    </p>
                </article>

                <article class="privacy-section nv-surface">
                    <h2>11. Alterações desta política</h2>
                    <p>
                        Esta política pode ser atualizada para refletir mudanças no serviço ou nas exigências legais.
                        A data no início da página indica a revisão mais recente. Mudanças relevantes devem ser
                        comunicadas de forma adequada aos usuários.
                    </p>
                </article>

                <p class="privacy-note">
                    Esta página descreve a implementação identificada no código do projeto e não substitui a revisão
                    jurídica pelo controlador responsável. Consulte também os
                    <router-link to="/terms">Termos de Uso</router-link>.
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
.privacy-content {
    --background: var(--color-page-background);
}

.privacy-hero {
    padding-block: var(--section-gap) var(--space-xl);
}

.privacy-hero h1 {
    margin: 14px 0 10px;
}

.privacy-hero p {
    max-width: 720px;
}

.privacy-updated {
    margin-top: 18px;
    color: var(--color-text-muted);
    font-size: 0.85rem;
}

.privacy-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: var(--section-gap);
}

.privacy-section {
    padding: var(--surface-padding);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
}

.privacy-section h2 {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 1.1rem;
    line-height: 1.35;
}

.privacy-section p,
.privacy-section li,
.privacy-note,
.privacy-section address {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.7;
}

.privacy-section address {
    margin-top: 12px;
    font-style: normal;
}

.privacy-section p {
    margin: 0;
}

.privacy-section p + p {
    margin-top: 12px;
}

.privacy-section ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 10px 0 0;
    padding-left: 22px;
}

.privacy-section p + ul {
    margin-top: 10px;
}

.privacy-section a,
.privacy-note a {
    color: var(--color-brand-primary, #3B52F6);
}

.privacy-note {
    margin: 0;
}
</style>
