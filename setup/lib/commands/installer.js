/**
 * Install command
 * Performs fresh installation of PAI Voice Server
 */

const logger = require('../utils/logger');
const { copyFile, ensureDirectoryExists } = require('../utils/file-ops');
const environment = require('../core/environment');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');
const manifest = require('../core/manifest');
const paths = require('../core/paths');

/**
 * Install PAI Voice Server
 * @param {object} options - Installation options
 * @param {boolean} options.dryRun - Preview without making changes
 * @param {boolean} options.force - Force reinstall if already installed
 * @param {boolean} options.serviceMode - Use enhanced service mode (crash recovery, separate logs)
 * @returns {Promise<object>} Installation result
 */
async function install(options = {}) {
  const { dryRun = false, force = false, serviceMode = false } = options;

  logger.boxHeader('PAI Voice Server Installation');
  logger.newline();

  if (dryRun) {
    logger.dryRunNotice();
  }

  // Step 1: Check if already installed
  if (metadata.isInstalled() && !force) {
    logger.error('PAI Voice Server is already installed');
    logger.info('Use \'pai-voice-server update\' to update');
    logger.info('Use \'pai-voice-server install --force\' to reinstall');
    return { success: false, reason: 'already_installed' };
  }

  // Step 2: Validate environment
  logger.info('Validating environment...');
  const envCheck = environment.validateEnvironment();
  logger.newline();

  environment.displayEnvironmentCheck(envCheck);

  if (!envCheck.valid) {
    logger.newline();
    logger.errorBox('Environment validation failed');
    return { success: false, reason: 'environment_check_failed', errors: envCheck.errors };
  }

  // Step 3: Display warnings if any
  if (envCheck.warnings.length > 0) {
    logger.newline();
    logger.info('Installation will continue despite warnings');
  }

  logger.newline();

  // Step 4: Create installation directory
  logger.info('Creating installation directory...');
  const installPath = paths.getInstallPath();

  try {
    ensureDirectoryExists(installPath, { dryRun });
    logger.success(`Created: ${installPath}`);
  } catch (error) {
    logger.error(`Failed to create directory: ${error.message}`);
    return { success: false, reason: 'directory_creation_failed', error: error.message };
  }

  // Step 5: Copy server files
  logger.info('Installing server files...');

  const components = manifest.getAllComponents();
  const installedComponents = [];

  for (const component of components) {
    try {
      const sourcePath = paths.resolveSourcePath(component.source);

      logger.verbose(`  ${component.description}...`);
      copyFile(sourcePath, component.target, { dryRun, overwrite: true });

      installedComponents.push(component.name);
      logger.success(`  ${component.description}`);
    } catch (error) {
      if (component.type === 'required') {
        logger.error(`  Failed to install ${component.description}: ${error.message}`);
        return {
          success: false,
          reason: 'component_install_failed',
          component: component.name,
          error: error.message
        };
      } else {
        logger.warn(`  Skipped ${component.description}: ${error.message}`);
      }
    }
  }

  // Step 6: Create LaunchAgent
  logger.info(`Creating service${serviceMode ? ' (service mode)' : ''}...`);

  try {
    launchagent.createPlist({ dryRun, serviceMode });
    logger.success(`LaunchAgent created${serviceMode ? ' with enhanced features' : ''}`);
  } catch (error) {
    logger.error(`Failed to create LaunchAgent: ${error.message}`);
    return { success: false, reason: 'launchagent_creation_failed', error: error.message };
  }

  // Step 7: Start service
  logger.info('Starting service...');

  try {
    launchagent.load({ dryRun });
    logger.success('Service started');

    if (!dryRun) {
      // Wait for service to start
      logger.info('Waiting for server to start...');
      const started = await launchagent.waitForStart(10);

      if (started) {
        logger.success('Server is running');
      } else {
        logger.warn('Server did not start within timeout (check logs)');
      }
    }
  } catch (error) {
    logger.warn(`Failed to start service: ${error.message}`);
    logger.info('You can start it manually with: pai-voice-server start');
  }

  // Step 8: Create metadata
  logger.info('Creating installation metadata...');

  try {
    metadata.createMetadata({ dryRun });
    logger.success('Metadata created');
  } catch (error) {
    logger.warn(`Failed to create metadata: ${error.message}`);
  }

  // Step 9: Display success summary
  logger.successBox('Installation Complete!');
  logger.newline();

  logger.section('Installation Details');
  logger.keyValue('Location', installPath);
  logger.keyValue('Service', manifest.getManifest().service.name);
  logger.keyValue('Port', manifest.getManifest().service.port);
  logger.keyValue('Mode', serviceMode ? 'Service (enhanced)' : 'Standard');

  if (serviceMode) {
    logger.keyValue('Stdout Log', paths.getStdoutLogPath());
    logger.keyValue('Stderr Log', paths.getStderrLogPath());
  } else {
    logger.keyValue('Logs', paths.getLogPath());
  }

  logger.newline();
  logger.section('Next Steps');
  logger.log('  • Check status: pai-voice-server status');
  logger.log('  • Test server: curl http://localhost:8888/health');
  logger.log('  • Send notification: curl -X POST http://localhost:8888/notify \\');
  logger.log('      -H "Content-Type: application/json" \\');
  logger.log('      -d \'{"message": "Hello from PAI"}\'');

  if (serviceMode) {
    logger.log('  • View logs: tail -f ' + paths.getStdoutLogPath());
    logger.log('  • View errors: tail -f ' + paths.getStderrLogPath());
  } else {
    logger.log('  • View logs: tail -f ' + paths.getLogPath());
  }

  if (!envCheck.checks.elevenLabs.configured) {
    logger.newline();
    logger.warn('ElevenLabs API key not configured');
    logger.log('  Add to ~/.env: ELEVENLABS_API_KEY=your_api_key_here');
    logger.log('  Get a key at: https://elevenlabs.io');
  }

  logger.newline();

  return {
    success: true,
    installedComponents,
    installPath,
    dryRun
  };
}

module.exports = install;
