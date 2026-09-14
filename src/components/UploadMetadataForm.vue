<template>
    <section class="form-wrapper" aria-labelledby="metadata-title">
        <h2 id="metadata-title" class="form-title">INFORMAÇÕES DO CONTEÚDO</h2>

        <form @submit.prevent="$emit('submit')">
            <div class="form-group">
                <label for="title">Título</label>
                <input
                    id="title"
                    v-model="form.title"
                    type="text"
                    placeholder="Ex.: Memórias Póstumas de Brás Cubas"
                    class="custom-input"
                    required
                />
            </div>

            <div class="form-group">
                <label for="author">Autor</label>
                <input
                    id="author"
                    v-model="form.author"
                    type="text"
                    placeholder="Nome do autor ou usuário"
                    class="custom-input"
                    required
                />
            </div>

            <div class="form-row">
                <div class="form-group flex-1">
                    <label for="category">Categoria</label>
                    <select id="category" v-model="form.category" class="custom-select" required>
                        <option value="" disabled>Selecione</option>
                        <option value="literatura">Literatura</option>
                        <option value="historia">História &amp; Documentos</option>
                        <option value="tecnico">Técnico &amp; Acadêmico</option>
                        <option value="filosofia">Filosofia</option>
                        <option value="poesia">Poesia</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>

                <div class="form-group flex-1">
                    <label for="type">Tipo</label>
                    <select id="type" v-model="form.type" class="custom-select" required>
                        <option value="" disabled>Selecione</option>
                        <option value="livro">Livro</option>
                        <option value="documento">Documento</option>
                        <option value="poema">Poema</option>
                        <option value="material-tecnico">Material técnico</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group flex-1">
                    <label for="year">Ano</label>
                    <input
                        id="year"
                        v-model="form.year"
                        type="number"
                        min="1"
                        :max="currentYear"
                        placeholder="Ex.: 1899"
                        class="custom-input"
                    />
                </div>

                <div class="form-group flex-1">
                    <label for="language">Idioma</label>
                    <select id="language" v-model="form.language" class="custom-select">
                        <option value="">Selecione</option>
                        <option value="pt">Português</option>
                        <option value="en">Inglês</option>
                        <option value="es">Espanhol</option>
                        <option value="fr">Francês</option>
                        <option value="other">Outro</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="genre">Gênero / Tema <span>(opcional)</span></label>
                <input
                    id="genre"
                    v-model="form.genre"
                    type="text"
                    placeholder="Ex.: Romance, Poesia, Programação..."
                    class="custom-input"
                />
            </div>

            <div class="form-group">
                <label for="description">Descrição <span>(opcional)</span></label>
                <textarea
                    id="description"
                    v-model="form.description"
                    class="custom-textarea"
                    placeholder="Descreva brevemente este conteúdo..."
                    rows="3"
                />
            </div>

            <button type="submit" class="btn-submit-book" :disabled="!isValid || isUploading">
                {{ isUploading ? 'ENVIANDO...' : 'ADICIONAR À BIBLIOTECA' }}
            </button>
        </form>
    </section>
</template>

<script setup lang="ts">
import type { UploadForm } from '../types/upload';

defineProps<{
    isValid: boolean;
    isUploading: boolean;
}>();

const form = defineModel<UploadForm>({ required: true });

defineEmits<{
    (event: 'submit'): void;
}>();

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.form-wrapper {
    padding: 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
}

.form-title {
    margin: 0 0 20px;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    letter-spacing: 0.5px;
}

.form-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-bottom: 14px;
}

.form-group label {
    margin-bottom: 4px;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 700;
}

.form-group label span {
    color: var(--color-text-muted);
    font-weight: 400;
}

.custom-input,
.custom-select,
.custom-textarea {
    width: 100%;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
    background: var(--color-white);
    color: var(--color-text-primary);
    outline: none;
}

.custom-input,
.custom-select {
    min-height: 40px;
    padding: 8px 12px;
}

.custom-textarea {
    min-height: 88px;
    padding: 10px 12px;
    resize: vertical;
}

.custom-input:focus,
.custom-select:focus,
.custom-textarea:focus {
    border-color: var(--color-brand-primary);
    box-shadow: 0 0 0 3px rgba(59, 82, 246, 0.12);
}

.form-row {
    display: flex;
    gap: 12px;
}

.flex-1 {
    flex: 1;
}

.btn-submit-book {
    width: 100%;
    min-height: 44px;
    margin-top: 10px;
    padding: 10px 16px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--color-primary-dark);
    color: var(--color-white);
    cursor: pointer;
    font-weight: 700;
    transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn-submit-book:hover:not(:disabled) {
    background: var(--color-text-primary);
}

.btn-submit-book:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

@media (max-width: 540px) {
    .form-row {
        flex-direction: column;
        gap: 0;
    }
}
</style>
