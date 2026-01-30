/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Añade aquí otras variables VITE_ que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}