<template>
    <IonPage>
        <IonModal :is-open="isTermsModalOpen" @didDismiss="closeTermsModal" class="terms-modal">
            <IonHeader class="terms-modal-header">
                <IonToolbar>
                    <IonTitle>Termos de Uso</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            class="terms-close-button"
                            type="button"
                            aria-label="Fechar termos de uso"
                            @click="closeTermsModal"
                        >
                            <IonIcon slot="icon-only" :icon="closeOutline" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent class="terms-modal-content">
                <div class="terms-modal-body nv-surface">
                    <p>
                        Ao acessar ou utilizar a NexusVault, você concorda com estes Termos de Uso. A plataforma é
                        destinada à organização, preservação e descoberta colaborativa de documentos e materiais de
                        conhecimento.
                    </p>
                    <p>
                        Para utilizar recursos que exigem cadastro, forneça informações corretas e mantenha seus dados
                        atualizados. Você é responsável por proteger suas credenciais e pelas atividades realizadas em
                        sua conta.
                    </p>
                    <p>
                        Não use a plataforma para fraude, assédio, discriminação, violação de direitos autorais,
                        distribuição de malware ou qualquer atividade ilícita. Você deve respeitar estas regras e as
                        Diretrizes da Comunidade.
                    </p>
                    <p>
                        O conteúdo enviado por você deve ser de sua autoria ou possuir autorização para uso. A
                        NexusVault pode moderar, remover ou bloquear materiais que violem estes termos ou direitos de
                        terceiros.
                    </p>
                    <p>
                        A plataforma pode tratar dados pessoais necessários para operar contas, serviços e segurança do
                        ambiente. Use a plataforma com responsabilidade e mantenha a confidencialidade de suas
                        credenciais.
                    </p>
                    <p>
                        Estes termos podem ser atualizados, e o uso contínuo da plataforma após alterações indica sua
                        aceitação das novas condições.
                    </p>
                </div>
            </IonContent>
            <IonFooter class="terms-modal-footer">
                <IonToolbar>
                    <div class="terms-footer-actions">
                        <IonButton
                            class="terms-decline-button"
                            expand="block"
                            type="button"
                            @click="declineTermsModal"
                        >
                            Recusar termos
                        </IonButton>
                        <IonButton
                            class="terms-accept-button"
                            expand="block"
                            type="button"
                            @click="acceptTermsModal"
                        >
                            Aceitar termos
                        </IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonModal>

        <IonContent class="auth-content" :scroll-y="true">
            <div class="auth-wrapper">
                <div class="auth-shell">
                    <aside class="auth-visual" aria-label="NexusVault">
                        <img src="@/assets/images/library.webp" alt="Estante de livros em uma biblioteca"
                            class="visual-image" />
                        <div class="visual-content">
                            <div class="visual-copy">
                                <span class="nv-badge nv-badge--inverse">MUSEU DIGITAL ABERTO</span>
                                <h1>Conhecimento merece um lugar para permanecer.</h1>
                                <p>Organize, preserve e encontre as histórias que conectam uma comunidade inteira.</p>
                            </div>
                            <div class="visual-meta"><span class="meta-dot"></span> Acervo colaborativo e acessível
                            </div>
                        </div>
                    </aside>

                    <section class="auth-panel">
                        <div class="brand-header" :class="{ 'brand-header--compact': mode === 'forgot-password' }">
                            <ion-button class="back-button" fill="clear" type="button" aria-label="Voltar à página anterior"
                                @click="goBack">
                                <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                            </ion-button>
                            <div class="logo-container">
                                <router-link to="/home" class="logo-link" aria-label="Ir para a página inicial">
                                    <img src="@/assets/images/NexusVault.svg" alt="NexusVault" class="brand-logo" />
                                </router-link>
                            </div>
                        </div>

                        <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
                            <div class="form-group">
                                <label for="login-email">E-mail</label>
                                <ion-input id="login-email" v-model="loginForm.email" type="email" fill="outline"
                                    placeholder="Digite seu e-mail" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="login-password">Senha</label>
                                <ion-input id="login-password" v-model="loginForm.password" type="password" fill="outline"
                                    placeholder="Digite sua senha" class="custom-input" required />
                            </div>
                            <div class="forgot-link-container">
                                <a class="text-link" @click.prevent="setMode('forgot-password')">Esqueci a senha</a>
                            </div>
                            <button v-if="confirmationRequired" type="button" class="button-link text-link"
                                :disabled="loading || !loginForm.email.trim()"
                                @click="handleResendConfirmation">
                                Reenviar e-mail de confirmação
                            </button>
                            <ion-button type="submit" expand="block" class="primary-button" :disabled="loading">
                                <span v-if="!loading">Entrar</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
                            <ion-button type="button" expand="block" fill="outline" class="secondary-button"
                                :disabled="loading" @click="handleMagicLinkLogin">
                                <span v-if="!loading">Entrar com Magic Link</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
                            <p v-if="magicLinkRequested" class="auth-email-note" role="status">
                                Não recebeu o e-mail? Verifique sua caixa de spam.
                            </p>
                            <div class="switch-mode-text">
                                Não possui uma conta?
                                <a class="text-link font-bold" @click.prevent="setMode('register')">Cadastre-se</a>
                            </div>
                        </form>

                        <form v-else-if="mode === 'register'" class="auth-form" @submit.prevent="handleRegister">
                            <AuthAvatarPicker :preview-url="avatarPreviewUrl"
                                hint="JPEG, PNG ou WebP — convertida automaticamente" @selected="setAvatar" />
                            <div class="form-group">
                                <label for="register-name">Nome Completo</label>
                                <ion-input id="register-name" v-model="registerForm.fullName" type="text" fill="outline"
                                    placeholder="Seu nome completo" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-username">Nome de usuário</label>
                                <ion-input id="register-username" v-model="registerForm.username" type="text" fill="outline"
                                    placeholder="@seu.usuario" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-email">E-mail</label>
                                <ion-input id="register-email" v-model="registerForm.email" type="email" fill="outline"
                                    placeholder="seu.email@exemplo.com" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-password">Senha</label>
                                <div class="password-field">
                                    <ion-input id="register-password" v-model="registerForm.password"
                                        :type="signupPasswordVisible ? 'text' : 'password'" fill="outline"
                                        placeholder="Crie sua senha" class="custom-input password-input"
                                        required :minlength="8" autocomplete="new-password" />
                                    <ion-button class="password-toggle" fill="clear" type="button"
                                        :aria-label="signupPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'"
                                        :aria-pressed="signupPasswordVisible"
                                        @click="signupPasswordVisible = !signupPasswordVisible">
                                        <ion-icon slot="icon-only"
                                            :icon="signupPasswordVisible ? eyeOffOutline : eyeOutline" />
                                    </ion-button>
                                </div>
                                <small class="password-hint">Use pelo menos 8 caracteres.</small>
                            </div>

                            <div class="terms-consent">
                                <input id="register-terms" v-model="termsAccepted" type="checkbox" required />
                                <label for="register-terms">Li e aceito os</label>
                                <button type="button" class="text-link terms-link" @click="openTermsModal">
                                    Termos de Uso
                                </button>
                                <span>da NexusVault.</span>
                            </div>

                            <ion-button type="submit" expand="block" class="primary-button"
                                :disabled="loading || !termsAccepted">
                                <span v-if="!loading">Criar conta</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>

                            <div class="switch-mode-text">
                                Já possui uma conta?
                                <a class="text-link font-bold" @click.prevent="setMode('login')">Faça login</a>
                            </div>
                        </form>

                        <form v-else-if="mode === 'forgot-password'" class="auth-form"
                            @submit.prevent="handleForgotPassword">
                            <header class="auth-intro">
                                <h1 class="nv-heading-h4">Recuperar senha</h1>
                                <p class="nv-page-description">
                                    Digite o e-mail associado à sua conta e enviaremos um link com instruções para
                                    redefinir sua senha.
                                </p>
                            </header>
                            <div class="form-group">
                                <label for="forgot-email">E-mail</label>
                                <ion-input id="forgot-email" v-model="forgotEmail" type="email" fill="outline"
                                    placeholder="Digite seu e-mail" class="custom-input" required />
                            </div>
                            <ion-button type="submit" expand="block" class="primary-button" :disabled="loading">
                                <span v-if="!loading">Enviar E-mail de Recuperação</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
                            <div class="switch-mode-text">
                                Lembrou sua senha?
                                <a class="text-link font-bold" @click.prevent="setMode('login')">Voltar ao login</a>
                            </div>
                        </form>

                        <form v-else class="auth-form" @submit.prevent="handleResetPassword">
                            <header class="auth-intro">
                                <h1 class="nv-heading-h4">Criar nova senha</h1>
                                <p class="nv-page-description">
                                    Crie uma senha forte e segura para sua conta.
                                </p>
                            </header>
                            <div class="form-group">
                                <label for="reset-password">Nova senha</label>
                                <div class="password-field">
                                    <ion-input id="reset-password" v-model="resetPasswordForm.password"
                                        :type="resetPasswordVisible ? 'text' : 'password'" fill="outline"
                                        placeholder="Digite sua nova senha" class="custom-input password-input"
                                        required :minlength="6" autocomplete="new-password" />
                                    <ion-button class="password-toggle" fill="clear" type="button"
                                        :aria-label="resetPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'"
                                        :aria-pressed="resetPasswordVisible"
                                        @click="resetPasswordVisible = !resetPasswordVisible">
                                        <ion-icon slot="icon-only"
                                            :icon="resetPasswordVisible ? eyeOffOutline : eyeOutline" />
                                    </ion-button>
                                </div>
                                <small class="password-hint">Use pelo menos 6 caracteres.</small>
                            </div>
                            <ion-button type="submit" expand="block" class="primary-button" :disabled="loading">
                                <span v-if="!loading">Alterar Senha</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
                        </form>
                    </section>
                </div>
            </div>
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonInput,
    IonModal,
    IonPage,
    IonSpinner,
    IonTitle,
    IonToolbar
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { arrowBackOutline, closeOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import AuthAvatarPicker from '@/components/AuthAvatarPicker.vue';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const termsAccepted = ref(false);
const isTermsModalOpen = ref(false);
const signupPasswordVisible = ref(false);
const resetPasswordVisible = ref(false);

const acceptTermsModal = () => {
    termsAccepted.value = true;
    closeTermsModal();
};

const declineTermsModal = () => {
    termsAccepted.value = false;
    closeTermsModal();
};

const goBack = () => {
    if (mode.value === 'reset-password') {
        setMode('login');
        void router.replace('/auth');
        return;
    }

    if (window.history.length > 1) {
        router.back();
        return;
    }

    void router.replace('/home');
};

const openTermsModal = () => {
    isTermsModalOpen.value = true;
};

const closeTermsModal = () => {
    isTermsModalOpen.value = false;
};

const {
    mode, loading, loginForm, registerForm, forgotEmail, resetPasswordForm,
    avatarPreviewUrl, confirmationRequired, magicLinkRequested, setMode, setAvatar,
    handleLogin, handleRegister, handleMagicLinkLogin, handleResendConfirmation,
    handleForgotPassword, handleResetPassword
} = useAuth();
</script>

<style scoped>
.auth-content {
    --background: var(--color-page-background);
}

.auth-wrapper {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--page-space) var(--page-gutter);
}

