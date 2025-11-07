/**
 * Restart command
 * Restarts the PAI Voice Server service
 */

const logger = require('../utils/logger');
const stop = require('./stop');
const start = require('./start');

/**
 * Restart PAI Voice Server
 * @param {object} options - Restart options
 * @param {boolean} options.dryRun - Preview without making changes
 * @returns {Promise<object>} Restart result
 */
async function restart(options = {}) {
  const { dryRun = false } = options;

  logger.info('Restarting PAI Voice Server...');
  logger.newline();

  // Stop server
  const stopResult = await stop({ dryRun });
  if (!stopResult.success && !stopResult.alreadyStopped) {
    return { success: false, reason: 'stop_failed', stopResult };
  }

  // Wait a bit
  if (!dryRun) {
    await require('../utils/exec').sleep(1000);
  }

  logger.newline();

  // Start server
  const startResult = await start({ dryRun });
  if (!startResult.success) {
    return { success: false, reason: 'start_failed', startResult };
  }

  logger.newline();
  logger.success('Server restarted successfully');

  return { success: true, stopResult, startResult };
}

module.exports = restart;
