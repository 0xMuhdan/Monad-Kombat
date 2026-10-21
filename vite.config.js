import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      // Copy entire assets directory recursively into dist/assets
      const srcAssets = path.resolve(__dirname, 'assets');
      const distAssets = path.resolve(distDir, 'assets');
      if (fs.existsSync(srcAssets)) {
        fs.cpSync(srcAssets, distAssets, { recursive: true, force: false });
      }

      // Copy essential standalone runtime files
      const runtimeFiles = [
        'fighter-registry.js',
        'files.json',
        'sw.js',
        'precache.js',
        'preload.js',
        'game.js',
        'match.js',
        'touch.js',
        'menu.js',
        'announcer.js',
        'cora.js',
        'edda.js',
        'fenr.js',
        'haldor.js',
        'isolde.js',
        'mira.js',
        'naja.js',
        'nib.js',
        'rhea.js',
        'solan.js',
        'zanni.js',
        'style.css',
        'menu.css',
        'monad-kombat-theme.css',
        '.htaccess'
      ];

      for (const file of runtimeFiles) {
        const srcPath = path.resolve(__dirname, file);
        const destPath = path.resolve(distDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  };
}

export default defineConfig({
  server: { port: 8000, host: 'localhost' },
  plugins: [copyStaticAssetsPlugin()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        home: 'monad-kombat.html',
        game: 'offline-lab.html',
        dashboard: 'dashboard.html',
        join: 'join.html',
        lobby: 'lobby.html',
        match: 'match.html',
        result: 'result.html',
        mobile: 'mobile.html'
      }
    }
  }
});