.auth-shell {
    display: grid;
    grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 0.9fr);
    width: min(1060px, 100%);
    min-height: 650px;
    overflow: hidden;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-medium);
}

.auth-visual {
    position: relative;
    min-height: 650px;
    overflow: hidden;
    background: #1D2338;
    color: var(--color-white);
}

.visual-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.42;
    mix-blend-mode: luminosity;
}

.auth-visual::after {
    position: absolute;
    inset: 0;
    background: rgba(29, 35, 56, 0.68);
    content: '';
}

.visual-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 38px;
}

.visual-brand {
    color: #FFFFFF;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 3px;
}

.visual-brand span {
    color: #A7B7FF;
}

.visual-copy {
    max-width: 380px;
}

.visual-copy h1 {
    margin: 18px 0 16px;
    color: #FFFFFF;
    font-size: clamp(2rem, 4vw, 3.3rem);
    line-height: 1.08;
    letter-spacing: -0.8px;
}

.visual-copy p {
    max-width: 330px;
    margin: 0;
    color: rgba(255, 255, 255, 0.76);
    font-size: 14px;
    line-height: 1.7;
}

.visual-meta {
    display: flex;
    align-items: center;
    gap: 9px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
}

.meta-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #A7B7FF;
    box-shadow: 0 0 0 5px rgba(167, 183, 255, 0.15);
}

