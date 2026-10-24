<template>
    <section ref="formSection" class="form-wrapper" aria-labelledby="metadata-title" tabindex="-1">
        <h2 id="metadata-title" class="form-title" tabindex="-1">REVISE AS INFORMAÇÕES</h2>
        <p class="form-intro">Confira os dados encontrados e complete os campos destacados antes de enviar.</p>

        <form @submit.prevent="$emit('submit')">
            <div class="form-group">
                <label :for="fieldId('title')">
                    Título
                    <span v-if="isAutoFilled('title')" class="auto-filled-indicator">Encontrado automaticamente</span>
                </label>
                <input
                    :id="fieldId('title')"
                    v-model="form.title"
                    type="text"
                    placeholder="Ex.: Memórias Póstumas de Brás Cubas"
                    class="custom-input"
                    :class="{ 'metadata-field-missing': metadataMissingFields.includes('title') }"
                    :aria-invalid="metadataMissingFields.includes('title') ? 'true' : undefined"
                    :aria-describedby="metadataMissingFields.includes('title') ? fieldId('title-metadata-error') : undefined"
                    required
                />
                <p v-if="metadataMissingFields.includes('title')" :id="fieldId('title-metadata-error')" class="metadata-field-error">
                    Título não identificado. Informe manualmente.
                </p>
            </div>

            <div class="form-group">
                <label :for="fieldId('author')">
                    Autor
                    <span v-if="isAutoFilled('author')" class="auto-filled-indicator">Encontrado automaticamente</span>
                </label>
                <input
                    :id="fieldId('author')"
                    v-model="form.author"
                    type="text"
                    placeholder="Nome do autor ou usuário"
                    class="custom-input"
                    :class="{ 'metadata-field-missing': metadataMissingFields.includes('author') }"
                    :aria-invalid="metadataMissingFields.includes('author') ? 'true' : undefined"
                    :aria-describedby="metadataMissingFields.includes('author') ? fieldId('author-metadata-error') : undefined"
                    required
                />
                <p v-if="metadataMissingFields.includes('author')" :id="fieldId('author-metadata-error')" class="metadata-field-error">
                    Autor não identificado. Informe manualmente.
                </p>
            </div>

            <div class="form-row">
                <div class="form-group flex-1">
                    <label :for="fieldId('category')">
                        Categoria
                        <span v-if="isAutoFilled('category')" class="auto-filled-indicator">Encontrada automaticamente</span>
                    </label>
                    <select
                        :id="fieldId('category')"
                        v-model="form.category"
                        class="custom-select"
                        :class="{ 'metadata-field-missing': metadataMissingFields.includes('category') }"
                        :aria-invalid="metadataMissingFields.includes('category') ? 'true' : undefined"
                        :aria-describedby="metadataMissingFields.includes('category') ? fieldId('category-metadata-error') : undefined"
                        required
                    >
                        <option value="" disabled>Selecione</option>
                        <option value="literatura">Literatura</option>
                        <option value="historia">História &amp; Documentos</option>
                        <option value="tecnico">Técnico &amp; Acadêmico</option>
                        <option value="filosofia">Filosofia</option>
                        <option value="poesia">Poesia</option>
                        <option value="outros">Outros</option>
                    </select>
                    <p v-if="metadataMissingFields.includes('category')" :id="fieldId('category-metadata-error')" class="metadata-field-error">
                        Categoria não identificada. Selecione manualmente.
                    </p>
                </div>

                <div class="form-group flex-1">
                    <label :for="fieldId('type')">
                        Tipo
                        <span v-if="isAutoFilled('type')" class="auto-filled-indicator">Encontrado automaticamente</span>
                    </label>
                    <select
                        :id="fieldId('type')"
                        v-model="form.type"
                        class="custom-select"
                        :class="{ 'metadata-field-missing': metadataMissingFields.includes('type') }"
                        :aria-invalid="metadataMissingFields.includes('type') ? 'true' : undefined"
                        :aria-describedby="metadataMissingFields.includes('type') ? fieldId('type-metadata-error') : undefined"
                        required
                    >
                        <option value="" disabled>Selecione</option>
                        <option value="livro">Livro</option>
                        <option value="documento">Documento</option>
                        <option value="poema">Poema</option>
                        <option value="material-tecnico">Material técnico</option>
                        <option value="outro">Outro</option>
                    </select>
                    <p v-if="metadataMissingFields.includes('type')" :id="fieldId('type-metadata-error')" class="metadata-field-error">
                        Tipo não identificado. Selecione manualmente.
                    </p>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group flex-1">
                    <label :for="fieldId('year')">
                        Ano
                        <span v-if="isAutoFilled('year')" class="auto-filled-indicator">Encontrado automaticamente</span>
                    </label>
                    <input
                        :id="fieldId('year')"
                        :value="form.year"
                        type="number"
                        min="1000"
                        :max="currentYear + 1"
                        step="1"
                        placeholder="Ex.: 1899"
                        class="custom-input"
                        :class="{ 'metadata-field-missing': metadataMissingFields.includes('year') }"
                        :aria-invalid="metadataMissingFields.includes('year') ? 'true' : undefined"
                        :aria-describedby="metadataMissingFields.includes('year') ? fieldId('year-metadata-error') : undefined"
                        @input="updateYear"
                        required
                    />
                    <p v-if="metadataMissingFields.includes('year')" :id="fieldId('year-metadata-error')" class="metadata-field-error">
                        Ano não identificado. Informe manualmente.
                    </p>
                </div>

                <div class="form-group flex-1">
                    <label :for="fieldId('language')">
                        Idioma
                        <span v-if="isAutoFilled('language')" class="auto-filled-indicator">Encontrado automaticamente</span>
                    </label>
                    <select
                        :id="fieldId('language')"
                        v-model="form.language"
                        class="custom-select"
                        :class="{ 'metadata-field-missing': metadataMissingFields.includes('language') }"
                        :aria-describedby="metadataMissingFields.includes('language') ? fieldId('language-metadata-error') : undefined"
                    >
                        <option value="">Selecione</option>
                        <option v-for="language in languages" :key="language.code" :value="language.code">
                            {{ language.name }}
                        </option>
                    </select>
                    <p v-if="metadataMissingFields.includes('language')" :id="fieldId('language-metadata-error')" class="metadata-field-error">
                        Idioma não identificado. Selecione manualmente.
                    </p>
                </div>
            </div>

            <div class="form-group">
                <label :for="fieldId('genre-input')">
                    Gêneros / Temas <span>(opcional, selecione vários)</span>
                    <span v-if="isAutoFilled('genre')" class="auto-filled-indicator">Encontrados automaticamente</span>
                </label>
                <div
                    class="genre-picker"
                    :class="{ 'metadata-field-missing': metadataMissingFields.includes('genre') }"
                    role="group"
                    :aria-describedby="metadataMissingFields.includes('genre') ? fieldId('genre-metadata-error') : undefined"
                >
                    <div v-if="genreTags.length" class="genre-tags" aria-label="Temas selecionados">
                        <span v-for="tag in genreTags" :key="tag" class="genre-tag">
                            {{ tag }}
                            <button type="button" :aria-label="`Remover tema ${tag}`" @click="removeGenreTag(tag)">×</button>
                        </span>
                    </div>
                    <div class="genre-suggestions" aria-label="Temas sugeridos">
                        <button
                            v-for="suggestion in genreSuggestions"
                            :key="suggestion"
                            type="button"
                            class="genre-suggestion"
                            :aria-pressed="hasGenreTag(suggestion)"
                            @click="toggleGenreTag(suggestion)"
                        >
                            {{ suggestion }}
                        </button>
                    </div>
                    <div class="genre-custom-entry">
                        <input
                            :id="fieldId('genre-input')"
                            v-model="genreDraft"
                            type="text"
                            class="custom-input"
                            placeholder="Adicionar outro tema"
                            @keydown.enter.prevent="addGenreTag"
                        />
                        <button type="button" class="btn-add-genre" :disabled="!genreDraft.trim()" @click="addGenreTag">
                            Adicionar
                        </button>
                    </div>
                </div>
                <p v-if="metadataMissingFields.includes('genre')" :id="fieldId('genre-metadata-error')" class="metadata-field-error">
                    Nenhum tema foi identificado. Selecione ou adicione um, se desejar.
                </p>
            </div>

            <div class="form-group">
                <label :for="fieldId('cover')">Capa <span>(opcional)</span></label>

                <div class="cover-upload">
                    <input
                        :id="fieldId('cover')"
                        ref="coverInput"
                        type="file"
                        accept="image/*"
                        class="hidden-cover-input"
                        @change="handleCoverChange"
                    />

                    <div class="cover-actions">
                        <button type="button" class="btn-cover-select" @click="openCoverPicker">
                            {{ form.cover ? 'Trocar capa' : 'Selecionar capa' }}
                        </button>

                        <button
                            v-if="form.cover"
                            type="button"
                            class="btn-remove-cover"
                            @click="removeCover"
                        >
                            Remover
                        </button>
                    </div>

                    <div v-if="coverPreview" class="cover-preview">
                        <img :src="coverPreview" :alt="`Capa selecionada: ${form.cover?.name ?? 'imagem'}`" />
                    </div>

                    <span v-if="form.cover" class="cover-name">{{ form.cover.name }}</span>
                    <p v-if="coverMetadataWarning && !form.cover" class="metadata-field-error">
                        Não foi possível carregar a capa encontrada. Você pode selecionar uma imagem.
                    </p>
                </div>
            </div>

            <div class="form-group">
                <label :for="fieldId('description')">
                    Descrição <span>(opcional)</span>
                    <span v-if="isAutoFilled('description')" class="auto-filled-indicator">Encontrada automaticamente</span>
                </label>
                <textarea
                    :id="fieldId('description')"
                    v-model="form.description"
                    class="custom-textarea"
                    placeholder="Descreva brevemente este conteúdo..."
                    rows="6"
                    maxlength="3000"
                    :class="{ 'metadata-field-missing': metadataMissingFields.includes('description') }"
                    :aria-describedby="metadataMissingFields.includes('description') ? fieldId('description-metadata-error') : undefined"
                />
                <span class="character-count">{{ form.description.length }}/3000 caracteres</span>
                <p v-if="metadataMissingFields.includes('description')" :id="fieldId('description-metadata-error')" class="metadata-field-error">
                    Descrição não identificada. Você pode preenchê-la manualmente.
                </p>
            </div>

            <div v-if="showRightsDeclaration" class="rights-declaration">
                <input
                    :id="fieldId('rights-declaration')"
                    v-model="form.rightsDeclarationAccepted"
                    type="checkbox"
                    required
                />
                <label :for="fieldId('rights-declaration')">
                    Declaro que o conteúdo é de domínio público ou está devidamente licenciado e que posso compartilhá-lo.
                </label>
            </div>

            <button type="submit" class="btn-submit-book" :disabled="!isValid || isUploading">
                {{ isUploading ? 'SALVANDO...' : submitLabel }}
            </button>
        </form>
    </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { UploadForm } from '../types/upload';

