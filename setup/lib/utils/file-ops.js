/**
 * File operations utility
 * Handles file copying, directory creation, and file hashing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Calculate SHA256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {string} Hex hash string
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    logger.verbose(`Failed to hash ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Check if a file has been modified by comparing hashes
 * @param {string} filePath - Path to file
 * @param {string} originalHash - Original hash to compare against
 * @returns {boolean} True if file has been modified
 */
function isFileModified(filePath, originalHash) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const currentHash = calculateFileHash(filePath);
  return currentHash !== originalHash;
}

/**
 * Copy a file with permission preservation
 * @param {string} source - Source file path
 * @param {string} target - Target file path
 * @param {object} options - Copy options
 * @param {boolean} options.dryRun - If true, don't actually copy
 * @param {boolean} options.overwrite - If true, overwrite existing files
 * @returns {boolean} True if file was copied
 */
function copyFile(source, target, options = {}) {
  const { dryRun = false, overwrite = true } = options;

  logger.verbose(`Copying: ${source} → ${target}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would copy file');
    return true;
  }

  // Check if source exists
  if (!fs.existsSync(source)) {
    throw new Error(`Source file not found: ${source}`);
  }

  // Check if target exists and overwrite is false
  if (fs.existsSync(target) && !overwrite) {
    logger.verbose(`  Skipping (already exists): ${target}`);
    return false;
  }

  // Ensure target directory exists
  const targetDir = path.dirname(target);
  ensureDirectoryExists(targetDir, { dryRun });

  // Copy file
  try {
    fs.copyFileSync(source, target);

    // Preserve permissions
    const stats = fs.statSync(source);
    fs.chmodSync(target, stats.mode);

    return true;
  } catch (error) {
    throw new Error(`Failed to copy ${source} to ${target}: ${error.message}`);
  }
}

/**
 * Ensure a directory exists (create if it doesn't)
 * @param {string} dirPath - Directory path
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually create
 * @returns {boolean} True if directory was created
 */
function ensureDirectoryExists(dirPath, options = {}) {
  const { dryRun = false } = options;

  if (fs.existsSync(dirPath)) {
    return false;
  }

  logger.verbose(`Creating directory: ${dirPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would create directory');
    return true;
  }

  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Remove a file
 * @param {string} filePath - File to remove
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually remove
 * @returns {boolean} True if file was removed
 */
function removeFile(filePath, options = {}) {
  const { dryRun = false } = options;

  if (!fs.existsSync(filePath)) {
    return false;
  }

  logger.verbose(`Removing file: ${filePath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would remove file');
    return true;
  }

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove ${filePath}: ${error.message}`);
  }
}

/**
 * Remove a directory recursively
 * @param {string} dirPath - Directory to remove
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually remove
 * @returns {boolean} True if directory was removed
 */
function removeDirectory(dirPath, options = {}) {
  const { dryRun = false } = options;

  if (!fs.existsSync(dirPath)) {
    return false;
  }

  logger.verbose(`Removing directory: ${dirPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would remove directory');
    return true;
  }

  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to remove directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Backup a file by copying it with a timestamp
 * @param {string} filePath - File to backup
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually backup
 * @returns {string|null} Path to backup file, or null if not backed up
 */
function backupFile(filePath, options = {}) {
  const { dryRun = false } = options;

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;

  logger.verbose(`Backing up: ${filePath} → ${backupPath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would backup file');
    return backupPath;
  }

  try {
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    logger.warn(`Failed to backup ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Read a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {object} Parsed JSON object
 */
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON from ${filePath}: ${error.message}`);
  }
}

/**
 * Write a JSON file
 * @param {string} filePath - Path to write JSON
 * @param {object} data - Data to write
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually write
 */
function writeJSON(filePath, data, options = {}) {
  const { dryRun = false } = options;

  logger.verbose(`Writing JSON: ${filePath}`);

  if (dryRun) {
    logger.verbose('  [DRY RUN] Would write JSON');
    return;
  }

  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON to ${filePath}: ${error.message}`);
  }
}

/**
 * Expand tilde (~) in file paths to home directory
 * @param {string} filePath - Path potentially containing ~
 * @returns {string} Expanded path
 */
function expandHome(filePath) {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(require('os').homedir(), filePath.slice(2));
  }
  return filePath;
}

module.exports = {
  calculateFileHash,
  isFileModified,
  copyFile,
  ensureDirectoryExists,
  removeFile,
  removeDirectory,
  backupFile,
  readJSON,
  writeJSON,
  expandHome
};
