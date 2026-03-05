import os from 'node:os';
import path from 'node:path';
import { startServer } from './server.js';

function parseArgs(argv) {
  const args = {
    port: 4312,
    host: '127.0.0.1',
    codexHome: path.join(os.homedir(), '.codex'),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--port' && argv[i + 1]) {
      args.port = Number(argv[i + 1]);
      i += 1;
      continue;
    }

    if (arg === '--host' && argv[i + 1]) {
      args.host = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--codex-home' && argv[i + 1]) {
      args.codexHome = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
  }

  if (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535) {
    throw new Error(`Invalid port: ${args.port}`);
  }

  return args;
}

export async function runCli(argv) {
  const options = parseArgs(argv);
  const server = await startServer(options);

  console.log(`Codex Session Web UI running at http://${options.host}:${options.port}`);
  console.log(`Codex home: ${options.codexHome}`);

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
