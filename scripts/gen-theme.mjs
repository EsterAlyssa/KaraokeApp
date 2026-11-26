// Genera src/styles/theme.css dal tema Material (design/material-theme.json).
// Uso: npm run theme
import { readFileSync, writeFileSync } from 'node:fs';

const theme = JSON.parse(readFileSync(new URL('../design/material-theme.json', import.meta.url), 'utf8'));

// Variabili dell'app -> ruoli Material
const map = {
  bg: 'background',
  card: 'surfaceContainerLowest',
  surface: 'surfaceContainerHigh',
  ink: 'onSurface',
  muted: 'onSurfaceVariant',
  line: 'outlineVariant',
  'line-strong': 'outline',
  primary: 'primary',
  'on-primary': 'onPrimary',
  accent: 'primaryContainer',
  'on-accent': 'onPrimaryContainer',
  tertiary: 'tertiaryContainer',
  danger: 'error',
};

const block = (scheme) =>
  Object.entries(map)
    .map(([v, role]) => `  --${v}: ${theme.schemes[scheme][role]};`)
    .join('\n');

const css = `/* GENERATO da scripts/gen-theme.mjs: non modificare a mano. */
/* Fonte: design/material-theme.json (seed ${theme.seed}) */

:root,
[data-theme='day'] {
${block('light')}
  color-scheme: light;
}

[data-theme='night'] {
${block('dark')}
  color-scheme: dark;
}
`;

writeFileSync(new URL('../src/styles/theme.css', import.meta.url), css);
console.log('Scritto src/styles/theme.css');
