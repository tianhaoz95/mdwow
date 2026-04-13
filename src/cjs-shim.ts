// Shim for CJS globals needed by bundled CommonJS modules
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @ts-ignore
globalThis.require = require;
// @ts-ignore
globalThis.__filename = __filename;
// @ts-ignore
globalThis.__dirname = __dirname;
