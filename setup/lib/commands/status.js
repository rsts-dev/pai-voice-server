/**
 * Status command
 * Shows PAI Voice Server installation and service status
 */

const logger = require('../utils/logger');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');
const environment = require('../core/environment');
const paths = require('../core/paths');
const manifest = require('../core/manifest');

/**
 * Show PAI Voice Server status
 * @param {object} options - Status options
 * @param {boolean} options.verbose - Show detailed information
 * @returns {Promise<object>} Status result
 */
async function status(options = {}) {
  const { verbose = false } = options;

  logger.boxHeader('PAI Voice Server Status');
  logger.newline();

  // Check installation
  const isInstalled = metadata.isInstalled();

  if (!isInstalled) {
    logger.error('PAI Voice Server is not installed');
    logger.info('Install with: pai-voice-server install');
    logger.newline();
    return { success: false, installed: false };
  }

  // Get metadata
  const meta = metadata.readMetadata();

  // Get service status
  const serviceStatus = await launchagent.getStatus();

  // Display installation info
  logger.section('Installation');
  logger.keyValue('Version', meta.version);
  logger.keyValue('Installed', new Date(meta.installDate).toLocaleString());

  if (meta.lastUpdate) {
    logger.keyValue('Last Updated', new Date(meta.lastUpdate).toLocaleString());
  }

  logger.keyValue('Location', paths.getInstallPath());

  // Display service status
  logger.newline();
  logger.section('Service');
  logger.keyValue('Name', manifest.getManifest().service.name);

  if (serviceStatus.running) {
    logger.keyValue('Status', `${logger.colors.green}● running${logger.colors.reset}`);
  } else if (serviceStatus.loaded) {
    logger.keyValue('Status', `${logger.colors.yellow}● loaded but not responding${logger.colors.reset}`);
  } else {
    logger.keyValue('Status', `${logger.colors.red}● stopped${logger.colors.reset}`);
  }

  logger.keyValue('Port', manifest.getManifest().service.port);
  logger.keyValue('LaunchAgent', serviceStatus.plistExists ? 'installed' : 'not found');

  // Check API configuration
  const elevenLabsCheck = environment.checkElevenLabsConfig();
  logger.newline();
  logger.section('Configuration');

  if (elevenLabsCheck.configured) {
    logger.keyValue('ElevenLabs API', `${logger.colors.green}configured${logger.colors.reset}`);
    if (elevenLabsCheck.voiceId) {
      logger.keyValue('Default Voice ID', elevenLabsCheck.voiceId);
    }
  } else {
    logger.keyValue('ElevenLabs API', `${logger.colors.yellow}not configured${logger.colors.reset}`);
    logger.log('  Add to ~/.env: ELEVENLABS_API_KEY=your_api_key_here');
  }

  // Check for customizations
  const customized = metadata.getCustomizedFiles();
  if (customized.length > 0) {
    logger.newline();
    logger.section('Customizations');
    customized.forEach(name => {
      const component = manifest.getComponent(name);
      logger.log(`  • ${component.description} has been modified`);
    });
  }

  // Display logs location
  logger.newline();
  logger.section('Logs');
  logger.keyValue('Location', paths.getLogPath());

  // Show recent logs if verbose
  if (verbose) {
    logger.newline();
    logger.section('Recent Logs (last 20 lines)');
    const logs = launchagent.getLogs(20);
    logger.log(logger.colors.dim + logs + logger.colors.reset);
  }

  // Commands
  logger.newline();
  logger.section('Commands');
  if (serviceStatus.running) {
    logger.log('  • Stop:    pai-voice-server stop');
    logger.log('  • Restart: pai-voice-server restart');
  } else {
    logger.log('  • Start:   pai-voice-server start');
  }
  logger.log('  • Update:  pai-voice-server update');
  logger.log('  • Logs:    tail -f ' + paths.getLogPath());
  logger.log('  • Test:    curl http://localhost:8888/health');

  logger.newline();

  return {
    success: true,
    installed: true,
    version: meta.version,
    serviceStatus,
    elevenLabsConfigured: elevenLabsCheck.configured,
    customized: customized.length > 0
  };
}

module.exports = status;
