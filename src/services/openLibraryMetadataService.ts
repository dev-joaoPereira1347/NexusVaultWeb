import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { UploadForm } from '@/types/upload';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type FileClues = {
    titles: string[];
    author: string;
    year: string;
    text: string;
    isbn: string | null;
    language: string;
    genre: string;
    description: string;
    subjects: string[];
    extractionWarning?: string;
};

type OpenLibraryDocument = {
    key: string;
    title?: string;
    author_name?: string[];
    cover_i?: number;
    first_publish_year?: number;
    subject?: string[];
    language?: string[];
    first_sentence?: string | string[];
};

type OpenLibrarySearchResponse = {
    docs?: OpenLibraryDocument[];
};

type OpenLibraryMetadata = Pick<
    UploadForm,
    'title' | 'author' | 'category' | 'year' | 'type' | 'genre' | 'language' | 'description'
>;

export type OpenLibraryLookupResult = {
    metadata: OpenLibraryMetadata | null;
    cover: File | null;
    matchedBy?: 'isbn' | 'title';
    extractionWarning?: string;
    coverWarning?: string;
};

const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_PDF_PAGES = 5;
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';

const filenameTitle = (fileName: string): string =>
    fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const filenameClues = (fileName: string): { title: string; author: string } => {
    const parts = filenameTitle(fileName).split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return { title: parts[0] ?? '', author: '' };

    const title = parts[1]
        .replace(/\s+\d+(?:st|nd|rd|th)?\s*\.?\s*ed(?:ition)?\.?.*$/i, '')
        .replace(/\s*\(\d{4}\)\s*$/, '')
        .trim();

    return { title, author: parts[0] };
};

