import { supabase } from '@/services/supabase';

export interface PublicLibraryStatistics {
    documentCount: number;
    contributorCount: number;
}

export const getPublicLibraryStatistics = async (): Promise<PublicLibraryStatistics> => {
    const [{ count: documentCount, error: documentError }, firstContributorPage] = await Promise.all([
        supabase
            .from('library_items')
            .select('id', { count: 'exact', head: true }),
        supabase
            .from('library_items')
            .select('uploaded_by', { count: 'exact' })
            .order('uploaded_by', { ascending: true })
            .range(0, 999)
    ]);

    if (documentError) throw documentError;
    if (firstContributorPage.error) throw firstContributorPage.error;
    if (typeof documentCount !== 'number' || typeof firstContributorPage.count !== 'number') {
        throw new Error('O banco não retornou a contagem dos documentos ou colaboradores.');
    }
    if (!Array.isArray(firstContributorPage.data)) {
        throw new Error('O banco retornou os colaboradores em um formato inválido.');
    }

    const contributorIds = new Set<string>();
    let offset = 0;
    let contributors = firstContributorPage.data;

    while (offset < firstContributorPage.count) {
        if (!contributors.length) {
            throw new Error('O banco retornou uma página vazia antes do fim dos colaboradores.');
        }

        for (const contributor of contributors) {
            if (typeof contributor.uploaded_by !== 'string') {
                throw new Error('O banco retornou um colaborador em formato inválido.');
            }
            contributorIds.add(contributor.uploaded_by);
        }

        offset += contributors.length;
        if (offset >= firstContributorPage.count) break;

        const nextPage = await supabase
            .from('library_items')
            .select('uploaded_by', { count: 'exact' })
            .order('uploaded_by', { ascending: true })
            .range(offset, offset + 999);

        if (nextPage.error) throw nextPage.error;
        if (!Array.isArray(nextPage.data)) {
            throw new Error('O banco retornou os colaboradores em um formato inválido.');
        }
        contributors = nextPage.data;
    }

    return {
        documentCount,
        contributorCount: contributorIds.size
    };
};
