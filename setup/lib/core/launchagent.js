/**
 * LaunchAgent management
 * Handles macOS LaunchAgent creation, loading, and status checks
 */

const fs = require('fs');
const { exec, execOutput, sleep } = require('../utils/exec');
const logger = require('../utils/logger');
const paths = require('./paths');
const manifest = require('./manifest');

/**
 * Generate LaunchAgent plist content
 * @returns {string} Plist XML content
 */
function generatePlist() {
  const { service } = manifest.getManifest();
  const serverPath = paths.getServerPath();
  const bunPath = paths.getBunPath();
  const logPath = paths.getLogPath();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${service.name}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${bunPath}</string>
        <string>run</string>
        <string>${serverPath}</string>
    </array>

    <key>WorkingDirectory</key>
    <string>${paths.getInstallPath()}</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>StandardOutPath</key>
    <string>${logPath}</string>

    <key>StandardErrorPath</key>
    <string>${logPath}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>HOME</key>
        <string>${require('os').homedir()}</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${require('os').homedir()}/.bun/bin</string>
    </dict>
</dict>
</plist>
`;
}

/**
 * Create LaunchAgent plist file
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually create
 * @returns {boolean} True if created
 */
function createPlist(options = {}) {
  const { dryRun = false } = options;
  const plistPath = paths.getLaunchAgentPath();

  logger.verbose(`Creating LaunchAgent plist: ${plistPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would create plist file');
    return true;
  }

  try {
    // Ensure LaunchAgents directory exists
    const launchAgentsDir = require('path').dirname(plistPath);
    if (!fs.existsSync(launchAgentsDir)) {
      fs.mkdirSync(launchAgentsDir, { recursive: true });
    }

    // Write plist file
    const plistContent = generatePlist();
    fs.writeFileSync(plistPath, plistContent, 'utf8');

    return true;
  } catch (error) {
    throw new Error(`Failed to create plist: ${error.message}`);
  }
}

/**
 * Remove LaunchAgent plist file
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually remove
 * @returns {boolean} True if removed
 */
function removePlist(options = {}) {
  const { dryRun = false } = options;
  const plistPath = paths.getLaunchAgentPath();

  if (!fs.existsSync(plistPath)) {
    return false;
  }

  logger.verbose(`Removing LaunchAgent plist: ${plistPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would remove plist file');
    return true;
  }

  try {
    fs.unlinkSync(plistPath);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove plist: ${error.message}`);
  }
}

/**
 * Load LaunchAgent (start service)
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually load
 * @returns {boolean} True if loaded
 */
function load(options = {}) {
  const { dryRun = false } = options;
  const plistPath = paths.getLaunchAgentPath();

  if (!fs.existsSync(plistPath)) {
    throw new Error('LaunchAgent plist not found. Run install first.');
  }

  logger.verbose(`Loading LaunchAgent: ${plistPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would load LaunchAgent');
    return true;
  }

  try {
    exec(`launchctl load "${plistPath}"`, { dryRun, silent: true, ignoreError: true });
    return true;
  } catch (error) {
    // Ignore "already loaded" errors
    if (error.message && error.message.includes('already loaded')) {
      return true;
    }
    throw new Error(`Failed to load LaunchAgent: ${error.message}`);
  }
}

/**
 * Unload LaunchAgent (stop service)
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually unload
 * @returns {boolean} True if unloaded
 */
function unload(options = {}) {
  const { dryRun = false } = options;
  const plistPath = paths.getLaunchAgentPath();

  if (!fs.existsSync(plistPath)) {
    logger.verbose('LaunchAgent plist not found (already removed?)');
    return false;
  }

  logger.verbose(`Unloading LaunchAgent: ${plistPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would unload LaunchAgent');
    return true;
  }

  try {
    exec(`launchctl unload "${plistPath}"`, { dryRun, silent: true, ignoreError: true });
    return true;
  } catch (error) {
    // Ignore "not loaded" errors
    if (error.message && error.message.includes('Could not find')) {
      return true;
    }
    throw new Error(`Failed to unload LaunchAgent: ${error.message}`);
  }
}

/**
 * Check if LaunchAgent is loaded
 * @returns {boolean} True if loaded
 */
function isLoaded() {
  const { service } = manifest.getManifest();

  try {
    const result = execOutput(`launchctl list | grep "${service.name}"`, { ignoreError: true });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if service is running (health check)
 * @returns {Promise<boolean>} True if running
 */
async function isRunning() {
  const { service } = manifest.getManifest();

  try {
    // Check if port is listening
    const portCheck = execOutput(`lsof -ti:${service.port}`, { ignoreError: true });
    if (!portCheck || portCheck.trim() === '') {
      return false;
    }

    // Try health endpoint
    const healthCheck = execOutput(
      `curl -s -f -m 2 http://localhost:${service.port}/health`,
      { ignoreError: true }
    );

    return healthCheck && healthCheck.includes('healthy');
  } catch {
    return false;
  }
}

/**
 * Get service status
 * @returns {object} Status information
 */
async function getStatus() {
  const loaded = isLoaded();
  const running = await isRunning();
  const plistExists = fs.existsSync(paths.getLaunchAgentPath());

  return {
    loaded,
    running,
    plistExists,
    status: running ? 'running' : (loaded ? 'loaded but not responding' : 'stopped')
  };
}

/**
 * Get log file content (last N lines)
 * @param {number} lines - Number of lines to retrieve
 * @returns {string} Log content
 */
function getLogs(lines = 50) {
  const logPath = paths.getLogPath();

  if (!fs.existsSync(logPath)) {
    return 'No log file found';
  }

  try {
    const content = execOutput(`tail -n ${lines} "${logPath}"`);
    return content;
  } catch (error) {
    return `Failed to read logs: ${error.message}`;
  }
}

/**
 * Wait for service to start
 * @param {number} timeout - Timeout in seconds
 * @returns {Promise<boolean>} True if service started
 */
async function waitForStart(timeout = 10) {
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;

  while (Date.now() - startTime < timeoutMs) {
    if (await isRunning()) {
      return true;
    }
    await sleep(1000);
  }

  return false;
}

module.exports = {
  generatePlist,
  createPlist,
  removePlist,
  load,
  unload,
  isLoaded,
  isRunning,
  getStatus,
  getLogs,
  waitForStart
};
