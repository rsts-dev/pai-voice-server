/**
 * Start command
 * Starts the PAI Voice Server service
 */

const logger = require('../utils/logger');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');

/**
 * Start PAI Voice Server
 * @param {object} options - Start options
 * @param {boolean} options.dryRun - Preview without making changes
 * @returns {Promise<object>} Start result
 */
async function start(options = {}) {
  const { dryRun = false } = options;

  logger.info('Starting PAI Voice Server...');

  // Check if installed
  if (!metadata.isInstalled()) {
    logger.error('PAI Voice Server is not installed');
    logger.info('Install first: pai-voice-server install');
    return { success: false, reason: 'not_installed' };
  }

  // Check if already running
  const status = await launchagent.getStatus();
  if (status.running && !dryRun) {
    logger.success('Server is already running');
    return { success: true, alreadyRunning: true };
  }

  // Load LaunchAgent
  try {
    launchagent.load({ dryRun });

    if (!dryRun) {
      logger.info('Waiting for server to start...');
      const started = await launchagent.waitForStart(10);

      if (started) {
        logger.success('Server started successfully');
        logger.info('Check status: pai-voice-server status');
        return { success: true };
      } else {
        logger.error('Server did not start within timeout');
        logger.info('Check logs: tail -f ' + require('../core/paths').getLogPath());
        return { success: false, reason: 'start_timeout' };
      }
    } else {
      logger.success('[DRY RUN] Would start server');
      return { success: true, dryRun: true };
    }
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    return { success: false, reason: 'start_failed', error: error.message };
  }
}

module.exports = start;
