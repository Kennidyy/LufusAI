import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

if (!existsSync('dist')) mkdirSync('dist');
if (!existsSync('dist/main')) mkdirSync('dist/main');
if (!existsSync('dist/preload')) mkdirSync('dist/preload');
if (!existsSync('dist/views')) mkdirSync('dist/views');

await esbuild.build({
  entryPoints: ['src/main/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/main/index.js',
  format: 'esm',
  external: ['electron', 'dotenv', 'dotenv/config', 'argon2'],
  alias: {
    '@': path.join(rootDir, 'src')
  }
});

await esbuild.build({
  entryPoints: ['src/preload/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/preload/index.js',
  format: 'cjs',
  external: ['electron'],
});

await esbuild.build({
  entryPoints: ['src/views/renderer.ts'],
  bundle: true,
  target: 'chrome120',
  outfile: 'dist/views/renderer.js',
  format: 'iife',
});

copyFileSync('src/views/index.html', 'dist/views/index.html');
copyFileSync('src/views/styles.css', 'dist/views/styles.css');

console.log('Build completed!');