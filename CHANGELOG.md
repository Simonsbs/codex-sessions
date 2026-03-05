# Changelog

All notable changes to this project are documented in this file.

## [0.4.1] - 2026-03-05
### Added
- Added `CHANGELOG.md` to document releases.
- Expanded README with practical usage instructions and examples.

### Changed
- `list` output is now tabular for easier scanning.
- `list` now prioritizes full session IDs.
- Removed `Name` and `Size` columns from `list` output.
- Renamed sessions are now visible in `list` by prefixing the prompt column with `<custom-name> | ...`.

## [0.4.0] - 2026-03-05
### Changed
- Package moved to scoped name `@simonsbs/codex-sessions`.

## [0.3.0] - 2026-03-05
### Changed
- Refactored from Web UI to terminal-first TUI/CLI workflow.
- Added interactive mode plus command mode (`list`, `rename`, `delete`, `copy`, `duplicate`).
- Added open-source project docs (`LICENSE`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`).
