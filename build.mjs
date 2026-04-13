import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  jsx: 'automatic',
  target: 'node18',
  inject: ['src/cjs-shim.ts'],
  // Bundle all dependencies for zero-install npx usage
  // fsevents is a native macOS binary — must stay external
  external: ['fsevents'],
  // Stub out the optional react-devtools-core import so it doesn't crash at runtime
  plugins: [
    {
      name: 'stub-optional-deps',
      setup(build) {
        build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
          path: 'react-devtools-core',
          namespace: 'stub',
        }));
        build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: 'export default null;',
          loader: 'js',
        }));
      },
    },
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('Build complete: dist/cli.js');
