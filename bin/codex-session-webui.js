#!/usr/bin/env node
import { runCli } from '../src/cli.js';

runCli(process.argv.slice(2)).catch((error) => {
  console.error(`[codex-session-webui] ${error.message}`);
  process.exit(1);
});