.auth-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px clamp(32px, 6vw, 76px);
}

.brand-header {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    margin-bottom: 38px;
}

.brand-header--compact {
    margin-bottom: 24px;
}

.auth-intro {
    display: grid;
    gap: var(--space-xs);
}

.auth-intro .nv-heading-h4,
.auth-intro .nv-page-description {
    margin: 0;
}

.auth-intro .nv-page-description {
    line-height: 1.6;
}

.back-button {
    position: absolute;
    top: 50%;
    left: 0;
    --color: var(--color-text-secondary, #4A4E69);
    transform: translateY(-50%);
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-link {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
}

.brand-logo {
    width: 124px;
    height: auto;
    object-fit: contain;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 17px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
    text-align: left;
}

.form-group label {
    color: var(--color-text-primary, #22223B);
    font-size: 12px;
    font-weight: 700;
}

.custom-input {
    --background: #fff;
    --border-color: var(--color-border, #c9c7c4);
    --border-radius: var(--radius-control, var(--radius-sm));
    --border-style: solid;
    --border-width: 1px;
    --padding-start: 14px;
    --padding-end: 14px;
    --color: var(--color-text-primary, #22223B);
    --placeholder-color: var(--color-text-muted, #6E6C7C);
    font-size: 13px;
    min-height: var(--control-height);
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.custom-input:focus-within {
    --border-color: var(--color-brand-primary, #3B52F6);
    box-shadow: 0 0 0 3px rgba(59, 82, 246, 0.12);
}

.password-field {
    position: relative;
}

.password-input {
    --padding-end: 48px;
}

.password-toggle {
    position: absolute;
    z-index: 2;
    top: 50%;
    right: 4px;
    width: 40px;
    height: 40px;
    margin: 0;
    --color: var(--color-text-secondary, #4A4E69);
    transform: translateY(-50%);
}

.password-hint {
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.75rem;
}

.forgot-link-container {
    text-align: right;
    margin-top: -4px;
}

.text-link {
    color: var(--color-brand-primary, #3B52F6);
    font-size: 12px;
    text-decoration: none;
    cursor: pointer;
}

.text-link:hover {
    text-decoration: underline;
}

.auth-email-note {
    margin: -8px 0 0;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.75rem;
    line-height: 1.5;
}

.terms-link {
    background: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
}

.terms-consent {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 12px;
    line-height: 1.6;
}

.terms-consent input {
    position: relative;
    display: grid;
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    place-content: center;
    margin: 0 5px 0 0;
    appearance: none;
    border: 1px solid var(--color-border, #8a8790);
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
}

.terms-consent input::before {
    width: 10px;
    height: 6px;
    border: solid #fff;
    border-width: 0 0 2px 2px;
    content: '';
    transform: rotate(-45deg) scale(0);
    transition: transform 0.12s ease;
}

.terms-consent input:checked {
    border-color: var(--color-brand-primary, #3B52F6);
    background: var(--color-brand-primary, #3B52F6);
}

.terms-consent input:checked::before {
    transform: rotate(-45deg) scale(1);
}

.terms-consent input:focus-visible {
    outline: 3px solid rgb(83 83 143 / 24%);
    outline-offset: 2px;
}

.terms-consent label {
    cursor: pointer;
}

.switch-mode-text {
    text-align: center;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 12px;
    line-height: 1.6;
    margin-top: 7px;
}

.font-bold {
    font-weight: 700;
}

.button-link {
    display: inline-block;
    margin: 0 auto;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font: inherit;
}

.primary-button {
    --background: var(--color-primary-dark, #2D2D2D);
    --background-hover: #111827;
    --color: #FFFFFF;
    --border-radius: var(--radius-control, var(--radius-sm));
    font-weight: 700;
    height: 48px;
    margin-top: 7px;
    text-transform: none;
}

.primary-button[disabled] {
    --background: var(--color-primary-dark, #2D2D2D);
    --color: #FFFFFF;
    opacity: 0.72;
}

.secondary-button {
    --background: var(--color-surface);
    --background-hover: var(--color-surface-alt);
    --color: var(--color-text-primary, #22223B);
    --border-color: var(--color-border, #777);
    --border-width: 1px;
    --border-radius: var(--radius-control, var(--radius-sm));
    font-weight: 700;
    height: 48px;
    margin-top: -4px;
    text-transform: none;
}

.terms-modal {
    --height: min(80vh, 760px);
    --width: min(760px, 92vw);
    --border-radius: var(--radius-lg);
}

.terms-modal-content {
    --background: var(--color-surface);
}

.terms-modal-body {
    box-sizing: border-box;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-md) var(--space-md) calc(var(--space-xl) + var(--space-lg) + env(safe-area-inset-bottom, 0px));
    color: var(--color-text-primary, #22223B);
    line-height: 1.6;
}

.terms-modal-body p {
    margin: 0 0 12px;
    color: var(--color-text-secondary, #4A4E69);
    line-height: inherit;
}

:global(ion-modal.terms-modal ion-header ion-toolbar) {
    --background: var(--color-primary-dark);
    --color: var(--color-white);
    --border-color: transparent;
    --min-height: 56px;
}

:global(ion-modal.terms-modal ion-header ion-title) {
    color: var(--color-white);
    font-weight: 700;
}

.terms-close-button {
    --color: var(--color-white);
    --border-radius: 50%;
    min-width: 44px;
    min-height: 44px;
    margin-inline-end: var(--space-xs);
}

:global(ion-modal.terms-modal ion-footer) {
    --background: var(--color-surface);
}

:global(ion-modal.terms-modal ion-footer ion-toolbar) {
    --background: var(--color-surface);
    --color: var(--color-text-primary);
    --padding-start: var(--space-md);
    --padding-end: var(--space-md);
    --padding-top: var(--space-sm);
    --padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
}

.terms-accept-button {
    --background: var(--color-primary-dark);
    --background-hover: #1a1a1a;
    --color: #fff;
    --border-radius: var(--radius-control);
    min-height: var(--control-height);
    margin: 0;
    font-weight: 700;
    text-transform: none;
}

.terms-accept-button::part(native) {
    color: #fff;
}

.terms-footer-actions {
    display: flex;
    gap: var(--space-sm);
}

.terms-footer-actions ion-button {
    flex: 1;
    min-width: 0;
}

.terms-decline-button {
    --background: var(--color-surface);
    --background-hover: var(--color-surface-alt);
    --color: var(--color-text-primary);
    --border-color: var(--color-border-soft);
    --border-style: solid;
    --border-width: 1px;
    --border-radius: var(--radius-control);
    min-height: var(--control-height);
    margin: 0;
    font-weight: 700;
    text-transform: none;
}

@media (max-width: 780px) {
    .auth-wrapper {
        padding: 20px 14px;
    }

    .auth-shell {
        display: block;
        min-height: auto;
        border-radius: var(--radius-lg, 16px);
    }

    .auth-visual {
        display: none;
    }

    .auth-panel {
        padding: 36px 24px 40px;
    }

    .terms-modal {
        --height: 100%;
        --width: 100%;
        --max-height: 100%;
        --max-width: 100%;
        --border-radius: 0;
    }

    .terms-modal-body {
        max-width: none;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: var(--color-surface);
        padding: var(--space-md);
        padding-bottom: calc(var(--space-xl) + var(--space-lg) + env(safe-area-inset-bottom, 0px));
    }
}

@media (max-width: 420px) {
    .auth-panel {
        padding: 28px 18px 32px;
    }

    .brand-header {
        margin-bottom: 30px;
    }
}
</style>
