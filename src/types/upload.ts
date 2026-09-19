export interface UploadForm {
    title: string;
    author: string;
    category: string;
    year: string;
    type: string;
    genre: string;
    language: string;
    description: string;
    cover: File | null;
}
