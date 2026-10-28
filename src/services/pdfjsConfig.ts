export const pdfWasmUrl = new URL(
    `${import.meta.env.BASE_URL}pdfjs/wasm/`,
    window.location.origin
).href;
