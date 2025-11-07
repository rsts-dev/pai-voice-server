/**
 * Uninstall command
 * Removes PAI Voice Server installation
 */

const logger = require('../utils/logger');
const { removeDirectory, removeFile, backupFile } = require('../utils/file-ops');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');
const paths = require('../core/paths');

/**
 * Uninstall PAI Voice Server
 * @param {object} options - Uninstall options
 * @param {boolean} options.dryRun - Preview without making changes
 * @param {boolean} options.preserveLogs - Keep log files
 * @param {boolean} options.backup - Create backup before removal
 * @returns {Promise<object>} Uninstall result
 */
async function uninstall(options = {}) {
  const { dryRun = false, preserveLogs = false, backup = false } = options;

  logger.boxHeader('PAI Voice Server Uninstallation');
  logger.newline();

  if (dryRun) {
    logger.dryRunNotice();
  }

  // Check if installed
  if (!metadata.isInstalled()) {
    logger.error('PAI Voice Server is not installed');
    return { success: false, reason: 'not_installed' };
  }

  // Get metadata
  const meta = metadata.readMetadata();

  // Check for customizations
  const customized = metadata.getCustomizedFiles();
  if (customized.length > 0 && !dryRun) {
    logger.warn('Customized files detected:');
    customized.forEach(name => {
      logger.log(`  • ${name}`);
    });
    logger.newline();

    if (backup) {
      logger.info('Creating backup of customized files...');
      // Backup will be created automatically by removeDirectory
    }
  }

  // Stop service
  logger.info('Stopping service...');
  const serviceStatus = await launchagent.getStatus();

  if (serviceStatus.running || serviceStatus.loaded) {
    try {
      launchagent.unload({ dryRun });
      logger.success('Service stopped');
    } catch (error) {
      logger.warn(`Failed to stop service: ${error.message}`);
    }
  } else {
    logger.success('Service not running');
  }

  // Remove LaunchAgent plist
  logger.info('Removing LaunchAgent...');
  try {
    const removed = launchagent.removePlist({ dryRun });
    if (removed) {
      logger.success('LaunchAgent removed');
    } else {
      logger.verbose('LaunchAgent not found');
    }
  } catch (error) {
    logger.warn(`Failed to remove LaunchAgent: ${error.message}`);
  }

  // Remove installation directory
  logger.info('Removing installation files...');
  const installPath = paths.getInstallPath();

  try {
    // Backup if requested
    if (backup && !dryRun && customized.length > 0) {
      const backupPath = `${installPath}.backup-${Date.now()}`;
      logger.info(`Creating backup: ${backupPath}`);

      const fs = require('fs');
      if (fs.existsSync(installPath)) {
        fs.cpSync(installPath, backupPath, { recursive: true });
        logger.success(`Backup created: ${backupPath}`);
      }
    }

    removeDirectory(installPath, { dryRun });
    logger.success(`Removed: ${installPath}`);
  } catch (error) {
    logger.error(`Failed to remove installation: ${error.message}`);
    return { success: false, reason: 'removal_failed', error: error.message };
  }

  // Handle log files
  const logPath = paths.getLogPath();
  if (preserveLogs) {
    logger.info(`Preserving logs: ${logPath}`);
  } else {
    logger.info('Removing log file...');
    try {
      const removed = removeFile(logPath, { dryRun });
      if (removed) {
        logger.success('Log file removed');
      } else {
        logger.verbose('Log file not found');
      }
    } catch (error) {
      logger.warn(`Failed to remove log file: ${error.message}`);
    }
  }

  // Success summary
  logger.successBox('Uninstallation Complete!');
  logger.newline();

  if (customized.length > 0 && backup && !dryRun) {
    logger.info('Your customized files have been backed up');
  }

  if (preserveLogs) {
    logger.info(`Logs preserved at: ${logPath}`);
  }

  logger.newline();
  logger.info('To reinstall: pai-voice-server install');
  logger.newline();

  return {
    success: true,
    removedInstallation: true,
    preservedLogs: preserveLogs,
    createdBackup: backup && customized.length > 0,
    dryRun
  };
}

module.exports = uninstall;
