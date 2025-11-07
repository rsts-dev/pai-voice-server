# PAI Voice Server

A voice notification server for the Personal AI Infrastructure (PAI) system that provides text-to-speech notifications using ElevenLabs API.

> **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide (if available).

## 🎯 Features

- **ElevenLabs Integration**: High-quality AI voices for notifications
- **Multiple Voice Support**: Different voices for different AI agents
- **macOS Service**: Runs automatically in the background
- **Menu Bar Indicator**: Visual status indicator in macOS menu bar
- **Simple HTTP API**: Easy integration with any tool or script

## 📋 Prerequisites

- macOS (tested on macOS 11+)
- Node.js 18.0.0+ (for npm installation)
- [Bun](https://bun.sh) runtime (required for running the server)
- ElevenLabs API key (required for voice functionality)

## 🚀 Quick Start

### Method 1: NPM Installation (Recommended)

#### 1. Install Bun (if not already installed)
```bash
curl -fsSL https://bun.sh/install | bash
```

#### 2. Configure API Key (Required)
Add your ElevenLabs API key to `~/.env`:
```bash
echo "ELEVENLABS_API_KEY=your_api_key_here" >> ~/.env
echo "ELEVENLABS_VOICE_ID=s3TPKV1kjDlVtZbl4Ksh" >> ~/.env
```

> Get your free API key at [elevenlabs.io](https://elevenlabs.io) (10,000 characters/month free)

#### 3. Install via NPM
```bash
# Install the installer globally
npm install -g pai-voice-server

# Install the voice server
pai-voice-server install
```

This will:
- Create installation at `~/.claude/pai-voice-server/`
- Create a macOS LaunchAgent for auto-start
- Start the voice server on port 8888
- Verify the installation

## 🛠️ Service Management

### NPM Commands (Recommended)

```bash
# Check status
pai-voice-server status

# Start/Stop/Restart
pai-voice-server start
pai-voice-server stop
pai-voice-server restart

# Update to latest version
pai-voice-server update

# Verify installation
pai-voice-server verify

# Uninstall
pai-voice-server uninstall
```

### Method 2: Manual Installation (Alternative)

If you prefer manual installation without NPM:

```bash
cd ~/.claude/pai-voice-server
./install.sh
```

**Manual service management:**
```bash
./start.sh     # Start server
./stop.sh      # Stop server
./restart.sh   # Restart server
./status.sh    # Check status
./uninstall.sh # Uninstall
```

> **Note**: The manual scripts (`.sh` files) are deprecated and will be removed in a future version. Please use the NPM installation method.

## 📡 API Usage

### Send a Voice Notification
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Task completed successfully",
    "voice_id": "s3TPKV1kjDlVtZbl4Ksh",
    "voice_enabled": true
  }'
```

### Parameters
- `message` (required): The text to speak
- `voice_id` (optional): ElevenLabs voice ID to use
- `voice_enabled` (optional): Whether to speak the notification (default: true)
- `title` (optional): Notification title (default: "PAI Notification")

### Available Voice IDs
```javascript
// PAI System Agents
Kai:                     s3TPKV1kjDlVtZbl4Ksh  // Main assistant
Perplexity-Researcher:   AXdMgz6evoL7OPd7eU12  // Perplexity research agent
Claude-Researcher:       AXdMgz6evoL7OPd7eU12  // Claude research agent
Gemini-Researcher:       iLVmqjzCGGvqtMCk6vVQ  // Gemini research agent
Engineer:                fATgBRI8wg5KkDFg8vBd  // Engineering agent
Principal-Engineer:      iLVmqjzCGGvqtMCk6vVQ  // Principal engineering agent
Designer:                ZF6FPAbjXT4488VcRRnw  // Design agent
Architect:               muZKMsIDGYtIkjjiUS82  // Architecture agent
Pentester:               xvHLFjaUEpx4BOf7EiDd  // Security agent
Artist:                  ZF6FPAbjXT4488VcRRnw  // Artist agent
Writer:                  gfRt6Z3Z8aTbpLfexQ7N  // Content agent
```

## 🖥️ Menu Bar Indicator

The voice server includes an optional menu bar indicator that shows the server status.

### Installing the Menu Bar

1. **Install SwiftBar** (recommended) or BitBar:
```bash
brew install --cask swiftbar
# OR
brew install --cask bitbar
```

2. **Run the menu bar installer**:
```bash
cd ~/.claude/voice-server/menubar
./install-menubar.sh
```

### Menu Bar Features
- **Visual Status**: 🎙️ (running) or 🎙️⚫ (stopped)
- **Quick Controls**: Start/Stop/Restart server from menu
- **Status Info**: Shows voice type (ElevenLabs)
- **Quick Test**: Test voice with one click
- **View Logs**: Access server logs directly

### Manual Installation
If you prefer manual installation:
1. Copy `menubar/pai-voice.5s.sh` to your SwiftBar/BitBar plugins folder
2. Make it executable: `chmod +x pai-voice.5s.sh`
3. Refresh SwiftBar/BitBar

## 🔧 Configuration

### Environment Variables (in ~/.env)

**Required:**
```bash
ELEVENLABS_API_KEY=your_api_key_here
```

**Optional:**
```bash
PORT=8888                                    # Server port (default: 8888)
ELEVENLABS_VOICE_ID=s3TPKV1kjDlVtZbl4Ksh   # Default voice ID (Kai's voice)
```

### Voice Configuration (voices.json)

The `voices.json` file provides reference metadata for agent voices:

```json
{
  "default_rate": 175,
  "voices": {
    "kai": {
      "voice_name": "Jamie (Premium)",
      "rate_multiplier": 1.3,
      "rate_wpm": 228,
      "description": "UK Male - Professional, conversational",
      "type": "Premium"
    },
    "researcher": {
      "voice_name": "Ava (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "US Female - Analytical, highest quality",
      "type": "Premium"
    },
    "engineer": {
      "voice_name": "Zoe (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "US Female - Steady, professional",
      "type": "Premium"
    },
    "architect": {
      "voice_name": "Serena (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "UK Female - Strategic, sophisticated",
      "type": "Premium"
    },
    "designer": {
      "voice_name": "Isha (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "Indian Female - Creative, distinct",
      "type": "Premium"
    },
    "artist": {
      "voice_name": "Isha (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "Indian Female - Creative, artistic",
      "type": "Premium"
    },
    "pentester": {
      "voice_name": "Oliver (Enhanced)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "UK Male - Technical, sharp",
      "type": "Enhanced"
    },
    "writer": {
      "voice_name": "Serena (Premium)",
      "rate_multiplier": 1.35,
      "rate_wpm": 236,
      "description": "UK Female - Articulate, warm",
      "type": "Premium"
    }
  }
}
```

**Note:** The actual ElevenLabs voice IDs are configured in the hook files (`hooks/stop-hook.ts` and `hooks/subagent-stop-hook.ts`), not in `voices.json`.

## 🏥 Health Check

Check server status:
```bash
curl http://localhost:8888/health
```

Response:
```json
{
  "status": "healthy",
  "port": 8888,
  "voice_system": "ElevenLabs",
  "default_voice_id": "s3TPKV1kjDlVtZbl4Ksh",
  "api_key_configured": true
}
```

## 🐛 Troubleshooting

### Server won't start
1. Check if another service is using port 8888:
   ```bash
   lsof -ti:8888
   ```
2. Kill the process if needed:
   ```bash
   lsof -ti:8888 | xargs kill -9
   ```

### No voice output
1. Verify ElevenLabs API key is configured:
   ```bash
   grep ELEVENLABS_API_KEY ~/.env
   ```
2. Check server logs:
   ```bash
   tail -f ~/Library/Logs/pai-voice-server.log
   ```
3. Test the API directly:
   ```bash
   curl -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message":"Test message","voice_id":"s3TPKV1kjDlVtZbl4Ksh"}'
   ```

### API Errors
- **401 Unauthorized**: Invalid API key - check ~/.env
- **429 Too Many Requests**: Rate limit exceeded - wait or upgrade plan
- **Quota Exceeded**: Monthly character limit reached - upgrade plan or wait for reset

## 📁 Project Structure

```
voice-server/
├── setup/                 # NPM installation package
│   ├── package.json       # NPM package configuration
│   ├── install.js         # CLI entry point
│   ├── lib/               # Installation modules
│   │   ├── commands/      # Command implementations
│   │   ├── core/          # Core modules
│   │   └── utils/         # Utilities
│   ├── dist/              # Bundled server files
│   └── README.md          # NPM package documentation
├── server.ts              # Main server implementation
├── voices.json            # Voice metadata and configuration
├── [*.sh scripts]         # Legacy manual scripts (deprecated)
├── macos-service/         # LaunchAgent configuration
└── menubar/               # Menu bar indicator scripts
```

**Installation Locations** (when using npm):
- Installation: `~/.claude/pai-voice-server/`
- LaunchAgent: `~/Library/LaunchAgents/com.pai.voice-server.plist`
- Logs: `~/Library/Logs/pai-voice-server.log`

## 🔒 Security

- **API Key Protection**: Keep your `ELEVENLABS_API_KEY` secure
- **Never commit** API keys to version control
- **CORS**: Server is restricted to localhost only
- **Rate Limiting**: 10 requests per minute per IP

## 📊 Performance

- **Voice Generation**: ~500ms-2s (API call + network)
- **Audio Playback**: Immediate after generation
- **Monthly Quota**: 10,000 characters (free tier)
- **Rate Limits**: Per ElevenLabs plan

## 📝 License

Part of the Personal AI Infrastructure (PAI) system.

## 🙋 Support

For issues or questions:
1. Check the logs: `~/.claude/voice-server/logs/`
2. Verify configuration: `curl http://localhost:8888/health`
3. Review documentation: `documentation/voice-system.md`
