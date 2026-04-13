import { spawn } from 'child_process';

/** Open a URL in the default browser, cross-platform. */
export function openUrl(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32'  ? 'start' :
    'xdg-open';

  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}
