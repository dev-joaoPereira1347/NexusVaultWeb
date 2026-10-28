import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { UploadForm } from '@/types/upload';
import { pdfWasmUrl } from '@/services/pdfjsConfig';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type FileClues = {
    titles: string[];
    preferredTitle: string;
    author: string;
    year: string;
    text: string;
    isbns: string[];
    language: string;
    genre: string;
    description: string;
    subjects: string[];
    embeddedCover: File | null;
    extractionWarning?: string;
    coverExtractionWarning?: boolean;
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
    embeddedCover: File | null;
    matchedBy?: 'isbn' | 'title';
    extractionWarning?: string;
    coverExtractionWarning?: boolean;
    lookupWarning?: string;
    coverWarning?: string;
};

const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_PDF_PAGES = 5;
const MAX_ISBN_CANDIDATES = 10;
const MIN_VISIBLE_COVER_PIXELS = 32;
const MIN_VISIBLE_COVER_RATIO = 0.0001;
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

const findIsbnCandidates = (text: string): string[] => {
    const labels = [...text.matchAll(/(?:\bI\s*S\s*B\s*N\b|[|1l]\s*[s5]\s*[b8]\s*n)/gi)];
    const isbn10Candidates = labels.flatMap((label) => {
        const start = (label.index ?? 0) + label[0].length;
        const rawDigits = text.slice(start, start + 80)
            .toUpperCase()
            .replace(/O/g, '0')
            .replace(/[IL|!\]]/g, '1')
            .replace(/[ÓÒÖ]/g, '6')
            .replace(/[^0-9X]/g, '');
        const rawIsbn13 = normalizeIsbn(rawDigits.slice(0, 13));
        if (rawIsbn13) {
            return [{ isbn: isbn10FromIsbn13(rawIsbn13), exact: true }];
        }

        const rawCandidate = rawDigits.slice(0, 10);
        const isbn = normalizeIsbn(rawCandidate);
        if (isbn) return [{ isbn, exact: true }];
        if (!/^\d{10}$/.test(rawCandidate)) return [];

        const correctedCandidates: Array<{ isbn: string; exact: boolean }> = [];
        for (let index = 0; index < rawCandidate.length; index += 1) {
            for (let digit = 0; digit <= 9; digit += 1) {
                if (String(digit) === rawCandidate[index]) continue;
                const corrected = `${rawCandidate.slice(0, index)}${digit}${rawCandidate.slice(index + 1)}`;
                const validIsbn = normalizeIsbn(corrected);
                if (validIsbn) correctedCandidates.push({ isbn: validIsbn, exact: false });
            }
        }
        return correctedCandidates;
    });

    const barcodeMatches = [...text.matchAll(/(?:^|[^\d])(9(?:[\s"'“”.,-]*[0-9tT]){12})(?![0-9tT])/g)];
    const isbn13Candidates = barcodeMatches.flatMap((match) => {
        const rawCandidate = match[1].toUpperCase().replace(/T/g, '4').replace(/\D/g, '');
        if (!/^\d{13}$/.test(rawCandidate)) return [];

        const candidates: Array<{ isbn: string; exact: boolean }> = [];
        const addCandidate = (candidate: string, exact: boolean) => {
            if (!candidate.startsWith('978')) return;
            const isbn = normalizeIsbn(isbn10FromIsbn13(candidate));
            if (isbn) candidates.push({ isbn, exact });
        };

        if (isValidIsbn13(rawCandidate)) addCandidate(rawCandidate, true);
        for (let index = 0; index < rawCandidate.length; index += 1) {
            for (let digit = 0; digit <= 9; digit += 1) {
                if (String(digit) === rawCandidate[index]) continue;
                const corrected = `${rawCandidate.slice(0, index)}${digit}${rawCandidate.slice(index + 1)}`;
                if (isValidIsbn13(corrected)) addCandidate(corrected, false);
            }
        }
        return candidates;
    });

    const exactCandidates = [...isbn10Candidates, ...isbn13Candidates]
        .filter(({ exact }) => exact)
        .map(({ isbn }) => isbn);
    const repairedIsbn10 = isbn10Candidates.map(({ isbn }) => isbn);
    const repairedIsbn13 = new Set(isbn13Candidates.map(({ isbn }) => isbn));
    const corroboratedCandidates = repairedIsbn10.filter((isbn) => {
        const prefix = `978${isbn.slice(0, 9)}`;
        return [...repairedIsbn13].some((candidate) => {
            const candidatePrefix = `978${candidate.slice(0, 9)}`;
            return candidatePrefix === prefix;
        });
    });
    const candidates = corroboratedCandidates.length > 0
        ? corroboratedCandidates
        : exactCandidates;

    return [...new Set(candidates)].slice(0, MAX_ISBN_CANDIDATES);
};

const isbn10FromIsbn13 = (isbn13: string): string => {
    const firstNineDigits = isbn13.slice(3, 12);
    let checksum = 0;
    for (let index = 0; index < firstNineDigits.length; index += 1) {
        checksum += Number(firstNineDigits[index]) * (10 - index);
    }
    const checkDigit = (11 - (checksum % 11)) % 11;
    return `${firstNineDigits}${checkDigit === 10 ? 'X' : checkDigit}`;
};

const isValidIsbn13 = (isbn: string): boolean =>
    /^\d{13}$/.test(isbn)
    && [...isbn].reduce(
        (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
        0
    ) % 10 === 0;

const isGenericLookupTitle = (title: string): boolean =>
    /^(?:livro(?: de)? ingles(?: e livro de atividades)?|livro|english(?: language)? book|book|documento|document|arquivo|scan|sem titulo|untitled)$/i
        .test(title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[().]/g, '').trim());

const readTextFile = async (file: File): Promise<string> =>
    (await file.slice(0, MAX_TEXT_BYTES).text()).replace(/^\uFEFF/, '');

const hasVisiblePageContent = (canvas: HTMLCanvasElement): boolean => {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível verificar a imagem gerada do PDF.');

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const minimumPixels = Math.max(
        MIN_VISIBLE_COVER_PIXELS,
        Math.floor(canvas.width * canvas.height * MIN_VISIBLE_COVER_RATIO)
    );
    let visiblePixels = 0;
    for (let index = 0; index < data.length; index += 4) {
        if (data[index] < 245 || data[index + 1] < 245 || data[index + 2] < 245) {
            visiblePixels += 1;
            if (visiblePixels >= minimumPixels) return true;
        }
    }
    return false;
};

const renderPdfPageAsCover = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
): Promise<File | null> => {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 700 / baseViewport.height, 700 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    try {
        await page.render({ canvas, viewport, background: '#ffffff' }).promise;
        if (!hasVisiblePageContent(canvas)) return null;

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob?.size) throw new Error('Não foi possível gerar a imagem da página do PDF.');
        return new File([blob], 'capa-extraida-do-pdf.png', { type: 'image/png' });
    } finally {
        canvas.width = 0;
        canvas.height = 0;
    }
};

const readPdf = async (file: File): Promise<{
    title: string;
    author: string;
    text: string;
    isbnText: string;
    language: string;
    genre: string;
    embeddedCover: File | null;
    coverExtractionWarning: boolean;
}> => {
    const loadingTask = pdfjsLib.getDocument({
        data: await file.arrayBuffer(),
        wasmUrl: pdfWasmUrl
    });
    const pdf = await loadingTask.promise;

    try {
        const { info } = await pdf.getMetadata();
        const textParts: string[] = [];
        const isbnTextParts: string[] = [];

        for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, MAX_PDF_PAGES); pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            textParts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        }
        if (pdf.numPages > MAX_PDF_PAGES) {
            const lastPage = await pdf.getPage(pdf.numPages);
            const content = await lastPage.getTextContent();
            isbnTextParts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        }

        let embeddedCover: File | null = null;
        let coverExtractionWarning = false;
        for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, MAX_PDF_PAGES); pageNumber += 1) {
            try {
                embeddedCover = await renderPdfPageAsCover(pdf, pageNumber);
            } catch {
                coverExtractionWarning = true;
                continue;
            }
            if (embeddedCover) break;
        }
        if (!embeddedCover) coverExtractionWarning = true;

        return {
            title: 'Title' in info && typeof info.Title === 'string' ? info.Title.trim() : '',
            author: 'Author' in info && typeof info.Author === 'string' ? info.Author.trim() : '',
            text: textParts.join('\n'),
            isbnText: isbnTextParts.join('\n'),
            language: 'Language' in info && typeof info.Language === 'string' ? info.Language.trim() : '',
            genre: 'Subject' in info && typeof info.Subject === 'string' ? info.Subject.trim() : '',
            embeddedCover,
            coverExtractionWarning
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
    embeddedCover: File | null;
    coverExtractionWarning: boolean;
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
    const manifestItems = Array.from(packageXml.getElementsByTagNameNS('*', 'item'));
    const coverId = Array.from(metadata.getElementsByTagNameNS('*', 'meta'))
        .find((item) => item.getAttribute('name')?.toLowerCase() === 'cover')
        ?.getAttribute('content');
    const coverItem = manifestItems.find((item) =>
        item.getAttribute('properties')?.split(/\s+/).includes('cover-image')
    ) ?? manifestItems.find((item) => item.getAttribute('id') === coverId);
    let embeddedCover: File | null = null;
    let coverExtractionWarning = false;
    const coverHref = coverItem?.getAttribute('href');
    if (coverHref) {
        try {
            const resolvedUrl = new URL(coverHref, `https://epub-reader.invalid/${packagePath}`);
            const coverPath = decodeURIComponent(resolvedUrl.pathname.replace(/^\/+/, ''));
            const coverEntry = zip.file(coverPath);
            if (coverEntry) {
                const blob = await coverEntry.async('blob');
                const extension = coverPath.split('.').pop()?.toLowerCase() || 'jpg';
                const inferredMimeType = extension === 'png' ? 'image/png'
                    : extension === 'gif' ? 'image/gif'
                        : extension === 'webp' ? 'image/webp'
                            : 'image/jpeg';
                const mimeType = blob.type.startsWith('image/') ? blob.type : inferredMimeType;
                if (blob.size) {
                    embeddedCover = new File([blob], `capa-extraida-do-epub.${extension}`, { type: mimeType });
                }
            }
        } catch {
            coverExtractionWarning = true;
            embeddedCover = null;
        }
    }

    return {
        title,
        author,
        language,
        description,
        subjects,
        embeddedCover,
        coverExtractionWarning,
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
    let isbnText = '';
    let language = '';
    let genre = '';
    let description = '';
    let subjects: string[] = [];
    let embeddedCover: File | null = null;
    let coverExtractionWarning = false;
    let extractionWarning: string | undefined;

    try {
        if (extension === 'pdf') {
            ({
                title,
                author,
                text,
                isbnText,
                language,
                genre,
                embeddedCover,
                coverExtractionWarning
            } = await readPdf(file));
        } else if (extension === 'epub') {
            ({
                title,
                author,
                text,
                language,
                genre,
                description,
                subjects,
                embeddedCover,
                coverExtractionWarning
            } = await readEpub(file));
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

    const preferredTitle = [parsedFilename.title, title, fallbackTitle]
        .find((candidate) => candidate && !isGenericLookupTitle(candidate)) ?? '';
    const titles = [...new Set([preferredTitle, title, parsedFilename.title, fallbackTitle].filter(Boolean))]
        .filter((candidate) => !isGenericLookupTitle(candidate));

    return {
        titles,
        preferredTitle,
        author: parsedFilename.author || author,
        year: filenameTitle(file.name).match(/\b(?:1[5-9]\d{2}|20\d{2})\b/)?.[0] ?? '',
        text,
        isbns: findIsbnCandidates(`${file.name}\n${text}\n${isbnText}`),
        language,
        genre,
        description,
        subjects,
        embeddedCover,
        coverExtractionWarning,
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

const normalizeMatchTokens = (value: string, title = false): string[] => {
    const ignoredTokens = title
        ? new Set(['a', 'an', 'and', 'book', 'edition', 'for', 'of', 'student', 'the', 'to'])
        : new Set(['and', 'de', 'del', 'jr', 'of', 'the']);
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((token) => token && !ignoredTokens.has(token));
};

const tokenCoverage = (query: string, candidate: string, title = false): number => {
    const queryTokens = [...new Set(normalizeMatchTokens(query, title))];
    if (queryTokens.length === 0) return 0;
    const candidateTokens = new Set(normalizeMatchTokens(candidate, title));
    const matches = queryTokens.filter((token) => candidateTokens.has(token)).length;
    return matches / queryTokens.length;
};

const rankTitleMatch = (
    documents: OpenLibraryDocument[],
    clues: FileClues
): OpenLibraryDocument | undefined => {
    if (!clues.preferredTitle) return undefined;

    return documents
        .map((document) => {
            const titleCoverage = tokenCoverage(clues.preferredTitle, document.title ?? '', true);
            const authorCoverage = clues.author
                ? Math.max(...(document.author_name ?? []).map((author) => tokenCoverage(clues.author, author)))
                : 0;
            const hasAuthorData = Boolean(document.author_name?.length);
            const authorMatches = authorCoverage >= 0.5;
            const titleIsStrong = titleCoverage >= 0.8;
            const isRelevant = titleCoverage >= 0.6
                && (!clues.author || authorMatches || (!hasAuthorData && titleIsStrong));
            return {
                document,
                isRelevant,
                score: titleCoverage * 0.75 + authorCoverage * 0.25
            };
        })
        .filter((match) => match.isRelevant)
        .sort((left, right) => right.score - left.score)[0]?.document;
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

const normalizeSubject = (subject: string): string =>
    subject
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const SUBJECT_TRANSLATIONS: Record<string, string> = {
    'biography': 'Biografia',
    'business english': 'Inglês para negócios',
    'computer networks': 'Redes de computadores',
    'computer programming': 'Programação de computadores',
    'computer science': 'Ciência da computação',
    'computer software': 'Software de computador',
    'computers': 'Computação',
    'electronic digital computers': 'Computadores digitais eletrônicos',
    'engineering': 'Engenharia',
    'english as a second language': 'Inglês como segunda língua',
    'english language': 'Língua inglesa',
    'fiction': 'Ficção',
    'foreign language study': 'Estudo de língua estrangeira',
    'history': 'História',
    'language': 'Idioma',
    'literature': 'Literatura',
    'philosophy': 'Filosofia',
    'poetry': 'Poesia',
    'programming': 'Programação',
    'romance': 'Romance',
    'software engineering': 'Engenharia de software',
    'technical writing': 'Redação técnica',
    'textbooks for foreign speakers': 'Livros didáticos para falantes de outros idiomas'
};

const translateOpenLibrarySubjects = (subjects: string[]): string[] =>
    [...new Set(subjects.map((subject) =>
        SUBJECT_TRANSLATIONS[normalizeSubject(subject)] ?? subject.trim()
    ).filter(Boolean))];

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
    let result: OpenLibraryDocument | undefined;
    let matchedBy: OpenLibraryLookupResult['matchedBy'];
    let lookupWarning: string | undefined;

    try {
        for (const isbn of clues.isbns) {
            documents = await searchOpenLibrary(new URLSearchParams({ isbn }), signal);
            if (documents.length > 0) break;
        }

        matchedBy = clues.isbns.length > 0 && documents.length > 0 ? 'isbn' : undefined;

        if (matchedBy === 'isbn') {
            result = documents[0];
        } else {
            for (const title of clues.titles) {
                const params = new URLSearchParams({ title });
                if (clues.author) params.set('author', clues.author);
                const titleDocuments = await searchOpenLibrary(params, signal);
                documents.push(...titleDocuments);

                if (titleDocuments.length === 0 && clues.author) {
                    documents.push(...await searchOpenLibrary(new URLSearchParams({ title }), signal));
                }
            }

            result = rankTitleMatch(documents, clues);
            if (result) matchedBy = 'title';
        }
    } catch (error) {
        if (signal?.aborted) throw error;
        lookupWarning = error instanceof Error
            ? error.message
            : 'Não foi possível consultar os metadados externos.';
    }

    if (!result?.title) {
        return {
            metadata: null,
            cover: null,
            embeddedCover: clues.embeddedCover,
            extractionWarning: clues.extractionWarning,
            coverExtractionWarning: clues.coverExtractionWarning,
            lookupWarning
        };
    }

    let cover: File | null = null;
    let coverWarning: string | undefined = clues.coverExtractionWarning
        ? 'Não foi possível extrair uma imagem de capa do documento.'
        : undefined;
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
    const translatedSubjects = translateOpenLibrarySubjects(subjects);
    const firstSentence = Array.isArray(result.first_sentence)
        ? result.first_sentence[0]
        : result.first_sentence;
    const allSubjects = [...translatedSubjects, ...clues.subjects, clues.genre];
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
        embeddedCover: clues.embeddedCover,
        matchedBy,
        extractionWarning: clues.extractionWarning,
        coverExtractionWarning: clues.coverExtractionWarning,
        lookupWarning,
        coverWarning
    };
};
