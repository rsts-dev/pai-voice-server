/**
 * Stop command
 * Stops the PAI Voice Server service
 */

const logger = require('../utils/logger');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');

/**
 * Stop PAI Voice Server
 * @param {object} options - Stop options
 * @param {boolean} options.dryRun - Preview without making changes
 * @returns {Promise<object>} Stop result
 */
async function stop(options = {}) {
  const { dryRun = false } = options;

  logger.info('Stopping PAI Voice Server...');

  // Check if installed
  if (!metadata.isInstalled()) {
    logger.error('PAI Voice Server is not installed');
    return { success: false, reason: 'not_installed' };
  }

  // Check if running
  const status = await launchagent.getStatus();
  if (!status.running && !dryRun) {
    logger.warn('Server is not running');
    return { success: true, alreadyStopped: true };
  }

  // Unload LaunchAgent
  try {
    launchagent.unload({ dryRun });

    if (!dryRun) {
      // Give it a moment to stop
      await require('../utils/exec').sleep(2000);

      const newStatus = await launchagent.getStatus();
      if (!newStatus.running) {
        logger.success('Server stopped successfully');
        return { success: true };
      } else {
        logger.warn('Server may still be running');
        logger.info('Check status: pai-voice-server status');
        return { success: false, reason: 'stop_incomplete' };
      }
    } else {
      logger.success('[DRY RUN] Would stop server');
      return { success: true, dryRun: true };
    }
  } catch (error) {
    logger.error(`Failed to stop server: ${error.message}`);
    return { success: false, reason: 'stop_failed', error: error.message };
  }
}

module.exports = stop;
