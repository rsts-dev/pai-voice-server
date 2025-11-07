/**
 * Safe command execution utility
 * Handles dry-run mode and provides consistent error handling
 */

const { execSync, spawn } = require('child_process');
const logger = require('./logger');

/**
 * Execute a command synchronously
 * @param {string} command - The command to execute
 * @param {object} options - Execution options
 * @param {boolean} options.dryRun - If true, log command without executing
 * @param {boolean} options.silent - If true, suppress output
 * @param {boolean} options.ignoreError - If true, don't throw on error
 * @returns {object} { success, stdout, stderr, error }
 */
function exec(command, options = {}) {
  const { dryRun = false, silent = false, ignoreError = false } = options;

  logger.verbose(`Executing: ${command}`);

  if (dryRun) {
    logger.verbose(`  [DRY RUN] Would execute: ${command}`);
    return { success: true, stdout: '', stderr: '', error: null };
  }

  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    return {
      success: true,
      stdout: stdout || '',
      stderr: '',
      error: null
    };
  } catch (error) {
    if (!ignoreError) {
      logger.error(`Command failed: ${command}`);
      logger.verbose(`  Error: ${error.message}`);
      throw error;
    }

    return {
      success: false,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : '',
      error: error
    };
  }
}

/**
 * Execute a command and return output as string
 * @param {string} command - The command to execute
 * @param {object} options - Execution options
 * @returns {string} Command output
 */
function execOutput(command, options = {}) {
  const { dryRun = false, ignoreError = false } = options;

  logger.verbose(`Executing: ${command}`);

  if (dryRun) {
    logger.verbose(`  [DRY RUN] Would execute: ${command}`);
    return '';
  }

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return output.trim();
  } catch (error) {
    if (!ignoreError) {
      throw error;
    }
    return '';
  }
}

/**
 * Check if a command exists
 * @param {string} command - Command name to check
 * @returns {boolean} True if command exists
 */
function commandExists(command) {
  try {
    const result = execSync(`which ${command}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Spawn a process (for long-running commands)
 * @param {string} command - Command to execute
 * @param {array} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise} Promise that resolves when process completes
 */
function spawnProcess(command, args = [], options = {}) {
  const { dryRun = false } = options;

  logger.verbose(`Spawning: ${command} ${args.join(' ')}`);

  if (dryRun) {
    logger.verbose(`  [DRY RUN] Would spawn: ${command} ${args.join(' ')}`);
    return Promise.resolve({ code: 0 });
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    proc.on('error', (error) => {
      logger.error(`Process error: ${error.message}`);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        const error = new Error(`Process exited with code ${code}`);
        error.code = code;
        reject(error);
      }
    });
  });
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  exec,
  execOutput,
  commandExists,
  spawnProcess,
  sleep
};
