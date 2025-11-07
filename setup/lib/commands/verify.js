/**
 * Verify command
 * Verifies PAI Voice Server installation integrity
 */

const fs = require('fs');
const logger = require('../utils/logger');
const launchagent = require('../core/launchagent');
const metadata = require('../core/metadata');
const manifest = require('../core/manifest');
const paths = require('../core/paths');

/**
 * Verify PAI Voice Server installation
 * @returns {Promise<object>} Verification result
 */
async function verify() {
  logger.boxHeader('PAI Voice Server Verification');
  logger.newline();

  const issues = [];
  const warnings = [];

  // Check installation
  logger.info('Checking installation...');

  if (!metadata.isInstalled()) {
    logger.error('Installation not found');
    return { success: false, reason: 'not_installed' };
  }

  logger.success('Installation found');

  // Check metadata
  logger.info('Checking metadata...');
  const meta = metadata.readMetadata();

  if (!meta) {
    issues.push('Metadata file missing or corrupt');
    logger.error('Metadata file missing or corrupt');
  } else {
    logger.success('Metadata valid');
  }

  // Check components
  logger.info('Checking components...');
  const components = manifest.getAllComponents();

  for (const component of components) {
    if (!fs.existsSync(component.target)) {
      if (component.type === 'required') {
        issues.push(`Required component missing: ${component.description}`);
        logger.error(`  ✗ ${component.description} - MISSING`);
      } else {
        warnings.push(`Optional component missing: ${component.description}`);
        logger.warn(`  ⚠ ${component.description} - missing`);
      }
    } else {
      logger.success(`  ${component.description}`);
    }
  }

  // Check LaunchAgent
  logger.info('Checking LaunchAgent...');
  const plistPath = paths.getLaunchAgentPath();

  if (!fs.existsSync(plistPath)) {
    issues.push('LaunchAgent plist missing');
    logger.error('LaunchAgent plist missing');
  } else {
    logger.success('LaunchAgent plist exists');
  }

  // Check service status
  logger.info('Checking service status...');
  const serviceStatus = await launchagent.getStatus();

  if (serviceStatus.loaded) {
    logger.success('LaunchAgent is loaded');
  } else {
    warnings.push('LaunchAgent not loaded');
    logger.warn('LaunchAgent not loaded');
  }

  if (serviceStatus.running) {
    logger.success('Server is running');
  } else {
    warnings.push('Server not responding');
    logger.warn('Server not responding');
  }

  // Check health endpoint
  if (serviceStatus.running) {
    logger.info('Testing health endpoint...');
    try {
      const { execOutput } = require('../utils/exec');
      const response = execOutput('curl -s -f -m 2 http://localhost:8888/health', {
        ignoreError: true
      });

      if (response && response.includes('healthy')) {
        logger.success('Health endpoint responding');
      } else {
        warnings.push('Health endpoint not responding correctly');
        logger.warn('Health endpoint not responding correctly');
      }
    } catch (error) {
      warnings.push('Failed to test health endpoint');
      logger.warn('Failed to test health endpoint');
    }
  }

  // Summary
  logger.newline();

  if (issues.length === 0 && warnings.length === 0) {
    logger.successBox('Verification Passed!');
    logger.newline();
    logger.success('Installation is healthy');
  } else if (issues.length > 0) {
    logger.errorBox('Verification Failed!');
    logger.newline();
    logger.error('Critical issues found:');
    issues.forEach(issue => logger.log(`  • ${issue}`));

    if (warnings.length > 0) {
      logger.newline();
      logger.warn('Warnings:');
      warnings.forEach(warning => logger.log(`  • ${warning}`));
    }

    logger.newline();
    logger.info('Try reinstalling: pai-voice-server install --force');
  } else {
    logger.successBox('Verification Passed with Warnings');
    logger.newline();
    logger.warn('Warnings found:');
    warnings.forEach(warning => logger.log(`  • ${warning}`));

    logger.newline();
    if (!serviceStatus.running) {
      logger.info('Start the server: pai-voice-server start');
    }
  }

  logger.newline();

  return {
    success: issues.length === 0,
    issues,
    warnings,
    serviceStatus
  };
}

module.exports = verify;
