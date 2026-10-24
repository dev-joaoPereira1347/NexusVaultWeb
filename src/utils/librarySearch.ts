import { normalizeLibraryTerm } from '@/utils/libraryTaxonomy';
import type { PublicLibraryItem } from '@/types/library';

export const matchesLibrarySearch = (item: PublicLibraryItem, query: string): boolean => {
    const terms = normalizeLibraryTerm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;

    const searchableText = normalizeLibraryTerm([
        item.title,
        item.author,
        item.category,
        item.genre ?? '',
        item.content_type,
        item.description ?? '',
        item.file_name
    ].join(' '));

    return terms.every((term) => searchableText.includes(term));
};
