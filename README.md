# codex-sessions

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
npm install -g codex-sessions
```

## Usage
Interactive TUI mode:
```bash
codex-sessions
```

Command mode:
```bash
codex-sessions list
codex-sessions list --json
codex-sessions rename <sessionId> "New Name"
codex-sessions delete <sessionId>
codex-sessions copy <sessionId>
codex-sessions duplicate <sessionId>
```

Compatibility alias:
```bash
codex-session-tui
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
