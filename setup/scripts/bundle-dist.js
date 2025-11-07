#!/usr/bin/env node
/**
 * Bundle Distribution Script
 *
 * Prepares the setup package for publishing by bundling server files into dist/
 * This runs automatically before npm publish via the prepublishOnly hook
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRIPT_DIR = __dirname;
const SETUP_ROOT = path.join(SCRIPT_DIR, '..');
const PROJECT_ROOT = path.join(SETUP_ROOT, '..');
const DIST_DIR = path.join(SETUP_ROOT, 'dist');

// Files to bundle from project root
const FILES_TO_BUNDLE = [
  { source: 'server.ts', target: 'server.ts' },
  { source: 'voices.json', target: 'voices.json' }
];

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function cleanDistDirectory() {
  log('▶ Cleaning dist/ directory...', 'yellow');

  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });
  log('✓ dist/ directory cleaned', 'green');
}

function copyFile(sourcePath, targetPath) {
  const sourceFullPath = path.join(PROJECT_ROOT, sourcePath);
  const targetFullPath = path.join(DIST_DIR, targetPath);

  if (!fs.existsSync(sourceFullPath)) {
    throw new Error(`Source file not found: ${sourceFullPath}`);
  }

  // Ensure target directory exists
  const targetDir = path.dirname(targetFullPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(sourceFullPath, targetFullPath);
  log(`  ✓ ${sourcePath} → dist/${targetPath}`, 'green');
}

function bundleFiles() {
  log('▶ Bundling files...', 'yellow');

  for (const file of FILES_TO_BUNDLE) {
    try {
      copyFile(file.source, file.target);
    } catch (error) {
      log(`  ✗ Failed to copy ${file.source}: ${error.message}`, 'red');
      throw error;
    }
  }

  log('✓ Files bundled successfully', 'green');
}

function calculateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex').substring(0, 8);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function verifyBundle() {
  log('▶ Verifying bundle...', 'yellow');

  let allFilesExist = true;
  let totalSize = 0;

  for (const file of FILES_TO_BUNDLE) {
    const targetPath = path.join(DIST_DIR, file.target);

    if (!fs.existsSync(targetPath)) {
      log(`  ✗ Missing: dist/${file.target}`, 'red');
      allFilesExist = false;
      continue;
    }

    // Get file stats
    const stats = fs.statSync(targetPath);
    const size = stats.size;
    totalSize += size;

    // Calculate checksum
    const checksum = calculateChecksum(targetPath);

    // Verify file is not empty
    if (size === 0) {
      log(`  ✗ Empty file: dist/${file.target}`, 'red');
      allFilesExist = false;
      continue;
    }

    // Display verification info
    log(`  ✓ ${file.target}`, 'green');
    log(`    Size: ${formatFileSize(size)}`, 'reset');
    log(`    Checksum: ${checksum}`, 'reset');
  }

  if (!allFilesExist) {
    throw new Error('Bundle verification failed: missing or empty files');
  }

  log(`✓ Bundle verified (Total: ${formatFileSize(totalSize)})`, 'green');
}

function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('     PAI Voice Server - Bundle Distribution', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  try {
    cleanDistDirectory();
    bundleFiles();
    verifyBundle();

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('     ✓ Bundle created successfully!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'green');

    process.exit(0);
  } catch (error) {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
    log(`     ✗ Bundle failed: ${error.message}`, 'red');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'red');

    process.exit(1);
  }
}

main();
