import { describe, expect, test } from 'vitest';
import { parsePublicationYear } from '@/utils/publicationYear';

describe('parsePublicationYear', () => {
    test('accepts valid integer years from 1000 through next year', () => {
        expect(parsePublicationYear('1000')).toBe(1000);
        expect(parsePublicationYear('1899')).toBe(1899);
        expect(parsePublicationYear(String(new Date().getFullYear()))).toBe(new Date().getFullYear());
        expect(parsePublicationYear(String(new Date().getFullYear() + 1))).toBe(new Date().getFullYear() + 1);
    });

    test.each(['', '0', '999', '-1', '2025.5', '2025abc', String(new Date().getFullYear() + 2)])(
        'rejects invalid year %s',
        (year) => {
            expect(parsePublicationYear(year)).toBeNull();
        }
    );
});
