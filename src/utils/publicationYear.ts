export const parsePublicationYear = (value: string): number | null => {
    if (!/^\d+$/.test(value.trim())) return null;

    const year = Number(value);
    const currentYear = new Date().getFullYear();
    if (!Number.isSafeInteger(year) || year < 1000 || year > currentYear + 1) return null;
    return year;
};
