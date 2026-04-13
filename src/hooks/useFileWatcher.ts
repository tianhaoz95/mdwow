import { useState, useEffect, useRef } from 'react';
import { readFileSync } from 'fs';
import chokidar from 'chokidar';

export type FileWatcherState = {
  content: string | null;
  error: string | null;
  lastUpdated: Date | null;
  isWatching: boolean;
};

function readFile(filePath: string): { content: string; error: null } | { content: null; error: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return { content, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: null, error: `Failed to read file: ${message}` };
  }
}

export function useFileWatcher(filePath: string): FileWatcherState {
  const [state, setState] = useState<FileWatcherState>(() => {
    const { content, error } = readFile(filePath);
    return {
      content,
      error,
      lastUpdated: content ? new Date() : null,
      isWatching: false,
    };
  });

  const watcherRef = useRef<ReturnType<typeof chokidar.watch> | null>(null);

  useEffect(() => {
    // Initial read
    const { content, error } = readFile(filePath);
    setState({
      content,
      error,
      lastUpdated: content ? new Date() : null,
      isWatching: true,
    });

    // Set up watcher
    const watcher = chokidar.watch(filePath, {
      persistent: true,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    watcher.on('change', () => {
      const { content: newContent, error: newError } = readFile(filePath);
      setState({
        content: newContent,
        error: newError,
        lastUpdated: newContent ? new Date() : null,
        isWatching: true,
      });
    });

    watcher.on('unlink', () => {
      setState((prev) => ({
        ...prev,
        error: 'File was removed',
        isWatching: false,
      }));
    });

    watcher.on('error', (err) => {
      setState((prev) => ({
        ...prev,
        error: `Watcher error: ${err instanceof Error ? err.message : String(err)}`,
      }));
    });

    watcherRef.current = watcher;

    return () => {
      watcher.close().catch(() => {});
      watcherRef.current = null;
    };
  }, [filePath]);

  return state;
}
