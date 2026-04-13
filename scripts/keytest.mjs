/**
 * Key + mouse inspector. Press any key or scroll to see raw input.
 * Ctrl+C to quit.
 *
 * Shows BOTH what Ink's useInput sees AND what the raw internal_eventEmitter sees.
 */
import React, { useState, useEffect } from 'react';
import { render, useInput, useApp, useStdin, useStdout, Box, Text } from 'ink';

function KeyTest() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const stdin = useStdin();
  const [log, setLog] = useState([]);

  const push = (msg) => setLog(prev => [...prev.slice(-18), msg]);

  // Enable SGR mouse reporting
  useEffect(() => {
    if (!stdout) return;
    stdout.write('\x1b[?1000h\x1b[?1002h\x1b[?1003h\x1b[?1006h');
    return () => stdout.write('\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l');
  }, [stdout]);

  // Listen on internal_eventEmitter for raw chunks
  useEffect(() => {
    const emitter = stdin.internal_eventEmitter;
    if (!emitter) { push('NO internal_eventEmitter'); return; }

    const handler = (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const hex = buf.toString('hex');
      const str = JSON.stringify(buf.toString('binary'));
      push(`RAW: hex=${hex} str=${str}`);
    };
    emitter.on('input', handler);
    return () => emitter.off('input', handler);
  }, [stdin]);

  // Ink useInput
  useInput((input, key) => {
    if (key.ctrl && input === 'c') { exit(); return; }
    const activeKeys = Object.entries(key).filter(([,v]) => v).map(([k]) => k);
    push(`INK: input=${JSON.stringify(input)} keys=[${activeKeys.join(',')}]`);
  });

  return React.createElement(Box, { flexDirection: 'column', padding: 1 },
    React.createElement(Text, { bold: true, color: 'cyan' },
      'Press keys / scroll (Ctrl+C to quit)'),
    React.createElement(Text, { dimColor: true }, '─'.repeat(60)),
    ...log.map((l, i) =>
      React.createElement(Text, { key: i, color: l.startsWith('RAW') ? 'yellow' : 'green' }, l)
    )
  );
}

render(React.createElement(KeyTest), { exitOnCtrlC: false });
