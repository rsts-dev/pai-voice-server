#!/usr/bin/env node
/**
 * PAI Voice Server - Installation CLI
 * Main entry point for the installation package
 */

const logger = require('./lib/utils/logger');
const packageJson = require('./package.json');

// Command handlers
const commands = {
  install: require('./lib/commands/installer'),
  update: require('./lib/commands/updater'),
  uninstall: require('./lib/commands/uninstaller'),
  start: require('./lib/commands/start'),
  stop: require('./lib/commands/stop'),
  restart: require('./lib/commands/restart'),
  status: require('./lib/commands/status'),
  verify: require('./lib/commands/verify')
};

/**
 * Display help text
 */
function showHelp() {
  console.log(`
${logger.colors.bright}PAI Voice Server${logger.colors.reset} - v${packageJson.version}

${logger.colors.bright}USAGE${logger.colors.reset}
  pai-voice-server <command> [options]

${logger.colors.bright}COMMANDS${logger.colors.reset}
  install      Install PAI Voice Server
  update       Update to latest version (preserves customizations)
  uninstall    Uninstall PAI Voice Server
  start        Start the service
  stop         Stop the service
  restart      Restart the service
  status       Show service status
  verify       Verify installation integrity

${logger.colors.bright}OPTIONS${logger.colors.reset}
  --dry-run    Preview changes without making them
  --yes        Skip confirmation prompts
  --verbose    Show detailed output
  --help       Show this help message
  --version    Show version information

${logger.colors.bright}EXAMPLES${logger.colors.reset}
  # Install the voice server
  pai-voice-server install

  # Preview installation without making changes
  pai-voice-server install --dry-run

  # Update to latest version
  pai-voice-server update

  # Check service status
  pai-voice-server status

  # View detailed status with logs
  pai-voice-server status --verbose

  # Uninstall and preserve logs
  pai-voice-server uninstall --preserve-logs

${logger.colors.bright}DOCUMENTATION${logger.colors.reset}
  Repository: https://github.com/pai/voice-server
  Issues: https://github.com/pai/voice-server/issues

${logger.colors.bright}INSTALLATION LOCATION${logger.colors.reset}
  Default: ~/.claude/pai-voice-server/
  LaunchAgent: ~/Library/LaunchAgents/com.pai.voice-server.plist
  Logs: ~/Library/Logs/pai-voice-server.log
`);
}

/**
 * Display version information
 */
function showVersion() {
  console.log(`pai-voice-server v${packageJson.version}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  const parsed = {
    command: null,
    options: {
      dryRun: false,
      yes: false,
      verbose: false,
      force: false,
      preserveLogs: false,
      backup: false
    }
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      showVersion();
      process.exit(0);
    }

    if (arg === '--dry-run') {
      parsed.options.dryRun = true;
      continue;
    }

    if (arg === '--yes' || arg === '-y') {
      parsed.options.yes = true;
      continue;
    }

    if (arg === '--verbose') {
      parsed.options.verbose = true;
      continue;
    }

    if (arg === '--force' || arg === '-f') {
      parsed.options.force = true;
      continue;
    }

    if (arg === '--preserve-logs') {
      parsed.options.preserveLogs = true;
      continue;
    }

    if (arg === '--backup') {
      parsed.options.backup = true;
      continue;
    }

    // If it doesn't start with --, it's a command
    if (!arg.startsWith('--') && !arg.startsWith('-')) {
      if (!parsed.command) {
        parsed.command = arg;
      }
    }
  }

  return parsed;
}

/**
 * Main entry point
 */
async function main() {
  const parsed = parseArgs();

  // Set logger modes
  if (parsed.options.verbose) {
    logger.setVerbose(true);
  }

  if (parsed.options.dryRun) {
    logger.setDryRun(true);
  }

  // Default to status if no command provided
  const command = parsed.command || 'status';

  // Check if command exists
  if (!commands[command]) {
    logger.error(`Unknown command: ${command}`);
    logger.info('Run with --help to see available commands');
    process.exit(1);
  }

  try {
    // Execute command
    const result = await commands[command](parsed.options);

    // Exit with appropriate code
    if (result && result.success === false) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logger.newline();
    logger.errorBox('Command Failed');
    logger.newline();
    logger.error(error.message);

    if (parsed.options.verbose && error.stack) {
      logger.newline();
      logger.log(logger.colors.dim + error.stack + logger.colors.reset);
    }

    logger.newline();
    logger.info('For help: pai-voice-server --help');
    logger.newline();

    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { parseArgs, showHelp, showVersion };