type MetadataField = 'title' | 'author' | 'category' | 'type' | 'year' | 'language' | 'genre' | 'description';
type AutoFilledField = 'title' | 'author' | 'category' | 'type' | MetadataField;

const props = withDefaults(defineProps<{
    isValid: boolean;
    isUploading: boolean;
    metadataMissingFields?: MetadataField[];
    autoFilledFields?: AutoFilledField[];
    coverMetadataWarning?: boolean;
    submitLabel?: string;
    idPrefix?: string;
    showRightsDeclaration?: boolean;
}>(), {
    submitLabel: 'ADICIONAR À BIBLIOTECA',
    metadataMissingFields: () => [],
    autoFilledFields: () => [],
    coverMetadataWarning: false,
    idPrefix: '',
    showRightsDeclaration: false
});

const form = defineModel<UploadForm>({ required: true });
const fieldId = (name: string) => props.idPrefix ? `${props.idPrefix}-${name}` : name;
const currentYear = new Date().getFullYear();
const formSection = ref<HTMLElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);
const coverPreview = ref('');
const genreDraft = ref('');
const genreSuggestions = [
    'Ficção', 'Romance', 'Fantasia', 'Ficção científica', 'Mistério',
    'História', 'Biografia', 'Poesia', 'Filosofia', 'Programação'
];
const languageDisplayNames = new Intl.DisplayNames(['pt'], { type: 'language' });
const languageCodes = (
    'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'
).split(' ');
const languages = languageCodes.map((code) => ({
    code,
    name: languageDisplayNames.of(code) ?? code
}));
watch(() => form.value.language, (language) => {
    if (language && !languageCodes.includes(language)) form.value.language = '';
}, { immediate: true });
const genreTags = computed({
    get: () => [...new Set(form.value.genre.split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean))],
    set: (tags: string[]) => {
        form.value.genre = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].join(', ');
    }
});
let activeCoverObjectUrl: string | null = null;

