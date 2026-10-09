import { describe, expect, test } from 'vitest';
import { getLibraryItemTags, normalizeLibraryTerm } from '@/utils/libraryTaxonomy';

describe('libraryTaxonomy', () => {
    test('normalizes accents and case for genre filtering', () => {
        expect(normalizeLibraryTerm('  HISTÓRIA  ')).toBe('historia');
    });

    test('splits genre metadata and adds the translated category once', () => {
        expect(getLibraryItemTags('Romance, Poesia; romance', 'literatura')).toEqual([
            'Romance',
            'Poesia',
            'Literatura'
        ]);
    });
});
