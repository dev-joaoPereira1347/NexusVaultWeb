const categoryLabels: Record<string, string> = {
    literatura: 'Literatura',
    historia: 'História & Documentos',
    tecnico: 'Técnico & Acadêmico',
    filosofia: 'Filosofia',
    poesia: 'Poesia',
    outros: 'Outros'
};

export const normalizeLibraryTerm = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('pt-BR');

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