const updateYear = (event: Event) => {
    form.value.year = (event.target as HTMLInputElement).value;
};

const isAutoFilled = (field: AutoFilledField) => props.autoFilledFields.includes(field);
const hasGenreTag = (tag: string) => genreTags.value.some((existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase());

const toggleGenreTag = (tag: string) => {
    genreTags.value = hasGenreTag(tag)
        ? genreTags.value.filter((existing) => existing.toLocaleLowerCase() !== tag.toLocaleLowerCase())
        : [...genreTags.value, tag];
};

const removeGenreTag = (tag: string) => {
    genreTags.value = genreTags.value.filter((existing) => existing !== tag);
};

const addGenreTag = () => {
    const tag = genreDraft.value.trim();
    if (!tag || hasGenreTag(tag)) return;
    genreTags.value = [...genreTags.value, tag];
    genreDraft.value = '';
};

const releaseCoverPreview = () => {
    if (!activeCoverObjectUrl) return;

    URL.revokeObjectURL(activeCoverObjectUrl);
    activeCoverObjectUrl = null;
};

watch(
    () => form.value?.cover,
    (coverFile, previousFile) => {
        if (coverFile === previousFile && coverFile) {
            return;
        }

        releaseCoverPreview();

        if (!coverFile) {
            if (coverInput.value) {
                coverInput.value.value = '';
            }
            coverPreview.value = '';
            return;
        }

        activeCoverObjectUrl = URL.createObjectURL(coverFile);
        coverPreview.value = activeCoverObjectUrl;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    releaseCoverPreview();
});

const openCoverPicker = () => {
    coverInput.value?.click();
};

const handleCoverChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0] ?? null;

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
        input.value = '';
        window.alert('Selecione um arquivo de imagem.');
        return;
    }

    form.value.cover = selectedFile;
    input.value = '';
};

