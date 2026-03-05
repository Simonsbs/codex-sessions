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
npm install -g @simonsbs/codex-sessions
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

## Examples
List sessions (tabular):
```bash
codex-sessions list
```

Rename a session and verify it appears in the list:
```bash
codex-sessions rename 019cbdc9-7be5-7ac0-adf7-0c60e90a2c83 "Project kickoff"
codex-sessions list
```

Copy a session JSONL to export folder:
```bash
codex-sessions copy 019cbdc9-7be5-7ac0-adf7-0c60e90a2c83
# output includes path in ~/.codex/session_exports
```

Duplicate a session to create a new session ID:
```bash
codex-sessions duplicate 019cbdc9-7be5-7ac0-adf7-0c60e90a2c83
```

Delete a session safely to trash folder:
```bash
codex-sessions delete 019cbdc9-7be5-7ac0-adf7-0c60e90a2c83
# moved to ~/.codex/session_trash
```

Use a custom Codex home path:
```bash
codex-sessions list --codex-home /path/to/custom/.codex
```

## Output format (`list`)
Columns:
- `#`
- `ID` (full UUID)
- `Modified`
- `Prompt`

If a custom name exists, prompt column starts with:
- `<custom-name> | <prompt-preview>`

## Changelog
- [CHANGELOG.md](./CHANGELOG.md)

## Open-source docs
- [License](./LICENSE)
- [Contributing](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security](./SECURITY.md)
