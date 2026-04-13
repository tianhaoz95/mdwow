import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { App } from './app.js';

const cli = meow(
  `
  Usage
    $ mdwow <file>

  Arguments
    file    Path to a Markdown file to view

  Options
    --help     Show this help message
    --version  Show version number

  Examples
    $ mdwow README.md
    $ mdwow docs/guide.md
    $ npx mdwow CHANGELOG.md
`,
  {
    importMeta: import.meta,
    flags: {},
  },
);

const [filePath] = cli.input;

if (!filePath) {
  console.error('Error: Please provide a Markdown file path.\n');
  console.error('Usage: mdwow <file>');
  console.error('Example: mdwow README.md');
  process.exit(1);
}

const resolved = resolve(filePath);

if (!existsSync(resolved)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

// Always restore mouse reporting before the process dies, regardless of how
// exit is triggered (q key, Ctrl+C, SIGTERM, uncaught error, etc.)
const MOUSE_OFF = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';
process.on('exit', () => {
  process.stdout.write(MOUSE_OFF);
});
// Also handle signals that don't automatically trigger 'exit'
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

const { waitUntilExit } = render(<App filePath={resolved} />, {
  exitOnCtrlC: false,
});

waitUntilExit().then(() => {
  process.exit(0);
});
