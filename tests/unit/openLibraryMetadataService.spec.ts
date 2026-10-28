import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { getDocumentMock } = vi.hoisted(() => ({
    getDocumentMock: vi.fn()
}));

vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: getDocumentMock
}));

const { findOpenLibraryMetadata } = await import('@/services/openLibraryMetadataService');

describe('open library metadata service', () => {
    let renderedPage = 0;
    let visiblePageNumbers = new Set([2]);
    let lastPageText = '';
    let pdfTitle = 'Test Book';
    let pdfAuthor = 'Test Author';
    let toBlobDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
        vi.clearAllMocks();
        renderedPage = 0;
        visiblePageNumbers = new Set([2]);
        lastPageText = '';
        pdfTitle = 'Test Book';
        pdfAuthor = 'Test Author';
        const context = {
            getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
                const data = new Uint8ClampedArray(width * height * 4).fill(255);
                if (visiblePageNumbers.has(renderedPage)) {
                    for (let pixel = 0; pixel < 300; pixel += 1) data[pixel * 4] = 0;
                }
                return { data };
            })
        };
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockReturnValue(context as unknown as CanvasRenderingContext2D);
        toBlobDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'toBlob');
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            configurable: true,
            value: (callback: BlobCallback) => callback(new Blob(['cover'], { type: 'image/png' }))
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ docs: [] })
        }));

        const pages = Array.from({ length: 127 }, (_, index) => index + 1).map((pageNumber) => ({
            getViewport: () => ({ width: 200, height: 300 }),
            getTextContent: async () => ({
                items: pageNumber === 127 && lastPageText ? [{ str: lastPageText }] : []
            }),
            render: () => {
                renderedPage = pageNumber;
                return { promise: Promise.resolve() };
            }
        }));
        getDocumentMock.mockReturnValue({
            promise: Promise.resolve({
                numPages: pages.length,
                getMetadata: async () => ({ info: { Title: pdfTitle, Author: pdfAuthor } }),
                getPage: async (pageNumber: number) => pages[pageNumber - 1]
            }),
            destroy: vi.fn()
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        if (toBlobDescriptor) {
            Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', toBlobDescriptor);
        } else {
            delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).toBlob;
        }
    });

    test('skips blank PDF pages and extracts the first page with visible content', async () => {
        const file = new File(['pdf'], 'test-book.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });

        const result = await findOpenLibraryMetadata(file);

        expect(getDocumentMock).toHaveBeenCalledOnce();
        expect(getDocumentMock).toHaveBeenCalledWith(expect.objectContaining({
            wasmUrl: expect.stringContaining('/pdfjs/wasm/')
        }));
        expect(renderedPage).toBe(2);
        expect(result?.embeddedCover).toBeInstanceOf(File);
        expect(result?.embeddedCover?.name).toBe('capa-extraida-do-pdf.png');
    });

    test('keeps an illustrated first page as the extracted cover', async () => {
        visiblePageNumbers = new Set([1]);
        const file = new File(['pdf'], 'illustrated-cover.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });

        const result = await findOpenLibraryMetadata(file);

        expect(result?.embeddedCover).toBeInstanceOf(File);
        expect(renderedPage).toBe(1);
    });

    test('uses the OCR ISBN on the last page instead of a generic filename match', async () => {
        lastPageText = '| s B N 0 5 2 ] 5 5 4 ó 5 8 9 "740521"53t,659';
        const file = new File(['pdf'], 'livro ingles.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = new URL(input.toString());
            if (url.searchParams.get('isbn') === '0521534658') {
                return {
                    ok: true,
                    json: async () => ({
                        docs: [{
                            key: '/works/OL18557155W',
                            title: 'Business start-up',
                            author_name: ['Mark Ibbotson', 'Bryan Stephens'],
                            first_publish_year: 2006,
                            language: ['eng']
                        }]
                    })
                };
            }
            return { ok: true, json: async () => ({ docs: [] }) };
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await findOpenLibraryMetadata(file);

        expect(result?.matchedBy).toBe('isbn');
        expect(result?.metadata).toMatchObject({
            title: 'Business start-up',
            author: 'Mark Ibbotson',
            year: '2006',
            language: 'en'
        });
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('isbn=0521534658'),
            undefined
        );
    });

    test('recognizes a valid ISBN-13 directly after its label', async () => {
        pdfTitle = '';
        pdfAuthor = '';
        lastPageText = 'ISBN 978-0-521-53465-9';
        const file = new File(['pdf'], 'livro ingles.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = new URL(input.toString());
            if (url.searchParams.get('isbn') === '0521534658') {
                return {
                    ok: true,
                    json: async () => ({
                        docs: [{
                            key: '/works/OL18557155W',
                            title: 'Business start-up',
                            author_name: ['Mark Ibbotson', 'Bryan Stephens']
                        }]
                    })
                };
            }
            return { ok: true, json: async () => ({ docs: [] }) };
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await findOpenLibraryMetadata(file);

        expect(result?.matchedBy).toBe('isbn');
        expect(result?.metadata?.title).toBe('Business start-up');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('isbn=0521534658'),
            undefined
        );
    });

    test('rejects unrelated title results and prefers the filename title and author', async () => {
        pdfTitle = '2015 Wall Calendar W Bonus Full Page Photos';
        pdfAuthor = 'Ce Helton';
        const file = new File(
            ['pdf'],
            "Richards J.C. - Interchange 1 (4th edition). Student's Book - 5 e 6.pdf",
            { type: 'application/pdf' }
        );
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = new URL(input.toString());
            const title = url.searchParams.get('title')?.toLowerCase() ?? '';
            const docs = title.includes('interchange')
                ? [
                    {
                        key: '/works/wrong',
                        title: '2015 Wall Calendar W Bonus Full Page Photos',
                        author_name: ['Ce Helton']
                    },
                    {
                        key: '/works/interchange',
                        title: "Interchange 1: Student's Book",
                        author_name: ['Jack C. Richards', 'Jonathan Hull']
                    }
                ]
                : title.includes('calendar')
                    ? [{
                        key: '/works/wrong',
                        title: '2015 Wall Calendar W Bonus Full Page Photos',
                        author_name: ['Ce Helton']
                    }]
                    : [];
            return { ok: true, json: async () => ({ docs }) };
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await findOpenLibraryMetadata(file);

        expect(result?.matchedBy).toBe('title');
        expect(result?.metadata).toMatchObject({
            title: "Interchange 1: Student's Book",
            author: 'Jack C. Richards'
        });
    });

    test('returns no external metadata when search results do not match the document clues', async () => {
        pdfTitle = '2015 Wall Calendar W Bonus Full Page Photos';
        pdfAuthor = 'Ce Helton';
        const file = new File(
            ['pdf'],
            "Richards J.C. - Interchange 1 (4th edition). Student's Book - 5 e 6.pdf",
            { type: 'application/pdf' }
        );
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                docs: [{
                    key: '/works/wrong',
                    title: '2015 Wall Calendar W Bonus Full Page Photos',
                    author_name: ['Ce Helton']
                }]
            })
        }));

        const result = await findOpenLibraryMetadata(file);

        expect(result?.metadata).toBeNull();
        expect(result?.matchedBy).toBeUndefined();
    });

    test('translates common Open Library subjects into Portuguese', async () => {
        pdfTitle = '';
        pdfAuthor = '';
        const file = new File(['pdf'], 'Pressman - Software Engineering.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                docs: [{
                    key: '/works/software-engineering',
                    title: 'Software Engineering',
                    author_name: ['Roger S. Pressman'],
                    subject: [
                        'Software engineering',
                        'Electronic digital computers',
                        'Programming'
                    ]
                }]
            })
        }));

        const result = await findOpenLibraryMetadata(file);

        expect(result?.metadata).toMatchObject({
            genre: 'Engenharia de software, Computadores digitais eletrônicos, Programação',
            category: 'tecnico'
        });
    });

    test('does not use a generic filename as an Open Library title query', async () => {
        pdfTitle = '';
        pdfAuthor = '';
        const file = new File(['pdf'], 'livro ingles.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: async () => new ArrayBuffer(3)
        });

        const result = await findOpenLibraryMetadata(file);

        expect(result?.metadata).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });
});
