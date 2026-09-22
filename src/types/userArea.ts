export type ReadingStatus = 'lendo' | 'lido' | 'pausado';

export interface LibraryCatalogItem {
    id: string;
    title: string;
    author: string;
}

export interface LibraryContribution {
    id: string;
    title: string;
    author: string;
    category: string;
    content_type: string;
    year: number | null;
    file_name: string;
    cover_url: string;
    created_at: string;
}

export interface ReadingProgress {
    id: string;
    document_id: string;
    page: number;
    percent: number;
    status: ReadingStatus;
    title: string;
    author: string;
}

export interface DocumentReview {
    id: string;
    document_id: string;
    rating: number;
    comment: string;
    title: string;
    author: string;
}

export interface UserProfileForm {
    fullName: string;
    username: string;
    email: string;
    avatarUrl: string;
}

export interface ProgressDraft {
    documentId: string;
    page: number;
    percent: number;
    status: ReadingStatus;
}

export interface ReviewDraft {
    documentId: string;
    rating: number;
    comment: string;
}
