const DEFAULT_MAX_SIZE = 512;
const DEFAULT_QUALITY = 0.86;

const canvasToWebpBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('Falha ao gerar a imagem WebP.'));
        }, 'image/webp', quality);
    });

export const convertImageToWebp = async (
    file: File,
    options?: { maxSize?: number; quality?: number }
): Promise<File> => {
    if (!file.type.startsWith('image/')) {
        throw new Error('Selecione um arquivo de imagem.');
    }

    const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
    const quality = options?.quality ?? DEFAULT_QUALITY;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        bitmap.close();
        throw new Error('Não foi possível converter a imagem para WebP.');
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvasToWebpBlob(canvas, quality);
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
};
