# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PAI Voice Server is a voice notification server for the Personal AI Infrastructure (PAI) system. It provides text-to-speech notifications using ElevenLabs API and runs as a macOS LaunchAgent service.

**Technology Stack:**
- Runtime: Bun (required)
- Language: TypeScript
- Platform: macOS-specific (uses afplay, osascript, LaunchAgent)
- Voice API: ElevenLabs TTS API

## Development Commands

### NPM Package Development (Recommended)

```bash
# Build distribution bundle
cd setup/
npm run build                     # Bundles server.ts and voices.json into dist/

# Test locally
npm link                          # Link globally for testing
pai-voice-server install --dry-run  # Preview installation
pai-voice-server install --yes      # Install
pai-voice-server status             # Check status
npm unlink                        # Clean up

# Publish to npm
npm version patch                 # Bump version
npm publish                       # Publish package
```

### Running the Server Directly

```bash
# Run server directly (development)
bun run server.ts

# Run via wrapper script
./run-server.sh
```

### Service Management Commands

**Using NPM package** (recommended):
```bash
pai-voice-server install          # Install service
pai-voice-server start            # Start service
pai-voice-server stop             # Stop service
pai-voice-server restart          # Restart service
pai-voice-server status           # Check status
pai-voice-server update           # Update to latest version
pai-voice-server verify           # Verify installation
pai-voice-server uninstall        # Uninstall service
```

**Using legacy scripts** (deprecated):
```bash
./install.sh                      # DEPRECATED - use npm
./start.sh
./stop.sh
./restart.sh
./status.sh
./uninstall.sh
```

### Testing the API

```bash
# Health check
curl http://localhost:8888/health

# Send test notification
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "voice_id": "s3TPKV1kjDlVtZbl4Ksh"}'
```

## Setup Package Structure

The `setup/` directory contains the npm installation package following the claude-buddy pattern:

```
setup/
├── package.json           # NPM package definition
├── install.js             # Main CLI entry point (#!/usr/bin/env node)
├── lib/
│   ├── commands/          # Command implementations
│   │   ├── installer.js   # Fresh installation logic
│   │   ├── updater.js     # Update with preservation
│   │   ├── uninstaller.js # Safe removal
│   │   ├── start.js       # Start service
│   │   ├── stop.js        # Stop service
│   │   ├── restart.js     # Restart service
│   │   ├── status.js      # Service status
│   │   └── verify.js      # Installation verification
│   ├── core/              # Core modules
│   │   ├── manifest.js    # Component definitions
│   │   ├── environment.js # System validation
│   │   ├── launchagent.js # LaunchAgent management
│   │   ├── metadata.js    # Installation tracking
│   │   └── paths.js       # Path resolution
│   └── utils/             # Utilities
│       ├── logger.js      # Colored output
│       ├── exec.js        # Safe command execution
│       └── file-ops.js    # File operations
├── scripts/
│   └── bundle-dist.js     # Pre-publish bundling
├── dist/                  # Bundled files (created by npm run build)
│   ├── server.ts          # Copied from ../server.ts
│   └── voices.json        # Copied from ../voices.json
├── .npmignore             # NPM publish exclusions
└── README.md              # Package documentation
```

### Key Setup Features

**Installation Workflow:**
1. User runs `npm install -g pai-voice-server`
2. NPM installs package to global node_modules
3. Creates symlink: `pai-voice-server` → `setup/install.js`
4. User runs `pai-voice-server install`
5. Installer copies files from `setup/dist/` to `~/.claude/pai-voice-server/`

**Bundle Process** (prepublishOnly hook):
- `npm run build` → `bundle-dist.js`
- Cleans `setup/dist/`
- Copies `../server.ts` → `setup/dist/server.ts`
- Copies `../voices.json` → `setup/dist/voices.json`
- Verifies bundle contents

**Installation Target:**
- Default: `~/.claude/pai-voice-server/`
- LaunchAgent: `~/Library/LaunchAgents/com.pai.voice-server.plist`
- Logs: `~/Library/Logs/pai-voice-server.log`

**Update Preservation:**
- Detects modified files via hash comparison
- Preserves customized `voices.json`
- Updates server core files only
- Creates backups before replacement

## Architecture

### Core Components

**server.ts** - Main server implementation (~330 lines)
- HTTP server (Bun native serve API)
- ElevenLabs TTS integration
- macOS notification display (via osascript)
- Audio playback (via afplay)
- Rate limiting (10 req/min per IP)
- Input validation and sanitization
- Environment variable loading from `~/.env`

