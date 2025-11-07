# PAI Voice Server Installation Package

Installation package for PAI Voice Server - Text-to-speech notification service using ElevenLabs API.

## Installation

### Global Installation (Recommended)

```bash
npm install -g pai-voice-server
```

This installs the `pai-voice-server` command globally.

### Install Voice Server

```bash
# Install the voice server
pai-voice-server install

# Or preview installation first
pai-voice-server install --dry-run
```

## Usage

### Commands

```bash
# Install
pai-voice-server install              # Install voice server
pai-voice-server install --dry-run    # Preview installation

# Service Management
pai-voice-server start                # Start the service
pai-voice-server stop                 # Stop the service
pai-voice-server restart              # Restart the service
pai-voice-server status               # Show service status
pai-voice-server status --verbose     # Show detailed status with logs

# Updates & Maintenance
pai-voice-server update               # Update to latest version
pai-voice-server update --dry-run     # Preview update
pai-voice-server verify               # Verify installation integrity

# Uninstall
pai-voice-server uninstall            # Uninstall voice server
pai-voice-server uninstall --preserve-logs  # Keep log files
pai-voice-server uninstall --backup   # Create backup before removal
```

### Options

- `--dry-run` - Preview changes without making them
- `--yes`, `-y` - Skip confirmation prompts
- `--verbose` - Show detailed output
- `--force`, `-f` - Force operation (install/update)
- `--help`, `-h` - Show help message
- `--version`, `-v` - Show version information

## Installation Location

The voice server is installed to:

- **Installation**: `~/.claude/pai-voice-server/`
- **LaunchAgent**: `~/Library/LaunchAgents/com.pai.voice-server.plist`
- **Logs**: `~/Library/Logs/pai-voice-server.log`

## Prerequisites

- **macOS**: Currently macOS only (uses LaunchAgent)
- **Bun**: Required for running the server ([install Bun](https://bun.sh))
- **Node.js**: 18.0.0 or higher (for installation tool)
- **ElevenLabs API Key**: Required for voice functionality ([get API key](https://elevenlabs.io))

## Configuration

Add your ElevenLabs API key to `~/.env`:

```bash
echo "ELEVENLABS_API_KEY=your_api_key_here" >> ~/.env
echo "ELEVENLABS_VOICE_ID=s3TPKV1kjDlVtZbl4Ksh" >> ~/.env
```

## Features

- ✅ **Dry-run mode**: Preview all changes before making them
- ✅ **Smart updates**: Preserves your customizations during updates
- ✅ **Service management**: Start, stop, restart with simple commands
- ✅ **Health checks**: Verify installation integrity
- ✅ **Detailed status**: See complete service information
- ✅ **Verbose logging**: Debug issues with detailed output

## Examples

### Fresh Installation

```bash
# Preview installation
pai-voice-server install --dry-run

# Install
pai-voice-server install

# Check status
pai-voice-server status
```

### Update Workflow

```bash
# Check current status
pai-voice-server status

# Preview update
pai-voice-server update --dry-run

# Perform update
pai-voice-server update

# Verify installation
pai-voice-server verify
```

### Troubleshooting

```bash
# Check detailed status
pai-voice-server status --verbose

# Verify installation
pai-voice-server verify

# View logs
tail -f ~/Library/Logs/pai-voice-server.log

# Restart service
pai-voice-server restart
```

## Update Preservation

When you run `pai-voice-server update`, the updater automatically:

- ✅ Detects your customized files (like `voices.json`)
- ✅ Preserves them during updates
- ✅ Only updates server core files
- ✅ Creates backups of replaced files

## API Usage

Once installed and running, the server provides a REST API:

### Health Check

```bash
curl http://localhost:8888/health
```

### Send Notification

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Task completed successfully",
    "voice_id": "s3TPKV1kjDlVtZbl4Ksh"
  }'
```

## Development

### Local Testing

```bash
cd setup/
npm link                      # Link globally for testing
pai-voice-server install --dry-run
```

### Building Distribution

```bash
cd setup/
npm run build                 # Bundle dist/ files
npm pack                      # Test package contents
```

## Support

- **Repository**: https://github.com/pai/voice-server
- **Issues**: https://github.com/pai/voice-server/issues
- **Documentation**: [Main README](../README.md)

## License

MIT
