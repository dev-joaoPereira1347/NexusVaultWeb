const categoryLabels: Record<string, string> = {
    literatura: 'Literatura',
    historia: 'História & Documentos',
    tecnico: 'Técnico & Acadêmico',
    filosofia: 'Filosofia',
    poesia: 'Poesia',
    outros: 'Outros'
};

const genreTranslations: Record<string, { key: string; label: string }> = {
    classical: { key: 'classico', label: 'Clássico' },
    classics: { key: 'classico', label: 'Clássico' },
    fiction: { key: 'ficcao', label: 'Ficção' },
    folklore: { key: 'folclore', label: 'Folclore' },
    literature: { key: 'literatura', label: 'Literatura' },
    history: { key: 'historia', label: 'História' },
    poetry: { key: 'poesia', label: 'Poesia' },
    philosophy: { key: 'filosofia', label: 'Filosofia' },
    fantasy: { key: 'fantasia', label: 'Fantasia' },
    'science fiction': { key: 'ficcao cientifica', label: 'Ficção científica' },
    'short stories': { key: 'contos', label: 'Contos' },
    mythology: { key: 'mitologia', label: 'Mitologia' },
    adventure: { key: 'aventura', label: 'Aventura' },
    comedy: { key: 'comedia', label: 'Comédia' },
    mystery: { key: 'misterio', label: 'Mistério' },
    religion: { key: 'religiao', label: 'Religião' }
};

export const normalizeLibraryTerm = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('pt-BR');

export const normalizeLibraryGenre = (value: string): string => {
    const normalized = normalizeLibraryTerm(value);
    return genreTranslations[normalized]?.key ?? normalized;
};

export const getLibraryGenreLabel = (value: string): string => {
    const normalized = normalizeLibraryTerm(value);
    return genreTranslations[normalized]?.label ?? value;
};

export const getLibraryItemTags = (genre: string | null, category: string): string[] => {
    const terms = [
        ...(genre ?? '').split(/[,;|]/),
        categoryLabels[normalizeLibraryTerm(category)] ?? category
    ].map((term) => term.trim()).filter(Boolean);

    const uniqueTerms = new Map<string, string>();
    for (const term of terms) {
        const key = normalizeLibraryTerm(term);
        if (!uniqueTerms.has(key)) uniqueTerms.set(key, term);
    }

    return [...uniqueTerms.values()];
};
