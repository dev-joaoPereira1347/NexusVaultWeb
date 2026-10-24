import { describe, expect, test } from 'vitest';
import { matchesLibrarySearch } from '@/utils/librarySearch';
import type { PublicLibraryItem } from '@/types/library';

const item: PublicLibraryItem = {
    id: 'document-1',
    title: 'Memórias Póstumas de Brás Cubas',
    author: 'Machado de Assis',
    category: 'literatura',
    genre: 'Romance Realista',
    content_type: 'livro',
    year: 1881,
    description: 'Obra clássica da literatura brasileira.',
    file_name: 'memorias-postumas.pdf',
    cover_url: '',
    download_url: ''
};

describe('matchesLibrarySearch', () => {
    test('finds documents by title or author without requiring exact capitalization', () => {
        expect(matchesLibrarySearch(item, 'machado de assis')).toBe(true);
        expect(matchesLibrarySearch(item, 'BRÁS CUBAS')).toBe(true);
    });

    test('finds keywords across descriptive metadata and the file name', () => {
        expect(matchesLibrarySearch(item, 'clássica brasileira')).toBe(true);
        expect(matchesLibrarySearch(item, 'memorias postumas')).toBe(true);
        expect(matchesLibrarySearch(item, 'romance realista')).toBe(true);
    });

    test('normalizes accents and requires every search term to match', () => {
        expect(matchesLibrarySearch(item, 'brás literatura')).toBe(true);
        expect(matchesLibrarySearch(item, 'brás astronomia')).toBe(false);
    });

    test('matches every item for an empty query', () => {
        expect(matchesLibrarySearch(item, '   ')).toBe(true);
    });
});
