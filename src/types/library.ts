export interface LibraryItem {
    id: string;
    uploaded_by: string;
    title: string;
    author: string;
    category: string;
    content_type: string;
    year: number | null;
    genre: string | null;
    language: string | null;
    description: string | null;
    file_path: string;
    file_name: string;
    file_mime: string;
    file_size: number;
    cover_path: string | null;
    created_at: string;
    updated_at: string;
}

export interface LibraryItemInsert {
    uploaded_by: string;
    title: string;
    author: string;
    category: string;
    content_type: string;
    year: number | null;
    genre: string | null;
    language: string | null;
    description: string | null;
    file_path: string;
    file_name: string;
    file_mime: string;
    file_size: number;
    cover_path: string | null;
}

export interface PublicLibraryItem {
    id: string;
    title: string;
    author: string;
    category: string;
    content_type: string;
    year: number | null;
    description: string | null;
    cover_url: string;
    download_url: string;
}
