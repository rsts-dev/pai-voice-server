# Changelog

All notable changes to the PAI Voice Server npm package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Taskfile for local development automation
- GitHub Actions CI/CD workflows
- ESLint configuration for code quality
- Jest testing framework and initial tests
- Comprehensive automation infrastructure

## [1.0.0] - 2025-01-XX

### Added
- Initial release of PAI Voice Server npm package
- CLI with 8 commands:
  - `install` - Fresh installation with environment validation
  - `update` - Smart updates with customization preservation
  - `uninstall` - Safe removal with optional backups
  - `start` - Start the service
  - `stop` - Stop the service
  - `restart` - Restart the service
  - `status` - Show comprehensive service status
  - `verify` - Verify installation integrity
- Dry-run mode for all operations (`--dry-run`)
- Verbose mode for detailed output (`--verbose`)
- Environment validation (Bun, macOS, API key, port availability)
- LaunchAgent management for macOS service
- Smart update system with hash-based file modification detection
- Customization preservation during updates (voices.json)
- Installation metadata tracking
- Colored output with user-friendly messages
- Comprehensive error handling and recovery
- Security features (input validation, rate limiting)

### Installation
- Installation target: `~/.claude/pai-voice-server/`
- LaunchAgent: `~/Library/LaunchAgents/com.pai.voice-server.plist`
- Logs: `~/Library/Logs/pai-voice-server.log`

### Requirements
- Node.js 18.0.0 or higher
- macOS (uses LaunchAgent)
- Bun runtime (for server execution)
- ElevenLabs API key (for voice functionality)

### Documentation
- Complete README with installation instructions
- CLAUDE.md for repository context
- Inline code documentation

## [0.1.0] - Development

### Added
- Initial development version
- Core installation modules
- Command implementations
- Utility functions

---

## Version History

- **1.0.0** - Initial public release
- **0.1.0** - Development version

## Links

- [npm Package](https://www.npmjs.com/package/pai-voice-server)
- [Repository](https://github.com/pai/voice-server)
- [Issues](https://github.com/pai/voice-server/issues)
