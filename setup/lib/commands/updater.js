/**
 * Update command
 * Updates PAI Voice Server with preservation of customizations
 */

const logger = require('../utils/logger');
const { copyFile, backupFile } = require('../utils/file-ops');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');
const manifest = require('../core/manifest');
const paths = require('../core/paths');

/**
 * Update PAI Voice Server
 * @param {object} options - Update options
 * @param {boolean} options.dryRun - Preview without making changes
 * @param {boolean} options.force - Force update even if same version
 * @returns {Promise<object>} Update result
 */
async function update(options = {}) {
  const { dryRun = false, force = false } = options;

  logger.boxHeader('PAI Voice Server Update');
  logger.newline();

  if (dryRun) {
    logger.dryRunNotice();
  }

  // Check if installed
  if (!metadata.isInstalled()) {
    logger.error('PAI Voice Server is not installed');
    logger.info('Install first: pai-voice-server install');
    return { success: false, reason: 'not_installed' };
  }

  // Get current and new versions
  const currentVersion = metadata.getInstalledVersion();
  const newVersion = manifest.getManifest().version;

  logger.info(`Current version: ${currentVersion}`);
  logger.info(`New version: ${newVersion}`);
  logger.newline();

  if (currentVersion === newVersion && !force) {
    logger.success('Already up to date');
    logger.info('Use --force to reinstall');
    return { success: true, alreadyUpToDate: true };
  }

  // Check for customizations
  const customized = metadata.getCustomizedFiles();
  if (customized.length > 0) {
    logger.warn('Customized files detected:');
    customized.forEach(name => {
      const component = manifest.getComponent(name);
      logger.log(`  • ${component.description}`);
    });
    logger.info('These files will be preserved');
    logger.newline();
  }

  // Stop service
  logger.info('Stopping service...');
  const wasRunning = await launchagent.isRunning();

  if (wasRunning) {
    try {
      launchagent.unload({ dryRun });
      logger.success('Service stopped');
    } catch (error) {
      logger.warn(`Failed to stop service: ${error.message}`);
    }
  } else {
    logger.verbose('Service not running');
  }

  // Update components
  logger.info('Updating files...');

  const components = manifest.getAllComponents();
  const updatedComponents = [];
  const preservedComponents = [];

  for (const component of components) {
    try {
      // Check if this component is customized
      const isCustomized = customized.includes(component.name);

      if (isCustomized && component.preserveOnUpdate) {
        // Preserve customized file
        logger.info(`  Preserving ${component.description} (customized)`);
        preservedComponents.push(component.name);
        continue;
      }

      // Backup if customized but not preservable
      if (isCustomized && !dryRun) {
        const backupPath = backupFile(component.target, { dryRun });
        if (backupPath) {
          logger.info(`  Backed up: ${backupPath}`);
        }
      }

      // Update file
      const sourcePath = paths.resolveSourcePath(component.source);
      copyFile(sourcePath, component.target, { dryRun, overwrite: true });

      updatedComponents.push(component.name);
      logger.success(`  Updated ${component.description}`);
    } catch (error) {
      if (component.type === 'required') {
        logger.error(`  Failed to update ${component.description}: ${error.message}`);
        return {
          success: false,
          reason: 'update_failed',
          component: component.name,
          error: error.message
        };
      } else {
        logger.warn(`  Failed to update ${component.description}: ${error.message}`);
      }
    }
  }

  // Update LaunchAgent
  logger.info('Updating service configuration...');
  try {
    launchagent.createPlist({ dryRun });
    logger.success('Service configuration updated');
  } catch (error) {
    logger.warn(`Failed to update service configuration: ${error.message}`);
  }

  // Update metadata
  logger.info('Updating metadata...');
  try {
    metadata.updateAfterInstall({ dryRun, isUpdate: true });
    logger.success('Metadata updated');
  } catch (error) {
    logger.warn(`Failed to update metadata: ${error.message}`);
  }

  // Restart service if it was running
  if (wasRunning) {
    logger.info('Starting service...');
    try {
      launchagent.load({ dryRun });

      if (!dryRun) {
        logger.info('Waiting for server to start...');
        const started = await launchagent.waitForStart(10);

        if (started) {
          logger.success('Server started successfully');
        } else {
          logger.warn('Server did not start within timeout');
          logger.info('Start manually: pai-voice-server start');
        }
      } else {
        logger.success('[DRY RUN] Would start server');
      }
    } catch (error) {
      logger.warn(`Failed to start service: ${error.message}`);
      logger.info('Start manually: pai-voice-server start');
    }
  }

  // Success summary
  logger.successBox('Update Complete!');
  logger.newline();

  logger.section('Update Summary');
  logger.keyValue('Previous version', currentVersion);
  logger.keyValue('New version', newVersion);
  logger.keyValue('Updated components', updatedComponents.length.toString());

  if (preservedComponents.length > 0) {
    logger.keyValue('Preserved components', preservedComponents.length.toString());
  }

  logger.newline();
  logger.info('Check status: pai-voice-server status');
  logger.newline();

  return {
    success: true,
    fromVersion: currentVersion,
    toVersion: newVersion,
    updatedComponents,
    preservedComponents,
    dryRun
  };
}

module.exports = update;
