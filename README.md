# codex-session-tui

Terminal-first session manager for Codex CLI.

## Why TUI
This tool stays in the same workflow as Codex CLI:
- terminal-native interaction
- no web server
- no localhost browser surface

## Features
- List sessions from `~/.codex/sessions`
- Rename session display names (stored in `~/.codex/session-manager-meta.json`)
- Delete sessions (moves files to `~/.codex/session_trash`)
- Copy sessions (copies `.jsonl` files into `~/.codex/session_exports`)
- Duplicate sessions (creates a new session file with a new UUID)

## Install
```bash
npm install -g codex-session-tui
```

## Usage
Interactive TUI mode:
```bash
codex-session-tui
```

Command mode:
```bash
codex-session-tui list
codex-session-tui list --json
codex-session-tui rename <sessionId> "New Name"
codex-session-tui delete <sessionId>
codex-session-tui copy <sessionId>
codex-session-tui duplicate <sessionId>
```

Options:
- `--codex-home <path>` override the Codex home directory (default `~/.codex`)

## Open-source docs
- [License](./LICENSE)
- [Contributing](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security](./SECURITY.md)

## Publish to npm
```bash
npm login
npm publish --access public
```
