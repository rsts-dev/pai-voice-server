/**
 * Path resolution utility
 * Handles paths for both development and published package contexts
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Resolve source path (works in both dev and published contexts)
 * @param {string} relativePath - Relative path from dist/ (e.g., 'server.ts')
 * @returns {string} Absolute path to source file
 */
function resolveSourcePath(relativePath) {
  // Try package-bundled path first (setup/dist/)
  const packagePath = path.join(__dirname, '../..', 'dist', relativePath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // Fallback to development repo path (../dist/)
  const devPath = path.join(__dirname, '../../..', relativePath);
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  throw new Error(`Source file not found: ${relativePath}`);
}

/**
 * Get installation base directory
 * @returns {string} Base installation directory
 */
function getInstallBasePath() {
  return expandHome('~/.claude');
}

/**
 * Get installation directory for voice server
 * @returns {string} Installation directory
 */
function getInstallPath() {
  return path.join(getInstallBasePath(), 'pai-voice-server');
}

/**
 * Get LaunchAgent plist path
 * @returns {string} Path to LaunchAgent plist file
 */
function getLaunchAgentPath() {
  return expandHome('~/Library/LaunchAgents/com.pai.voice-server.plist');
}

/**
 * Get log file path (standard mode - combined stdout/stderr)
 * @returns {string} Path to log file
 */
function getLogPath() {
  return expandHome('~/Library/Logs/pai-voice-server.log');
}

/**
 * Get logs directory (service mode - separate log files)
 * @returns {string} Path to logs directory
 */
function getLogsDir() {
  return path.join(getInstallPath(), 'logs');
}

/**
 * Get stdout log path (service mode)
 * @returns {string} Path to stdout log file
 */
function getStdoutLogPath() {
  return path.join(getLogsDir(), 'voice-server.log');
}

/**
 * Get stderr log path (service mode)
 * @returns {string} Path to stderr log file
 */
function getStderrLogPath() {
  return path.join(getLogsDir(), 'voice-server-error.log');
}

/**
 * Get metadata file path
 * @returns {string} Path to metadata file
 */
function getMetadataPath() {
  return path.join(getInstallPath(), '.metadata.json');
}

/**
 * Get server file path
 * @returns {string} Path to installed server.ts
 */
function getServerPath() {
  return path.join(getInstallPath(), 'server.ts');
}

/**
 * Get voices file path
 * @returns {string} Path to installed voices.json
 */
function getVoicesPath() {
  return path.join(getInstallPath(), 'voices.json');
}

/**
 * Expand tilde (~) in paths to home directory
 * @param {string} filePath - Path potentially containing ~
 * @returns {string} Expanded path
 */
function expandHome(filePath) {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Get Bun executable path
 * @returns {string} Path to Bun executable
 */
function getBunPath() {
  // Try common paths
  const possiblePaths = [
    path.join(os.homedir(), '.bun/bin/bun'),
    '/usr/local/bin/bun',
    '/opt/homebrew/bin/bun'
  ];

  for (const bunPath of possiblePaths) {
    if (fs.existsSync(bunPath)) {
      return bunPath;
    }
  }

  // Fallback to 'bun' in PATH
  return 'bun';
}

module.exports = {
  resolveSourcePath,
  getInstallBasePath,
  getInstallPath,
  getLaunchAgentPath,
  getLogPath,
  getLogsDir,
  getStdoutLogPath,
  getStderrLogPath,
  getMetadataPath,
  getServerPath,
  getVoicesPath,
  expandHome,
  getBunPath
};
