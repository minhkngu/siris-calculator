import { spawn } from 'node:child_process';

const commands = [
  [new URL('../server/lark-api.mjs', import.meta.url).pathname, []],
  [new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname, ['--host', '127.0.0.1']],
];
const children = commands.map(([file, args]) => spawn(process.execPath, [file, ...args], {
  stdio: 'inherit',
  env: process.env,
}));
let stopping = false;

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = code;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stopAll(0));
}

for (const child of children) {
  child.on('error', error => {
    process.stderr.write(`Không khởi động được máy chủ phát triển: ${error.message}\n`);
    stopAll(1);
  });
  child.on('exit', code => {
    if (!stopping) stopAll(code ?? 1);
  });
}
