/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MLB_API_URL?: string;
  readonly VITE_MLB_HEADSHOT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
