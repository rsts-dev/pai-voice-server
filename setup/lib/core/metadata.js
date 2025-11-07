/**
 * Metadata management
 * Tracks installation state, versions, and user customizations
 */

const fs = require('fs');
const { calculateFileHash } = require('../utils/file-ops');
const { readJSON, writeJSON } = require('../utils/file-ops');
const logger = require('../utils/logger');
const paths = require('./paths');
const manifest = require('./manifest');

/**
 * Create initial metadata
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually create
 * @returns {object} Metadata object
 */
function createMetadata(options = {}) {
  const { dryRun = false } = options;
  const { version } = manifest.getManifest();

  const metadata = {
    version: version,
    installDate: new Date().toISOString(),
    installedComponents: {},
    service: {
      name: manifest.getManifest().service.name,
      status: 'installed'
    }
  };

  // Calculate hashes for all installed files
  const components = manifest.getAllComponents();
  for (const component of components) {
    if (fs.existsSync(component.target)) {
      const hash = calculateFileHash(component.target);
      metadata.installedComponents[component.name] = {
        version: version,
        hash: hash,
        modified: false,
        installDate: new Date().toISOString()
      };
    }
  }

  // Write metadata file
  const metadataPath = paths.getMetadataPath();
  logger.verbose(`Creating metadata: ${metadataPath}`);

  if (!dryRun) {
    writeJSON(metadataPath, metadata, { dryRun });
  }

  return metadata;
}

/**
 * Read metadata file
 * @returns {object|null} Metadata object or null if not found
 */
function readMetadata() {
  const metadataPath = paths.getMetadataPath();

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    return readJSON(metadataPath);
  } catch (error) {
    logger.warn(`Failed to read metadata: ${error.message}`);
    return null;
  }
}

/**
 * Update metadata file
 * @param {object} metadata - Metadata object
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually write
 */
function updateMetadata(metadata, options = {}) {
  const { dryRun = false } = options;
  const metadataPath = paths.getMetadataPath();

  logger.verbose(`Updating metadata: ${metadataPath}`);

  if (!dryRun) {
    writeJSON(metadataPath, metadata, { dryRun });
  }
}

/**
 * Check if installation exists
 * @returns {boolean} True if installed
 */
function isInstalled() {
  const metadataPath = paths.getMetadataPath();
  const serverPath = paths.getServerPath();

  return fs.existsSync(metadataPath) && fs.existsSync(serverPath);
}

/**
 * Get installation version
 * @returns {string|null} Version string or null if not installed
 */
function getInstalledVersion() {
  const metadata = readMetadata();
  return metadata ? metadata.version : null;
}

/**
 * Check for customized files
 * @returns {array} Array of customized component names
 */
function getCustomizedFiles() {
  const metadata = readMetadata();
  if (!metadata) {
    return [];
  }

  const customized = [];
  const components = manifest.getAllComponents();

  for (const component of components) {
    const componentMeta = metadata.installedComponents[component.name];
    if (!componentMeta) {
      continue;
    }

    // Check if file still exists
    if (!fs.existsSync(component.target)) {
      continue;
    }

    // Calculate current hash
    const currentHash = calculateFileHash(component.target);

    // Compare with stored hash
    if (currentHash !== componentMeta.hash) {
      customized.push(component.name);
    }
  }

  return customized;
}

/**
 * Update metadata after installation/update
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, don't actually update
 * @param {boolean} options.isUpdate - If true, preserve install date
 * @returns {object} Updated metadata
 */
function updateAfterInstall(options = {}) {
  const { dryRun = false, isUpdate = false } = options;
  const { version } = manifest.getManifest();

  let metadata = readMetadata();

  if (!metadata || !isUpdate) {
    // Fresh install - create new metadata
    metadata = {
      version: version,
      installDate: new Date().toISOString(),
      installedComponents: {},
      service: {
        name: manifest.getManifest().service.name,
        status: 'installed'
      }
    };
  } else {
    // Update - preserve install date, update version
    metadata.version = version;
    metadata.lastUpdate = new Date().toISOString();
  }

  // Update component hashes
  const components = manifest.getAllComponents();
  for (const component of components) {
    if (fs.existsSync(component.target)) {
      const hash = calculateFileHash(component.target);

      if (!metadata.installedComponents[component.name]) {
        // New component
        metadata.installedComponents[component.name] = {
          version: version,
          hash: hash,
          modified: false,
          installDate: new Date().toISOString()
        };
      } else {
        // Update existing component
        metadata.installedComponents[component.name].version = version;
        metadata.installedComponents[component.name].hash = hash;
        metadata.installedComponents[component.name].modified = false;
        metadata.installedComponents[component.name].lastUpdate = new Date().toISOString();
      }
    }
  }

  // Write metadata
  if (!dryRun) {
    updateMetadata(metadata, { dryRun });
  }

  return metadata;
}

/**
 * Display installation info
 * @param {object} metadata - Metadata object
 */
function displayInfo(metadata) {
  if (!metadata) {
    logger.info('No installation found');
    return;
  }

  logger.section('Installation Information');
  logger.keyValue('Version', metadata.version);
  logger.keyValue('Installed', new Date(metadata.installDate).toLocaleString());

  if (metadata.lastUpdate) {
    logger.keyValue('Last Updated', new Date(metadata.lastUpdate).toLocaleString());
  }

  logger.keyValue('Location', paths.getInstallPath());
  logger.keyValue('Service', metadata.service.name);

  // Check for customizations
  const customized = getCustomizedFiles();
  if (customized.length > 0) {
    logger.newline();
    logger.warn('Customized files detected:');
    customized.forEach(name => {
      const component = manifest.getComponent(name);
      logger.log(`  • ${component.description} (${name})`);
    });
  }
}

module.exports = {
  createMetadata,
  readMetadata,
  updateMetadata,
  isInstalled,
  getInstalledVersion,
  getCustomizedFiles,
  updateAfterInstall,
  displayInfo
};
