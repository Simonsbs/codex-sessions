import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SessionStore } from './session-store.js';

function parseArgs(argv) {
  const options = {
    codexHome: path.join(os.homedir(), '.codex'),
    command: null,
    rest: [],
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--codex-home' && argv[i + 1]) {
      options.codexHome = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (!options.command) {
      options.command = arg;
      continue;
    }
    options.rest.push(arg);
  }

  return options;
}

function formatDate(iso) {
  if (!iso) return 'n/a';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'n/a' : d.toLocaleString();
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function printSessionsTable(sessions) {
  for (let i = 0; i < sessions.length; i += 1) {
    const s = sessions[i];
    const prompt = s.prompt ? s.prompt.slice(0, 80) : 'No prompt preview';
    console.log(`${String(i + 1).padStart(3, ' ')}. ${s.name}`);
    console.log(`     id: ${s.id}`);
    console.log(`     modified: ${formatDate(s.modifiedAt)} | size: ${formatSize(s.sizeBytes)}`);
    console.log(`     ${prompt}`);
  }
}

async function runCommand(store, command, args, asJson) {
  if (command === 'list') {
    const sessions = await store.listSessions();
    if (asJson) {
      console.log(JSON.stringify({ sessions }, null, 2));
    } else {
      printSessionsTable(sessions);
    }
    return;
  }

  if (command === 'rename') {
    const [sessionId, ...nameParts] = args;
    const name = nameParts.join(' ').trim();
    if (!sessionId || !name) {
      throw new Error('Usage: codex-session-tui rename <sessionId> <name>');
    }
    const result = await store.renameSession(sessionId, name);
    console.log(`Renamed ${result.sessionId} => ${result.name}`);
    return;
  }

  if (command === 'delete') {
    const [sessionId] = args;
    if (!sessionId) {
      throw new Error('Usage: codex-session-tui delete <sessionId>');
    }
    const result = await store.deleteSession(sessionId);
    console.log(`Deleted ${result.sessionId} (moved to ${result.trashPath})`);
    return;
  }

  if (command === 'copy') {
    const [sessionId] = args;
    if (!sessionId) {
      throw new Error('Usage: codex-session-tui copy <sessionId>');
    }
    const result = await store.copySession(sessionId);
    console.log(`Copied ${result.sessionId} to ${result.copyPath}`);
    return;
  }

  if (command === 'duplicate') {
    const [sessionId] = args;
    if (!sessionId) {
      throw new Error('Usage: codex-session-tui duplicate <sessionId>');
    }
    const result = await store.duplicateSession(sessionId);
    console.log(`Duplicated ${result.sessionId} as ${result.duplicateId}`);
    console.log(`New file: ${result.duplicatePath}`);
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log('codex-session-tui [--codex-home <path>] [command]');
    console.log('Commands:');
    console.log('  list [--json]');
    console.log('  rename <sessionId> <name>');
    console.log('  delete <sessionId>');
    console.log('  copy <sessionId>');
    console.log('  duplicate <sessionId>');
    console.log('No command starts interactive TUI mode.');
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function runInteractive(store) {
  const rl = readline.createInterface({ input, output });

  try {
    let running = true;

    while (running) {
      const sessions = await store.listSessions();
      console.clear();
      console.log('Codex Sessions TUI');
      console.log(`Codex home: ${store.codexHome}`);
      console.log('');

      if (!sessions.length) {
        console.log('No sessions found.');
        break;
      }

      printSessionsTable(sessions.slice(0, 30));
      if (sessions.length > 30) {
        console.log(`... showing 30 of ${sessions.length} sessions`);
      }

      console.log('');
      const pick = (await rl.question('Pick number, r=refresh, q=quit: ')).trim().toLowerCase();

      if (pick === 'q') {
        running = false;
        continue;
      }
      if (pick === 'r') {
        continue;
      }

      const index = Number(pick) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= sessions.length) {
        await rl.question('Invalid selection. Press Enter to continue.');
        continue;
      }

      const selected = sessions[index];
      console.log('');
      console.log(`Selected: ${selected.name}`);
      const action = (await rl.question('Action [rename|delete|copy|duplicate|back]: ')).trim().toLowerCase();

      try {
        if (action === 'rename') {
          const name = (await rl.question('New name: ')).trim();
          await store.renameSession(selected.id, name);
          await rl.question('Renamed. Press Enter to continue.');
        } else if (action === 'delete') {
          const confirm = (await rl.question('Type DELETE to confirm: ')).trim();
          if (confirm === 'DELETE') {
            await store.deleteSession(selected.id);
            await rl.question('Deleted. Press Enter to continue.');
          }
        } else if (action === 'copy') {
          const result = await store.copySession(selected.id);
          await rl.question(`Copied to ${result.copyPath}. Press Enter.`);
        } else if (action === 'duplicate') {
          const result = await store.duplicateSession(selected.id);
          await rl.question(`Duplicated as ${result.duplicateId}. Press Enter.`);
        }
      } catch (error) {
        await rl.question(`${error.message}. Press Enter to continue.`);
      }
    }
  } finally {
    rl.close();
  }
}

export async function runCli(argv) {
  const options = parseArgs(argv);
  const store = new SessionStore(options.codexHome);
  await store.ensureLayout();

  if (options.command) {
    await runCommand(store, options.command, options.rest, options.json);
    return;
  }

  await runInteractive(store);
}
