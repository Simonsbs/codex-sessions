# codex-session-webui

Localhost Web UI for managing Codex CLI sessions.

## Features

- List sessions from `~/.codex/sessions`
- Rename sessions (stored in `~/.codex/session-manager-meta.json`)
- Delete sessions (moves files to `~/.codex/session_trash`)
- Copy sessions (copies JSONL into `~/.codex/session_exports`)
- Duplicate sessions (creates a new session file with a new UUID)

## Install

```bash
npm install -g codex-session-webui
```

For local development in this repo:

```bash
npm install
npm start
```

## Run

```bash
codex-session-webui
```

Options:

- `--port <number>` default `4312`
- `--host <host>` default `127.0.0.1`
- `--codex-home <path>` default `~/.codex`

Then open `http://127.0.0.1:4312`.

## Notes

- Renaming does not modify original Codex session JSONL content.
- Deleting is reversible by moving files back from `session_trash`.