const removeCover = () => {
    form.value.cover = null;
    if (coverInput.value) {
        coverInput.value.value = '';
    }
};

defineEmits<{
    (event: 'submit'): void;
}>();
</script>

<style scoped>
.form-wrapper {
    padding: 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
}

.form-title {
    margin: 0 0 6px;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    letter-spacing: 0.5px;
}

.form-intro {
    margin: 0 0 20px;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

.form-group label .auto-filled-indicator {
    display: inline-flex;
    margin-left: 6px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(22, 125, 89, 0.1);
    color: #167d59 !important;
    font-size: 0.68rem;
    font-weight: 700 !important;
}

.form-wrapper :focus-visible {
    outline-color: var(--color-brand-primary);
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

.hidden-cover-input {
    display: none;
}

.cover-upload {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.cover-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn-cover-select,
.btn-remove-cover {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    font-weight: 700;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.btn-cover-select {
    padding: 9px 14px;
}

.btn-remove-cover {
    padding: 9px 12px;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.cover-preview {
    display: grid;
    place-items: center;
    width: min(160px, 100%);
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
    background:
        linear-gradient(135deg, rgba(210, 219, 255, 0.35), rgba(255, 255, 255, 0.15)),
        var(--color-surface-alt);
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
}

.cover-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.cover-name {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    word-break: break-word;
}

.metadata-field-error {
    margin: 4px 0 0;
    color: var(--color-danger, #b42318);
    font-size: 0.75rem;
    line-height: 1.4;
}

.metadata-field-missing {
    border-color: var(--color-danger, #b42318);
}

.genre-picker {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
    background: var(--color-white);
}

.genre-tags,
.genre-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.genre-tag,
.genre-suggestion {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 4px 10px;
    border: 1px solid var(--color-border-soft);
    border-radius: 999px;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: 0.78rem;
}

.genre-tag {
    border-color: rgba(22, 125, 89, 0.25);
    background: rgba(22, 125, 89, 0.08);
    color: #167d59;
}

.genre-tag button {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
}

.genre-suggestion {
    cursor: pointer;
}

.genre-suggestion[aria-pressed="true"] {
    border-color: var(--color-brand-primary);
    background: rgba(59, 82, 246, 0.08);
    color: var(--color-brand-primary);
}

.genre-custom-entry {
    display: flex;
    gap: 8px;
}

.btn-add-genre {
    flex: 0 0 auto;
    padding: 8px 12px;
    border: 1px solid var(--color-brand-primary);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-brand-primary);
    cursor: pointer;
    font-weight: 700;
}

.btn-add-genre:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.character-count {
    align-self: flex-end;
    margin-top: 4px;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    text-align: right;
}

.rights-declaration {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 20px;
    color: var(--color-text-secondary);
    line-height: 1.5;
}

.rights-declaration input {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    margin: 2px 0 0;
    accent-color: var(--color-brand-primary);
}

.rights-declaration label {
    cursor: pointer;
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
