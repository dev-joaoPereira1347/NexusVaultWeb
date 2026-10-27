import type { PublicLibraryItem } from '@/types/library';

export interface BookCollection {
    id: string;
    user_id: string;
    name: string;
    description: string;
    is_public: boolean;
    updated_at: string;
    items: PublicLibraryItem[];
}

export interface BookCollectionDraft {
    name: string;
    isPublic: boolean;
}
