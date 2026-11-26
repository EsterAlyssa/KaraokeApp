import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Icona: design/icone/d-duetto-dadi.svg (copiata in public/favicon.svg).
// iPhone e Android "maskable" ritagliano l'icona da soli: lo sfondo verde acqua deve arrivare
// fino ai bordi, altrimenti resta una cornice bianca.
const TEAL = '#00696F';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0.22, resizeOptions: { background: TEAL } },
    apple: { ...preset.apple, padding: 0.08, resizeOptions: { background: TEAL } },
  },
  images: ['public/favicon.svg'],
});
