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
    genre: string | null;
    language: string | null;
    description: string | null;
    file_name: string;
    file_path: string;
    file_mime: string;
    file_size: number;
    cover_path: string | null;
    cover_url: string;
    created_at: string;
}

export type UploadScanStatus = 'pending' | 'processing' | 'scanning' | 'approved' | 'rejected' | 'failed';

export interface LibraryUploadRequest {
    id: string;
    target_item_id: string;
    title: string;
    file_name: string;
    status: UploadScanStatus;
    status_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReadingProgress {
    id: string;
    document_id: string;
    page: number;
    percent: number;
    status: ReadingStatus;
    title: string;
    author: string;
    cover_url: string;
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

export interface ReviewDraft {
    documentId: string;
    rating: number;
    comment: string;
}