### API Endpoints

1. **POST /notify** - Send voice notification
   - Parameters: `message` (required), `voice_id` (optional), `voice_enabled` (optional, default true), `title` (optional)
   - Returns: JSON status response

2. **POST /pai** - PAI-specific notification (uses default voice)
   - Parameters: `message` (required), `title` (optional)
   - Returns: JSON status response

3. **GET /health** - Health check endpoint
   - Returns: Server status, port, voice system info, API key status

### Voice Configuration

- **voices.json** - Voice metadata (reference only for documentation)
  - Contains voice names, descriptions, speaking rates
  - NOT used by server at runtime (metadata for PAI system hooks)

- **Actual voice IDs** configured in:
  - Environment variable: `ELEVENLABS_VOICE_ID` (default voice)
  - API request parameter: `voice_id` (per-request override)
  - PAI hooks: `hooks/stop-hook.ts` and `hooks/subagent-stop-hook.ts` (in PAI system)

### Security Features

- **Input validation**: Sanitizes messages (max 500 chars, removes dangerous patterns)
- **Rate limiting**: 10 requests per minute per IP
- **CORS**: Restricted to localhost only
- **API key**: Stored securely in `~/.env` (never in code)
- Shell command injection protection via sanitization

### Environment Variables

Required in `~/.env` (user's home directory):
```bash
ELEVENLABS_API_KEY=sk_...    # Required for ElevenLabs voices
ELEVENLABS_VOICE_ID=s3TPKV1kjDlVtZbl4Ksh  # Optional (default voice)
PORT=8888                     # Optional (default 8888)
```

### macOS Integration

- **LaunchAgent**: Auto-starts on login, keeps alive on crashes
- **Logs**: `~/Library/Logs/pai-voice-server.log`
- **Service file**: `~/Library/LaunchAgents/com.pai.voice-server.plist`
- **Menu bar indicator**: Optional SwiftBar/BitBar plugin in `menubar/`

## Key Implementation Details

### Audio Generation Flow

1. Validate and sanitize input text
2. Call ElevenLabs API (`POST /v1/text-to-speech/{voice_id}`)
   - Model: `eleven_turbo_v2_5`
   - Format: audio/mpeg
3. Write audio buffer to `/tmp/voice-{timestamp}.mp3`
4. Play via `/usr/bin/afplay`
5. Clean up temp file after playback

### Error Handling

- Missing API key: Logs warning, server runs but no voice output
- ElevenLabs API errors: Logs error, notification continues without voice
- Invalid input: Returns 400 with error message
- Rate limit exceeded: Returns 429

### Rate Limiting

- In-memory Map tracking: `{ip: {count, resetTime}}`
- Window: 60 seconds
- Limit: 10 requests per IP per window

## Integration with PAI System

This server is designed to work with the PAI (Personal AI Infrastructure) system:

- Receives notifications from Claude Code hooks (completion hooks)
- Different voices for different AI agents (researcher, engineer, pentester, etc.)
- Voice IDs mapped to agent personas in PAI system configuration
- Supports both voice-enabled and silent notifications

## Troubleshooting

**Server won't start:**
- Check port 8888 availability: `lsof -ti:8888`
- Verify Bun installed: `bun --version`
- Check logs: `tail -f ~/Library/Logs/pai-voice-server.log`

**No voice output:**
- Verify API key: `grep ELEVENLABS_API_KEY ~/.env`
- Test health: `curl http://localhost:8888/health`
- Check ElevenLabs quota/rate limits

**API errors:**
- 401: Invalid API key
- 429: Rate limit exceeded (either server-side or ElevenLabs)
- Quota exceeded: Monthly character limit reached

## Important Notes

- **macOS only**: Uses platform-specific tools (afplay, osascript, LaunchAgent)
- **No tests**: Currently no test suite
- **No build step**: TypeScript executed directly via Bun
- **Stateless**: No database, no persistent state (rate limiting is in-memory)
- **Single instance**: Designed to run as single service per user
- **Environment-dependent**: Requires `~/.env` in user home directory

## Menu Bar Indicator

Optional visual status indicator via SwiftBar/BitBar:
- Script: `menubar/pai-voice.5s.sh` (refreshes every 5 seconds)
- Shows: 🎙️ (running) or 🎙️⚫ (stopped)
- Actions: Start, stop, restart, test, view logs
- Installation: `menubar/install-menubar.sh`