const normalizeIsbn = (value: string): string | null => {
    const isbn = value.replace(/[^0-9x]/gi, '').toUpperCase();

    if (/^\d{13}$/.test(isbn)) {
        const checksum = [...isbn.slice(0, 12)].reduce(
            (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
            0
        );
        return (10 - (checksum % 10)) % 10 === Number(isbn[12]) ? isbn : null;
    }

    if (/^\d{9}[\dX]$/.test(isbn)) {
        const checksum = [...isbn].reduce(
            (sum, digit, index) => sum + (digit === 'X' ? 10 : Number(digit)) * (10 - index),
            0
        );
        return checksum % 11 === 0 ? isbn : null;
    }

    return null;
};

const findIsbn = (text: string): string | null => {
    const labeledIsbn = text.match(/ISBN(?:-1[03])?\s*[:#]?\s*([0-9Xx][0-9Xx\s-]{8,20})/i);
    const candidates = labeledIsbn ? [labeledIsbn[1]] : text.match(/[0-9Xx][0-9Xx\s-]{8,20}/g) ?? [];

    for (const candidate of candidates) {
        const isbn = normalizeIsbn(candidate);
        if (isbn) return isbn;
    }

    return null;
};

const readTextFile = async (file: File): Promise<string> =>
    (await file.slice(0, MAX_TEXT_BYTES).text()).replace(/^\uFEFF/, '');

const readPdf = async (file: File): Promise<{
    title: string;
    author: string;
    text: string;
    language: string;
    genre: string;
}> => {
    const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
    const pdf = await loadingTask.promise;

    try {
        const { info } = await pdf.getMetadata();
        const textParts: string[] = [];

        for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, MAX_PDF_PAGES); pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            textParts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        }

        return {
            title: 'Title' in info && typeof info.Title === 'string' ? info.Title.trim() : '',
            author: 'Author' in info && typeof info.Author === 'string' ? info.Author.trim() : '',
            text: textParts.join('\n'),
            language: 'Language' in info && typeof info.Language === 'string' ? info.Language.trim() : '',
            genre: 'Subject' in info && typeof info.Subject === 'string' ? info.Subject.trim() : ''
        };
    } finally {
        await loadingTask.destroy();
    }
};

const readEpub = async (file: File): Promise<{
    title: string;
    author: string;
    text: string;
    language: string;
    genre: string;
    description: string;
    subjects: string[];
}> => {
    const zip = await JSZip.loadAsync(file);
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('O EPUB não contém o arquivo de catálogo esperado.');

    const containerXml = new DOMParser().parseFromString(await containerFile.async('text'), 'application/xml');
    const packagePath = containerXml.querySelector('rootfile')?.getAttribute('full-path');
    if (!packagePath) throw new Error('Não foi possível localizar os metadados internos do EPUB.');

    const packageFile = zip.file(packagePath);
    if (!packageFile) throw new Error('O catálogo de metadados do EPUB não foi encontrado.');

    const packageXml = new DOMParser().parseFromString(await packageFile.async('text'), 'application/xml');
    const metadata = packageXml.getElementsByTagNameNS('*', 'metadata')[0];
    if (!metadata) throw new Error('O EPUB não contém metadados de publicação.');

    const getMetadataValue = (tagName: string): string =>
        metadata.getElementsByTagNameNS('*', tagName)[0]?.textContent?.trim() ?? '';

    const title = getMetadataValue('title');
    const author = getMetadataValue('creator');
    const identifier = getMetadataValue('identifier');
    const language = getMetadataValue('language');
    const description = getMetadataValue('description');
    const subjects = Array.from(metadata.getElementsByTagNameNS('*', 'subject'))
        .map((item) => item.textContent?.trim() ?? '')
        .filter(Boolean);

    return {
        title,
        author,
        language,
        description,
        subjects,
        genre: subjects.join(', '),
        text: [identifier, ...Array.from(metadata.getElementsByTagNameNS('*', 'meta')).map((item) => item.textContent ?? '')]
            .join('\n')
    };
};

const extractFileClues = async (file: File): Promise<FileClues> => {
    const fallbackTitle = filenameTitle(file.name);
    const parsedFilename = filenameClues(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();
    let title = '';
    let author = '';
    let text = '';
    let language = '';
    let genre = '';
    let description = '';
    let subjects: string[] = [];
    let extractionWarning: string | undefined;

    try {
        if (extension === 'pdf') {
            ({ title, author, text, language, genre } = await readPdf(file));
        } else if (extension === 'epub') {
            ({ title, author, text, language, genre, description, subjects } = await readEpub(file));
        } else {
            text = await readTextFile(file);
            title = text.match(/^\s*title\s*[:=]\s*(.+)$/im)?.[1]?.trim()
                ?? text.match(/^\s*#\s+(.+)$/m)?.[1]?.trim()
                ?? '';
            author = text.match(/^\s*author\s*[:=]\s*(.+)$/im)?.[1]?.trim() ?? '';
            language = text.match(/^\s*language\s*[:=]\s*(.+)$/im)?.[1]?.trim() ?? '';
            genre = text.match(/^\s*(?:genre|subject|tema)\s*[:=]\s*(.+)$/im)?.[1]?.trim() ?? '';
            description = text.match(/^\s*description\s*[:=]\s*(.+)$/im)?.[1]?.trim() ?? '';
            subjects = genre ? genre.split(/[,;|]/).map((subject) => subject.trim()).filter(Boolean) : [];
        }
    } catch (error) {
        extractionWarning = error instanceof Error
            ? error.message
            : 'Não foi possível ler os metadados internos do arquivo.';
    }

    const isbn = findIsbn(`${file.name}\n${text}`);

    return {
        titles: [...new Set([title, parsedFilename.title, fallbackTitle].filter(Boolean))],
        author: author || parsedFilename.author,
        year: filenameTitle(file.name).match(/\b(?:1[5-9]\d{2}|20\d{2})\b/)?.[0] ?? '',
        text,
        isbn,
        language,
        genre,
        description,
        subjects,
        extractionWarning
    };
};

const searchOpenLibrary = async (
    params: URLSearchParams,
    signal?: AbortSignal
): Promise<OpenLibraryDocument[]> => {
    params.set('fields', 'key,title,author_name,cover_i,first_publish_year,subject,language,first_sentence');
    params.set('limit', '5');

    const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`, signal ? { signal } : undefined);
    if (!response.ok) {
        throw new Error(`Open Library respondeu com erro (${response.status}).`);
    }

    const result = await response.json() as OpenLibrarySearchResponse;
    return result.docs ?? [];
};

const fetchOpenLibraryCover = async (coverId: number, signal?: AbortSignal): Promise<File> => {
    const response = await fetch(
        `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`,
        signal ? { signal } : undefined
    );
    if (!response.ok) {
        throw new Error(`Open Library respondeu com erro (${response.status}).`);
    }

    const image = await response.blob();
    if (!image.type.startsWith('image/') || image.size === 0) {
        throw new Error('A resposta da Open Library não contém uma imagem válida.');
    }

    return new File([image], `open-library-cover-${coverId}.jpg`, { type: image.type });
};

const classifyCategory = (subjects: string[], clues: string[]): string => {
    const subjectText = [...subjects, ...clues].join(' ').toLowerCase();

    if (/poetry|poesia|poema/.test(subjectText)) return 'poesia';
    if (/philosophy|filosofia/.test(subjectText)) return 'filosofia';
    if (/history|historical|história|historia/.test(subjectText)) return 'historia';
    if (/science|technology|computer|engineering|technical|software|programming|programação|computação|engenharia|ciência|tecnologia/.test(subjectText)) return 'tecnico';
    if (/fiction|literature|novel|romance|literatura|ficção/.test(subjectText)) return 'literatura';
    return 'outros';
};

const mapLanguage = (languages: string[] = []): string => {
    const language = languages[0]?.toLowerCase().split('/').pop()?.split(/[-_]/)[0];
    const languageMap: Record<string, string> = {
        por: 'pt',
        pt: 'pt',
        portuguese: 'pt',
        português: 'pt',
        eng: 'en',
        en: 'en',
        english: 'en',
        spa: 'es',
        es: 'es',
        spanish: 'es',
        fre: 'fr',
        fra: 'fr',
        fr: 'fr',
        french: 'fr'
    };

    return language ? languageMap[language] ?? '' : '';
};

const inferLanguageFromText = (text: string): string => {
    const normalizedText = text.toLocaleLowerCase();
    const languageMarkers: Record<string, string[]> = {
        pt: [' de ', ' que ', ' para ', ' com ', ' não ', ' uma ', ' os ', ' as ', ' software ', 'ção ', 'ções '],
        en: [' the ', ' and ', ' of ', ' to ', ' with ', ' is ', ' are ', ' for ', ' from ', ' this '],
        es: [' el ', ' la ', ' los ', ' las ', ' que ', ' para ', ' con ', ' una ', ' del ', ' este '],
        fr: [' le ', ' la ', ' les ', ' des ', ' une ', ' avec ', ' pour ', ' est ', ' dans ', ' cette ']
    };
    const scores = Object.entries(languageMarkers)
        .map(([language, markers]) => ({
            language,
            score: markers.reduce((total, marker) => {
                const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return total + (normalizedText.match(new RegExp(escapedMarker, 'g'))?.length ?? 0);
            }, 0)
        }))
        .sort((left, right) => right.score - left.score);

    return scores[0].score >= 3 && scores[0].score - scores[1].score >= 2
        ? scores[0].language
        : '';
};

const inferGenre = (subjects: string[], title: string, text: string): string => {
    if (subjects.length > 0) return subjects.slice(0, 3).join(', ');

    const topicText = `${title} ${text.slice(0, 4000)}`.toLocaleLowerCase();
    const topicRules: Array<{ pattern: RegExp; label: string }> = [
        { pattern: /software engineering|engenharia de software/, label: 'Engenharia de software' },
        { pattern: /programming|programação|programming language/, label: 'Programação' },
        { pattern: /computer science|ciência da computação|computação/, label: 'Ciência da computação' },
        { pattern: /mathematics|matemática|cálculo/, label: 'Matemática' },
        { pattern: /physics|física/, label: 'Física' },
        { pattern: /biology|biologia/, label: 'Biologia' },
        { pattern: /philosophy|filosofia/, label: 'Filosofia' },
        { pattern: /history|história/, label: 'História' },
        { pattern: /poetry|poesia|poema/, label: 'Poesia' },
        { pattern: /novel|romance|ficção|fiction/, label: 'Ficção' }
    ];

    return topicRules.find(({ pattern }) => pattern.test(topicText))?.label ?? '';
};

const excerptFromText = (text: string): string => {
    const excerpt = text
        .replace(/^\s*(?:title|author|language|genre|subject|description|isbn)\s*[:=].*$/gim, ' ')
        .replace(/ISBN(?:-1[03])?\s*[:#]?\s*[0-9Xx\s-]+/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (excerpt.length < 80) return '';
    if (excerpt.length <= 280) return excerpt;

    const boundary = excerpt.lastIndexOf(' ', 277);
    return `${excerpt.slice(0, boundary > 180 ? boundary : 277).trim()}...`;
};

export const findOpenLibraryMetadata = async (
    file: File,
    signal?: AbortSignal,
    onFileRead?: () => void
): Promise<OpenLibraryLookupResult | null> => {
    const clues = await extractFileClues(file);
    onFileRead?.();
    let documents: OpenLibraryDocument[] = [];

    if (clues.isbn) {
        documents = await searchOpenLibrary(new URLSearchParams({ isbn: clues.isbn }), signal);
    }

    let matchedBy: OpenLibraryLookupResult['matchedBy'] = clues.isbn && documents.length > 0
        ? 'isbn'
        : undefined;

    for (const title of clues.titles) {
        if (documents.length > 0) break;

        const params = new URLSearchParams({ title });
        if (clues.author) params.set('author', clues.author);
        documents = await searchOpenLibrary(params, signal);

        if (documents.length === 0 && clues.author) {
            documents = await searchOpenLibrary(new URLSearchParams({ title }), signal);
        }

        if (documents.length > 0) matchedBy = 'title';
    }

    const result = documents[0];
    if (!result?.title) {
        return {
            metadata: null,
            cover: null,
            extractionWarning: clues.extractionWarning
        };
    }

    let cover: File | null = null;
    let coverWarning: string | undefined;
    if (result.cover_i) {
        try {
            cover = await fetchOpenLibraryCover(result.cover_i, signal);
        } catch (error) {
            if (signal?.aborted) throw error;
            coverWarning = error instanceof Error
                ? error.message
                : 'Não foi possível carregar a capa encontrada.';
        }
    }

    const subjects = result.subject ?? [];
    const firstSentence = Array.isArray(result.first_sentence)
        ? result.first_sentence[0]
        : result.first_sentence;
    const allSubjects = [...subjects, ...clues.subjects, clues.genre];
    const matchedTitle = result.title;
    const language = mapLanguage(result.language)
        || mapLanguage([clues.language])
        || inferLanguageFromText(clues.text);
    const genre = inferGenre(allSubjects, matchedTitle, clues.text) || clues.genre;

    return {
        metadata: {
            title: result.title,
            author: result.author_name?.[0] ?? clues.author,
            year: clues.year || (result.first_publish_year ? String(result.first_publish_year) : ''),
            category: classifyCategory(allSubjects, [matchedTitle, clues.text.slice(0, 4000)]),
            type: 'livro',
            genre,
            language,
            description: firstSentence || clues.description || excerptFromText(clues.text)
        },
        cover,
        matchedBy,
        extractionWarning: clues.extractionWarning,
        coverWarning
    };
};
