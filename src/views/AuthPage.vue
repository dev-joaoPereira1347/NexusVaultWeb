<template>
    <IonPage>
        <IonContent class="auth-content" :scroll-y="true">
            <div class="auth-wrapper">
                <div class="auth-shell">
                    <aside class="auth-visual" aria-label="NexusVault">
                        <img src="@/assets/images/library.webp" alt="Estante de livros em uma biblioteca"
                            class="visual-image" />
                        <div class="visual-content">
                            <div class="visual-copy">
                                <span class="eyebrow">MUSEU DIGITAL ABERTO</span>
                                <h1>Conhecimento merece um lugar para permanecer.</h1>
                                <p>Organize, preserve e encontre as histórias que conectam uma comunidade inteira.</p>
                            </div>
                            <div class="visual-meta"><span class="meta-dot"></span> Acervo colaborativo e acessível
                            </div>
                        </div>
                    </aside>

                    <section class="auth-panel">
                        <div class="brand-header">
                            <div class="logo-container">
                                <router-link to="/home" class="logo-link" aria-label="Ir para a página inicial">
                                    <img src="@/assets/images/NexusVault.svg" alt="NexusVault" class="brand-logo" />
                                </router-link>
                            </div>
                        </div>

                        <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
                            <div class="form-group">
                                <label for="login-email">E-mail</label>
                                <ion-input id="login-email" v-model="loginForm.email" type="email"
                                    placeholder="Digite seu e-mail" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="login-password">Senha</label>
                                <ion-input id="login-password" v-model="loginForm.password" type="password"
                                    placeholder="Digite sua senha" class="custom-input" required />
                            </div>
                            <div class="forgot-link-container">
                                <a class="text-link" @click.prevent="setMode('forgot-password')">Esqueci a senha</a>
                            </div>
                            <ion-button type="submit" expand="block" class="primary-button" :disabled="loading">
                                <span v-if="!loading">Entrar</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
                            <ion-button type="button" expand="block" fill="clear" class="secondary-button"
                                :disabled="loading" @click="handleMagicLinkLogin">
                                <span v-if="!loading">Entrar com Magic Link</span>
                                <ion-spinner v-else name="crescent" />
                            </ion-button>
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
                                <ion-input id="register-name" v-model="registerForm.fullName" type="text"
                                    placeholder="Seu nome completo" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-username">Nome de usuário</label>
                                <ion-input id="register-username" v-model="registerForm.username" type="text"
                                    placeholder="@seu.usuario" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-email">E-mail</label>
                                <ion-input id="register-email" v-model="registerForm.email" type="email"
                                    placeholder="seu.email@exemplo.com" class="custom-input" required />
                            </div>
                            <div class="form-group">
                                <label for="register-password">Senha</label>
                                <ion-input id="register-password" v-model="registerForm.password" type="password"
                                    placeholder="Crie sua senha" class="custom-input" required />
                            </div>

                            <ion-button type="submit" expand="block" class="primary-button" :disabled="loading">
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
                            <div class="form-group">
                                <label for="forgot-email">E-mail cadastrado</label>
                                <ion-input id="forgot-email" v-model="forgotEmail" type="email"
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
                            <div class="form-group">
                                <label for="reset-password">Nova senha</label>
                                <ion-input id="reset-password" v-model="resetPasswordForm.password" type="password"
                                    placeholder="Digite sua nova senha" class="custom-input" required :minlength="6" />
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
import { IonButton, IonContent, IonInput, IonPage, IonSpinner } from '@ionic/vue';
import AuthAvatarPicker from '@/components/AuthAvatarPicker.vue';
import { useAuth } from '@/composables/useAuth';

const {
    mode, loading, loginForm, registerForm, forgotEmail, resetPasswordForm,
    avatarPreviewUrl, setMode, setAvatar,
    handleLogin, handleRegister, handleMagicLinkLogin, handleForgotPassword, handleResetPassword
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

.eyebrow {
    color: #A7B7FF;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
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
    margin-bottom: 38px;
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
    --background: var(--color-surface);
    --border-color: var(--color-border-soft);
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

.secondary-button {
    --background: transparent;
    --background-hover: rgba(59, 82, 246, 0.06);
    --color: var(--color-brand-primary, #3B52F6);
    --border-radius: var(--radius-control, var(--radius-sm));
    font-weight: 700;
    height: 48px;
    margin-top: -4px;
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
