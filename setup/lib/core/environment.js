/**
 * Environment validation
 * Checks system requirements and environment setup
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execOutput, commandExists } = require('../utils/exec');
const logger = require('../utils/logger');
const manifest = require('./manifest');
const paths = require('./paths');

/**
 * Validate platform (macOS only)
 * @returns {object} { valid, error }
 */
function validatePlatform() {
  const platform = os.platform();
  const requiredPlatform = manifest.getManifest().requirements.platform;

  if (platform !== requiredPlatform) {
    return {
      valid: false,
      error: `Unsupported platform: ${platform}. PAI Voice Server requires macOS.`
    };
  }

  return { valid: true };
}

/**
 * Validate Node.js version
 * @returns {object} { valid, version, error }
 */
function validateNodeVersion() {
  const currentVersion = process.version;
  const requiredVersion = manifest.getManifest().requirements.minNodeVersion;

  // Simple version comparison (works for major versions)
  const current = parseInt(currentVersion.slice(1).split('.')[0]);
  const required = parseInt(requiredVersion.split('.')[0]);

  if (current < required) {
    return {
      valid: false,
      version: currentVersion,
      error: `Node.js ${requiredVersion}+ required, found ${currentVersion}`
    };
  }

  return { valid: true, version: currentVersion };
}

/**
 * Validate Bun installation
 * @returns {object} { valid, version, path, error }
 */
function validateBun() {
  if (!commandExists('bun')) {
    return {
      valid: false,
      error: 'Bun is not installed. Install from: https://bun.sh'
    };
  }

  try {
    const version = execOutput('bun --version');
    const bunPath = paths.getBunPath();

    return {
      valid: true,
      version: version,
      path: bunPath
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to get Bun version: ${error.message}`
    };
  }
}

/**
 * Validate launchctl (macOS service manager)
 * @returns {object} { valid, error }
 */
function validateLaunchctl() {
  if (!commandExists('launchctl')) {
    return {
      valid: false,
      error: 'launchctl not found (required for macOS service management)'
    };
  }

  return { valid: true };
}

/**
 * Check if port is available
 * @param {number} port - Port number to check
 * @returns {object} { available, processInfo, error }
 */
function checkPort(port) {
  try {
    const result = execOutput(`lsof -ti:${port}`, { ignoreError: true });

    if (!result || result.trim() === '') {
      return { available: true };
    }

    // Port is in use
    const pid = result.trim().split('\n')[0];
    let processInfo = `PID ${pid}`;

    try {
      const processName = execOutput(`ps -p ${pid} -o comm=`, { ignoreError: true });
      if (processName) {
        processInfo = `${processName.trim()} (PID ${pid})`;
      }
    } catch {
      // Ignore error getting process name
    }

    return {
      available: false,
      processInfo,
      error: `Port ${port} is already in use by ${processInfo}`
    };
  } catch (error) {
    // If lsof command fails, assume port is available
    return { available: true };
  }
}

/**
 * Check ElevenLabs API key configuration
 * @returns {object} { configured, voiceId, error }
 */
function checkElevenLabsConfig() {
  const envPath = path.join(os.homedir(), '.env');

  if (!fs.existsSync(envPath)) {
    return {
      configured: false,
      error: 'No ~/.env file found'
    };
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    let apiKey = null;
    let voiceId = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ELEVENLABS_API_KEY=')) {
        apiKey = trimmed.split('=')[1].trim();
      }
      if (trimmed.startsWith('ELEVENLABS_VOICE_ID=')) {
        voiceId = trimmed.split('=')[1].trim();
      }
    }

    if (!apiKey || apiKey === '' || apiKey === 'your_api_key_here') {
      return {
        configured: false,
        error: 'ELEVENLABS_API_KEY not configured in ~/.env'
      };
    }

    return {
      configured: true,
      voiceId: voiceId || 'default'
    };
  } catch (error) {
    return {
      configured: false,
      error: `Failed to read ~/.env: ${error.message}`
    };
  }
}

/**
 * Check directory permissions
 * @param {string} dirPath - Directory to check
 * @returns {object} { writable, error }
 */
function checkDirectoryPermissions(dirPath) {
  const expandedPath = paths.expandHome(dirPath);

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(expandedPath)) {
      fs.mkdirSync(expandedPath, { recursive: true });
    }

    // Try to write a test file
    const testFile = path.join(expandedPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return { writable: true };
  } catch (error) {
    return {
      writable: false,
      error: `No write permission for ${dirPath}: ${error.message}`
    };
  }
}

/**
 * Perform complete environment validation
 * @returns {object} { valid, checks, errors }
 */
function validateEnvironment() {
  logger.info('Checking environment...');

  const checks = {
    platform: validatePlatform(),
    nodeVersion: validateNodeVersion(),
    bun: validateBun(),
    launchctl: validateLaunchctl(),
    port: checkPort(8888),
    elevenLabs: checkElevenLabsConfig(),
    permissions: checkDirectoryPermissions('~/.claude')
  };

  const errors = [];
  const warnings = [];

  // Collect errors
  if (!checks.platform.valid) errors.push(checks.platform.error);
  if (!checks.nodeVersion.valid) errors.push(checks.nodeVersion.error);
  if (!checks.bun.valid) errors.push(checks.bun.error);
  if (!checks.launchctl.valid) errors.push(checks.launchctl.error);
  if (checks.permissions.writable === false) errors.push(checks.permissions.error);

  // Collect warnings (non-fatal)
  if (!checks.port.available) warnings.push(checks.port.error);
  if (!checks.elevenLabs.configured) warnings.push(checks.elevenLabs.error);

  const valid = errors.length === 0;

  return {
    valid,
    checks,
    errors,
    warnings
  };
}

/**
 * Display environment check results
 * @param {object} result - Result from validateEnvironment()
 */
function displayEnvironmentCheck(result) {
  const { checks, errors, warnings } = result;

  // Display checks
  if (checks.platform.valid) {
    logger.success('Platform: macOS');
  }

  if (checks.nodeVersion.valid) {
    logger.success(`Node.js: ${checks.nodeVersion.version}`);
  }

  if (checks.bun.valid) {
    logger.success(`Bun: ${checks.bun.version}`);
  }

  if (checks.launchctl.valid) {
    logger.success('launchctl: available');
  }

  if (checks.port.available) {
    logger.success('Port 8888: available');
  } else {
    logger.warn(`Port 8888: ${checks.port.processInfo}`);
  }

  if (checks.elevenLabs.configured) {
    logger.success('ElevenLabs API: configured');
  } else {
    logger.warn('ElevenLabs API: not configured (will use fallback)');
  }

  if (checks.permissions.writable) {
    logger.success('Permissions: ~/.claude/ writable');
  }

  // Display errors
  if (errors.length > 0) {
    logger.newline();
    logger.error('Environment check failed:');
    errors.forEach(error => logger.log(`  • ${error}`));
  }

  // Display warnings
  if (warnings.length > 0 && errors.length === 0) {
    logger.newline();
    logger.warn('Warnings (non-fatal):');
    warnings.forEach(warning => logger.log(`  • ${warning}`));
  }
}

module.exports = {
  validatePlatform,
  validateNodeVersion,
  validateBun,
  validateLaunchctl,
  checkPort,
  checkElevenLabsConfig,
  checkDirectoryPermissions,
  validateEnvironment,
  displayEnvironmentCheck
};
